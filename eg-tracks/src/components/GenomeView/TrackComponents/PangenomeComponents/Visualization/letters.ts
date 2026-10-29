/* ══════════════════════════════════════════════════════════════════════════
   The letters under the pointer.

   A node, or a stretch of a bar, is drawn across some pixels; the pointer
   is on one of them. Zoomed in a base is several pixels wide and the
   pointer means one base. Zoomed out a pixel covers several bases and the
   pointer cannot mean one of them, so it means the run its pixel covers -
   as genomealign's fine mode marks round(basesPerPixel) bases. Shared by
   the tube map, which spells one node, and the bars, which read through a
   haplotype's own sequence.
   ══════════════════════════════════════════════════════════════════════════ */

export interface NodeLetters {
  letters: string[];
  /** The first of them the pointer's pixel covers; `span` says how many. */
  at: number;
  /** How many bases the pointer's own pixel covers, starting at `at`. */
  span: number;
  /** The lowest and highest coordinate of the letters shown. */
  from: number;
  to: number;
  /** And of the letters marked. */
  markFrom: number;
  markTo: number;
  /** Read on the reverse strand: the letters are the reference's strand,
      and the own coordinates count down along them. */
  reverse?: boolean;
  /** Whether the sequence runs on past what is shown. */
  clippedLeft: boolean;
  clippedRight: boolean;
  /** The whole thing's length, for saying how much was left out. */
  length: number;
}

/** What is being pointed at: some bases drawn between two pixels. */
export interface LetterHit {
  sequence: string;
  length: number;
  /** The pixels it is drawn between. */
  left: number;
  right: number;
  /** Its first base's coordinate. */
  start: number;
  /** The base the pixel is answered with, and the pixel itself. */
  offset: number;
  pixel: number;
}

/**
 * The bases a pixel covers. Where a base is a pixel or wider the pointer is
 * inside one base and means that one - the one the pixel is painted with:
 * a boundary falls at a fraction of a pixel, and marking both bases there
 * read G, then GA, then A on the way from one letter to the next. Where
 * bases are narrower than a pixel the pointer means all the ones its pixel
 * covers, a base straddling an edge belonging to both pixels.
 */
export function coveredBases(hit: LetterHit): { first: number; last: number } {
  const perBase = hit.length > 0 ? (hit.right - hit.left) / hit.length : 0;
  if (!(perBase > 0) || perBase >= 1) return { first: hit.offset, last: hit.offset };
  const inside = (base: number) => Math.min(hit.length - 1, Math.max(0, base));
  const first = inside(Math.floor((hit.pixel - hit.left) / perBase));
  const last = Math.max(first, inside(Math.ceil((hit.pixel + 1 - hit.left) / perBase) - 1));
  return { first, last };
}

/**
 * One node's letters, for a view whose nodes are the things pointed at -
 * the tube map, where each is drawn as its own box. A long node is cut
 * down to `cap` bases round the pointer and says which end it lost.
 */
export function nodeLetters(hit: LetterHit, cap: number): NodeLetters {
  const { first, last } = coveredBases(hit);
  if (hit.length <= cap) {
    return {
      letters: hit.sequence.split(""),
      at: first,
      span: last - first + 1,
      from: hit.start,
      to: hit.start + hit.length - 1,
      markFrom: hit.start + first,
      markTo: hit.start + last,
      clippedLeft: false,
      clippedRight: false,
      length: hit.length,
    };
  }
  /* Centred on the pointer, then slid back inside the node so a base near
     either end still shows a full window rather than a half-empty one. */
  const half = Math.floor(cap / 2);
  const start = Math.min(Math.max(0, first - half), hit.length - cap);
  const end = start + cap;
  const at = Math.max(0, first - start);
  return {
    letters: hit.sequence.slice(start, end).split(""),
    at,
    span: Math.min(last - first + 1, cap - at),
    from: hit.start + start,
    to: hit.start + end - 1,
    markFrom: hit.start + first,
    markTo: hit.start + last,
    clippedLeft: start > 0,
    clippedRight: end < hit.length,
    length: hit.length,
  };
}
