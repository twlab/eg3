/**
 * Shared fixtures for the e2e suite.
 *
 * Two things make these tests survivable:
 *
 *  1. `eg` — a typed proxy over `window.__EG__`, so a spec can arrange state
 *     ("hg38, this region, these tracks") in one call and assert on state
 *     rather than on pixels.
 *
 *  2. HAR replay — every track fetches remote binary data from vizhub, ENCODE,
 *     AWS and friends. Left live, the suite is slow and fails whenever one of
 *     those hosts hiccups. Record once, replay forever.
 *
 * HAR modes, via the EG_HAR environment variable:
 *   replay (default) — serve remote requests from e2e/hars when a file exists,
 *                      otherwise fall through to the network
 *   record           — hit the network and write/update the HAR
 *   off              — always use the live network
 */
import { test as base, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HAR_DIR = path.join(HERE, "hars");

type HarMode = "replay" | "record" | "off";
const HAR_MODE = (process.env.EG_HAR as HarMode) ?? "replay";

/** Anything not served by the local dev server is track data worth recording. */
const REMOTE_URL = /^https?:\/\/(?!localhost|127\.0\.0\.1)/;

export async function useHar(page: Page, name: string): Promise<void> {
  if (HAR_MODE === "off") return;

  const harPath = path.join(HAR_DIR, `${name}.har`);

  if (HAR_MODE === "record") {
    fs.mkdirSync(HAR_DIR, { recursive: true });
    await page.routeFromHAR(harPath, {
      url: REMOTE_URL,
      update: true,
      updateContent: "attach",
    });
    return;
  }

  // Replay. A missing HAR is not a failure — it just means nobody has recorded
  // this group yet, so fall through to the live network.
  if (fs.existsSync(harPath)) {
    await page.routeFromHAR(harPath, { url: REMOTE_URL, update: false });
  }
}

/**
 * Waits until the track container has stopped mutating.
 *
 * Tracks stream in: the container mounts, then fetches, then paints, and the
 * toolbar's action handlers are not wired up until that first pass completes.
 * Clicking earlier dispatches into the void — which is exactly how these tests
 * failed the first time round. Rather than a fixed sleep, watch the subtree
 * element count and treat "unchanged for a beat" as settled.
 */
export async function waitForTracksSettled(
  page: Page,
  { timeout = 30_000, quietMs = 700 }: { timeout?: number; quietMs?: number } = {},
): Promise<void> {
  await page
    .getByTestId("track-manager")
    .waitFor({ state: "visible", timeout });

  // Clear any bookkeeping left by a previous wait on this page.
  await page.evaluate(() => {
    delete (window as any).__egSettleCount;
    delete (window as any).__egSettleSince;
  });

  await page.waitForFunction(
    (quiet: number) => {
      const root = document.querySelector('[data-testid="track-manager"]');
      if (!root) return false;

      const count = root.querySelectorAll("*").length;
      const w = window as any;
      const now = Date.now();

      if (w.__egSettleCount !== count) {
        w.__egSettleCount = count;
        w.__egSettleSince = now;
        return false;
      }
      return now - (w.__egSettleSince ?? now) >= quiet;
    },
    quietMs,
    { timeout, polling: 100 },
  );
}

/**
 * Clicks a toolbar button and waits for the resulting re-render to finish.
 *
 * The container rebuilds its subtree after every pan/zoom, and a click that
 * lands mid-rebuild is dropped on the floor — which is what made a bare
 * `click(); click();` pair silently perform only the first action. Always go
 * through this for consecutive toolbar interactions.
 */
export async function clickTool(page: Page, title: string | RegExp) {
  await page.getByTitle(title).click();
  await waitForTracksSettled(page);
}

/**
 * Clicks a toolbar button until it demonstrably takes effect.
 *
 * The app drops clicks that arrive while the track container is rebuilding, and
 * how often that happens depends on machine load — the same test passes alone
 * and fails when heavy track specs run alongside it. Waiting for the container
 * to settle first shrinks the window but does not close it, because the rebuild
 * can start again between the settle check and the click.
 *
 * So: click, watch for the state to actually move, and click again if it did
 * not. If the button is genuinely broken this still fails, with a message
 * saying the action never took effect rather than a bare assertion mismatch.
 *
 * The dropped clicks are a real app-level rough edge, not just a test problem —
 * a user clicking twice quickly hits it too.
 */
export async function clickToolUntilChanged<T>(
  page: Page,
  title: string | RegExp,
  read: () => Promise<T>,
  { attempts = 3, timeout = 10_000 }: { attempts?: number; timeout?: number } = {},
): Promise<void> {
  const before = await read();

  for (let attempt = 1; attempt <= attempts; attempt++) {
    await waitForTracksSettled(page);
    await page.getByTitle(title).click();

    try {
      await expect.poll(read, { timeout }).not.toEqual(before);
      await waitForTracksSettled(page);
      return;
    } catch {
      // Either the click was swallowed by a rebuild, or it was merely slower
      // than the poll window. Settle and look once more before clicking again —
      // re-clicking a slow-but-landed action would apply it twice.
      await waitForTracksSettled(page);
      if (JSON.stringify(await read()) !== JSON.stringify(before)) return;
    }
  }

  throw new Error(
    `"${title}" produced no state change after ${attempts} attempts ` +
      `(value stayed ${JSON.stringify(before)})`,
  );
}

/**
 * Counts what actually painted. Annotation tracks draw features as SVG,
 * numerical tracks draw to canvas, so neither alone is a universal signal.
 */
export async function paintedElementCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const root = document.querySelector('[data-testid="track-manager"]');
    if (!root) return 0;
    return (
      root.querySelectorAll("svg").length + root.querySelectorAll("canvas").length
    );
  });
}

/** Mirrors the handle installed by src/lib/testHandle.ts. */
export interface EgHandle {
  goto: (url?: string) => Promise<void>;
  region: () => Promise<string | null>;
  /** Region parsed into numbers, with separators stripped. */
  regionParts: () => Promise<{ chr: string; start: number; end: number } | null>;
  width: () => Promise<number>;
  trackNames: () => Promise<string[]>;
  trackCount: () => Promise<number>;
  goTo: (coordinate: string) => Promise<void>;
  addTracks: (tracks: Record<string, any>[]) => Promise<void>;
  setTracks: (tracks: Record<string, any>[]) => Promise<void>;
  clearTracks: () => Promise<void>;
  tool: (name: string) => Promise<void>;
  activeTool: () => Promise<string | null>;
  newSession: (opts: {
    genome: string;
    region?: string;
    tracks?: Record<string, any>[];
  }) => Promise<void>;
  loadExample: (id: string) => Promise<void>;
  reset: () => Promise<void>;
}

/**
 * Parses a single-chromosome region string.
 *
 * Returns null when the view spans chromosomes — the navigation context is the
 * whole genome, so zooming far enough out yields "chr7:...-chr9:..." instead.
 * Callers that can hit that zoom level must handle the null.
 */
export function parseRegion(
  region: string | null,
): { chr: string; start: number; end: number } | null {
  if (!region) return null;
  // Region labels in the UI carry thousands separators; state strings do not.
  const cleaned = region.replace(/,/g, "");
  const match = cleaned.match(/^(\S+):(\d+)-(\d+)$/);
  if (!match) return null;
  return { chr: match[1], start: Number(match[2]), end: Number(match[3]) };
}

function makeHandle(page: Page): EgHandle {
  const waitForHandle = async () => {
    await page.waitForFunction(() => Boolean((window as any).__EG__), null, {
      timeout: 30_000,
    });
  };

  const handle: EgHandle = {
    goto: async (url = "./") => {
      await page.goto(url);
      await waitForHandle();
    },

    region: () => page.evaluate(() => (window as any).__EG__.region()),

    regionParts: async () => parseRegion(await handle.region()),

    width: async () => {
      const parts = await handle.regionParts();
      return parts ? parts.end - parts.start : 0;
    },

    trackNames: () => page.evaluate(() => (window as any).__EG__.trackNames()),

    trackCount: async () => (await handle.trackNames()).length,

    goTo: async (coordinate) => {
      await page.evaluate(
        (c) => (window as any).__EG__.goTo(c),
        coordinate,
      );
    },

    addTracks: async (tracks) => {
      await page.evaluate((t) => (window as any).__EG__.addTracks(t), tracks);
    },

    setTracks: async (tracks) => {
      await page.evaluate((t) => (window as any).__EG__.setTracks(t), tracks);
    },

    clearTracks: async () => {
      await page.evaluate(() => (window as any).__EG__.clearTracks());
    },

    tool: async (name) => {
      await page.evaluate((n) => (window as any).__EG__.tool(n), name);
    },

    activeTool: () => page.evaluate(() => (window as any).__EG__.activeTool()),

    newSession: async (opts) => {
      await page.evaluate((o) => (window as any).__EG__.newSession(o), opts);
      await page.evaluate(() => (window as any).__EG__.whenReady());
      await waitForTracksSettled(page);
    },

    loadExample: async (id) => {
      await page.evaluate((i) => (window as any).__EG__.loadExample(i), id);
      await page.evaluate(() => (window as any).__EG__.whenReady());
      await waitForTracksSettled(page, { timeout: 60_000 });
    },

    reset: async () => {
      await page.evaluate(() => (window as any).__EG__.reset());
    },
  };

  return handle;
}

/** Console errors collected during a test, for the smoke assertions. */
export type ConsoleErrors = { messages: string[] };

export const test = base.extend<{
  eg: EgHandle;
  consoleErrors: ConsoleErrors;
}>({
  // Depends on consoleErrors so its listeners are attached before this fixture
  // navigates — otherwise errors thrown during initial load are missed.
  eg: async ({ page, consoleErrors: _consoleErrors }, use, testInfo) => {
    // One HAR per spec file keeps recordings small and independently
    // re-recordable.
    const harName = path.basename(testInfo.file).replace(/\.spec\.ts$/, "");
    await useHar(page, harName);

    const handle = makeHandle(page);
    await handle.goto();
    // Persisted sessions from a previous run would otherwise leak in.
    await handle.reset();
    await use(handle);
  },

  consoleErrors: async ({ page }, use) => {
    const collected: ConsoleErrors = { messages: [] };
    page.on("console", (msg) => {
      if (msg.type() === "error") collected.messages.push(msg.text());
    });
    page.on("pageerror", (err) => {
      collected.messages.push(`pageerror: ${err.message}`);
    });
    await use(collected);
  },
});

export { expect };
