/* ══════════════════════════════════════════════════════════════════════════
   The HPRC Epigenome Browser's tracks for the haplotypes picked in a
   pangenome.

   Its catalog is one table, a row per track per sample, published with the
   site (https://github.com/twlab/HPRCEB, docs/data/tracks.tsv). Each row
   carries a ready eg3 track - type, url, name, options - and the coordinates
   it is in: a reference ("chm13", "hg38"), or one of the sample's own
   haplotypes ("HG00097_1"). A haplotype's files name their contigs the way
   the graph's paths do, "HG00097#1#CM094060.1", so its tracks are fetched
   over the regions its path walks in the graph.

   The genome alignment tracks ("chm13 vs HG00097 hap1") are left out: the
   graph is what lays a haplotype against the reference here.

   Which rows a view gets follows the site's own rules (its
   trackSelection.ts): the four functional layers only when asked for, the
   repeat and annotation tracks always, a few of those off to begin with -
   for the haplotypes picked: in their own coordinates, or the sample's
   tracks mapped to the graph's reference, drawn along the reference's bar.
   ══════════════════════════════════════════════════════════════════════════ */

export const HPRC_CATALOG_URL =
  "https://epigenome.humanpangenome.org/data/tracks.tsv";

/** The four layers a reader chooses between, in the site's order. */
export const HPRC_LAYERS = [
  {
    id: "methylation",
    title: "DNA Methylation",
    description: "CpG methylation profiles called from long reads",
    platform: "ONT / PacBio",
  },
  {
    id: "expression",
    title: "Expression",
    description:
      "Full-length transcript sequencing for gene expression quantification",
    platform: "Iso-Seq",
  },
  {
    id: "chromatin_accessibility",
    title: "Chromatin Accessibility",
    description:
      "Single-molecule chromatin accessibility and nucleosome positioning",
    platform: "Fiber-seq",
  },
  {
    id: "chromatin_conformation",
    title: "Chromatin Conformation",
    description:
      "3D genome organization and chromatin interactions measured by Omni-C",
    platform: "Omni-C",
  },
] as const;

const LAYER_IDS = new Set<string>(HPRC_LAYERS.map((layer) => layer.id));

/** One track of one sample. Plain data, so it can ride in a saved session. */
export interface HprcTrack {
  id: string;
  sample: string;
  /** The sample's haplotype whose coordinates it is in; null on the reference. */
  haplotype: number | null;
  /** "chm13", "hg38", or the haplotype's own, "HG00097_1". */
  coordinate: string;
  dataType: string;
  name: string;
  type: string;
  url: string;
  indexUrl?: string;
  options: Record<string, unknown>;
  /** On when first listed - the site leaves a few off. */
  on: boolean;
}

/** The catalog's name for the reference a graph path belongs to. */
export function hprcReferenceOf(sample: string): "chm13" | "hg38" | null {
  const name = sample.toLowerCase();
  if (name.startsWith("chm13")) return "chm13";
  if (name.startsWith("grch38") || name === "hg38") return "hg38";
  return null;
}

let loading: Promise<HprcTrack[]> | null = null;

/** The whole catalog, fetched once. */
export function loadHprcCatalog(): Promise<HprcTrack[]> {
  loading ??= fetch(HPRC_CATALOG_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`The HPRC track list answered ${response.status}.`);
      }
      return response.text();
    })
    .then(parseCatalog)
    .catch((problem) => {
      loading = null;
      throw problem;
    });
  return loading;
}

export function parseCatalog(text: string): HprcTrack[] {
  const [header, ...rows] = text.trim().split("\n");
  const column = header.split("\t");
  const SAMPLE = column.indexOf("sample_id");
  const TYPE = column.indexOf("data_type");
  const BROWSER = column.indexOf("browser_attributes");
  const tracks: HprcTrack[] = [];
  rows.forEach((row, index) => {
    const cells = row.split("\t");
    let attributes: any;
    try {
      attributes = JSON.parse(cells[BROWSER]);
    } catch {
      return;
    }
    if (!attributes?.url || !attributes.type) return;
    /* The graph places a haplotype against the reference itself. */
    if (attributes.type === "genomealign") return;
    const sample = cells[SAMPLE];
    const coordinate = String(attributes.coordinate ?? "");
    const own = /_(\d+)$/.exec(coordinate);
    tracks.push({
      id: `hprc-${index}`,
      sample,
      haplotype:
        own && coordinate.startsWith(`${sample}_`) ? Number(own[1]) : null,
      coordinate,
      dataType: cells[TYPE],
      name: String(attributes.name ?? attributes.type),
      type: attributes.type,
      url: attributes.url,
      ...(attributes.indexUrl ? { indexUrl: attributes.indexUrl } : {}),
      options: attributes.options ?? {},
      on: true,
    });
  });
  return tracks;
}

/**
 * The tracks a pangenome view gets for `haplotypes` (`sample#haplotype`)
 * with `layers` asked for: the reference's first, then each haplotype's.
 *
 * - A sample's tracks mapped to the graph's reference - its chm13 Kinnex,
 *   Hi-C, insulation - come with any of its haplotypes. Their files only
 *   name the reference's chromosomes, so they are fetched in its
 *   coordinates and drawn along the reference's own bar. They start off:
 *   the reader asks for them.
 * - A track in a haplotype's own coordinates comes with that haplotype,
 *   fetched over its alt path and drawn along it.
 */
export function hprcTracksFor(
  catalog: HprcTrack[],
  reference: string,
  haplotypes: string[],
  layers: ReadonlySet<string>,
): HprcTrack[] {
  const picked = new Set(haplotypes);
  const samples = new Set(haplotypes.map((key) => key.split("#")[0]));
  return catalog
    .filter((track) => {
      if (!samples.has(track.sample)) return false;
      if (LAYER_IDS.has(track.dataType) && !layers.has(track.dataType)) {
        return false;
      }
      if (track.haplotype === null) return track.coordinate === reference;
      return picked.has(`${track.sample}#${track.haplotype}`);
    })
    .map((track) => ({
      ...track,
      on: track.haplotype === null ? false : startsOn(track, layers),
    }))
    /* The reference's first, then each haplotype's, in catalog order. */
    .sort(
      (a, b) =>
        Number(a.haplotype !== null) - Number(b.haplotype !== null) ||
        trackPath(a).localeCompare(trackPath(b), undefined, { numeric: true }),
    );
}

/** Which bar a track is drawn along: its haplotype's, or the reference's. */
export function trackPath(track: HprcTrack): string {
  return track.haplotype === null ? "" : `${track.sample}#${track.haplotype}`;
}

/** The site's own defaults: what it lists but leaves off. */
function startsOn(track: HprcTrack, layers: ReadonlySet<string>) {
  if (track.name.includes("CpG islands")) return layers.has("methylation");
  if (track.name.includes("HMM Flagger")) return false;
  if (track.name.includes("gene")) return false;
  if (track.name.endsWith("Fiber-seq raw m6A")) return false;
  return true;
}

/**
 * The track as VisualManager takes it - eg3's own description - with the
 * alt path it belongs to, `sample#haplotype`, when it is on one: its data
 * are fetched over that path's regions and drawn along it.
 */
export function toEgTrack(track: HprcTrack) {
  return {
    id: track.id,
    type: track.type,
    name: track.name,
    url: track.url,
    ...(track.indexUrl ? { indexUrl: track.indexUrl } : {}),
    options: { ...track.options },
    ...(track.haplotype !== null
      ? { altPath: `${track.sample}#${track.haplotype}` }
      : { onReference: true }),
  };
}
