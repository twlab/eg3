import JSON5 from "json5";

/**
 * Support for the "hammock" format of the 1st-generation WashU Epigenome
 * Browser. A hammock file is a tabix-indexed, bed-like file whose 4th column is
 * a relaxed-JSON fragment (no surrounding braces) describing the item, e.g.
 *
 *   chr1  3661194  3661958  scorelst:[3.37749,5.17927],id:1,name:"peak_1",
 *
 * Recognised fields: `name`, `id`, `strand` (`+`/`-` or `>`/`<`), `scorelst`
 * (one or more scores; the track's `scoreIndex` option picks which one is
 * drawn), plus any other free-form fields, which are shown in the click
 * tooltip.
 */
export interface HammockDetails {
  name: string;
  id?: string | number;
  /** Normalised to "+", "-" or "" (unstranded). */
  strand: string;
  scores: number[];
  /** Every field parsed from the 4th column. */
  fields: { [key: string]: any };
}

export const HammockDisplayModes = {
  BARPLOT: "barplot",
  FULL: "full",
  DENSITY: "density",
};

const EMPTY_DETAILS: HammockDetails = Object.freeze({
  name: "",
  strand: "",
  scores: [],
  fields: {},
}) as HammockDetails;

// Records are plain objects that may be frozen (the screenshot path passes them
// through Redux/Immer), so the parsed result is memoised on the side rather
// than stamped onto the record.
const detailsByRecord = new WeakMap<object, HammockDetails>();

function normalizeStrand(strand: any): string {
  if (strand === "+" || strand === ">") {
    return "+";
  }
  if (strand === "-" || strand === "<") {
    return "-";
  }
  return "";
}

/**
 * Parses the 4th column of a hammock line.
 *
 * @param {string} text - the raw 4th column
 * @return {HammockDetails} the parsed item; never throws
 */
export function parseHammockColumn(text: any): HammockDetails {
  if (typeof text !== "string" || text.trim() === "") {
    return EMPTY_DETAILS;
  }
  let fields: { [key: string]: any } | undefined;
  try {
    const parsed = JSON5.parse("{" + text + "}");
    if (parsed && typeof parsed === "object") {
      fields = parsed;
    }
  } catch (error) {
    // Not a relaxed-JSON fragment. Salvage the common fields so one odd line
    // doesn't blank the item; a plain bed-style name is kept as the name.
    fields = {};
    const name = text.match(/name\s*:\s*["']([^"']*)["']/);
    const scores = text.match(/scorelst\s*:\s*\[([^\]]*)\]/);
    const strand = text.match(/strand\s*:\s*["']?([+\-<>])/);
    const id = text.match(/(?:^|,)\s*id\s*:\s*["']?([^,"']+)/);
    if (!name && !scores && !strand && !id) {
      fields.name = text;
    } else {
      if (name) fields.name = name[1];
      if (scores) fields.scorelst = scores[1].split(",").map(Number);
      if (strand) fields.strand = strand[1];
      if (id) fields.id = id[1];
    }
  }
  if (!fields) {
    return EMPTY_DETAILS;
  }
  const scoreList = Array.isArray(fields.scorelst)
    ? fields.scorelst
    : fields.scorelst !== undefined
      ? [fields.scorelst]
      : [];
  return {
    name: fields.name !== undefined && fields.name !== null ? String(fields.name) : "",
    id: fields.id,
    strand: normalizeStrand(fields.strand),
    scores: scoreList.map(Number).filter((score) => Number.isFinite(score)),
    fields,
  };
}

/**
 * Gets the parsed hammock item of a raw tabix record (4th column under `[3]`).
 * Results are memoised per record.
 */
export function getHammockDetails(record: any): HammockDetails {
  if (record === null || typeof record !== "object") {
    return EMPTY_DETAILS;
  }
  let details = detailsByRecord.get(record);
  if (!details) {
    details = parseHammockColumn(record[3]);
    detailsByRecord.set(record, details);
  }
  return details;
}

/**
 * Score of a hammock record at `scoreIndex` of its `scorelst`. Falls back to
 * the first score when the index is out of range, and to `undefined` when the
 * item carries no scores at all.
 */
export function getHammockScore(
  record: any,
  scoreIndex: number = 0,
): number | undefined {
  const { scores } = getHammockDetails(record);
  if (scores.length === 0) {
    return undefined;
  }
  const index = Number.isInteger(scoreIndex) ? scoreIndex : 0;
  return scores[index] !== undefined ? scores[index] : scores[0];
}
