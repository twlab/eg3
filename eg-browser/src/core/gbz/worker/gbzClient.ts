import GbzWorker from "./gbzWorker.ts?worker";
import type { PathBounds } from "../bounds";
import type { IntervalQuery, SubgraphJson } from "../subgraph";
import type { DatabaseSummary, GbzRequest, GbzResponse } from "./protocol";

/* ══════════════════════════════════════════════════════════════════════════
   Main-thread handle on the worker.

   One worker serves every open database. Databases are addressed by an id
   that the rest of the app can put in a fetch config and in redux - the file
   itself never leaves this module.
   ══════════════════════════════════════════════════════════════════════════ */

type Pending = {
  resolve: (value: GbzResponse) => void;
  reject: (error: Error) => void;
};

/* A plain Omit over a union keeps only the keys every member shares, which
   would erase everything but `type`. Distributing keeps each variant whole. */
type Unsent<T> = T extends unknown ? Omit<T, "token"> : never;

let worker: Worker | null = null;
let nextToken = 1;
const pending = new Map<number, Pending>();

/** Summaries of everything currently open, so the UI can list them. */
const opened = new Map<string, DatabaseSummary>();

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new GbzWorker();
  worker.onmessage = (event: MessageEvent<GbzResponse>) => {
    const waiting = pending.get(event.data.token);
    if (!waiting) return;
    pending.delete(event.data.token);
    waiting.resolve(event.data);
  };
  worker.onerror = (event) => {
    const error = new Error(event.message || "The database worker failed");
    for (const waiting of pending.values()) waiting.reject(error);
    pending.clear();
  };
  return worker;
}

function send(
  request: Unsent<GbzRequest>,
  transfer: Transferable[] = [],
): Promise<GbzResponse> {
  const token = nextToken++;
  const message = { ...request, token } as GbzRequest;
  return new Promise((resolve, reject) => {
    pending.set(token, { resolve, reject });
    ensureWorker().postMessage(message, transfer);
  });
}

function unwrap(response: GbzResponse): GbzResponse {
  if (!response.ok) throw new Error(response.error);
  return response;
}

/**
 * Hands a database the user picked to the worker.
 *
 * The file itself goes across, not its contents: a `File` is a handle onto
 * something on disk, and structured clone passes it without reading a byte.
 * The worker reads the pages its queries touch and no more, so opening is
 * immediate whatever the file's size - a nine gigabyte graph costs the same
 * here as a ten megabyte one.
 */
export async function openLocalDatabase(file: File): Promise<DatabaseSummary> {
  const id = `local:${crypto.randomUUID()}`;
  const response = unwrap(await send({ type: "open", id, name: file.name, file }));
  if (response.ok && response.type === "open") {
    opened.set(id, response.summary);
    return response.summary;
  }
  throw new Error("Unexpected reply while opening the database");
}

/**
 * Opens a database hosted on a web server, the way `openLocalDatabase` opens
 * one on disk.
 *
 * Nothing is downloaded up front: the worker reads it by HTTP range requests,
 * a block at a time, as queries need them - the same pages a local file would
 * have read. The server has to answer range requests and allow this page
 * (CORS); both are checked on open, so a server that cannot fails here with a
 * reason rather than halfway through a query.
 */
export async function openRemoteDatabase(url: string): Promise<DatabaseSummary> {
  const id = `url:${crypto.randomUUID()}`;
  const name = decodeURIComponent(new URL(url).pathname.split("/").pop() || url);
  const response = unwrap(await send({ type: "openUrl", id, name, url }));
  if (response.ok && response.type === "open") {
    opened.set(id, response.summary);
    return response.summary;
  }
  throw new Error("Unexpected reply while opening the database");
}

export async function closeLocalDatabase(id: string): Promise<void> {
  opened.delete(id);
  if (worker) unwrap(await send({ type: "close", id }));
}

export async function queryLocalInterval(
  id: string,
  query: IntervalQuery,
): Promise<SubgraphJson> {
  const response = unwrap(await send({ type: "interval", id, query }));
  if (response.ok && response.type === "interval") return response.result;
  throw new Error("Unexpected reply to an interval query");
}

export async function localPathBounds(
  id: string,
  query: { sample: string; contig: string; haplotype?: number },
): Promise<PathBounds | null> {
  const response = unwrap(await send({ type: "pathBounds", id, query }));
  if (response.ok && response.type === "pathBounds") return response.result;
  throw new Error("Unexpected reply to a path bounds query");
}

/** Ids are prefixed so a fetch config can be routed without a lookup.
    "Local" means read in this browser by the worker, whether the bytes come
    from a file on disk (`local:`) or a web server (`url:`) - as opposed to a
    database the Node backend queries for us. */
export const isLocalDatabase = (id: unknown): id is string =>
  typeof id === "string" && (id.startsWith("local:") || id.startsWith("url:"));

export const getLocalDatabase = (id: string): DatabaseSummary | undefined =>
  opened.get(id);

export const listLocalDatabases = (): DatabaseSummary[] => [...opened.values()];
