# Testing the browser

Four pieces, cheapest feedback first.

| Layer | Lives in | Run with | Speed |
| --- | --- | --- | --- |
| Track example catalog | `eg-tracks/src/models/genomes/trackExamples.ts` | — | — |
| Unit tests (model/coordinate math) | `eg-tracks/src/**/*.test.ts` | `npm test -w wuepgg3-track` | ~3s |
| Dev harness (manual) | Apps → Track Harness | `npm run dev` | interactive |
| End-to-end | `eg-browser/e2e` | `npm run test:e2e -w eg-next` | ~5 min |

## The track example catalog

`trackExamples.ts` holds one example config per track type, each carrying the
region where that track actually has data. It replaces the ~1000 lines of
commented-out `TrackModel` blocks that used to sit in `hg38.js`, `hg19.js` and
`mm10.js`, where testing a track type meant uncommenting a block, saving and
reloading.

One catalog feeds three consumers, so adding an example there gives you a
harness entry and an e2e smoke test for free:

```ts
{
  id: "my-track",              // stable; used in test names
  genome: "hg38",
  region: "chr7:27053397-27373765",
  description: "What this exercises",
  tags: ["numerical"],
  track: { type: "bigwig", name: "...", url: "..." },
}
```

Tags worth knowing:

- `slow` — large payloads (Hi-C, BAM, 3D). Excluded by `test:e2e:fast`.
- `error-case` — expected to fail loudly; the test asserts the browser survives.
- `stale-host` — config is right, data host is gone. Exempt from the console
  error assertion, and a unit test enforces that each one carries a `note`
  saying why, so the exemption cannot rot silently.

`NOTABLE_REGIONS` holds the coordinates that used to live in `//` comments
(fine-mode regions, the historically broken area, long-range views).

## The test handle

`src/lib/testHandle.ts` hangs `window.__EG__` off the page in dev builds, and in
any build made with `VITE_EG_TEST=1`. It exposes the store plus task-level
helpers so a test can arrange state in one call:

```js
__EG__.newSession({ genome: "hg38", region: "chr7:27053397-27373765" });
__EG__.loadExample("bigwig");   // session + region + track, from the catalog
__EG__.region();                 // current region string
__EG__.tool("PanRight");         // dispatch a toolbar action directly
__EG__.reset();                  // drop sessions and persisted state
```

It is also handy by hand: open the console on a dev build and drive the browser
without clicking.

## End-to-end

```bash
npm run test:e2e -w eg-next          # everything
npm run test:e2e:fast -w eg-next     # skip the slow track types
npm run test:e2e:ui -w eg-next       # Playwright UI mode
npm run test:e2e:report -w eg-next   # open the last HTML report
```

Playwright starts the dev server itself; an already-running one on port 5173 is
reused.

### Two things that will bite you

**Clicks land mid-rebuild and get dropped.** The track container rebuilds its
subtree after every pan/zoom, and a click during that window does nothing —
silently. How often it happens depends on machine load, so the same test passes
alone and fails when the heavy track specs run alongside it.

For anything that should move the view, use
`clickToolUntilChanged(page, "Pan right", () => eg.region())`: it settles,
clicks, watches for the state to actually move, and clicks again if it did not.
A genuinely broken button still fails, with a message saying the action never
took effect.

`clickTool` (settle, click, settle) is the lighter version for interactions that
are not expected to change state.

This is a real app-level rough edge, not only a test problem — a user clicking
twice quickly hits it too.

**Pan and zoom are approximate.** Both round when converting between bases and
pixels, so a pan-right/pan-left round trip lands a few bases off rather than
exactly where it started. Assert with a tolerance, not equality.

**The screenshot app can open before there is anything to capture.** It asks the
container for its current data on mount; if the container has not published yet
it renders "No tracks in view" and does not retry on its own — the user has to
hit retake. The test waits for tracks to settle before opening it.

**Worker count is capped at 2.** Track rendering is CPU-heavy and parallel
browsers starve each other, at which point the container falls behind and drops
interactions. That reads as flakiness but is really resource contention. Raising
it will reintroduce failures.

### Assertions

Prefer state over pixels — `eg.region()`, `eg.trackCount()`, `eg.activeTool()`
stay meaningful as rendering changes. For "did anything paint", use
`paintedElementCount(page)`: annotation tracks emit SVG, numerical tracks emit
canvas, so neither alone is a universal signal.

Note `parseRegion` returns `null` for a view spanning chromosomes. The nav
context is the whole genome, so zooming far out gives `chr7:...-chr9:...`.

### HAR replay

Every track fetches remote binary data from vizhub, ENCODE, AWS and friends.
Left live the suite is slow and fails whenever a host hiccups.

```bash
npm run test:e2e:record -w eg-next   # hit the network, write e2e/hars/*.har
npm run test:e2e -w eg-next          # replay from those HARs (default)
npm run test:e2e:live -w eg-next     # ignore HARs entirely
```

One HAR per spec file, so they can be re-recorded independently. Replay is a
no-op when no HAR exists yet, so the suite works before anything is recorded —
it is just slower and dependent on those hosts being up. Recording is the
prerequisite for adding `toHaveScreenshot()` visual diffs later; without pinned
data the images will not be stable.

## Adding coverage

- New track type → add an entry to `trackExamples.ts`. Nothing else needed.
- New toolbar button → add a case to `toolbar.spec.ts`, targeting its `title`.
- New coordinate math → unit test it in `eg-tracks`; that is milliseconds of
  feedback versus minutes.
