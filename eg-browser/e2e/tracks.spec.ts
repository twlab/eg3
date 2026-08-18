/**
 * Smoke tests generated from the track example catalog: one per track type.
 *
 * The catalog is imported straight from its source file rather than through the
 * `wuepgg3-track` barrel, because the barrel pulls in the whole rendering tree
 * and this file runs in Node at collection time. `trackExamples.ts` has no
 * imports of its own, so it loads cleanly.
 */
import {
  test,
  expect,
  paintedElementCount,
  clickToolUntilChanged,
} from "./fixtures";
import {
  TRACK_EXAMPLES,
  type TrackExample,
} from "../../eg-tracks/src/models/genomes/trackExamples";

/**
 * Console noise that says nothing about whether the track rendered. Anything
 * else fails the smoke test.
 */
const IGNORED_ERRORS = [
  /favicon/i,
  /ResizeObserver loop/i,
  /Download the React DevTools/i,
  /net::ERR_/i, // covered by the explicit error-case examples instead
  /Failed to load resource/i,
];

const isRealError = (message: string) =>
  !IGNORED_ERRORS.some((pattern) => pattern.test(message));

/**
 * Tracks tagged `slow` pull large binary payloads (Hi-C, BAM, 3D). They are
 * still covered, just given more room and kept out of the default run when
 * EG_SKIP_SLOW is set.
 */
const shouldRun = (example: TrackExample) =>
  !(process.env.EG_SKIP_SLOW === "1" && example.tags.includes("slow"));

test.describe("track smoke tests", () => {
  for (const example of TRACK_EXAMPLES.filter(shouldRun)) {
    const isSlow = example.tags.includes("slow");
    // Both of these are expected to log: error cases by design, stale hosts
    // because the data really is gone. Structure and survival are still
    // asserted for them.
    const expectsErrors =
      example.tags.includes("error-case") || example.tags.includes("stale-host");

    test(`${example.id} renders (${example.genome})`, async ({
      page,
      eg,
      consoleErrors,
    }) => {
      test.slow(isSlow, "large remote payload");

      await eg.loadExample(example.id);

      // The container mounted and knows about the ruler plus the track itself.
      const manager = page.getByTestId("track-manager");
      await expect(manager).toBeVisible();
      await expect
        .poll(async () => eg.trackCount(), {
          message: `${example.id} track count`,
        })
        .toBe(2);

      // The view sits where the example says its data lives.
      const parts = await eg.regionParts();
      expect(parts!.chr).toBe(example.region.split(":")[0]);

      // Something actually painted. Annotation tracks emit SVG, numerical tracks
      // emit canvas, so count both.
      await expect
        .poll(async () => paintedElementCount(page), {
          message: `${example.id} painted elements`,
          timeout: isSlow ? 60_000 : 30_000,
        })
        .toBeGreaterThan(0);

      if (!expectsErrors) {
        const real = consoleErrors.messages.filter(isRealError);
        expect(real, `${example.id} logged console errors`).toEqual([]);
      }
    });
  }
});

test.describe("error handling", () => {
  test("an unsupported track type does not take down the view", async ({
    page,
    eg,
  }) => {
    await eg.loadExample("error-unknown-type");

    await expect(page.getByTestId("track-manager")).toBeVisible();
    // The ruler beside it still renders, which is the real assertion: one bad
    // track must not stop the rest of the container.
    await expect.poll(async () => paintedElementCount(page)).toBeGreaterThan(0);
  });

  test("a broken url does not take down the view", async ({ page, eg }) => {
    await eg.loadExample("error-bad-url");

    await expect(page.getByTestId("track-manager")).toBeVisible();
    await expect.poll(async () => eg.trackCount()).toBe(2);
  });

  test("an empty url does not take down the view", async ({ page, eg }) => {
    await eg.loadExample("error-empty-url");

    await expect(page.getByTestId("track-manager")).toBeVisible();
    await expect.poll(async () => eg.trackCount()).toBe(2);
  });
});

test.describe("navigation with tracks loaded", () => {
  // Region changes are where most track bugs surface: data is refetched,
  // re-binned and redrawn. Exercise that with a couple of representative types.
  for (const id of ["bigwig", "genes-refgene", "repeatmasker"]) {
    test(`${id} survives a pan and a zoom`, async ({ page, eg }) => {
      await eg.loadExample(id);
      await expect(page.getByTestId("track-manager")).toBeVisible();

      const before = await eg.width();

      await clickToolUntilChanged(page, "Pan right", () => eg.region());
      expect(await eg.width()).toBeCloseTo(before, -3);

      await clickToolUntilChanged(page, "Zoom out 1x", () => eg.region());
      expect(await eg.width()).toBeGreaterThan(before);

      // Still alive and drawing after both operations.
      await expect(page.getByTestId("track-manager")).toBeVisible();
      await expect
        .poll(async () => paintedElementCount(page))
        .toBeGreaterThan(0);
    });
  }
});

test.describe("multiple tracks", () => {
  test("a stack of mixed track types renders together", async ({
    page,
    eg,
  }) => {
    const mixed = TRACK_EXAMPLES.filter(
      (e) =>
        e.genome === "hg38" &&
        !e.tags.includes("slow") &&
        !e.tags.includes("error-case") &&
        e.region === "chr7:27053397-27373765",
    ).slice(0, 6);

    await eg.newSession({
      genome: "hg38",
      region: "chr7:27053397-27373765",
      tracks: [{ type: "ruler", name: "Ruler" }, ...mixed.map((e) => e.track)],
    });

    await expect(page.getByTestId("track-manager")).toBeVisible();
    await expect.poll(async () => eg.trackCount()).toBe(mixed.length + 1);
    await expect
      .poll(async () => paintedElementCount(page), { timeout: 45_000 })
      .toBeGreaterThan(0);
  });
});
