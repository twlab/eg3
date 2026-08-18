/**
 * Integrity checks for the track example catalog.
 *
 * The catalog feeds the dev harness and the e2e smoke tests, so a malformed
 * entry silently weakens the suite rather than failing loudly. These tests make
 * that failure loud and instant.
 */
import { describe, it, expect } from "vitest";
import {
  TRACK_EXAMPLES,
  NOTABLE_REGIONS,
  getExampleGenomes,
  getTrackExample,
  getTrackExamples,
  getTrackExamplesByTag,
  getTrackExampleTags,
  toHubJson,
} from "./trackExamples";
import { getGenomeConfig } from "../../util";

const REGION_PATTERN = /^chr[\w.]+:\d+-\d+$/;

describe("track example catalog", () => {
  it("is not empty", () => {
    expect(TRACK_EXAMPLES.length).toBeGreaterThan(0);
  });

  it("has unique ids", () => {
    const ids = TRACK_EXAMPLES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every example a genome, region, description and tags", () => {
    for (const example of TRACK_EXAMPLES) {
      expect(example.genome, `${example.id} genome`).toBeTruthy();
      expect(example.region, `${example.id} region`).toBeTruthy();
      expect(example.description, `${example.id} description`).toBeTruthy();
      expect(example.tags.length, `${example.id} tags`).toBeGreaterThan(0);
    }
  });

  it("uses well-formed region strings", () => {
    for (const example of TRACK_EXAMPLES) {
      expect(example.region, `${example.id} region`).toMatch(REGION_PATTERN);
    }
  });

  it("puts start before end in every region", () => {
    for (const example of TRACK_EXAMPLES) {
      const [, coords] = example.region.split(":");
      const [start, end] = coords.split("-").map(Number);
      expect(end, `${example.id} region`).toBeGreaterThan(start);
    }
  });

  it("gives every example a track with a type or filetype", () => {
    for (const example of TRACK_EXAMPLES) {
      const track = example.track;
      expect(
        track.type || track.filetype,
        `${example.id} needs a type or filetype`,
      ).toBeTruthy();
    }
  });

  it("references genomes the app actually knows about", () => {
    for (const genome of getExampleGenomes()) {
      const config = getGenomeConfig(genome);
      expect(config?.genome, `unknown genome ${genome}`).toBeTruthy();
    }
  });

  // Each example's region must exist in the genome it claims, otherwise the
  // harness jumps somewhere empty and the smoke test passes on a blank view.
  it("points at regions that exist in the named genome", () => {
    for (const example of TRACK_EXAMPLES) {
      const config = getGenomeConfig(example.genome);
      const chrName = example.region.split(":")[0];
      const chromosome = config?.genome?.getChromosome(chrName);
      expect(chromosome, `${example.id}: ${chrName} not in ${example.genome}`)
        .toBeTruthy();

      const end = Number(example.region.split("-")[1]);
      expect(
        end,
        `${example.id}: region runs past the end of ${chrName}`,
      ).toBeLessThanOrEqual(chromosome!.getLength());
    }
  });

  it("only uses http(s) urls where a url is given", () => {
    for (const example of TRACK_EXAMPLES) {
      const url = example.track.url;
      if (!url) continue; // empty urls are deliberate error-case fixtures
      if (example.tags.includes("error-case")) continue;
      expect(url, `${example.id} url`).toMatch(/^https?:\/\//);
    }
  });

  it("covers the error cases the browser has to survive", () => {
    const errorIds = getTrackExamplesByTag("error-case").map((e) => e.id);
    expect(errorIds).toContain("error-unknown-type");
    expect(errorIds).toContain("error-bad-url");
    expect(errorIds).toContain("error-empty-url");
  });

  // A stale-host example is exempt from the console-error assertion in the e2e
  // suite, so it must say why — otherwise coverage quietly rots.
  it("documents why every stale-host example is exempt", () => {
    for (const example of getTrackExamplesByTag("stale-host")) {
      expect(example.note, `${example.id} needs a note explaining the host`)
        .toBeTruthy();
    }
  });

  it("gives container tracks their child tracks", () => {
    for (const example of getTrackExamplesByTag("container")) {
      expect(
        Array.isArray(example.track.tracks),
        `${example.id} needs a tracks array`,
      ).toBe(true);
      expect(example.track.tracks.length).toBeGreaterThan(1);
    }
  });
});

describe("notable regions", () => {
  it("are well-formed", () => {
    for (const [key, value] of Object.entries(NOTABLE_REGIONS)) {
      expect(value.region, `${key} region`).toMatch(REGION_PATTERN);
      expect(value.description, `${key} description`).toBeTruthy();
    }
  });

  it("are keyed by a genome the app knows", () => {
    for (const key of Object.keys(NOTABLE_REGIONS)) {
      const genome = key.split("-")[0];
      expect(getGenomeConfig(genome)?.genome, `unknown genome in ${key}`)
        .toBeTruthy();
    }
  });
});

describe("lookup helpers", () => {
  it("getTrackExample finds by id and returns undefined otherwise", () => {
    expect(getTrackExample("ruler")?.id).toBe("ruler");
    expect(getTrackExample("nope")).toBeUndefined();
  });

  it("getTrackExamples filters by genome", () => {
    const hg38 = getTrackExamples("hg38");
    expect(hg38.length).toBeGreaterThan(0);
    expect(hg38.every((e) => e.genome === "hg38")).toBe(true);
  });

  it("getTrackExamples returns everything when no genome is given", () => {
    expect(getTrackExamples()).toHaveLength(TRACK_EXAMPLES.length);
  });

  it("getTrackExampleTags returns only tags in use", () => {
    const tags = getTrackExampleTags();
    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags) {
      expect(getTrackExamplesByTag(tag).length).toBeGreaterThan(0);
    }
  });

  it("toHubJson produces plain track configs", () => {
    const hub = toHubJson(getTrackExamples("hg38").slice(0, 3));
    expect(hub).toHaveLength(3);
    for (const track of hub) {
      expect(track).not.toHaveProperty("id");
      expect(track).not.toHaveProperty("tags");
      expect(track.type || track.filetype).toBeTruthy();
    }
  });

  it("toHubJson copies rather than aliasing the catalog", () => {
    const hub = toHubJson([TRACK_EXAMPLES[0]]);
    hub[0].name = "mutated";
    expect(TRACK_EXAMPLES[0].track.name).not.toBe("mutated");
  });
});
