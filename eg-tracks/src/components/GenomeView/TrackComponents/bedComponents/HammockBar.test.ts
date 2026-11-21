import { describe, expect, it } from "vitest";
import { computeHammockBarScale, thinHammockBars } from "./HammockBar";

const item = (start: number, end: number, score: number | null) => ({
  xSpan: { start, end },
  feature: {
    start,
    end,
    3: score === null ? 'name:"x"' : `scorelst:[${score}],name:"x"`,
  },
});
const groups = (...items: any[]) => items.map((i) => ({ row: 0, placedFeatures: [i] }));

describe("computeHammockBarScale", () => {
  it("auto-scales to the scores inside the view window", () => {
    const placements = groups(item(10, 20, 5), item(500, 510, 80));
    const inView = computeHammockBarScale(placements, {}, 40, { start: 0, end: 100 });
    expect(inView.scale.domain()).toEqual([5, 0]);
    expect(inView.isFlat).toBe(false);
    const all = computeHammockBarScale(placements, {}, 40);
    expect(all.scale.domain()).toEqual([80, 0]);
  });

  it("falls back to every drawn item when the window holds none", () => {
    const placements = groups(item(500, 510, 80));
    const { scale } = computeHammockBarScale(placements, {}, 40, { start: 0, end: 100 });
    expect(scale.domain()).toEqual([80, 0]);
  });

  it("honours a fixed scale", () => {
    const { scale, isFlat } = computeHammockBarScale(
      groups(item(10, 20, 5)),
      { yScale: "fixed", yMax: 10, yMin: 0 },
      40,
    );
    expect(scale.domain()).toEqual([10, 0]);
    expect(scale(20)).toBe(scale(10)); // clamped
    expect(isFlat).toBe(false);
  });

  it("is flat when no item has a non-zero score", () => {
    expect(computeHammockBarScale(groups(item(1, 9, 0), item(20, 30, 0)), {}, 40).isFlat).toBe(true);
    expect(computeHammockBarScale(groups(item(1, 9, null)), {}, 40).isFlat).toBe(true);
    expect(computeHammockBarScale([], {}, 40).isFlat).toBe(true);
  });

  it("uses the requested score of each item", () => {
    const placement = { xSpan: { start: 0, end: 5 }, feature: { 3: "scorelst:[2,30]" } };
    const { scale } = computeHammockBarScale([{ placedFeatures: [placement] }], { scoreIndex: 1 }, 40);
    expect(scale.domain()).toEqual([30, 0]);
  });
});

describe("thinHammockBars", () => {
  it("keeps only the tallest of the sub-pixel items sharing a pixel column", () => {
    const [group] = thinHammockBars(
      groups(item(10.1, 10.3, 2), item(10.4, 10.6, 9), item(10.7, 10.9, 4), item(11.2, 11.5, 1)),
    );
    const scores = group.placedFeatures.map((p: any) => p.feature[3]).sort();
    expect(scores).toEqual(['scorelst:[1],name:"x"', 'scorelst:[9],name:"x"']);
  });

  it("keeps every item that is at least a pixel wide", () => {
    const wide = [item(10, 12, 1), item(10.5, 13, 2), item(10, 11, 3)];
    expect(thinHammockBars(groups(...wide))[0].placedFeatures).toHaveLength(3);
  });

  it("bounds the number of drawn items by the pixel width", () => {
    const dense = Array.from({ length: 5000 }, (_, i) => item(i / 50, i / 50 + 0.01, i % 7));
    expect(thinHammockBars(groups(...dense))[0].placedFeatures.length).toBeLessThanOrEqual(100);
  });
});
