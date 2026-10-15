import type { ViewMode } from "./Visualization/pangenomeViewState";

/* ══════════════════════════════════════════════════════════════════════════
   Which view the pangenome graph is drawn in, in TrackManager's toolbar
   where a genome's region readout and metadata button are. Every track
   follows it: the band is laid out for the view chosen (see
   fetchPangenomeData), so the ruler and the HPRC tracks stay under the
   graph in each.
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

export default function PangenomeViewSwitch({
  mode,
  onChange,
  fontSize,
  tubeGrouping,
  onTubeGrouping,
  variantGrouping,
  onVariantGrouping,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  fontSize: number;
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
  return (
    <div
      className="flex items-center gap-1 px-2"
      style={{ whiteSpace: "nowrap", flexShrink: 0 }}
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
