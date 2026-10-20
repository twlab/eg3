import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import type { Sqlite3Static } from "@sqlite.org/sqlite-wasm";

import { listHaplotypes, pathBounds } from "../bounds";
import { fileReader, installFileVfs, urlReader, urlSize } from "../fileVfs";
import type { FileVfs, SliceReader } from "../fileVfs";
import { SqliteWasmGbzSource } from "../sqliteWasmSource";
import { queryInterval } from "../subgraph";
import type { DatabaseSummary, GbzRequest, GbzResponse } from "./protocol";

/* ══════════════════════════════════════════════════════════════════════════
   Owns the GBZ-base databases the user has opened.

   Everything runs here rather than on the main thread for two reasons. A query
   decodes hundreds of node records and walks them, which is enough to drop
   frames. And the databases are read through `FileReaderSync`, which exists
   only in a worker - see `fileVfs.ts` for why a synchronous read is the one
   thing this needs.
   ══════════════════════════════════════════════════════════════════════════ */

let engine: Promise<{ sqlite3: Sqlite3Static; vfs: FileVfs }> | null = null;
const loadEngine = () => {
  if (!engine) {
    engine = sqlite3InitModule().then((sqlite3) => ({
      sqlite3,
      vfs: installFileVfs(sqlite3),
    }));
  }
  return engine;
};

const open = new Map<string, SqliteWasmGbzSource>();

function sourceFor(id: string): SqliteWasmGbzSource {
  const source = open.get(id);
  if (!source) throw new Error(`Database "${id}" is not open`);
  return source;
}

/* A database read from disk or from a web server: the reader is the only
   difference, and nothing past this line knows which it is. */
async function openDatabase(
  id: string,
  name: string,
  reader: SliceReader,
  url?: string,
  /* False when opened again only to query, as a page refresh does: the
     haplotype list is a read of the whole Paths table, and only the start
     page shows it. A query finds its own path. */
  listPaths = true,
): Promise<DatabaseSummary> {
  const { sqlite3, vfs } = await loadEngine();
  open.get(id)?.close();

  const source = SqliteWasmGbzSource.open(sqlite3, vfs, reader);
  let tags: Record<string, string>;
  try {
    tags = source.tags();
  } catch {
    source.close();
    throw new Error(
      `${name} is not a GBZ-base database (no Tags table). Convert a .gbz with gbz2db first.`,
    );
  }
  if (!tags.version) {
    source.close();
    throw new Error(`${name} is missing the GBZ-base version tag`);
  }

  const haplotypes = listPaths ? listHaplotypes(source) : [];
  const reference = haplotypes.find((h) => h.isReference) ?? null;
  open.set(id, source);

  return {
    id,
    name,
    bytes: reader.size,
    url,
    tags,
    haplotypes,
    reference,
    /* Not measured here: a path's range is a walk to its end, record by
       record over the network, and the path the reader goes on to pick is
       often another. The start page measures the one picked; see
       LocalDatabaseCard. */
    referenceBounds: null,
  };
}

async function handle(request: GbzRequest): Promise<GbzResponse> {
  const { token } = request;
  try {
    switch (request.type) {
      case "open":
        return {
          token,
          ok: true,
          type: "open",
          summary: await openDatabase(
            request.id,
            request.name,
            fileReader(request.file),
          ),
        };
      case "openUrl":
        return {
          token,
          ok: true,
          type: "open",
          summary: await openDatabase(
            request.id,
            request.name,
            urlReader(request.url, await urlSize(request.url)),
            request.url,
            request.listPaths ?? true,
          ),
        };
      case "close":
        open.get(request.id)?.close();
        open.delete(request.id);
        return { token, ok: true, type: "close" };
      case "interval":
        return {
          token,
          ok: true,
          type: "interval",
          result: queryInterval(sourceFor(request.id), request.query),
        };
      case "pathBounds":
        return {
          token,
          ok: true,
          type: "pathBounds",
          result: pathBounds(sourceFor(request.id), request.query),
        };
    }
  } catch (error) {
    return {
      token,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

self.onmessage = async (event: MessageEvent<GbzRequest>) => {
  const response = await handle(event.data);
  self.postMessage(response);
};
