import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { isSupportedTrackType, SUPPORTED_TRACK_TYPES } from "../trackTypes";

/**
 * Adding a track type means registering it in several maps. These tests read
 * those maps from source and fail when a supported type is missing from one of
 * them, which otherwise only shows up as an error when the track is loaded.
 * (Source text is used because the maps live in modules that need a browser.)
 */
const SRC = path.resolve(__dirname, "../..");
const read = (file: string) => fs.readFileSync(path.join(SRC, file), "utf8");

/** Keys of the object literal assigned right after `anchor`, comments ignored. */
function objectKeys(source: string, anchor: string): string[] {
  const start = source.indexOf(anchor);
  expect(start, `"${anchor}" not found`).toBeGreaterThan(-1);
  const body = source.slice(source.indexOf("{", start + anchor.length - 1));
  const keys: string[] = [];
  let depth = 0;
  for (const rawLine of body.split("\n")) {
    const line = rawLine.replace(/\/\/.*$/, "");
    const key = depth === 1 ? /^\s*([A-Za-z0-9_]+)\s*:/.exec(line) : null;
    if (key) {
      keys.push(key[1]);
    }
    depth += (line.match(/[{[(]/g) || []).length;
    depth -= (line.match(/[}\])]/g) || []).length;
    if (depth <= 0 && keys.length > 0) {
      break;
    }
  }
  return keys;
}

/** String literals of the `new Set([...])` or `[...]` assigned to `name`. */
function stringList(source: string, name: string): string[] {
  const match = new RegExp(`const ${name}\\b[^=]*=[^\\[]*\\[([^\\]]*)\\]`).exec(source);
  expect(match, `list "${name}" not found`).not.toBeNull();
  return [...match![1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

// g3d is shown by the 3D viewer panel, outside the track-row machinery
const ROW_TRACK_TYPES = SUPPORTED_TRACK_TYPES.filter((type) => type !== "g3d");

describe("supported track types", () => {
  it("are lower case and unique", () => {
    expect(SUPPORTED_TRACK_TYPES.every((type) => type === type.toLowerCase())).toBe(true);
    expect(new Set(SUPPORTED_TRACK_TYPES).size).toBe(SUPPORTED_TRACK_TYPES.length);
  });

  it("are matched case-insensitively", () => {
    expect(isSupportedTrackType("bigWig")).toBe(true);
    expect(isSupportedTrackType("HAMMOCK")).toBe(true);
    expect(isSupportedTrackType("rgbpeak")).toBe(false);
    expect(isSupportedTrackType(undefined)).toBe(false);
  });

  it("each have a track config", () => {
    const configured = objectKeys(
      read("trackConfigs/config-menu-models.tsx/getTrackConfig.tsx"),
      "export const TYPE_NAME_TO_CONFIG = {",
    );
    expect([...configured].sort()).toEqual([...ROW_TRACK_TYPES].sort());
  });

  it("each have default options", () => {
    const withDefaults = objectKeys(
      read("components/GenomeView/TrackComponents/defaultOptionsMap.tsx"),
      "export const trackOptionMap: { [key: string]: any } = {",
    );
    expect(ROW_TRACK_TYPES.filter((type) => !withDefaults.includes(type))).toEqual([]);
  });

  it("each have a data source, unless they load no file of their own", () => {
    const source = read("getRemoteData/fetchTypeMap.tsx");
    const fetched = [
      "BED_OR_TABIX", "BIG", "BIGBED", "JASPAR", "REPEATMASKER", "RMSKV2",
      "VCF", "HIC", "BAM", "GENE_ANNOTATION", "SNP",
    ].flatMap((name) => stringList(source, name));
    // drawn without data, or made of member tracks that are fetched one by one
    const noOwnFile = ["ruler", "dynamic", "dynamicbed", "dynamichic", "dynamiclongrange"];
    expect(
      ROW_TRACK_TYPES.filter((type) => !fetched.includes(type) && !noOwnFile.includes(type)),
    ).toEqual([]);
  });
});
