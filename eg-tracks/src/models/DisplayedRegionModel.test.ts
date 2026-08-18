/**
 * Covers the coordinate math behind the toolbar's pan and zoom buttons.
 * These are the operations that used to be verified by clicking and squinting
 * at the region label.
 */
import { describe, it, expect, beforeEach } from "vitest";
import Chromosome from "./Chromosome";
import Genome from "./Genome";
import DisplayedRegionModel from "./DisplayedRegionModel";

// A small genome keeps the expected numbers readable.
const genome = new Genome("test genome", [
  new Chromosome("chr1", 1000),
  new Chromosome("chr2", 2000),
  new Chromosome("chr3", 500),
]);
const navContext = genome.makeNavContext();
const TOTAL_BASES = 3500;

describe("DisplayedRegionModel", () => {
  let model: DisplayedRegionModel;

  beforeEach(() => {
    model = new DisplayedRegionModel(navContext, 1000, 2000);
  });

  describe("construction", () => {
    it("defaults to the whole navigation context", () => {
      const whole = new DisplayedRegionModel(navContext);
      expect(whole.getContextCoordinates().start).toBe(0);
      expect(whole.getContextCoordinates().end).toBe(TOTAL_BASES);
      expect(whole.getWidth()).toBe(TOTAL_BASES);
    });

    it("honours an explicit start and end", () => {
      expect(model.getContextCoordinates().start).toBe(1000);
      expect(model.getContextCoordinates().end).toBe(2000);
      expect(model.getWidth()).toBe(1000);
    });
  });

  describe("setRegion", () => {
    it("rejects an inverted interval", () => {
      expect(() => model.setRegion(500, 100)).toThrow(RangeError);
    });

    it("rejects non-finite input", () => {
      expect(() => model.setRegion(NaN, 100)).toThrow(RangeError);
      expect(() => model.setRegion(0, Infinity)).toThrow(RangeError);
    });

    // The view slides rather than shrinking, which is what keeps the width
    // stable when a user pans into either end of the genome.
    it("shifts right instead of clipping when pushed past the left edge", () => {
      model.setRegion(-500, 500);
      expect(model.getContextCoordinates().start).toBe(0);
      expect(model.getContextCoordinates().end).toBe(1000);
      expect(model.getWidth()).toBe(1000);
    });

    it("shifts left instead of clipping when pushed past the right edge", () => {
      model.setRegion(TOTAL_BASES - 200, TOTAL_BASES + 800);
      expect(model.getContextCoordinates().end).toBe(TOTAL_BASES);
      expect(model.getWidth()).toBe(1000);
    });

    it("clamps a region wider than the genome to the genome", () => {
      model.setRegion(-5000, TOTAL_BASES + 5000);
      expect(model.getContextCoordinates().start).toBe(0);
      expect(model.getContextCoordinates().end).toBe(TOTAL_BASES);
    });
  });

  describe("pan", () => {
    it("moves right by a positive number of bases", () => {
      model.pan(250);
      expect(model.getContextCoordinates().start).toBe(1250);
      expect(model.getContextCoordinates().end).toBe(2250);
    });

    it("moves left by a negative number of bases", () => {
      model.pan(-250);
      expect(model.getContextCoordinates().start).toBe(750);
      expect(model.getContextCoordinates().end).toBe(1750);
    });

    it("panLeft moves back one full view width", () => {
      model.panLeft();
      expect(model.getContextCoordinates().start).toBe(0);
      expect(model.getContextCoordinates().end).toBe(1000);
    });

    it("panRight moves forward one full view width", () => {
      model.panRight();
      expect(model.getContextCoordinates().start).toBe(2000);
      expect(model.getContextCoordinates().end).toBe(3000);
    });

    it("preserves width when panning into the left edge", () => {
      model.setRegion(100, 1100);
      model.panLeft();
      expect(model.getWidth()).toBe(1000);
      expect(model.getContextCoordinates().start).toBe(0);
    });

    it("preserves width when panning into the right edge", () => {
      model.setRegion(TOTAL_BASES - 1100, TOTAL_BASES - 100);
      model.panRight();
      expect(model.getWidth()).toBe(1000);
      expect(model.getContextCoordinates().end).toBe(TOTAL_BASES);
    });

    it("is reversible away from the edges", () => {
      const before = model.getContextCoordinates();
      model.panRight().panLeft();
      expect(model.getContextCoordinates().start).toBe(before.start);
      expect(model.getContextCoordinates().end).toBe(before.end);
    });
  });

  describe("zoom", () => {
    it("rejects a non-positive factor", () => {
      expect(() => model.zoom(0)).toThrow(RangeError);
      expect(() => model.zoom(-1)).toThrow(RangeError);
    });

    it("factors below 1 zoom in, keeping the centre fixed", () => {
      model.zoom(0.5);
      expect(model.getWidth()).toBe(500);
      // Centre was 1500 and should stay there: 1250..1750
      expect(model.getContextCoordinates().start).toBe(1250);
      expect(model.getContextCoordinates().end).toBe(1750);
    });

    it("factors above 1 zoom out, keeping the centre fixed", () => {
      model.zoom(2);
      expect(model.getWidth()).toBe(2000);
      expect(model.getContextCoordinates().start).toBe(500);
      expect(model.getContextCoordinates().end).toBe(2500);
    });

    it("honours a focal point at the left edge", () => {
      model.zoom(0.5, 0);
      expect(model.getContextCoordinates().start).toBe(1000);
      expect(model.getWidth()).toBe(500);
    });

    it("honours a focal point at the right edge", () => {
      model.zoom(0.5, 1);
      expect(model.getContextCoordinates().end).toBe(2000);
      expect(model.getWidth()).toBe(500);
    });

    // Matches the toolbar's +1 / -1 pair; the docs warn rounding makes this
    // approximate, so allow a couple of bases of drift.
    it("round-trips a zoom out and back in to within rounding error", () => {
      const before = model.getContextCoordinates();
      model.zoom(2).zoom(0.5);
      expect(model.getContextCoordinates().start).toBeCloseTo(before.start, -1);
      expect(model.getContextCoordinates().end).toBeCloseTo(before.end, -1);
    });

    it("never zooms out beyond the whole genome", () => {
      model.zoom(1000);
      expect(model.getContextCoordinates().start).toBe(0);
      expect(model.getContextCoordinates().end).toBe(TOTAL_BASES);
    });
  });

  describe("clone", () => {
    it("is independent of the original", () => {
      const copy = model.clone();
      copy.pan(500);
      expect(model.getContextCoordinates().start).toBe(1000);
      expect(copy.getContextCoordinates().start).toBe(1500);
    });
  });

  describe("currentRegionAsString", () => {
    it("names the chromosome when the view sits inside one", () => {
      model.setRegion(1000, 1500);
      expect(model.currentRegionAsString()).toContain("chr2");
    });

    it("spans chromosomes when the view crosses a boundary", () => {
      model.setRegion(900, 1200);
      const asString = model.currentRegionAsString();
      expect(asString).toContain("chr1");
      expect(asString).toContain("chr2");
    });
  });

  describe("getGenomeIntervals", () => {
    it("splits a cross-chromosome view into per-chromosome intervals", () => {
      model.setRegion(900, 1200);
      const intervals = model.getGenomeIntervals();
      expect(intervals.map((i) => i.chr)).toEqual(["chr1", "chr2"]);
    });
  });
});
