/**
 * The track types this browser can display, in lower case (track types are
 * case-insensitive; TrackModel lower-cases them).
 *
 * This is the one list to extend when adding a track type. The fetch layer
 * rejects anything that is not on it, and the track pickers of the browser
 * only offer what is on it. `trackTypes.test.ts` checks that every type listed
 * here is also registered with the config, default-option and data-source
 * maps, so a type cannot be left half wired.
 *
 * Kept free of imports on purpose: it is loaded by the fetch code as well as
 * by UI code.
 */
export const SUPPORTED_TRACK_TYPES: readonly string[] = [
  // annotation
  "bed",
  "bedcolor",
  "bigbed",
  "bigbedcolor",
  "refbed",
  "hammock",
  "geneannotation",
  "categorical",
  "repeatmasker",
  "rmskv2",
  "jaspar",
  "snp",
  "vcf",
  // numerical
  "bigwig",
  "bedgraph",
  "qbed",
  "boxplot",
  "dynseq",
  "matplot",
  // methylation
  "methylc",
  "modbed",
  // interaction
  "hic",
  "longrange",
  "biginteract",
  // alignment
  "bam",
  "genomealign",
  // dynamic
  "dynamic",
  "dynamicbed",
  "dbedgraph",
  "dynamichic",
  "dynamiclongrange",
  // other
  "ruler",
  "omeroidr",
  "g3d", // shown in the 3D viewer panel, not as a track row
];

const SUPPORTED = new Set(SUPPORTED_TRACK_TYPES);

/** Whether a track of this type (any letter case) can be displayed. */
export function isSupportedTrackType(type: string | null | undefined): boolean {
  return typeof type === "string" && SUPPORTED.has(type.toLowerCase());
}
