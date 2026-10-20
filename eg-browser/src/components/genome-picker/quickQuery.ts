import type { HaplotypeSummary } from "wuepgg3-track";

/* ══════════════════════════════════════════════════════════════════════════
   The start page's one-line query: where to look, which haplotypes, which
   HPRC tracks - typed rather than picked.

     CHM13#0#chr14:99,954,999-99,985,000 | HG005#1 HG005#2 | methylation expression

   Parts are split by "|" - or "/", which nothing in a region or a
   haplotype's name has either. The first is the region: the path as the graph
   names it - SAMPLE#HAPLOTYPE#CONTIG, the haplotype left out when there is
   one - then ":START-END". "CHM13 chr14:…" and "chm13:chr14:…" read the
   same, a bare "chr14:…" is on the genome already chosen, the numbers may
   keep the commas a copied location has, and ".." will do for the dash.

   The rest are lists, split by spaces or commas: a haplotype as
   SAMPLE#HAPLOTYPE, a sample alone for all of its haplotypes, "all" for
   every one; a track layer by name. What an item is is read off the item,
   so the lists can come in either order, or one without the other.

   Not a ":" or a "," between the parts, as a first try had it: ":" is the
   region's own, between its contig and its numbers, and "," is inside the
   numbers of a copied location; "#" is inside every haplotype's name.
   ══════════════════════════════════════════════════════════════════════════ */

/** What a query asks for, ready for the form. */
export interface QuickQuery {
  path: HaplotypeSummary;
  start: number;
  end: number;
  /** As `sample#haplotype`; null for every one. */
  haplotypes: string[] | null;
  /** HPRC layer ids - see HPRC_LAYERS. */
  layers: string[];
}

/** The HPRC layers by the names a reader would type. */
const LAYER_NAMES: Record<string, string> = {
  methylation: "methylation",
  expression: "expression",
  accessibility: "chromatin_accessibility",
  chromatin_accessibility: "chromatin_accessibility",
  conformation: "chromatin_conformation",
  chromatin_conformation: "chromatin_conformation",
};

/** The layers a query can name, as it names them. */
export const QUICK_LAYERS = ["methylation", "expression", "accessibility", "conformation"];

const REGION =
  /^(?:([^\s:#]+)(?:#(\d+))?(?:#|:|\s+))?([^\s:#]+):([\d,]+)\s*(?:-|–|\.\.)\s*([\d,]+)$/;

export function parseQuickQuery(
  text: string,
  file: {
    /** The paths a query can start from: the file's indexed ones. */
    queryable: HaplotypeSummary[];
    /** Every path in the file. */
    haplotypes: HaplotypeSummary[];
    /** The genome a region with none named is on. */
    genome: string;
  },
): { query: QuickQuery | null; problems: string[] } {
  const problems: string[] = [];
  const [regionPart = "", ...rest] = text.split(/[|/]/).map((part) => part.trim());

  const match = REGION.exec(regionPart);
  if (!match) {
    return {
      query: null,
      problems: [
        `"${regionPart}" is not a region: write it as CHM13#0#chr14:99,954,999-99,985,000.`,
      ],
    };
  }
  const [, sampleText, haplotypeText, contig, startText, endText] = match;
  const genomes = [...new Set(file.queryable.map((h) => h.sample))];
  const genome = sampleText
    ? genomes.find((g) => g.toLowerCase() === sampleText.toLowerCase())
    : file.genome;
  if (!genome) {
    problems.push(
      `This file has no ${sampleText} to query from: it has ${genomes.join(", ")}.`,
    );
  }
  const path = genome
    ? file.queryable.find(
        (h) =>
          h.sample === genome &&
          h.contig.toLowerCase() === contig.toLowerCase() &&
          (haplotypeText === undefined || h.haplotype === Number(haplotypeText)),
      )
    : undefined;
  if (genome && !path) problems.push(`${genome} has no path on ${contig} to query from.`);
  const start = Number(startText.replace(/,/g, ""));
  const end = Number(endText.replace(/,/g, ""));
  if (!(end > start)) problems.push("The region's end must come after its start.");

  /* Of the genome queried: every haplotype in the file but its own. */
  const alternates = [
    ...new Set(
      file.haplotypes
        .filter((h) => h.sample !== genome)
        .map((h) => `${h.sample}#${h.haplotype}`),
    ),
  ];
  let haplotypes: string[] | null = [];
  const layers: string[] = [];
  for (const item of rest.join(" ").split(/[\s,]+/).filter(Boolean)) {
    const lower = item.toLowerCase();
    const layer = LAYER_NAMES[lower];
    if (layer) {
      if (!layers.includes(layer)) layers.push(layer);
    } else if (lower === "all") {
      haplotypes = null;
    } else if (haplotypes !== null) {
      const named = lower.includes("#")
        ? alternates.filter((key) => key.toLowerCase() === lower)
        : alternates.filter((key) => key.toLowerCase().startsWith(`${lower}#`));
      if (!named.length) {
        problems.push(
          `"${item}" is not a haplotype in this file, or a track layer (${QUICK_LAYERS.join(", ")}).`,
        );
      }
      for (const key of named) if (!haplotypes.includes(key)) haplotypes.push(key);
    }
  }

  return {
    query:
      problems.length || !path ? null : { path, start, end, haplotypes, layers },
    problems,
  };
}
