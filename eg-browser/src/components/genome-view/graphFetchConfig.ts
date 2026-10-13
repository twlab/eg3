import type { DatabaseSummary } from "wuepgg3-track";

/* ══════════════════════════════════════════════════════════════════════════
   Which region the browser opens on.

   Kept apart from GenomeView so it can be tested without pulling in the track
   pipeline, which needs a DOM.
   ══════════════════════════════════════════════════════════════════════════ */

export const graphFetchConfigs = {
  micbKir3dl1: {
    database: "micb-kir3dl1-graph",
    format: "json",
    contig: "chr19",
    context: 0,
    sample: "GRCh38",
    interval: "54816636..54817000",
  },

  // HLA-DRB1 exon 2 - the hypervariable exon coding the peptide-binding groove, and the densest
  // bubble field in the MHC graph. This is the kind of fragment Eizenga et al. 2020 ("Pangenome
  // Graphs", Annu Rev Genomics Hum Genet 21:139-162) render at base-level detail in figure 2c,
  // which draws a fragment of an HLA-DRB1 graph.
  //
  // The MHC graph's path offsets are local to the extracted region, not chr6 coordinates:
  // offset = chr6_position - 28510125. Exon 2 is chr6:32,584,108-32,584,378, i.e. 4073983..4074253
  // here; the window below adds ~80 bp of flank on each side.
  hlaDrb1Exon2: {
    database: "mhc-graph",
    format: "json",
    contig: "MHC",
    context: 0,
    sample: "MHC-GRCh38",
    interval: "4073900..4074350",
  },

  hlaDrb1Exon2EXAMPLE: {
    database: "mhc-graph",
    format: "json",
    contig: "MHC",
    context: 0,
    sample: "MHC-GRCh38",
    interval: "4073840..4073930",
  },
};

export const defaultGraphFetchConfig = graphFetchConfigs.hlaDrb1Exon2EXAMPLE;

/** What a pangenome is opened on: the database, the reference path and
    region to query, and what to draw with it. In pangenomeBrowser this is
    kept on the session in redux; eg3's sessions do not carry one yet. */
export interface GraphFetchConfig {
  database: string;
  format: string;
  contig: string;
  sample: string;
  interval: string;
  context: number;
  /** The haplotypes to draw besides the reference, as `sample#haplotype`;
      every one in the graph when absent. */
  haplotypes?: string[];
  /** eg3 tracks to draw under the graph, as eg3 describes them - type, url,
      name, options - each fetched over the region the graph shows. */
  tracks?: Array<{ [key: string]: any }>;
}

/** One of the regions a file can be opened straight onto. */
export interface ExampleRegion {
  /** What the button says. */
  label: string;
  /** What is there, for the button's title. */
  note: string;
  sample: string;
  contig: string;
  start: number;
  end: number;
}

/**
 * Somewhere worth looking, per graph.
 *
 * A database only offers the ones whose sample and contig it carries on an
 * indexed path, so opening a file shows what that file can answer and
 * nothing else. The counts are what the window holds at context 32, with
 * the band's three windows merged, measured on the graph named.
 */
export const exampleRegions: ExampleRegion[] = [
  /* Human: 464 haplotypes of 233 samples, from hprc-v2.0-mc-chm13.gbz, on
     CHM13. Counted at context 32 with gbz-base's own query; found by
     scanning 1 kb every 50 kb across the MHC. */
  {
    label: "MHC densest",
    note: "588 nodes in 1 kb, and 495 walks: some haplotypes leave the window and come back",
    sample: "CHM13",
    contig: "chr6",
    start: 32_350_000,
    end: 32_351_000,
  },
  {
    label: "MHC densest, close in",
    note: "the middle of the same spot at 450 bp: 301 nodes, 392 walks",
    sample: "CHM13",
    contig: "chr6",
    start: 32_350_300,
    end: 32_350_750,
  },
  {
    label: "MHC densest, zoomed out",
    note: "10 kb around the same spot: 4,042 nodes, 698 walks",
    sample: "CHM13",
    contig: "chr6",
    start: 32_345_000,
    end: 32_355_000,
  },
  {
    label: "MHC broken walks",
    note: "345 nodes and 964 walks for 464 haplotypes: most come back in two pieces or more",
    sample: "CHM13",
    contig: "chr6",
    start: 29_800_000,
    end: 29_801_000,
  },
  {
    label: "MHC quiet",
    note: "13 nodes in 1 kb: nearly every haplotype the same, for comparison",
    sample: "CHM13",
    contig: "chr6",
    start: 33_100_000,
    end: 33_101_000,
  },
  {
    label: "chr1 typical",
    note: "35 nodes in 1 kb, away from the MHC",
    sample: "CHM13",
    contig: "chr1",
    start: 200_000_000,
    end: 200_001_000,
  },
  /* Mouse: 12 strains, from yut2tTest.gbz. */
  {
    label: "densest",
    note: "373 columns, 168 of them bubbles, in 1 kb - the busiest spot found",
    sample: "GRCm39",
    contig: "chr13",
    start: 111_433_091,
    end: 111_434_091,
  },
  {
    label: "densest, close in",
    note: "the middle of the same spot at 450 bp, where the letters have room",
    sample: "GRCm39",
    contig: "chr13",
    start: 111_433_300,
    end: 111_433_750,
  },
  {
    label: "densest, zoomed out",
    note: "10 kb around the same spot: 1,574 columns, 686 bubbles",
    sample: "GRCm39",
    contig: "chr13",
    start: 111_430_000,
    end: 111_440_000,
  },
  {
    label: "moderate",
    note: "215 columns, 99 bubbles in 1 kb",
    sample: "GRCm39",
    contig: "chr2",
    start: 162_071_167,
    end: 162_072_167,
  },
  {
    label: "sparse",
    note: "156 columns, 72 bubbles in 1 kb, for comparison",
    sample: "GRCm39",
    contig: "chr1",
    start: 169_784_989,
    end: 169_785_989,
  },
  {
    label: "quiet",
    note: "268 bp with 15 columns and 7 bubbles - the whole window at once",
    sample: "GRCm39",
    contig: "chr8",
    start: 46_475_758,
    end: 46_476_026,
  },
  {
    label: "sites inside sites",
    note: "160 bp, 24 bubbles, 7 of them PWK_PhJ or WSB_EiJ never reach: their route goes round the stretch the others vary in, so their bars are blank there",
    sample: "GRCm39",
    contig: "chr8",
    start: 46_472_770,
    end: 46_472_930,
  },

  /* MHC: 10 haplotypes, from mhc.gbz. */
  {
    label: "broken bubbles",
    note: "150 bp with 75 columns and 37 bubbles, and eleven places where a haplotype leaves the window and comes back",
    sample: "MHC-GRCh38",
    contig: "MHC",
    start: 4_074_750,
    end: 4_074_900,
  },
];

/** Fallback window size, for a database none of the examples describe. */
const INITIAL_WINDOW_BP = 500;

/**
 * Picks the window a freshly opened database opens on.
 *
 * A file whose reference path matches one of the examples above opens on the
 * same region as that example, so opening the MHC graph from disk lands on
 * HLA-DRB1 exon 2 rather than the quiet start of the region. The match is on
 * sample and contig, and the window still has to fall inside what this
 * particular file covers - a database can carry the same reference path over a
 * different slice of it.
 */
export function initialWindow(
  reference: { sample: string; contig: string },
  bounds: { start: number; end: number } | null,
): { start: number; end: number } {
  const low = bounds?.start ?? 0;
  const high = bounds?.end ?? Number.MAX_SAFE_INTEGER;

  for (const example of Object.values(graphFetchConfigs)) {
    if (
      example.sample !== reference.sample ||
      example.contig !== reference.contig
    ) {
      continue;
    }
    const [start, end] = example.interval.split("..").map(Number);
    if (start >= low && end <= high) return { start, end };
  }

  return { start: low, end: Math.min(low + INITIAL_WINDOW_BP, high) };
}

/**
 * Turns an opened database into a fetch config, querying its indexed
 * reference path.
 */
export function configForLocalDatabase(summary: DatabaseSummary) {
  const reference = summary.reference;
  if (!reference) return null;
  const { start, end } = initialWindow(reference, summary.referenceBounds);
  return {
    database: summary.id,
    format: "json",
    contig: reference.contig,
    context: 0,
    sample: reference.sample,
    interval: `${start}..${end}`,
  };
}
