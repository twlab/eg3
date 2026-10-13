import type {
  Database,
  PreparedStatement,
  Sqlite3Static,
} from "@sqlite.org/sqlite-wasm";

import { GbzRecord } from "./record";
import type { GbzPath, GbzSource, IndexedPosition } from "./store";
import type { FileVfs, FileVfsStats, SliceReader } from "./fileVfs";

/* ══════════════════════════════════════════════════════════════════════════
   A GbzSource over the official SQLite wasm build, reading through a
   `SliceReader` rather than from a copy of the database in memory.

   The statements are the same five as every other source - they mirror what
   gbz-base prepares in db.rs - and this class exists for one reason: SQLite's
   `oo1` API is synchronous, so `GbzSource` stays synchronous and the reader
   above it is untouched. wa-sqlite would have been the more obvious choice and
   is not usable here: its JS API returns promises throughout, which would
   have meant making `queryInterval` and the whole walk async.
   ══════════════════════════════════════════════════════════════════════════ */

const FIND_PATH = `SELECT handle, sample, contig, haplotype, fragment, is_indexed, fw_node, fw_offset
  FROM Paths WHERE sample = ? AND contig = ? AND haplotype = ? AND fragment <= ?
  ORDER BY fragment DESC LIMIT 1`;

const GET_PATH = `SELECT handle, sample, contig, haplotype, fragment, is_indexed, fw_node, fw_offset
  FROM Paths WHERE handle = ?`;

const LIST_PATHS = `SELECT handle, sample, contig, haplotype, fragment, is_indexed, fw_node, fw_offset
  FROM Paths ORDER BY handle`;

const INDEXED_POSITION = `SELECT path_offset, node_handle, node_offset FROM ReferenceIndex
  WHERE path_handle = ? AND path_offset <= ? ORDER BY path_offset DESC LIMIT 1`;

const GET_RECORD = `SELECT edges, bwt, sequence, path_handles FROM Nodes WHERE handle = ?`;

type Row = Record<string, unknown>;

const toPath = (row: Row): GbzPath => ({
  handle: Number(row.handle),
  sample: String(row.sample),
  contig: String(row.contig),
  haplotype: Number(row.haplotype),
  fragment: Number(row.fragment),
  isIndexed: Number(row.is_indexed) !== 0,
  fwNode: Number(row.fw_node),
  fwOffset: Number(row.fw_offset),
});

/** Runs a prepared statement for one row, or null when there is none. */
function one(
  statement: PreparedStatement,
  params: readonly (string | number)[],
): Row | null {
  statement.reset();
  statement.bind(params);
  const row = statement.step() ? (statement.get({}) as Row) : null;
  statement.reset();
  return row;
}

export class SqliteWasmGbzSource implements GbzSource {
  private readonly statements: PreparedStatement[] = [];
  private readonly findPathStmt: PreparedStatement;
  private readonly getPathStmt: PreparedStatement;
  private readonly listPathsStmt: PreparedStatement;
  private readonly indexedStmt: PreparedStatement;
  private readonly recordStmt: PreparedStatement;

  private constructor(
    private readonly db: Database,
    private readonly vfs: FileVfs,
    private readonly path: string,
  ) {
    const prepare = (sql: string) => {
      const statement = db.prepare(sql);
      this.statements.push(statement);
      return statement;
    };
    this.findPathStmt = prepare(FIND_PATH);
    this.getPathStmt = prepare(GET_PATH);
    this.listPathsStmt = prepare(LIST_PATHS);
    this.indexedStmt = prepare(INDEXED_POSITION);
    this.recordStmt = prepare(GET_RECORD);
  }

  /**
   * create a connection between sqlite and the db file uploaded by the user
   *
   * also able to cache the fetched region and save it in the storage layer (OPFS) private to website
   */
  static open(
    sqlite3: Sqlite3Static,
    vfs: FileVfs,
    reader: SliceReader,
  ): SqliteWasmGbzSource {
    const path = vfs.add(reader);
    const db = new sqlite3.oo1.DB({
      filename: path,
      flags: "r",
      vfs: vfs.name,
    });
    try {
      db.exec("PRAGMA cache_size = -32768");
      return new SqliteWasmGbzSource(db, vfs, path);
    } catch (error) {
      db.close();
      vfs.remove(path);
      throw error;
    }
  }

  findPath(
    sample: string,
    contig: string,
    haplotype: number,
    fragment: number,
  ): GbzPath | null {
    const row = one(this.findPathStmt, [sample, contig, haplotype, fragment]);
    return row ? toPath(row) : null;
  }

  getPath(handle: number): GbzPath | null {
    const row = one(this.getPathStmt, [handle]);
    return row ? toPath(row) : null;
  }

  listPaths(): GbzPath[] {
    const rows: GbzPath[] = [];
    this.listPathsStmt.reset();
    while (this.listPathsStmt.step()) {
      rows.push(toPath(this.listPathsStmt.get({}) as Row));
    }
    this.listPathsStmt.reset();
    return rows;
  }

  indexedPosition(
    pathHandle: number,
    pathOffset: number,
  ): IndexedPosition | null {
    const row = one(this.indexedStmt, [pathHandle, pathOffset]);
    if (!row) return null;
    return {
      pathOffset: Number(row.path_offset),
      node: Number(row.node_handle),
      offset: Number(row.node_offset),
    };
  }

  getRecord(handle: number): GbzRecord | null {
    const row = one(this.recordStmt, [handle]);
    if (!row) return null;
    return new GbzRecord({
      handle,
      edges: row.edges as Uint8Array,
      bwt: row.bwt as Uint8Array,
      sequence: row.sequence as Uint8Array,
      pathHandles: (row.path_handles as Uint8Array | null) ?? null,
    });
  }

  /** Free the prepared statements, close the database, drop what was read. */
  close(): void {
    for (const statement of this.statements) statement.finalize();
    this.db.close();
    this.vfs.remove(this.path);
  }

  /** The `Tags` table, which carries the graph's own metadata. */
  tags(): Record<string, string> {
    const tags: Record<string, string> = {};
    const statement = this.db.prepare("SELECT key, value FROM Tags");
    try {
      while (statement.step()) {
        const row = statement.get({}) as Row;
        tags[String(row.key)] = String(row.value);
      }
    } finally {
      statement.finalize();
    }
    return tags;
  }

  /** How much of the file has actually been read, for anyone measuring. */
  stats(): FileVfsStats | null {
    return this.vfs.stats(this.path);
  }
}
