import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  convertLegacyCoordinate,
  convertLegacyHub,
  getLegacyVocabularyUrls,
  normalizeLegacyHubUrl,
  parseLegacyGftk,
  parseLegacyHubText,
} from "../LegacyHubConverter";

const NATIVE_TRACKS = [
  { type: "ruler", name: "Ruler" },
  { type: "geneannotation", name: "refGene", genome: "mm9" },
  {
    type: "repeatmasker",
    name: "RepeatMasker",
    url: "https://vizhub.wustl.edu/public/mm9/rmsk16.bb",
  },
];
const OPTIONS = {
  genome: "mm9",
  hubUrl: "https://example.org/dir/hub",
  nativeTracks: NATIVE_TRACKS,
};
const convert = (text: string, extra = {}) =>
  convertLegacyHub(parseLegacyHubText(text), { ...OPTIONS, ...extra });

describe("normalizeLegacyHubUrl", () => {
  it("restores a tilde that typesetting replaced with a look-alike", () => {
    const tildeOperator = String.fromCharCode(0x223c);
    expect(
      normalizeLegacyHubUrl(`https://example.org/${tildeOperator}user/hub `),
    ).toBe("https://example.org/~user/hub");
  });
});

describe("convertLegacyCoordinate", () => {
  it("accepts both legacy coordinate forms", () => {
    expect(convertLegacyCoordinate("chr8:87120161-87587163")).toBe(
      "chr8:87120161-87587163",
    );
    expect(convertLegacyCoordinate("chr8,87120161,chr8,87587163")).toBe(
      "chr8:87120161-87587163",
    );
  });

  it("rejects what it cannot express", () => {
    expect(convertLegacyCoordinate("chr8,1,chr9,2")).toBeNull();
    expect(convertLegacyCoordinate("nonsense")).toBeNull();
    expect(convertLegacyCoordinate(null)).toBeNull();
  });
});

describe("parseLegacyHubText", () => {
  it("reads relaxed JSON with # comment lines", () => {
    const hub = parseLegacyHubText(`[
      # a comment
      {type:'bigwig', url:"a.bw", name:'x',},
    ]`);
    expect(hub).toEqual([{ type: "bigwig", url: "a.bw", name: "x" }]);
  });

  it("accepts bare numeric keys, which the legacy browser allowed", () => {
    const hub = parseLegacyHubText(
      `[{type:'categorical', name:"1: not a key, 2: nor this", categories:{1:['a','#f00'], 22 : ['b','#0f0']}}]`,
    );
    expect(hub[0].name).toBe("1: not a key, 2: nor this");
    expect(Object.keys(hub[0].categories)).toEqual(["1", "22"]);
  });

  it("rejects a hub that is not an array", () => {
    expect(() => parseLegacyHubText("{type:'bigwig'}")).toThrow();
  });
});

describe("convertLegacyHub on a published hub", () => {
  // the hub behind a link printed in a paper: hammock peaks, ChIA-PET
  // longrange tracks and the native refGene track
  const text = fs.readFileSync(
    path.join(__dirname, "fixtures", "legacy_hub_chiapet.txt"),
    "utf8",
  );
  const result = convertLegacyHub(parseLegacyHubText(text), OPTIONS);

  it("converts every track, in hub order, behind a ruler", () => {
    expect(result.warnings).toEqual([]);
    expect(result.hiddenTracks).toEqual([]);
    expect(result.tracks.map((track) => track.type)).toEqual([
      "ruler",
      ...Array(6).fill(["hammock", "longrange"]).flat(),
      ...Array(4).fill("hammock"),
      "geneannotation",
    ]);
  });

  it("keeps hammock tracks as barplots with their score names", () => {
    expect(result.tracks[1]).toMatchObject({
      type: "hammock",
      name: "wTR1 peak Pol2ChIA-PET",
      showOnHubLoad: true,
      options: {
        color: "#990005",
        displayMode: "barplot",
        scoreIndex: 0,
        scoreNames: ["signal value", "P value (-log10)", "Q value (-log10)"],
      },
    });
  });

  it("shows longrange tracks as arcs with the legacy color scale", () => {
    expect(result.tracks[2]).toMatchObject({
      type: "longrange",
      options: {
        color: "#FF1A40",
        displayMode: "arc",
        scoreScale: "fixed",
        scoreMin: 0,
        scoreMax: 5,
      },
    });
    expect(result.tracks[2].options).not.toHaveProperty("minValueFilter");
    // height is left to the track's own default (see interactionOptions)
    expect(result.tracks[2].options).not.toHaveProperty("height");
    expect(result.tracks[2].options).not.toHaveProperty("clampHeight");
  });

  it("resolves the native refGene track from the genome", () => {
    expect(result.tracks[result.tracks.length - 1]).toMatchObject({
      type: "geneannotation",
      name: "refGene",
      genome: "mm9",
    });
  });
});

describe("convertLegacyHub rules taken from the legacy parser", () => {
  it("hides tracks without a mode, like the legacy browser did", () => {
    const result = convert(`[
      {type:'bigwig', url:'http://x.org/a.bw', name:'shown', mode:'show'},
      {type:'bigwig', url:'http://x.org/b.bw', name:'no mode'},
      {type:'bigwig', url:'http://x.org/c.bw', name:'hidden', mode:'hide'},
    ]`);
    expect(result.tracks.map((track) => track.name)).toEqual(["Ruler", "shown"]);
    expect(result.hiddenTracks.map((track) => track.name)).toEqual([
      "no mode",
      "hidden",
    ]);
    expect(result.hiddenTracks[0].showOnHubLoad).toBe(false);
  });

  it("shows every track when forced to", () => {
    const result = convert(
      `[{type:'bed', url:'http://x.org/a.gz', name:'a'},
        {type:'hammock', url:'http://x.org/b.gz', name:'b', defaultmode:'barplot'}]`,
      { forceShowAll: true },
    );
    expect(result.hiddenTracks).toEqual([]);
    expect(result.tracks[1].options?.displayMode).toBe("full");
    expect(result.tracks[2].options?.displayMode).toBe("barplot");
  });

  it("accepts numeric modes and the type aliases", () => {
    const result = convert(`[
      {type:'interaction', url:'http://x.org/lr.gz', name:'lr', mode:5},
      {type:'annotation', url:'http://x.org/h.gz', name:'h', mode:7},
      {type:'BED', url:'http://x.org/b.gz', name:'b', mode:6},
    ]`);
    expect(result.tracks.slice(1).map((t) => [t.type, t.options?.displayMode]))
      .toEqual([
        ["longrange", "heatmap"],
        ["hammock", "barplot"],
        ["bed", "density"],
      ]);
  });

  it("reads attribute names case-insensitively", () => {
    const [, track] = convert(
      `[{Type:'bigwig', URL:'http://x.org/a.bw', Name:'a', Mode:'show', colorPositive:'#00ff00'}]`,
    ).tracks;
    expect(track).toMatchObject({ name: "a", options: { color: "#00ff00" } });
  });

  it("maps numerical display settings", () => {
    const [, track] = convert(`[{
      type:'bedgraph', url:'http://x.org/a.gz', name:'a', mode:'show',
      colorpositive:'#ff0000/#990000', colornegative:'rgb(0,0,255)',
      height:5, fixedscale:{min:0, max:20}, summarymethod:'total',
      smoothwindow:5, backgroundcolor:'#eeeeee',
    }]`).tracks;
    expect(track.options).toEqual({
      color: "#ff0000",
      color2: "rgb(0,0,255)",
      backgroundColor: "#eeeeee",
      height: 10, // the legacy browser enforced a 10px minimum
      aggregateMethod: "SUM",
      yScale: "fixed",
      yMax: 20,
      yMin: 0,
      smooth: 5,
    });
  });

  it("only fixes the y scale when both ends are given", () => {
    const [, track] = convert(
      `[{type:'bigwig', url:'http://x.org/a.bw', mode:'show', fixedscale:{max:20}}]`,
    ).tracks;
    expect(track.options).not.toHaveProperty("yScale");
  });

  it("takes colors and the fixed scale from a raw qtc block", () => {
    const [, track] = convert(
      `[{type:'bigwig', url:'http://x.org/a.bw', mode:1,
         qtc:{pr:1, pg:2, pb:3, thtype:1, thmin:1, thmax:9, height:60}}]`,
    ).tracks;
    expect(track.options).toMatchObject({
      color: "rgb(1,2,3)",
      height: 60,
      yScale: "fixed",
      yMin: 1,
      yMax: 9,
    });
  });

  it("uses the per-score scale of the plotted hammock score", () => {
    const [, track] = convert(`[{
      type:'hammock', url:'http://x.org/h.gz', mode:'barplot', showscoreidx:1,
      scorenamelst:['a','b'],
      scorescalelst:[{type:0},{type:1, min:0, max:50}],
    }]`).tracks;
    expect(track.options).toMatchObject({
      scoreIndex: 1,
      yScale: "fixed",
      yMin: 0,
      yMax: 50,
    });
  });

  it("applies the interaction score filter", () => {
    const [, track] = convert(
      `[{type:'longrange', url:'http://x.org/lr.gz', mode:'arc', positivefilterthreshold:3}]`,
    ).tracks;
    expect(track.options).toMatchObject({ displayMode: "arc", minValueFilter: 3 });
  });

  it("converts categories, inline or from the hub's category set", () => {
    const result = convert(`[
      {type:'category_set', set:{2:{1:['Enhancer','#ff0']}}},
      {type:'categorical', url:'http://x.org/a.gz', mode:'show',
       categories:{1:['Active TSS','#ff0000']}},
      {type:'categorical', url:'http://x.org/b.gz', mode:'show', category_set_index:2},
    ]`);
    expect(result.tracks[1].options?.category).toEqual({
      "1": { name: "Active TSS", color: "#ff0000" },
    });
    expect(result.tracks[2].options?.category).toEqual({
      "1": { name: "Enhancer", color: "#ff0" },
    });
  });

  it("keeps the query genome of a genome alignment track", () => {
    const result = convert(`[
      {type:'genomealign', url:'http://x.org/a.gz', mode:'full', querygenome:'hg19'},
      {type:'genomealign', url:'http://x.org/b.gz', mode:'full', name:'no query'},
    ]`);
    expect(result.tracks[1]).toMatchObject({
      type: "genomealign",
      querygenome: "hg19",
    });
    expect(result.warnings).toHaveLength(1);
  });

  it("resolves relative track URLs against the hub", () => {
    const [, track] = convert(`[{type:'bigwig', url:'a.bw', mode:'show'}]`).tracks;
    expect(track.url).toBe("https://example.org/dir/a.bw");
  });

  it("skips what has no equivalent and says so", () => {
    const result = convert(`[
      {type:'methylc', url:'http://x.org/m', name:'m', mode:'show'},
      {type:'metadata', vocabulary:{}},
      {type:'native_track', list:[{name:'rmsk_all', mode:'show'}, {name:'cpgIsland', mode:'show'}]},
    ]`);
    expect(result.tracks.map((track) => track.type)).toEqual([
      "ruler",
      "repeatmasker",
    ]);
    expect(result.warnings).toEqual([
      'Native track "cpgIsland" has no equivalent in this browser and was skipped.',
      '1 track of type "methylc" is not supported and was skipped.',
    ]);
  });

  it("counts unsupported tracks by type instead of listing each one", () => {
    const result = convert(`[
      {type:'methylc', name:'a', mode:'show', tracks:{forward:{}}},
      {type:'methylc', name:'b', mode:'show', tracks:{forward:{}}},
      {type:'cool', url:'abc', name:'c', mode:'show'},
    ]`);
    expect(result.warnings).toEqual([
      '2 tracks of type "methylc" are not supported and were skipped.',
      '1 track of type "cool" is not supported and was skipped.',
    ]);
  });

  it("names metadata ids from inline and fetched vocabularies", () => {
    const hubText = `[
      {type:'metadata', vocabulary_set:{
        Sample:'https://example.org/vocab/Samples',
        private:{terms:{11:['Real'], 21:['E001']}, vocabulary:{Type:['11'], EID:['21']}},
      }},
      {type:'bigwig', url:'http://x.org/a.bw', mode:'show',
       metadata:{Sample:'10001', Assay:'23001', private:['11','21'], Lab:'Ren'}},
    ]`;
    expect(getLegacyVocabularyUrls(parseLegacyHubText(hubText))).toEqual({
      Sample: "https://example.org/vocab/Samples",
    });
    const [, track] = convert(hubText, {
      vocabularies: {
        Sample: {
          terms: { "10001": ["MEL", "MEL (Leukemia)"] },
          vocabulary: { Sample: { "Cell Lines": { Cancer: ["10001"] } } },
        },
      },
    }).tracks;
    // Assay "23001" has no vocabulary: dropped, not shown as a bare number
    expect(track.metadata).toEqual({
      Sample: ["Cell Lines", "Cancer", "MEL"],
      Type: "Real",
      EID: "E001",
      Lab: "Ren",
    });
  });

  it("takes the view region from a coordinate_override entry", () => {
    expect(
      convert(`[{type:'coordinate_override', coord:'chr1,100,chr1,200'}]`).position,
    ).toBe("chr1:100-200");
  });
});

describe("parseLegacyGftk", () => {
  it("turns name,mode pairs into a native_track entry", () => {
    expect(parseLegacyGftk("refGene,full,rmsk_all,hide")).toEqual({
      type: "native_track",
      list: [{ name: "refGene", mode: "full" }],
    });
    expect(parseLegacyGftk("")).toBeNull();
    expect(parseLegacyGftk(null)).toBeNull();
  });
});
