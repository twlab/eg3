/* What a view hands the shared tooltip (VisualizationContainer): where the
   pointer is, what to say, and the letters under it when there are any. */

export interface HoverTarget {
  x: number;
  y: number;
  title: string;
  lines: string[];
  /* The letters round the pointer. A bar gives a base two or three pixels,
     so its letters are a texture rather than text - this is where they can
     be read. */
  zoom?: {
    letters: string[];
    /** Which of them the pointer is on. */
    at: number;
    /** How many bases its pixel covers, `at` among them. */
    span?: number;
    from: number;
    to: number;
    /** The coordinates of the marked bases. */
    markFrom?: number;
    markTo?: number;
    /** Whether the sequence runs on past what is shown. */
    clippedLeft?: boolean;
    clippedRight?: boolean;
    length?: number;
    /** Read on the reverse strand: the letters are the reference's strand
        and the haplotype's own coordinates count down along them. */
    reverse?: boolean;
  } | null;
}
