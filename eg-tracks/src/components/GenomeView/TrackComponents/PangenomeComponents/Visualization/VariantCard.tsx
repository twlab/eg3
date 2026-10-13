import { useMemo, useState } from "react";
import FloatingCard from "./FloatingCard";
import type { PangenomeModel } from "./pangenomeModel";
import type { VariantSegment, VariantWalk } from "./variantBubbles";

/* ══════════════════════════════════════════════════════════════════════════
   What a site is made of, opened by clicking it - a bubble of the variants
   view or a box of the grouped tube map, which are the same walks drawn two
   ways. Its walks, every haplotype through it with a search, and for a walk
   or a haplotype picked from those, the nodes it takes.

   On the body, at the pointer, so the drawing's box cannot clip it.
   ══════════════════════════════════════════════════════════════════════════ */

/** How many haplotypes the card lists before asking for a search. */
const LIST_MAX = 200;
/** The card's own size, for keeping it on the screen. */

export interface VariantCardProps {
  /** The fetched model, for the nodes' own sequence and names. */
  model: PangenomeModel;
  segment: VariantSegment;
  /** The walk clicked, if one was rather than the site as a whole. */
  walk: number | null;
  /** Where on the screen it was clicked. */
  x: number;
  y: number;
  onClose: () => void;
}

export default function VariantCard({
  model,
  segment,
  walk: opened,
  x,
  y,
  onClose,
}: VariantCardProps) {
  const [walk, setWalk] = useState<number | null>(opened);
  const [lane, setLane] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const labelOf = useMemo(
    () => new Map(model.lanes.map((l) => [l.key, l.label])),
    [model],
  );
  const contig = model.reference?.contig ?? "";
  const region = `${contig}:${segment.refStart.toLocaleString()}–${segment.refEnd.toLocaleString()} (${(
    segment.refEnd - segment.refStart
  ).toLocaleString()} bp of reference)`;

  const walkOf = new Map<string, VariantWalk>();
  for (const w of segment.walks) {
    for (const l of w.lanes) walkOf.set(l, w);
  }
  const pickedWalk =
    lane !== null
      ? (walkOf.get(lane) ?? null)
      : walk !== null
        ? (segment.walks.find((w) => w.index === walk) ?? null)
        : null;
  const needle = query.trim().toLowerCase();
  const lanes = segment.walks
    .filter((w) => walk === null || w.index === walk || needle)
    .flatMap((w) => w.lanes.map((l) => ({ lane: l, walk: w })))
    .filter(({ lane: l }) =>
      needle ? (labelOf.get(l) ?? l).toLowerCase().includes(needle) : true,
    );

  /* At the pointer, below it or above it as the window has room; see
     FloatingCard. */
  return (
    <FloatingCard x={x} y={y} className="pgv-section-card pgv-variant-card">
      <button
        type="button"
        className="pgv-section-close"
        aria-label="Close"
        onClick={onClose}
      >
        ×
      </button>
      <div className="pgv-tooltip-title">
        {segment.kind === "site" ? "site" : "the same in every haplotype"}
      </div>
      <div className="pgv-section-line">{region}</div>
      {segment.kind === "site" && (
        <div className="pgv-section-line">
          {segment.walks.length} unique walk
          {segment.walks.length === 1 ? "" : "s"} · {segment.haplotypes} haplotypes
        </div>
      )}
      {segment.sameSpelling > 0 && (
        <div className="pgv-section-line">
          {segment.sameSpelling} walks spell the same bases as another, through
          other nodes
        </div>
      )}

      {segment.kind === "site" && (
        <>
          <div className="pgv-section-head">Walks ({segment.walks.length})</div>
          {segment.walks.map((w) => (
            <div
              key={w.index}
              className={`pgv-variant-row${
                pickedWalk?.index === w.index ? " pgv-variant-row-on" : ""
              }`}
              onClick={() => {
                setWalk(walk === w.index ? null : w.index);
                setLane(null);
              }}
            >
              #{w.index} · {w.lanes.length} haplotypes ·{" "}
              {w.nodes.length
                ? `${w.nodes.length} node${w.nodes.length === 1 ? "" : "s"} · ${w.label}`
                : `skips the site · ${w.label}`}
              {w.isReference ? " · reference" : ""}
              {w.sameSpelling ? " · same bases as another" : ""}
            </div>
          ))}
        </>
      )}

      {pickedWalk && (
        <>
          <div className="pgv-section-head">
            {lane
              ? `${labelOf.get(lane) ?? lane}: walk #${pickedWalk.index}`
              : `Walk #${pickedWalk.index}`}{" "}
            nodes ({pickedWalk.nodes.length})
          </div>
          {pickedWalk.nodes.map((id, k) => {
            const node = model.nodeById.get(id);
            const sequence = node?.sequence ?? "";
            return (
              <div key={`${id}-${k}`} className="pgv-section-node">
                node {id} · {sequence.length} bp ·{" "}
                {sequence.length > 24 ? `${sequence.slice(0, 24)}…` : sequence}
                {node?.onReference ? " · ref" : ""}
              </div>
            );
          })}
        </>
      )}

      {segment.kind === "site" && (
        <>
          <div className="pgv-section-head">
            Haplotypes
            {walk !== null && !needle ? ` on walk #${walk}` : ""} ({lanes.length})
          </div>
          <input
            className="pgv-variant-search"
            type="search"
            placeholder="search haplotypes…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {lanes.slice(0, LIST_MAX).map(({ lane: l, walk: w }) => (
            <div
              key={l}
              className={`pgv-variant-row${lane === l ? " pgv-variant-row-on" : ""}`}
              onClick={() => setLane(lane === l ? null : l)}
            >
              {labelOf.get(l) ?? l} → walk #{w.index}
            </div>
          ))}
          {lanes.length > LIST_MAX && (
            <div className="pgv-section-line">
              …and {lanes.length - LIST_MAX} more - search to narrow
            </div>
          )}
        </>
      )}
    </FloatingCard>
  );
}
