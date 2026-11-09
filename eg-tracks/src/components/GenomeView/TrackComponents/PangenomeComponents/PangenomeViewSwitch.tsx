import type { ViewMode } from "./Visualization/pangenomeViewState";
import { usePangenomeView } from "./Visualization/pangenomeViewState";
import { STRIPE_INKS } from "./Visualization/BarCanvas";
import { binBpAt } from "./Visualization/bins";
import { CELL_BP, DENSE_PER_KB, STRIPE_PER_KB, stripeClass } from "./Visualization/barTiers";
import { LINE_GAP_PX, REF_INK, STRIPE_INKS as REF_STRIPE_INKS } from "./Visualization/refBarRule";
import { SHADE_WORDS } from "./Visualization/RefBar";

/* ══════════════════════════════════════════════════════════════════════════
   Which view the pangenome graph is drawn in, in TrackManager's toolbar
   where a genome's region readout and metadata button are. Every track
   follows it: the band is laid out for the view chosen (see
   fetchPangenomeData), so the ruler and the HPRC tracks stay under the
   graph in each. Beside it, the view's scale, and in the linear view
   zoomed out a key to the greys its bars are drawn with.
   ══════════════════════════════════════════════════════════════════════════ */

const VIEWS: Array<[ViewMode, string, string]> = [
  ["linear", "Linear", "Each haplotype a bar of its own, with its tracks under it"],
  ["tube", "Tube", "Every haplotype a tube through the graph's nodes"],
  ["variants", "Variants", "The window as sites and the walks through them"],
];

/* How far apart two bubbles can be and still be one site: the shortest
   shared stretch that separates two, in bases. Auto picks what fits the
   window; the tube map can also draw every node as it is. */
const GROUPINGS: Array<[number, string]> = [
  [0, "auto"],
  [1, "every bubble"],
  [10, "10 bp apart"],
  [50, "50 bp apart"],
  [100, "100 bp apart"],
  [500, "500 bp apart"],
];
const TUBE_GROUPINGS: Array<[number, string]> = [[-1, "every node"], ...GROUPINGS];

/** The view's scale in words: how many pixels a base gets while it gets
    at least one, and how many bases a pixel holds once it does not. */
function scaleText(basePerPixel: number): { text: string; narrow: boolean } {
  if (!(basePerPixel > 0)) return { text: "", narrow: false };
  if (basePerPixel <= 1) {
    const px = 1 / basePerPixel;
    return { text: `1 bp = ${px >= 10 ? Math.round(px) : px.toFixed(1)} px`, narrow: false };
  }
  const bp =
    basePerPixel >= 10000
      ? `${(basePerPixel / 1000).toFixed(basePerPixel >= 100000 ? 0 : 1)} Kb`
      : basePerPixel >= 100
        ? `${Math.round(basePerPixel)} bp`
        : `${basePerPixel.toFixed(1)} bp`;
  return { text: `1 px = ${bp}`, narrow: true };
}

/** A grey's words in the key: the small variants a kb its class stands
    for, between barTiers.ts's lines. */
function classWords(cls: number): string {
  const lines = STRIPE_PER_KB;
  if (cls === 1) return `under ${lines[0]}`;
  if (cls > lines.length) return `${lines[lines.length - 1]}+`;
  return `${lines[cls - 2]}–${lines[cls - 1]}`;
}

/** The key to a zoomed-out bar's greys: the greys that can show at this
    zoom, each in the stripes' own ink, and what grey means. While bins are
    under a cell (1 kb), only a cell with DENSE_PER_KB small variants a kb
    or more has its bins striped, so only the classes from there up show;
    once bins are a cell or wider, every bin with a small variant is, in
    any of the five. Null at a pixel a base or more, where nothing is
    binned. */
function greyKey(basePerPixel: number): { greys: Array<{ ink: string; words: string }>; title: string } | null {
  if (!(basePerPixel > 1)) return null;
  const every = binBpAt(1 / basePerPixel) >= CELL_BP;
  const from = every ? 1 : stripeClass(DENSE_PER_KB);
  const what = "Grey in a bar: a bin holding small variants (SNVs, MNVs, and small insertions, deletions and deletion-insertions)";
  return {
    greys: STRIPE_INKS.map((ink, k) => ({ ink, words: classWords(k + 1) })).slice(from - 1),
    title: every
      ? `${what}. The darker the grey, the more of them per kb.`
      : `${what}, where its kilobase has ${DENSE_PER_KB} or more of them. The darker the grey, the more per kb; sparser ones are ticks.`,
  };
}

/** The key to the ref bar's stripes (refBarRule.ts): shown while a stripe can
    show, under LINE_GAP_PX pixels a base, where two breaks a base apart
    are too close for a line each. Null at a pixel a base or more than
    that. */
const REF_KEY_TITLE =
  "The stripe in the ref bar (the reference's own row): where its nodes are too small for a line at each node break, the stripe is shaded by node breaks per kb over the kilobase - the lighter, the more. A break is where any haplotype in the pangenome leaves or rejoins the reference, shown here or not.";
function refKey(basePerPixel: number): Array<{ ink: string; words: string }> | null {
  if (!(basePerPixel > 1 / LINE_GAP_PX)) return null;
  return REF_STRIPE_INKS.map((ink, k) => ({ ink, words: SHADE_WORDS[k] }));
}

export default function PangenomeViewSwitch({
  mode,
  onChange,
  fontSize,
  tubeGrouping,
  onTubeGrouping,
  variantGrouping,
  onVariantGrouping,
  basePerPixel,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  fontSize: number;
  /** Bases per pixel in the view, for the scale readout. */
  basePerPixel?: number;
  tubeGrouping: number;
  onTubeGrouping: (grouping: number) => void;
  variantGrouping: number;
  onVariantGrouping: (grouping: number) => void;
}) {
  const grouping =
    mode === "tube"
      ? {
          value: tubeGrouping,
          options: TUBE_GROUPINGS,
          onChange: onTubeGrouping,
          title:
            "Draw the tubes through each site's unique walks, with the stretches everyone shares drawn short - or every node as it is. Auto picks what fits the window.",
        }
      : mode === "variants"
        ? {
            value: variantGrouping,
            options: GROUPINGS,
            onChange: onVariantGrouping,
            title:
              "Which bubbles count as one site. Bubbles closer together than this are one site, and their combinations are its walks. Auto picks what fits the window.",
          }
        : null;
  const scale = scaleText(basePerPixel ?? 0);
  /* The key to the greys: in the linear view below a pixel a base, where
     its bars are drawn. Past the size limit nothing is fetched, and the
     view has no model to show. */
  const view = usePangenomeView();
  const key = mode === "linear" && view?.model ? greyKey(basePerPixel ?? 0) : null;
  const refShades = mode === "linear" && view?.model ? refKey(basePerPixel ?? 0) : null;
  /* Each item on one line, the row wrapping where the toolbar is too
     narrow for it: the key's five greys come only in a narrow window. */
  return (
    <div
      className="flex items-center gap-1 px-2"
      style={{ whiteSpace: "nowrap", flexWrap: "wrap", flexShrink: 1 }}
    >
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Graph view"
    >
      {VIEWS.map(([value, label, title]) => {
        const on = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            title={title}
            onClick={() => onChange(value)}
            className="rounded-xs px-2 py-0.5 cursor-pointer transition-colors"
            style={{
              fontSize: `${Math.max(12, fontSize - 1)}px`,
              border: on ? "1px solid #1d4ed8" : "1px solid #d1d5db",
              backgroundColor: on ? "#eff6ff" : "transparent",
              color: on ? "#1d4ed8" : "var(--font-color)",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
      {scale.text && (
        <span
          title={
            scale.narrow
              ? "A base is narrower than a pixel now: the bars are drawn by bins, not base by base"
              : "Each base of the view gets at least this many pixels"
          }
          className="px-1"
          style={{
            fontSize: `${Math.max(12, fontSize - 1)}px`,
            fontStyle: "italic",
            fontVariantNumeric: "tabular-nums",
            color: scale.narrow ? "#b45309" : "var(--font-color)",
          }}
        >
          {scale.text}
        </span>
      )}
      {key && (
        <span
          className="pgv-grey-key flex items-center gap-1 px-1"
          title={key.title}
          style={{
            fontSize: `${Math.max(12, fontSize - 1)}px`,
            fontVariantNumeric: "tabular-nums",
            color: "var(--font-color)",
          }}
        >
          {key.greys.map(({ ink, words }) => (
            <span key={words} className="pgv-grey-key-class flex items-center gap-1 pr-1">
              <span className="pgv-grey-key-swatch" style={{ width: 12, height: 9, borderRadius: 1, backgroundColor: ink }} />
              {words}
            </span>
          ))}
          <span>small variants per kb</span>
        </span>
      )}
      {refShades && (
        <span
          className="pgv-grey-key pgv-ref-key flex items-center gap-1 px-1"
          title={REF_KEY_TITLE}
          style={{
            fontSize: `${Math.max(12, fontSize - 1)}px`,
            fontVariantNumeric: "tabular-nums",
            color: "var(--font-color)",
          }}
        >
          {refShades.map(({ ink, words }) => (
            <span key={words} className="pgv-grey-key-class flex items-center gap-1 pr-1">
              <span className="pgv-ref-key-swatch" style={{ backgroundColor: REF_INK }}>
                <span style={{ backgroundColor: ink }} />
              </span>
              {words}
            </span>
          ))}
          <span>node breaks per kb</span>
        </span>
      )}
      {grouping && (
        <label
          className="flex items-center gap-1 pl-1"
          title={grouping.title}
          style={{ fontSize: `${Math.max(12, fontSize - 1)}px`, color: "var(--font-color)" }}
        >
          group
          <select
            aria-label="Group"
            value={grouping.value}
            onChange={(event) => grouping.onChange(Number(event.target.value))}
            className="rounded-xs px-1 cursor-pointer"
            style={{
              border: "1px solid #d1d5db",
              backgroundColor: "var(--bg-color)",
              color: "var(--font-color)",
            }}
          >
            {grouping.options.map(([bp, label]) => (
              <option key={bp} value={bp}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
