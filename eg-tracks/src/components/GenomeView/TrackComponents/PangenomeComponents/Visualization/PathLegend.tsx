import { useMemo } from "react";
import { LEGEND_WIDTH, laneLayout } from "./laneLayout";
import { usePangenomeView } from "./pangenomeViewState";

/* ══════════════════════════════════════════════════════════════════════════
   The names down the left of the linear view.

   Pinned rather than drawn: the bars pan under it, and a name that travelled
   with them would be off the screen the moment you moved. So it sits outside
   the element that pans, and is laid out on the drawing's own rows - see
   laneLayout, which the drawing reads too - which is what keeps each name
   level with its own bar however the rows grow and shrink.

   It carries the name, which picks its haplotype out of the rest, and how
   much of that haplotype is in the window.

   It reads the view for itself rather than being handed it, as the toolbar
   does: everything it needs is already in the one place they share.
   ══════════════════════════════════════════════════════════════════════════ */

export default function PathLegend() {
  const view = usePangenomeView();
  const model = view?.model ?? null;
  const alleleRows = view?.alleleRows ?? false;

  const layout = useMemo(
    () => (model ? laneLayout(model, alleleRows) : null),
    [model, alleleRows],
  );
  const byKey = useMemo(
    () => new Map((model?.lanes ?? []).map((lane) => [lane.key, lane])),
    [model],
  );

  if (!view || !model || !layout) return null;
  /* The variants view has no row per haplotype to name - but the column
     keeps its width, since the band beside it is placed by it. */
  if (view.mode === "variants") {
    return <div className="pgv-legend-col" style={{ width: LEGEND_WIDTH }} />;
  }
  const { highlight, setHighlight } = view;

  return (
    <div
      className="pgv-legend-col"
      style={{ width: LEGEND_WIDTH, height: layout.height }}
    >
      {layout.rows.map((row) => {
        const lane = byKey.get(row.key);
        return (
          <div
            key={row.key}
            className={`pgv-legend-row${
              highlight !== null && highlight !== row.key ? " pgv-dim" : ""
            }`}
            /* Placed against the drawing's own coordinates, so the two cannot
               drift apart as rows grow and shrink. */
            style={{ top: row.top, height: row.height }}
          >
            <button
              className={`pgv-legend-name${
                highlight === row.key ? " pgv-legend-name-on" : ""
              }`}
              onClick={() => setHighlight(highlight === row.key ? null : row.key)}
              title={
                lane && lane.segments.length > 1
                  ? `${lane.bp} bp in ${lane.segments.length} walks`
                  : lane
                    ? `${lane.bp} bp`
                    : row.label
              }
            >
              <span className="pgv-legend-text">{row.label}</span>
              {row.isReference && <span className="pgv-ref-tag">ref</span>}
            </button>
          </div>
        );
      })}
    </div>
  );
}
