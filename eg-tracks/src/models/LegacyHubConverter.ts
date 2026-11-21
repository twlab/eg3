import JSON5 from "json5";

/**
 * Converts datahubs written for the retired 1st-generation ("legacy") WashU
 * Epigenome Browser into the datahub format of this browser, so links such as
 *
 *   /legacy/?genome=mm9&datahub=<hub url>&coordinate=chr8:87120161-87587163
 *
 * that appear in publications keep working. The attribute handling follows the
 * legacy browser's own hub parser (`parseHubtrack` / `parse_custom_track` in
 * https://github.com/epgg/eg, browser/js/base.js).
 *
 * A legacy hub differs from a current one in three ways:
 *  - the file is relaxed JSON (unquoted keys, single quotes, trailing commas)
 *    with whole-line `#` comments;
 *  - display settings sit directly on the track (`mode`, `colorpositive`,
 *    `qtc`, ...) instead of under `options`, and a track without a `mode` is
 *    not displayed;
 *  - it uses entries this browser has no equivalent file for: `native_track`
 *    (annotation tracks of the genome) and `coordinate_override`.
 */

/** A plain track object, as found in a current-format datahub. */
export interface ConvertedTrack {
  type: string;
  name: string;
  url?: string;
  genome?: string;
  showOnHubLoad?: boolean;
  options?: { [key: string]: any };
  metadata?: { [key: string]: any };
  [key: string]: any;
}

export interface LegacyHubConversion {
  /** Tracks to display, in hub order (ruler first). */
  tracks: ConvertedTrack[];
  /** Tracks the hub lists with `mode: "hide"`: available, but not displayed. */
  hiddenTracks: ConvertedTrack[];
  /** View region from a `coordinate_override` entry, as `chr:start-end`. */
  position: string | null;
  /** Human-readable notes about entries that could not be converted. */
  warnings: string[];
}

export interface LegacyHubConvertOptions {
  /** Name of the genome the hub is loaded on, e.g. "mm9". */
  genome: string;
  /** URL of the hub file; relative track URLs are resolved against it. */
  hubUrl?: string;
  /**
   * The genome's own default tracks. `native_track` entries are matched
   * against these by name so they pick up the genome's real configuration.
   */
  nativeTracks?: any[];
  /**
   * Display every track of the hub, including those without a `mode` (the
   * legacy `forceshowall` URL parameter).
   */
  forceShowAll?: boolean;
  /**
   * Metadata vocabularies the hub refers to by URL, keyed like the hub's
   * `vocabulary_set` (see {@link getLegacyVocabularyUrls}). Vocabularies
   * written inline in the hub need not be passed.
   */
  vocabularies?: { [key: string]: LegacyVocabulary };
}

/**
 * A legacy metadata vocabulary. Legacy tracks carry term ids as metadata
 * (`Sample: "10001"`); the vocabulary names them and arranges them in a tree.
 */
export interface LegacyVocabulary {
  /** id -> [name, description] */
  terms?: { [id: string]: any };
  /** nested categories whose leaves are arrays of term ids */
  vocabulary?: any;
}

// Legacy track types whose file format this browser reads unchanged, mapped to
// the current type name. `interaction` and `annotation` are the legacy
// parser's own aliases. Legacy types missing here (methylc, which was several
// files per track; cool; ld; matplot; categorymatrix; ...) have no equivalent.
const FILE_TYPE_MAP: { [legacyType: string]: string } = {
  bigwig: "bigwig",
  bedgraph: "bedgraph",
  bed: "bed",
  bigbed: "bigbed",
  bam: "bam",
  hic: "hic",
  categorical: "categorical",
  longrange: "longrange",
  interaction: "longrange",
  hammock: "hammock",
  annotation: "hammock",
  genomealign: "genomealign",
};
const NUMERICAL_TYPES = new Set(["bigwig", "bedgraph"]);
const ANNOTATION_TYPES = new Set(["bed", "bigbed"]);
const INTERACTION_TYPES = new Set(["longrange", "hic"]);

// Every entry type the legacy browser treated as a track.
const LEGACY_TRACK_TYPES = new Set([
  "bedgraph",
  "bigwig",
  "bed",
  "bigbed",
  "longrange",
  "interaction",
  "hic",
  "cool",
  "bam",
  "categorical",
  "methylc",
  "ld",
  "annotation",
  "hammock",
  "categorymatrix",
  "quantitativecategoryseries",
  "genomealign",
  "matplot",
  "callingcard",
]);

// Display modes of the legacy browser; hubs give them by name or by number.
const LEGACY_MODES = [
  "hide",
  "show",
  "thin",
  "full",
  "arc",
  "heatmap",
  "density",
  "barplot",
];

/**
 * Normalises a legacy `mode` value. As in the legacy browser, a track without
 * a (valid) mode is hidden.
 */
function parseLegacyMode(mode: any): string {
  if (typeof mode === "number") {
    return LEGACY_MODES[mode] || "hide";
  }
  if (typeof mode === "string") {
    const name = mode.trim().toLowerCase();
    if (name === "trihm") {
      return "heatmap";
    }
    return LEGACY_MODES.includes(name) ? name : "hide";
  }
  return "hide";
}

/**
 * Shallow copy of a hub entry with lower-cased keys: the legacy parser read
 * track attributes case-insensitively.
 */
function lowerCaseKeys(entry: any): { [key: string]: any } {
  const result: { [key: string]: any } = {};
  for (const key of Object.keys(entry)) {
    result[key.toLowerCase()] = entry[key];
  }
  return result;
}

// Characters that typesetting substitutes for "~" (seen in URLs copied from
// article PDFs): tilde operator, small tilde, fullwidth tilde.
const TILDE_LOOKALIKES = /[\u223C\u02DC\uFF5E]/g;

/**
 * Cleans up a hub URL taken from a legacy link. Publication PDFs often replace
 * the "~" of a `/~user/` path with a look-alike character, which the hosting
 * server then answers with 404.
 */
export function normalizeLegacyHubUrl(url: string): string {
  return (url || "").trim().replace(TILDE_LOOKALIKES, "~");
}

/**
 * Quotes bare numeric object keys (`{1: [...]}` becomes `{"1": [...]}`). The
 * legacy browser read hubs as JavaScript, where such keys are legal; JSON5
 * rejects them. Text inside strings is left alone.
 */
function quoteNumericKeys(text: string): string {
  let result = "";
  let quote: string | null = null; // the quote character of the open string
  let lastSignificant = ""; // last non-space character outside strings
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quote) {
      result += char;
      if (char === "\\") {
        result += text[++i] ?? "";
      } else if (char === quote) {
        quote = null;
        lastSignificant = char;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      result += char;
      continue;
    }
    if (/\d/.test(char) && (lastSignificant === "{" || lastSignificant === ",")) {
      const digits = /^\d+/.exec(text.slice(i))![0];
      const rest = text.slice(i + digits.length);
      if (/^\s*:/.test(rest)) {
        result += `"${digits}"`;
        i += digits.length - 1;
        lastSignificant = '"';
        continue;
      }
    }
    result += char;
    if (!/\s/.test(char)) {
      lastSignificant = char;
    }
  }
  return result;
}

/**
 * Parses the text of a legacy hub file.
 *
 * @param {string} text - content of the hub file
 * @return {any[]} the hub's entries
 * @throws {Error} if the text is not a (relaxed) JSON array
 */
export function parseLegacyHubText(text: string): any[] {
  const withoutComments = text
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("#"))
    .join("\n");
  let parsed: any;
  try {
    parsed = JSON5.parse(withoutComments);
  } catch (error) {
    parsed = JSON5.parse(quoteNumericKeys(withoutComments));
  }
  if (!Array.isArray(parsed)) {
    throw new Error("A datahub must be an array of tracks.");
  }
  return parsed;
}

/**
 * Converts a legacy `coordinate` value to this browser's `position` format.
 * Accepts `chr8:100-200` as well as the legacy `chr8,100,chr8,200` form.
 *
 * @return {string | null} `chr:start-end`, or null if it cannot be converted
 */
export function convertLegacyCoordinate(
  coordinate: string | null | undefined,
): string | null {
  if (!coordinate) {
    return null;
  }
  const text = String(coordinate).trim().replace(/\s+/g, "");
  let match = text.match(/^([\w.]+):(\d+)-(\d+)$/);
  if (match) {
    return `${match[1]}:${match[2]}-${match[3]}`;
  }
  match = text.match(/^([\w.]+),(\d+),([\w.]+),(\d+)$/);
  if (match && match[1] === match[3]) {
    return `${match[1]}:${match[2]}-${match[4]}`;
  }
  return null;
}

function isFixedScale(thtype: any): boolean {
  return thtype === 1 || thtype === "1" || thtype === "fixed";
}

function toNumber(value: any): number | undefined {
  const number = Number(value);
  return value !== undefined &&
    value !== null &&
    value !== "" &&
    typeof value !== "boolean" &&
    Number.isFinite(number)
    ? number
    : undefined;
}

function rgbFromQtc(qtc: any, prefix: "p" | "n"): string | undefined {
  const parts = ["r", "g", "b"].map((channel) =>
    toNumber(qtc[`${prefix}${channel}`]),
  );
  return parts.every((part) => part !== undefined)
    ? `rgb(${parts.join(",")})`
    : undefined;
}

/**
 * Legacy colors may be written "color/colorBeyondThreshold"; only the first
 * has an equivalent here.
 */
function firstColor(value: any): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  return value.split("/")[0].trim() || undefined;
}

/** Drops undefined values so they don't override the track type's defaults. */
function compact(options: { [key: string]: any }): { [key: string]: any } {
  const result: { [key: string]: any } = {};
  for (const key of Object.keys(options)) {
    if (options[key] !== undefined) {
      result[key] = options[key];
    }
  }
  return result;
}

function resolveUrl(url: string, hubUrl?: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url) || !hubUrl) {
    return url;
  }
  try {
    return new URL(url, hubUrl).href;
  } catch (error) {
    return url;
  }
}

function legacyHeight(legacy: any, qtc: any): number | undefined {
  const height = toNumber(legacy.height) ?? toNumber(qtc.height);
  return height !== undefined ? Math.max(10, Math.round(height)) : undefined;
}

/**
 * A fixed y range, from `fixedscale: {min, max}` or a fixed-type `qtc`. Like
 * the legacy browser, a scale is only fixed when both ends are given.
 */
function fixedRange(
  legacy: any,
  qtc: any,
): { min: number; max: number } | undefined {
  const scaleMin = toNumber(legacy.fixedscale?.min);
  const scaleMax = toNumber(legacy.fixedscale?.max);
  if (scaleMin !== undefined && scaleMax !== undefined) {
    return { min: scaleMin, max: scaleMax };
  }
  const qtcMin = toNumber(qtc.thmin);
  const qtcMax = toNumber(qtc.thmax);
  if (isFixedScale(qtc.thtype) && qtcMin !== undefined && qtcMax !== undefined) {
    return { min: qtcMin, max: qtcMax };
  }
  return undefined;
}

const SUMMARY_METHODS: { [legacyName: string]: string } = {
  average: "MEAN",
  mean: "MEAN",
  max: "MAX",
  min: "MIN",
  total: "SUM",
  sum: "SUM",
};

function numericalOptions(legacy: any): { [key: string]: any } {
  const qtc = legacy.qtc || {};
  const options: { [key: string]: any } = {
    color: firstColor(legacy.colorpositive) || rgbFromQtc(qtc, "p"),
    color2: firstColor(legacy.colornegative) || rgbFromQtc(qtc, "n"),
    backgroundColor: legacy.backgroundcolor,
    height: legacyHeight(legacy, qtc),
    group: legacy.group,
    aggregateMethod:
      SUMMARY_METHODS[String(legacy.summarymethod || "").toLowerCase()],
  };
  const range = fixedRange(legacy, qtc);
  if (range) {
    options.yScale = "fixed";
    options.yMax = range.max;
    options.yMin = range.min;
  }
  const smooth = toNumber(legacy.smoothwindow) ?? toNumber(qtc.smooth);
  if (smooth !== undefined && smooth >= 3) {
    options.smooth = Math.round(smooth);
  }
  return compact(options);
}

function annotationOptions(legacy: any, mode: string): { [key: string]: any } {
  const qtc = legacy.qtc || {};
  return compact({
    color: legacy.boxcolor || legacy.color || qtc.bedcolor,
    backgroundColor: legacy.backgroundcolor,
    displayMode: mode === "density" ? "density" : "full",
  });
}

function bamOptions(legacy: any, mode: string): { [key: string]: any } {
  const qtc = legacy.qtc || {};
  return compact({
    color: legacy.colorforward || qtc.forwardcolor,
    color2: legacy.colorreverse || qtc.reversecolor,
    backgroundColor: legacy.backgroundcolor,
    // legacy "show" meant the read density for bam
    displayMode: mode === "full" || mode === "thin" ? "full" : "density",
  });
}

function hammockOptions(legacy: any, mode: string): { [key: string]: any } {
  const qtc = legacy.qtc || {};
  // the legacy browser ignored showscoreidx unless scorenamelst came with it
  const hasScoreNames = Array.isArray(legacy.scorenamelst);
  const scoreIndex = hasScoreNames ? toNumber(legacy.showscoreidx) : undefined;
  const options: { [key: string]: any } = {
    color: legacy.boxcolor || legacy.color || qtc.bedcolor,
    backgroundColor: legacy.backgroundcolor,
    displayMode:
      mode === "barplot" ? "barplot" : mode === "density" ? "density" : "full",
    height: legacyHeight(legacy, qtc),
    scoreIndex:
      scoreIndex !== undefined && scoreIndex >= 0
        ? Math.round(scoreIndex)
        : undefined,
    scoreNames: hasScoreNames ? legacy.scorenamelst.map(String) : undefined,
  };
  // per-score scale of the plotted score, else the track-wide fixed scale
  const scoreScale = Array.isArray(legacy.scorescalelst)
    ? legacy.scorescalelst[options.scoreIndex ?? 0]
    : undefined;
  const range =
    scoreScale &&
    isFixedScale(scoreScale.type) &&
    toNumber(scoreScale.min) !== undefined &&
    toNumber(scoreScale.max) !== undefined
      ? { min: Number(scoreScale.min), max: Number(scoreScale.max) }
      : fixedRange(legacy, qtc);
  if (range) {
    options.yScale = "fixed";
    options.yMax = range.max;
    options.yMin = range.min;
  }
  return compact(options);
}

function interactionOptions(legacy: any, mode: string): { [key: string]: any } {
  const qtc = legacy.qtc || {};
  // Track height is left at this browser's default: a shorter track cuts long
  // arcs off, and clamping arcs to fit flattens them whenever one interaction
  // reaches beyond the view.
  const options: { [key: string]: any } = {
    color: firstColor(legacy.colorpositive) || rgbFromQtc(qtc, "p"),
    color2: firstColor(legacy.colornegative) || rgbFromQtc(qtc, "n"),
    backgroundColor: legacy.backgroundcolor,
    // legacy "show" meant arcs for interaction tracks
    displayMode: mode === "heatmap" ? "heatmap" : "arc",
  };
  // the score at which the legacy color saturated
  const colorScore = toNumber(qtc.pcolorscore);
  if (isFixedScale(qtc.thtype) && colorScore !== undefined && colorScore > 0) {
    options.scoreScale = "fixed";
    options.scoreMin = 0;
    options.scoreMax = colorScore;
  }
  const filterScore =
    toNumber(legacy.positivefilterthreshold) ?? toNumber(qtc.pfilterscore);
  if (filterScore !== undefined && filterScore > 0) {
    options.minValueFilter = filterScore;
  }
  return compact(options);
}

function categoricalOptions(
  legacy: any,
  categorySets: any,
): { [key: string]: any } {
  const qtc = legacy.qtc || {};
  const options: { [key: string]: any } = {
    backgroundColor: legacy.backgroundcolor,
    height: legacyHeight(legacy, qtc),
  };
  // categories come inline, or by index into the hub's `category_set` entry
  const categories =
    legacy.categories ||
    (categorySets && legacy.category_set_index !== undefined
      ? categorySets[legacy.category_set_index]
      : undefined);
  // legacy: { "1": ["Active TSS", "#ff0000"] }; current: { "1": { name, color } }
  if (categories && typeof categories === "object") {
    const category: { [key: string]: any } = {};
    for (const key of Object.keys(categories)) {
      const value = categories[key];
      category[key] = Array.isArray(value)
        ? { name: String(value[0]), color: value[1] }
        : value;
    }
    options.category = category;
  }
  return compact(options);
}

function findMetadataEntry(entries: any[]): any {
  return entries.find(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      String(entry.type).toLowerCase() === "metadata",
  );
}

/**
 * Lists the metadata vocabularies a legacy hub refers to by URL, as
 * `{ Sample: "https://...", Assay: "https://..." }`. Fetch them and pass the
 * results to {@link convertLegacyHub} as `vocabularies` to get named metadata.
 */
export function getLegacyVocabularyUrls(legacyHub: any[]): {
  [key: string]: string;
} {
  const sets = findMetadataEntry(legacyHub || [])?.vocabulary_set;
  const urls: { [key: string]: string } = {};
  if (sets && typeof sets === "object") {
    for (const key of Object.keys(sets)) {
      if (typeof sets[key] === "string") {
        urls[key] = sets[key];
      }
    }
  }
  return urls;
}

// id -> names of its ancestor categories, computed once per vocabulary
const ancestorsByVocabulary = new WeakMap<object, Map<string, string[]>>();

function getTermAncestors(vocabulary: LegacyVocabulary): Map<string, string[]> {
  let ancestors = ancestorsByVocabulary.get(vocabulary);
  if (!ancestors) {
    ancestors = new Map<string, string[]>();
    const walk = (node: any, path: string[]) => {
      if (Array.isArray(node)) {
        node.forEach((id) => ancestors!.set(String(id), path));
      } else if (node && typeof node === "object") {
        Object.keys(node).forEach((key) => walk(node[key], [...path, key]));
      }
    };
    walk(vocabulary.vocabulary, []);
    ancestorsByVocabulary.set(vocabulary, ancestors);
  }
  return ancestors;
}

/**
 * Replaces the term ids of a legacy track's metadata with their names. A value
 * becomes `[category, ..., name]` (the hierarchy this browser's metadata
 * understands). Ids whose vocabulary is not available are dropped rather than
 * shown as bare numbers.
 */
function resolveMetadata(
  metadata: any,
  vocabularies: { [key: string]: LegacyVocabulary },
): { [key: string]: any } | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }
  const resolved: { [key: string]: any } = {};
  for (const key of Object.keys(metadata)) {
    const values = Array.isArray(metadata[key]) ? metadata[key] : [metadata[key]];
    const vocabulary = vocabularies[key];
    if (!vocabulary?.terms) {
      // free text is kept as is; a bare number is an id we cannot name
      const texts = values.filter(
        (value: any) => typeof value === "string" && !/^\d+$/.test(value.trim()),
      );
      if (texts.length > 0) {
        resolved[key] = texts.length === 1 ? texts[0] : texts;
      }
      continue;
    }
    const ancestors = getTermAncestors(vocabulary);
    for (const value of values) {
      const id = String(value);
      const term = vocabulary.terms[id];
      const name = Array.isArray(term) ? term[0] : term;
      if (name === undefined || name === null) {
        continue;
      }
      let path = ancestors.get(id) || [];
      // the tree of a vocabulary usually starts with its own name
      if (path[0] && path[0].toLowerCase() === key.toLowerCase()) {
        path = path.slice(1);
      }
      if (values.length === 1) {
        resolved[key] = path.length > 0 ? [...path, String(name)] : String(name);
      } else {
        // several ids under one key are different attributes of the track,
        // told apart by their top-level category
        const attribute = path[0] || key;
        if (!(attribute in resolved)) {
          resolved[attribute] =
            path.length > 1 ? [...path.slice(1), String(name)] : String(name);
        }
      }
    }
  }
  return Object.keys(resolved).length > 0 ? resolved : undefined;
}

function plainTrack(track: any): any {
  return track && typeof track.serialize === "function"
    ? track.serialize()
    : { ...track };
}

function convertNativeTrack(
  item: any,
  options: LegacyHubConvertOptions,
  warnings: string[],
): ConvertedTrack | null {
  const name = String(item?.name || "");
  if (!name || item.mode === "hide" || item.mode === 0) {
    return null;
  }
  const natives = (options.nativeTracks || []).map(plainTrack);
  const sameName = natives.find(
    (track) => String(track.name || "").toLowerCase() === name.toLowerCase(),
  );
  if (sameName) {
    return { ...sameName, showOnHubLoad: true };
  }
  if (/^rmsk/i.test(name)) {
    const repeats = natives.find((track) =>
      ["repeatmasker", "rmskv2"].includes(String(track.type).toLowerCase()),
    );
    if (repeats) {
      return { ...repeats, showOnHubLoad: true };
    }
  }
  if (/gene|gencode|ensembl/i.test(name)) {
    return {
      type: "geneAnnotation",
      name,
      genome: options.genome,
      showOnHubLoad: true,
    };
  }
  warnings.push(
    `Native track "${name}" has no equivalent in this browser and was skipped.`,
  );
  return null;
}

/**
 * Turns the value of the legacy `gftk` URL parameter, a comma separated list of
 * `name,mode` pairs naming annotation tracks of the genome, into a
 * `native_track` hub entry that {@link convertLegacyHub} understands.
 *
 * @return {object | null} the hub entry, or null if the value names no track
 */
export function parseLegacyGftk(gftk: string | null | undefined): any | null {
  const parts = String(gftk || "")
    .split(",")
    .map((part) => part.trim());
  const list: any[] = [];
  for (let i = 0; i + 1 < parts.length; i += 2) {
    if (parts[i] && parseLegacyMode(parts[i + 1]) !== "hide") {
      list.push({ name: parts[i], mode: parts[i + 1] });
    }
  }
  return list.length > 0 ? { type: "native_track", list } : null;
}

/**
 * Converts the entries of a legacy hub to current-format tracks.
 *
 * @param {any[]} legacyHub - parsed hub, see {@link parseLegacyHubText}
 * @param {LegacyHubConvertOptions} options - genome and hub context
 * @return {LegacyHubConversion} converted tracks plus what could not be kept
 */
export function convertLegacyHub(
  legacyHub: any[],
  options: LegacyHubConvertOptions,
): LegacyHubConversion {
  const tracks: ConvertedTrack[] = [];
  const hiddenTracks: ConvertedTrack[] = [];
  const warnings: string[] = [];
  let position: string | null = null;

  const entries = legacyHub
    .filter((entry) => entry && typeof entry === "object")
    .map(lowerCaseKeys);
  const categorySets = entries.find(
    (entry) => String(entry.type).toLowerCase() === "category_set",
  )?.set;
  // vocabularies written inline in the hub, plus the ones the caller fetched
  const vocabularies: { [key: string]: LegacyVocabulary } = {};
  const vocabularySets = findMetadataEntry(entries)?.vocabulary_set;
  if (vocabularySets && typeof vocabularySets === "object") {
    for (const key of Object.keys(vocabularySets)) {
      if (vocabularySets[key] && typeof vocabularySets[key] === "object") {
        vocabularies[key] = vocabularySets[key];
      }
    }
  }
  Object.assign(vocabularies, options.vocabularies);
  const unsupportedCounts: { [type: string]: number } = {};

  for (const legacy of entries) {
    const legacyType = String(legacy.type || "").toLowerCase();

    if (legacyType === "native_track") {
      for (const item of legacy.list || []) {
        const native = convertNativeTrack(item, options, warnings);
        if (native) {
          tracks.push(native);
        }
      }
      continue;
    }
    if (legacyType === "coordinate_override") {
      position = convertLegacyCoordinate(legacy.coord) || position;
      continue;
    }

    const type = FILE_TYPE_MAP[legacyType];
    if (!type || !legacy.url) {
      // metadata vocabularies, splinters and other legacy-only entries are
      // dropped silently; tracks that cannot be shown are counted for a note
      if (LEGACY_TRACK_TYPES.has(legacyType) || legacy.url) {
        const reason = type ? `${legacyType} (no url)` : legacyType || "unknown";
        unsupportedCounts[reason] = (unsupportedCounts[reason] || 0) + 1;
      }
      continue;
    }

    // As in the legacy browser, a track is displayed only if it has a mode
    // other than "hide" (unless every track is forced to show).
    let mode = parseLegacyMode(legacy.mode);
    if (mode === "hide" && options.forceShowAll) {
      mode =
        legacy.defaultmode !== undefined
          ? parseLegacyMode(legacy.defaultmode)
          : "show";
      mode = mode === "hide" ? "show" : mode;
    }
    const isHidden = mode === "hide";

    let trackOptions: { [key: string]: any };
    if (type === "hammock") {
      trackOptions = hammockOptions(legacy, mode);
    } else if (INTERACTION_TYPES.has(type)) {
      trackOptions = interactionOptions(legacy, mode);
    } else if (type === "categorical") {
      trackOptions = categoricalOptions(legacy, categorySets);
    } else if (type === "bam") {
      trackOptions = bamOptions(legacy, mode);
    } else if (NUMERICAL_TYPES.has(type)) {
      trackOptions = numericalOptions(legacy);
    } else if (ANNOTATION_TYPES.has(type)) {
      trackOptions = annotationOptions(legacy, mode);
    } else {
      trackOptions = compact({ backgroundColor: legacy.backgroundcolor });
    }

    const track: ConvertedTrack = {
      type,
      name: String(legacy.name || String(legacy.url).split("/").pop() || type),
      url: resolveUrl(String(legacy.url), options.hubUrl),
      showOnHubLoad: !isHidden,
      options: trackOptions,
    };
    if (type === "genomealign") {
      if (!legacy.querygenome) {
        warnings.push(
          `Genome alignment track "${track.name}" has no querygenome and was skipped.`,
        );
        continue;
      }
      track.querygenome = String(legacy.querygenome);
    }
    const metadata = resolveMetadata(legacy.metadata, vocabularies);
    if (metadata) {
      track.metadata = metadata;
    }
    (isHidden ? hiddenTracks : tracks).push(track);
  }

  for (const reason of Object.keys(unsupportedCounts)) {
    const count = unsupportedCounts[reason];
    warnings.push(
      `${count} track${count > 1 ? "s" : ""} of type "${reason}" ${count > 1 ? "are" : "is"} not supported and ${count > 1 ? "were" : "was"} skipped.`,
    );
  }

  // A hub replaces the genome's default tracks, so make sure there is a ruler.
  if (!tracks.some((track) => String(track.type).toLowerCase() === "ruler")) {
    const nativeRuler = (options.nativeTracks || [])
      .map(plainTrack)
      .find((track) => String(track.type).toLowerCase() === "ruler");
    tracks.unshift(
      nativeRuler
        ? { ...nativeRuler, showOnHubLoad: true }
        : { type: "ruler", name: "Ruler", showOnHubLoad: true },
    );
  }

  return { tracks, hiddenTracks, position, warnings };
}
