/**
 * Toolbar interactions: pan, the six zoom steps, tool toggles, undo/redo.
 *
 * Every assertion goes through session state rather than pixels, so these stay
 * meaningful as the rendering changes.
 *
 * Actions that move the view go through `clickToolUntilChanged`, because the
 * app drops clicks that land while the track container is rebuilding. See the
 * note on that helper.
 */
import { test, expect, clickTool, clickToolUntilChanged } from "./fixtures";

// A mid-chromosome region so panning in either direction has room and never
// clamps against a chromosome edge.
const START_REGION = "chr7:27053397-27373765";

test.beforeEach(async ({ eg }) => {
  await eg.newSession({ genome: "hg38", region: START_REGION });
});

test.describe("panning", () => {
  test("pan right moves the view forward and keeps its width", async ({
    page,
    eg,
  }) => {
    const before = await eg.regionParts();
    const width = await eg.width();

    await clickToolUntilChanged(page, "Pan right", () => eg.region());

    const after = await eg.regionParts();
    expect(after!.start).toBeGreaterThan(before!.start);
    // Panning is a translation, so the width must survive it.
    expect(await eg.width()).toBeCloseTo(width, -2);
  });

  test("pan left moves the view backward and keeps its width", async ({
    page,
    eg,
  }) => {
    const before = await eg.regionParts();
    const width = await eg.width();

    await clickToolUntilChanged(page, "Pan left", () => eg.region());

    const after = await eg.regionParts();
    expect(after!.start).toBeLessThan(before!.start);
    expect(await eg.width()).toBeCloseTo(width, -2);
  });

  // Pan converts between base positions and pixels and rounds on the way, so a
  // round trip lands a few bases off rather than exactly where it started —
  // the same caveat DisplayedRegionModel documents for zoom. A handful of
  // bases is fine; drifting by a visible fraction of the view is not.
  test("pan right then left returns to the starting region", async ({
    page,
    eg,
  }) => {
    const before = await eg.regionParts();

    await clickToolUntilChanged(page, "Pan right", () => eg.region());
    await clickToolUntilChanged(page, "Pan left", () => eg.region());

    const after = await eg.regionParts();
    expect(Math.abs(after!.start - before!.start)).toBeLessThanOrEqual(10);
    expect(Math.abs(after!.end - before!.end)).toBeLessThanOrEqual(10);
  });
});

test.describe("zooming", () => {
  const zoomButtons = [
    { title: "Zoom in 5x", wider: false },
    { title: "Zoom in 1x", wider: false },
    { title: "Zoom in ⅓", wider: false },
    { title: "Zoom out ⅓", wider: true },
    { title: "Zoom out 1x", wider: true },
    { title: "Zoom out 5x", wider: true },
  ];

  for (const { title, wider } of zoomButtons) {
    test(`"${title}" makes the view ${wider ? "wider" : "narrower"}`, async ({
      page,
      eg,
    }) => {
      const before = await eg.width();

      await clickToolUntilChanged(page, title, () => eg.region());

      const after = await eg.width();
      if (wider) {
        expect(after).toBeGreaterThan(before);
      } else {
        expect(after).toBeLessThan(before);
      }
    });
  }

  test("zoom keeps the view centred", async ({ page, eg }) => {
    const before = await eg.regionParts();
    const centreBefore = (before!.start + before!.end) / 2;
    const widthBefore = before!.end - before!.start;

    await clickToolUntilChanged(page, "Zoom in 1x", () => eg.region());

    const after = await eg.regionParts();
    expect(after!.end - after!.start).toBeLessThan(widthBefore);

    const centreAfter = (after!.start + after!.end) / 2;
    // Allow a little drift from rounding.
    expect(Math.abs(centreAfter - centreBefore)).toBeLessThan(
      widthBefore * 0.05,
    );
  });

  // The navigation context is the whole genome, not a single chromosome, so
  // zooming far enough out legitimately produces a region spanning several
  // chromosomes ("chr7:...-chr9:..."). The guarantee worth testing is that it
  // stays inside the genome and keeps producing a valid region.
  test("zooming out repeatedly stays inside the genome", async ({
    page,
    eg,
  }) => {
    const before = await eg.width();

    for (let i = 0; i < 4; i++) {
      await clickToolUntilChanged(page, "Zoom out 5x", () => eg.region());
    }

    const region = await eg.region();
    expect(region, "region should still be set after zooming right out")
      .toBeTruthy();
    expect(region).toMatch(/^chr/);

    const parts = await eg.regionParts();
    if (parts) {
      expect(parts.start).toBeGreaterThanOrEqual(0);
      expect(parts.end).toBeGreaterThan(parts.start);
      expect(parts.end - parts.start).toBeGreaterThan(before);
    } else {
      // Spans chromosomes, which is expected at this zoom level.
      expect(region).toMatch(/chr\S+:\d+-chr\S+:\d+/);
    }
  });
});

test.describe("tool toggles", () => {
  test("selecting the highlight tool makes it active", async ({ page, eg }) => {
    await page.getByTitle("Highlight tool (Alt+N)").click();
    await expect.poll(() => eg.activeTool()).toBe("Highlight");
  });

  test("clicking the active tool again clears it", async ({ page, eg }) => {
    const zoomTool = page.getByTitle(/Zoom-in tool/);

    await zoomTool.click();
    await expect.poll(() => eg.activeTool()).toBe("Zoom");

    await zoomTool.click();
    await expect.poll(() => eg.activeTool()).toBeNull();
  });

  test("selecting a second tool replaces the first", async ({ page, eg }) => {
    await page.getByTitle(/Reorder tool/).click();
    await expect.poll(() => eg.activeTool()).toBe("Reorder");

    await page.getByTitle(/Drag tool/).click();
    await expect.poll(() => eg.activeTool()).toBe("Drag");
  });
});

test.describe("select all", () => {
  test("the checkbox selects and deselects every track", async ({
    page,
    eg,
  }) => {
    const checkbox = page.getByRole("checkbox", {
      name: "Select All/None tracks",
    });

    await checkbox.check();
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as any).__EG__.tracks().every((t: any) => t.isSelected),
        ),
      )
      .toBe(true);

    await checkbox.uncheck();
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as any).__EG__.tracks().some((t: any) => t.isSelected),
        ),
      )
      .toBe(false);
  });
});

test.describe("undo and redo", () => {
  // History is recorded a beat after the region changes, so these wait for the
  // buttons to enable rather than assuming they already have.
  test("undo restores the previous region", async ({ page, eg }) => {
    const before = await eg.region();

    await clickToolUntilChanged(page, "Pan right", () => eg.region());

    await expect(page.getByTitle("Undo")).toBeEnabled();
    await clickToolUntilChanged(page, "Undo", () => eg.region());

    expect(await eg.region()).toBe(before);
  });

  test("redo reapplies an undone change", async ({ page, eg }) => {
    await clickToolUntilChanged(page, "Pan right", () => eg.region());
    const panned = await eg.region();

    await expect(page.getByTitle("Undo")).toBeEnabled();
    await clickToolUntilChanged(page, "Undo", () => eg.region());

    await expect(page.getByTitle("Redo")).toBeEnabled();
    await clickToolUntilChanged(page, "Redo", () => eg.region());

    expect(await eg.region()).toBe(panned);
  });

  test("undo is disabled on a fresh session", async ({ page }) => {
    await expect(page.getByTitle("Undo")).toBeDisabled();
  });
});
