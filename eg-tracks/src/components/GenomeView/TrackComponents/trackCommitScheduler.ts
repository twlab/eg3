/**
 * Serializes expensive track commits (building the display-mode element tree
 * and handing it to React) across all TrackFactory instances so they never run
 * as one unbroken block.
 *
 * Why this exists: jank is governed by the *longest* task, not by total work.
 * When several tracks finish fetching in the same tick they each synchronously
 * build a multi-thousand-node element tree and commit it, back to back, with no
 * yield in between. One 200ms task freezes a drag outright; twenty 10ms tasks
 * interleave with it. A mouse drag only moves pixels from handleMove, so unlike
 * a wheel scroll (which the compositor keeps gliding) it stalls for exactly as
 * long as the main thread is busy.
 *
 * Commits are keyed by track id: queueing a newer commit for a track that
 * already has one pending replaces it, so a track never renders a draw that has
 * already been superseded.
 */

type Commit = () => void;

/** Insertion-ordered, so tracks commit roughly in the order they became ready. */
const queue = new Map<string, Commit>();
let draining = false;
let dragActive = false;

/**
 * How long to keep committing before yielding. Kept under half a 60Hz frame so
 * style, layout, paint and — most importantly — pointer events still fit in the
 * same frame. A single track commit that overruns this on its own cannot be
 * split any further; the budget only decides whether we start *another* one.
 */
const SLICE_BUDGET_MS = 5;

/**
 * Yield to the browser between slices. `scheduler.postTask` at "user-visible"
 * lets the browser run input ahead of us; the MessageChannel fallback posts a
 * real macrotask, which a promise/microtask would not — microtasks drain before
 * the browser gets to render, so they would not break up the block at all.
 */
const yieldToBrowser: (cb: () => void) => void = (() => {
  const scheduler = (globalThis as any).scheduler;
  if (scheduler && typeof scheduler.postTask === "function") {
    return (cb: () => void) => {
      scheduler.postTask(cb, { priority: "user-visible" });
    };
  }
  const channel = new MessageChannel();
  let pending: Array<() => void> = [];
  channel.port1.onmessage = () => {
    const toRun = pending;
    pending = [];
    for (const cb of toRun) {
      cb();
    }
  };
  return (cb: () => void) => {
    pending.push(cb);
    channel.port2.postMessage(null);
  };
})();

function scheduleDrain() {
  if (dragActive) {
    // Mid-drag the main thread belongs to handleMove. rAF pins us to at most
    // one slice per frame instead of racing the pointer for task slots.
    requestAnimationFrame(drain);
  } else {
    yieldToBrowser(drain);
  }
}

function drain() {
  const start = performance.now();
  do {
    const next = queue.keys().next();
    if (next.done) {
      break;
    }
    const key = next.value;
    const commit = queue.get(key)!;
    queue.delete(key);
    try {
      commit();
    } catch (e) {
      // One track failing to draw must not strand every track behind it.
      console.error("Track commit failed", e);
    }
    if (dragActive) {
      break;
    }
  } while (performance.now() - start < SLICE_BUDGET_MS);

  if (queue.size > 0) {
    scheduleDrain();
  } else {
    draining = false;
  }
}

/**
 * Queue a track's commit. Supersedes any commit still pending for `key`.
 */
export function scheduleTrackCommit(key: string, commit: Commit) {
  queue.set(key, commit);
  if (!draining) {
    draining = true;
    scheduleDrain();
  }
}

/** Drop a pending commit — call on unmount so it cannot setState afterwards. */
export function cancelTrackCommit(key: string) {
  queue.delete(key);
}

/**
 * Told by TrackManager on pointer down/up. Only affects pacing: during a drag
 * we commit one track per frame, otherwise we drain on the time budget.
 */
export function setTrackCommitDragActive(active: boolean) {
  dragActive = active;
}
