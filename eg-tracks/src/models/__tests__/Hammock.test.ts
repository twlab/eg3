import { describe, expect, it } from "vitest";
import {
  getHammockDetails,
  getHammockScore,
  parseHammockColumn,
} from "../Hammock";
import {
  getFeatureName,
  getFeatureScore,
  getFeatureStrand,
} from "../Feature";

const record = (column: string) => ({ start: 100, end: 200, 3: column });

describe("parseHammockColumn", () => {
  it("parses the relaxed-JSON 4th column of a hammock line", () => {
    const details = parseHammockColumn(
      'scorelst:[3.37749,5.17927],id:1,name:"WT.broad_peak_1",',
    );
    expect(details.name).toBe("WT.broad_peak_1");
    expect(details.id).toBe(1);
    expect(details.scores).toEqual([3.37749, 5.17927]);
    expect(details.strand).toBe("");
  });

  it("normalises the strand, including the > and < forms", () => {
    expect(parseHammockColumn('id:1,strand:">"').strand).toBe("+");
    expect(parseHammockColumn('id:1,strand:"<"').strand).toBe("-");
    expect(parseHammockColumn('id:1,strand:"-"').strand).toBe("-");
    expect(parseHammockColumn('id:1,strand:"."').strand).toBe("");
  });

  it("keeps extra fields for the tooltip", () => {
    const details = parseHammockColumn('id:7,name:"x",category:3,desc:"a, b"');
    expect(details.fields.category).toBe(3);
    expect(details.fields.desc).toBe("a, b");
  });

  it("treats a plain bed-style 4th column as the name", () => {
    expect(parseHammockColumn("peak_12").name).toBe("peak_12");
  });

  it("salvages the common fields from a line that is not valid relaxed JSON", () => {
    const details = parseHammockColumn('name:"ok" scorelst:[1,2] junk');
    expect(details.name).toBe("ok");
    expect(details.scores).toEqual([1, 2]);
  });

  it("never throws on empty or non-string input", () => {
    expect(parseHammockColumn("").name).toBe("");
    expect(parseHammockColumn(undefined).scores).toEqual([]);
    expect(getHammockDetails(null).name).toBe("");
  });
});

describe("getHammockScore", () => {
  const scored = record('scorelst:[3.5,9],id:1,name:"a"');

  it("returns the score at the requested index", () => {
    expect(getHammockScore(scored)).toBe(3.5);
    expect(getHammockScore(scored, 1)).toBe(9);
  });

  it("falls back to the first score when the index is out of range", () => {
    expect(getHammockScore(scored, 5)).toBe(3.5);
  });

  it("is undefined for an item without scores", () => {
    expect(getHammockScore(record("id:1"))).toBeUndefined();
  });

  it("works on frozen records", () => {
    const frozen = Object.freeze(record('scorelst:[2],name:"f"'));
    expect(getHammockScore(frozen)).toBe(2);
    expect(getHammockDetails(frozen).name).toBe("f");
  });
});

describe("feature accessors for hammock records", () => {
  const raw = record('scorelst:[4,8],id:2,name:"peak",strand:"<"');

  it("read name, strand and score out of the 4th column", () => {
    expect(getFeatureName(raw, "hammock")).toBe("peak");
    expect(getFeatureStrand(raw, "hammock")).toBe("-");
    expect(getFeatureScore(raw, "hammock")).toBe(4);
  });

  it("leave a plain bed record's raw 4th column alone", () => {
    expect(getFeatureName(record("geneA"), "bed")).toBe("geneA");
  });
});
