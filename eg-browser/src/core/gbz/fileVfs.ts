import type {
  Sqlite3Static,
  sqlite3_io_methods,
  sqlite3_vfs,
} from "@sqlite.org/sqlite-wasm";

/* `sqlite3.vfs` is real but absent from the published types, so the one
   call this needs is described here. A VFS method takes raw pointers and
   returns a result code; `never[]` is the parameter list every one of them
   is assignable to, which keeps the shape honest without reaching for any. */
type VfsMethods = Record<string, (...args: never[]) => number>;

interface VfsNamespace {
  vfs: {
    installVfs(opt: {
      io: { struct: sqlite3_io_methods; methods: VfsMethods };
      vfs: {
        struct: sqlite3_vfs;
        methods: VfsMethods;
        name: string;
        asDefault?: boolean;
      };
    }): void;
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   A read-only SQLite VFS over something that can hand back a slice of bytes.

   The point is to stop reading a database into memory to query it. sql.js can
   only take the whole file - its build has the Emscripten filesystem stripped
   out - so a 9 GB graph cannot be opened at all. SQLite itself never wanted
   the whole file: it reads the pages a query touches and nothing else, which
   for one window of this browser is about a hundred kilobytes.

   That is worth saying precisely, because it is what makes this worth doing.
   `Nodes` has `handle INTEGER PRIMARY KEY`, so its rows sit in the B-tree in
   handle order, and node ids follow the graph, so the records a window needs
   are a nearly solid run. Measured on the mouse graph, a 10 kb window touches
   4,582 records spanning 4,789 handles: 110 KB out of 9.4 GB, in a handful of
   adjacent blocks.

   What a caller supplies is `SliceReader`, which is deliberately the smallest
   thing that could work - a size and a synchronous read. In the browser that
   is `FileReaderSync` over `File.slice`, which is why this has to run in a
   worker: `FileReaderSync` exists nowhere else, and SQLite's `xRead` has to
   return bytes, not a promise. In a test it is `fs.readSync`, which is how
   this is checked against a real database without a browser.
   ══════════════════════════════════════════════════════════════════════════ */

/** Somewhere bytes can be read from, a slice at a time, without blocking. */
export interface SliceReader {
  /** Total size in bytes. */
  size: number;
  /** Bytes `[offset, offset + length)`. May return fewer at the end. */
  read(offset: number, length: number): Uint8Array;
}

/**
 * How much is fetched at once, and how much is kept.
 *
 * SQLite asks for one page at a time - 4 KB in the databases gbz2db writes -
 * but the pages a query wants are consecutive, so a page-sized read would be
 * tens of separate reads where one would do. Reading a block around each miss
 * turns the 27 pages of a 10 kb window into two or three reads. 512 blocks of
 * 64 KB is a 32 MB ceiling on what a database costs in memory, which is the
 * whole point of the exercise, and enough that panning back over somewhere
 * just visited touches no file at all.
 */
export const BLOCK_SIZE = 64 * 1024;
export const MAX_BLOCKS = 512;

/**
 * What is held for one open file: the blocks read from it so far, and the way
 * to fetch a block that is missing.
 *
 * It is a cache, not the file itself. Nothing here can change the database -
 * `reader` is the only route to the bytes, and it only reads.
 */
interface CachedFileData {
  /** How to fetch a block on a miss. */
  reader: SliceReader;
  /** Block index to its bytes. Insertion order is the eviction order. */
  blocks: Map<number, Uint8Array>;
  reads: number;
  bytesRead: number;
}

/** What a database opened through this VFS cost, for anyone measuring. */
export interface FileVfsStats {
  reads: number;
  bytesRead: number;
  blocksHeld: number;
}

/**
 * Reads `length` bytes at `offset`, out of the block cache where it can be.
 *
 * A read crossing a block boundary is filled from each block in turn, so the
 * caller never sees the blocking. Returns how many bytes were actually
 * available, which is short only at the end of the file.
 */
function readThrough(
  cached: CachedFileData,
  into: Uint8Array,
  offset: number,
  length: number,
): number {
  let done = 0;
  while (done < length) {
    const at = offset + done;
    if (at >= cached.reader.size) break;

    const index = Math.floor(at / BLOCK_SIZE);
    let block = cached.blocks.get(index);
    if (block) {
      /* Already cached. Re-inserting moves the key to the back of the Map's
         order, which is what makes the eviction below least-recently-used. */
      cached.blocks.delete(index);
      cached.blocks.set(index, block);
    } else {
      const start = index * BLOCK_SIZE;
      const want = Math.min(BLOCK_SIZE, cached.reader.size - start);
      block = cached.reader.read(start, want);
      cached.reads++;
      cached.bytesRead += block.length;
      cached.blocks.set(index, block);
      /* Oldest first: Map iterates in insertion order. */
      while (cached.blocks.size > MAX_BLOCKS) {
        const oldest = cached.blocks.keys().next();
        if (oldest.done) break;
        cached.blocks.delete(oldest.value);
      }
    }

    const within = at - index * BLOCK_SIZE;
    const take = Math.min(length - done, block.length - within);
    if (take <= 0) break;
    into.set(block.subarray(within, within + take), done);
    done += take;
  }
  return done;
}

/** A VFS registered with SQLite, and the handle for opening files through it. */
export interface FileVfs {
  /** The name to pass as SQLite's `vfs` argument when opening a database. */
  name: string;
  /**
   * Registers a reader under a filename of this VFS's choosing, and returns
   * that name. Pass it as the database's path.
   */
  add(reader: SliceReader): string;
  /** Forgets a reader and everything cached for it. */
  remove(path: string): void;
  /** What an open database has read so far, or null if it is not open. */
  stats(path: string): FileVfsStats | null;
}

/**
 * Registers the VFS with SQLite. Call once per sqlite3 module.
 *
 * Read-only throughout: every method that would change the file answers
 * `SQLITE_READONLY`, and journal and WAL files are reported absent, so SQLite
 * never looks for the sidecar files a writable database would have. A
 * database has to be opened with `SQLITE_OPEN_READONLY` to match.
 */
export function installFileVfs(
  sqlite3: Sqlite3Static,
  name = "gbz-slice",
): FileVfs {
  const capi = sqlite3.capi;
  const wasm = sqlite3.wasm;

  /* readers registered by add() but not necessarily opened yet: one reader per
     database file, under a path key we invent. */
  const readers = new Map<string, SliceReader>();

  /* both holds the SAME CachedFileData object under two different keys, and
     xOpen is where they are both set - the one moment both keys exist at once.

     byPath is keyed by the path we invented. Used when we have the path:
     xOpen, and our own remove() and stats(). Unlike `readers`, an entry here
     means the file is open, and it carries the block cache and the counters. */
  const byPath = new Map<string, CachedFileData>();

  /* byPointer is keyed by pFile, the handle SQLite invents on open. SQLite
     does not read this map - it just hands pFile back on every call. We need
     it for the functions created by us,
     xRead, xFileSize and xClose are given pFile and nothing else;
     the path key is not passed to them. */
  const byPointer = new Map<number, CachedFileData>();

  let counter = 0;

  const ioStruct = new capi.sqlite3_io_methods();
  const vfsStruct = new capi.sqlite3_vfs();
  vfsStruct.$iVersion = 2;
  /* Present at runtime on every struct class, absent from the types. */
  vfsStruct.$szOsFile = (
    capi.sqlite3_file as unknown as { structInfo: { sizeof: number } }
  ).structInfo.sizeof;
  vfsStruct.$mxPathname = 512;

  const io = {
    xClose(pFile: number) {
      const cached = byPointer.get(pFile);
      byPointer.delete(pFile);
      if (cached) cached.blocks.clear();
      return 0;
    },
    xRead(pFile: number, pDest: number, n: number, offset64: bigint | number) {
      const cached = byPointer.get(pFile);
      if (!cached) return capi.SQLITE_IOERR_READ;
      const offset = Number(offset64);
      const buffer = new Uint8Array(n);
      let got: number;
      try {
        got = readThrough(cached, buffer, offset, n);
      } catch {
        return capi.SQLITE_IOERR_READ;
      }
      wasm.heap8u().set(buffer, pDest);
      /* SQLite wants the tail zeroed and a short read reported, which is how
         it tells a torn page from a page that was never written. */
      return got === n ? 0 : capi.SQLITE_IOERR_SHORT_READ;
    },
    xWrite() {
      return capi.SQLITE_READONLY;
    },
    xTruncate() {
      return capi.SQLITE_READONLY;
    },
    xSync() {
      return 0;
    },
    xFileSize(pFile: number, pSize64: number) {
      const cached = byPointer.get(pFile);
      if (!cached) return capi.SQLITE_IOERR;
      wasm.poke64(pSize64, BigInt(cached.reader.size));
      return 0;
    },
    /* Nothing else can be holding this file: it is one reader, read-only, in
       this worker. So locking is bookkeeping SQLite need not do. */
    xLock() {
      return 0;
    },
    xUnlock() {
      return 0;
    },
    xCheckReservedLock(_pFile: number, pResOut: number) {
      wasm.poke32(pResOut, 0);
      return 0;
    },
    xFileControl() {
      return capi.SQLITE_NOTFOUND;
    },
    xSectorSize() {
      return BLOCK_SIZE;
    },
    xDeviceCharacteristics() {
      /* The file cannot change underneath us, which lets SQLite skip the
         checks it would otherwise make on every read. */
      return capi.SQLITE_IOCAP_IMMUTABLE ?? 0x2000;
    },
  };

  const vfs = {
    xOpen(
      _pVfs: number,
      zName: number,
      pFile: number,
      flags: number,
      pOutFlags: number,
    ) {
      const path = zName ? (wasm.cstrToJs(zName) ?? "") : "";
      const reader = readers.get(path);
      if (!reader) return capi.SQLITE_CANTOPEN;
      if (flags & capi.SQLITE_OPEN_CREATE) return capi.SQLITE_READONLY;

      /* Reuse the state if this path is already open, so its cache survives;
         otherwise start a fresh one with an empty cache. */
      const cached: CachedFileData = byPath.get(path) ?? {
        reader,
        blocks: new Map(),
        reads: 0,
        bytesRead: 0,
      };
      byPath.set(path, cached);
      byPointer.set(pFile, cached);

      const handle = new capi.sqlite3_file(pFile);
      handle.$pMethods = ioStruct.pointer;
      handle.dispose();

      wasm.poke32(pOutFlags, capi.SQLITE_OPEN_READONLY);
      return 0;
    },
    xDelete() {
      return capi.SQLITE_READONLY;
    },
    xAccess(_pVfs: number, zName: number, _flags: number, pResOut: number) {
      /* Only the databases handed to `add` exist here. A journal or a WAL
         never does, which is what keeps SQLite from looking for one. */
      const path = zName ? (wasm.cstrToJs(zName) ?? "") : "";
      wasm.poke32(pResOut, readers.has(path) ? 1 : 0);
      return 0;
    },
    xFullPathname(_pVfs: number, zName: number, nOut: number, pOut: number) {
      /* The names are ours and already absolute, so this is a copy. */
      const path = zName ? (wasm.cstrToJs(zName) ?? "") : "";
      const bytes = new TextEncoder().encode(path);
      if (bytes.length + 1 > nOut) return capi.SQLITE_CANTOPEN;
      wasm.heap8u().set(bytes, pOut);
      wasm.poke8(pOut + bytes.length, 0);
      return 0;
    },
    xGetLastError(_pVfs: number, _nOut: number, pOut: number) {
      wasm.poke8(pOut, 0);
      return 0;
    },
    xCurrentTime(_pVfs: number, pOut: number) {
      /* Julian day, the way the unix VFS reports it. */
      wasm.poke64f(pOut, 2440587.5 + Date.now() / 86400000);
      return 0;
    },
    xCurrentTimeInt64(_pVfs: number, pOut: number) {
      wasm.poke64(pOut, BigInt(Date.now() + 210866760000000));
      return 0;
    },
    xRandomness(_pVfs: number, nByte: number, pOut: number) {
      const bytes = new Uint8Array(nByte);
      crypto.getRandomValues(bytes);
      wasm.heap8u().set(bytes, pOut);
      return nByte;
    },
    xSleep() {
      return 0;
    },
  };

  (sqlite3 as unknown as VfsNamespace).vfs.installVfs({
    io: { struct: ioStruct, methods: io as unknown as VfsMethods },
    vfs: {
      struct: vfsStruct,
      methods: vfs as unknown as VfsMethods,
      name,
      asDefault: false,
    },
  });

  return {
    name,
    add(reader: SliceReader) {
      const path = `/gbz/${++counter}.db`;
      readers.set(path, reader);
      return path;
    },
    remove(path: string) {
      readers.delete(path);
      const cached = byPath.get(path);
      if (cached) cached.blocks.clear();
      byPath.delete(path);
    },
    stats(path: string) {
      const cached = byPath.get(path);
      return cached
        ? {
            reads: cached.reads,
            bytesRead: cached.bytesRead,
            blocksHeld: cached.blocks.size,
          }
        : null;
    },
  };
}

/* `FileReaderSync` is a worker global, so it is absent from the DOM lib this
   app is typed against. Declared here rather than adding the WebWorker lib,
   which would put every worker global in scope everywhere. */
declare const FileReaderSync: {
  new (): { readAsArrayBuffer(blob: Blob): ArrayBuffer };
};

/**
 * A `SliceReader` over a `File` the user picked.
 *
 * Only usable in a worker: `FileReaderSync` is defined nowhere else, and a
 * VFS read has to return bytes rather than a promise.
 */
export function fileReader(file: File): SliceReader {
  const reader = new FileReaderSync();
  return {
    size: file.size,
    read(offset, length) {
      const end = Math.min(offset + length, file.size);
      if (end <= offset) return new Uint8Array(0);
      return new Uint8Array(reader.readAsArrayBuffer(file.slice(offset, end)));
    },
  };
}

/**
 * How big a database hosted at `url` is, found without downloading it.
 *
 * Its first hundred bytes are asked for as a range. They also say whether the
 * server can do what the reader needs at all: a 200 in answer to a range means
 * it sends the whole file every time, which would download a nine gigabyte
 * graph once per page SQLite reads.
 *
 * The size comes out of SQLite's own header - page size times page count -
 * rather than from `Content-Range`, which a cross-origin page cannot see unless
 * the server exposes it. `Content-Length` from a HEAD is the fallback, for a
 * file whose header count is stale.
 */
export async function urlSize(url: string): Promise<number> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { Range: "bytes=0-99" } });
  } catch {
    throw new Error(
      `Could not reach ${url}. The server has to allow requests from this page (CORS) and be online.`,
    );
  }
  if (response.status !== 206) {
    await response.body?.cancel();
    throw new Error(
      response.ok
        ? `${url} ignores range requests, so every read would download the whole file.`
        : `${url} answered HTTP ${response.status}.`,
    );
  }
  const head = new Uint8Array(await response.arrayBuffer());
  if (new TextDecoder().decode(head.subarray(0, 15)) !== "SQLite format 3") {
    throw new Error(`${url} is not an SQLite database.`);
  }
  const view = new DataView(head.buffer, head.byteOffset, head.byteLength);
  const raw = view.getUint16(16);
  const pageSize = raw === 1 ? 65536 : raw;
  const pages = view.getUint32(28);
  /* The page count is only trusted when the header says it is current. */
  if (pages > 0 && view.getUint32(92) === view.getUint32(24)) {
    return pageSize * pages;
  }
  const whole = await fetch(url, { method: "HEAD" });
  const length = Number(whole.headers.get("content-length"));
  if (!Number.isFinite(length) || length <= 0) {
    throw new Error(`Could not tell how big ${url} is.`);
  }
  return length;
}

/**
 * A `SliceReader` over a database on a web server, one range request per read.
 *
 * Synchronous, like `fileReader` and for the same reason - SQLite's `xRead`
 * returns bytes, not a promise - so it too only belongs in a worker, where a
 * blocking request stalls nothing a person is looking at. The block cache in
 * front of it means a read is one 64 KB range, and a window of the browser is
 * two or three of them.
 */
export function urlReader(url: string, size: number): SliceReader {
  return {
    size,
    read(offset, length) {
      const end = Math.min(offset + length, size);
      if (end <= offset) return new Uint8Array(0);
      const request = new XMLHttpRequest();
      request.open("GET", url, false);
      request.responseType = "arraybuffer";
      request.setRequestHeader("Range", `bytes=${offset}-${end - 1}`);
      request.send();
      if (request.status !== 206) {
        throw new Error(`${url} answered HTTP ${request.status} to a range request`);
      }
      return new Uint8Array(request.response as ArrayBuffer);
    },
  };
}
