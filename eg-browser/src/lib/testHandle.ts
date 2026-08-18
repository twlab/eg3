/**
 * Test handle: a small imperative API hung off `window.__EG__`.
 *
 * Driving the browser purely through clicks makes end-to-end tests long and
 * brittle — setting up "hg38, this region, these three tracks" is a dozen
 * interactions before the thing under test even starts. This exposes the store
 * plus a few task-level helpers so a test can arrange state in one call and
 * then assert on state rather than on pixels.
 *
 * Only installed in dev builds, or when a build sets `VITE_EG_TEST=1` (which is
 * what the Playwright config does for preview/CI runs). It is a no-op in a
 * normal production build.
 */
import {
  clearAllSessions,
  createSession,
  setCurrentSession,
  updateCurrentSession,
} from "./redux/slices/browserSlice";
import { dispatchAction, setToggleTool } from "./redux/slices/utilitySlice";
import {
  ACTION_TOOLS,
  TOGGLE_TOOLS,
  GenomeSerializer,
  getGenomeConfig,
  generateUUID,
  TRACK_EXAMPLES,
  getTrackExample,
  type TrackExample,
} from "wuepgg3-track";

type MinimalStore = {
  getState: () => any;
  dispatch: (action: any) => any;
};

export interface TestHandle {
  store: MinimalStore;
  /** Full redux state. */
  state: () => any;
  /** The active session object, or null. */
  session: () => any;
  /** Current region string, preferring the user-driven one. */
  region: () => string | null;
  /** Tracks in the active session. */
  tracks: () => any[];
  /** Track names, which is usually all an assertion needs. */
  trackNames: () => string[];
  /** Navigate to a coordinate string such as "chr7:27053397-27373765". */
  goTo: (coordinate: string) => void;
  /** Append tracks to the active session. */
  addTracks: (tracks: Record<string, any>[]) => void;
  /** Replace every track in the active session. */
  setTracks: (tracks: Record<string, any>[]) => void;
  /** Remove all tracks from the active session. */
  clearTracks: () => void;
  /** Activate a toggle tool or fire an action tool (pan/zoom) by name. */
  tool: (name: string) => void;
  /** Currently active toggle tool. */
  activeTool: () => string | null;
  /** Build a fresh session. Returns the new session id. */
  newSession: (opts: {
    genome: string;
    region?: string;
    tracks?: Record<string, any>[];
  }) => string | null;
  /** Drop every session and the persisted copy — test isolation. */
  reset: () => void;
  /** The track example catalog. */
  examples: TrackExample[];
  /** Set up a session that shows one catalog example at its own region. */
  loadExample: (id: string) => string | null;
  /** Resolves once a session exists and has a region. */
  whenReady: (timeoutMs?: number) => Promise<void>;
}

// Referenced as literals so Vite can statically replace them at build time and
// tree-shake the whole handle out of a production bundle.
const isEnabled = (): boolean =>
  Boolean(import.meta.env.DEV || import.meta.env.VITE_EG_TEST === "1");

export function installTestHandle(store: MinimalStore): void {
  if (typeof window === "undefined" || !isEnabled()) return;

  const state = () => store.getState();

  const session = () => {
    const s = state()?.browser?.present;
    const id = s?.currentSession;
    return id ? (s?.sessions?.entities?.[id] ?? null) : null;
  };

  // Tracks need ids and a selection flag or the track container skips them —
  // the same normalisation `createSession` does for its initial tracks.
  const initTracks = (tracks: Record<string, any>[]) =>
    tracks.map((t) => ({ ...t, id: generateUUID(), isSelected: false }));

  const handle: TestHandle = {
    store,
    state,
    session,

    region: () => {
      const s = session();
      if (!s) return null;
      return s.userViewRegion ?? s.viewRegion ?? null;
    },

    tracks: () => session()?.tracks ?? [],

    trackNames: () =>
      (session()?.tracks ?? []).map((t: any) => t.name ?? t.type ?? ""),

    goTo: (coordinate) => {
      store.dispatch(
        updateCurrentSession({
          viewRegion: coordinate as any,
          userViewRegion: coordinate as any,
        }),
      );
    },

    addTracks: (tracks) => {
      const current = session()?.tracks ?? [];
      store.dispatch(
        updateCurrentSession({ tracks: [...current, ...initTracks(tracks)] }),
      );
    },

    setTracks: (tracks) => {
      store.dispatch(updateCurrentSession({ tracks: initTracks(tracks) }));
    },

    clearTracks: () => {
      store.dispatch(updateCurrentSession({ tracks: [] }));
    },

    tool: (name) => {
      if (TOGGLE_TOOLS.has(name)) {
        store.dispatch(setToggleTool(name));
      } else if (ACTION_TOOLS.has(name)) {
        store.dispatch(dispatchAction(name));
      } else {
        throw new Error(`Unknown tool: ${name}`);
      }
    },

    activeTool: () => state()?.utility?.toolState?.tool ?? null,

    newSession: ({ genome, region, tracks }) => {
      const config = getGenomeConfig(genome);
      if (!config?.genome) {
        throw new Error(`Unknown genome: ${genome}`);
      }
      const serialized = GenomeSerializer.serialize(config);
      const id = generateUUID();

      store.dispatch(
        createSession({
          id,
          genome: serialized,
          viewRegion: region as any,
          additionalTracks: tracks ? initTracks(tracks) : undefined,
        }),
      );
      store.dispatch(setCurrentSession(id));
      return id;
    },

    reset: () => {
      store.dispatch(setCurrentSession(null));
      store.dispatch(clearAllSessions());
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("persist:"))
          .forEach((k) => localStorage.removeItem(k));
      } catch {
        /* storage may be unavailable; the redux reset is the part that matters */
      }
    },

    examples: TRACK_EXAMPLES,

    loadExample: (id) => {
      const example = getTrackExample(id);
      if (!example) {
        throw new Error(`Unknown track example: ${id}`);
      }
      // A ruler alongside the track under test gives every screenshot a stable
      // reference and proves the container itself rendered.
      return handle.newSession({
        genome: example.genome,
        region: example.region,
        tracks: [{ type: "ruler", name: "Ruler" }, example.track],
      });
    },

    whenReady: (timeoutMs = 15000) =>
      new Promise<void>((resolve, reject) => {
        const started = Date.now();
        const check = () => {
          const s = session();
          if (s && (s.userViewRegion || s.viewRegion)) {
            resolve();
            return;
          }
          if (Date.now() - started > timeoutMs) {
            reject(new Error("Timed out waiting for a session"));
            return;
          }
          setTimeout(check, 50);
        };
        check();
      }),
  };

  (window as any).__EG__ = handle;
}
