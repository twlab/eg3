import { memo, useEffect, useState } from "react";
import VariantCard from "./VariantCard";
import type { BandAxis, DrawFrame, PangenomeModel } from "./pangenomeModel";
import { REF_COLOR } from "./pangenomeModel";
import Ruler, { rulerTicks } from "./Ruler";
import { RULER_H } from "./laneLayout";
import type { HoverTarget } from "./LinearPathView";
import { VARIANT_SAME_Y, bpLabel } from "./variantBubbles";
import type {
  VariantLayout,
  VariantSegment,
  VariantWalk,
} from "./variantBubbles";

/* ══════════════════════════════════════════════════════════════════════════
   The variants view: a line through the window, a circle for each unique
   walk through each site, and a short dash for each stretch everyone shares.
   See variantBubbles.ts for how the sites and walks are found.

   Clicking a site opens a card: its walks, every haplotype through it with
   a search, and - for a walk or a haplotype picked from those - the nodes it
   takes.
   ══════════════════════════════════════════════════════════════════════════ */

/** About how wide a character of a length label is, for whether it fits. */
const LABEL_CHAR_PX = 5.5;
/** A circle this small has no room for its count inside it. */
const LABEL_MIN_R = 7;

interface VariantBubbleViewProps {
  model: PangenomeModel;
  frame?: DrawFrame;
  axis: BandAxis;
  segments: VariantSegment[];
  layout: VariantLayout;
  /** The drawing's width: the band. */
  width: number;
  onHover: (target: HoverTarget | null) => void;
}

/** Which site the card is open on, the walk clicked, and where. */
interface Card {
  segment: number;
  walk: number | null;
  x: number;
  y: number;
}

/** A colour for the lines leaving each walk of a site, most common first. */
const LINK_COLORS = ["#2e6fc4", "#e07b39", "#3a9e5c", "#a04fc4", "#c4415a"];


function VariantBubbleView({
  model,
  frame,
  axis,
  segments,
  layout,
  width,
  onHover,
}: VariantBubbleViewProps) {
  const [card, setCard] = useState<Card | null>(null);
  /* A card drawn for other data would point at the wrong site. */
  useEffect(() => setCard(null), [segments]);

  const contig = model.reference?.contig ?? "";
  const region = (segment: VariantSegment) =>
    `${contig}:${segment.refStart.toLocaleString()}–${segment.refEnd.toLocaleString()} (${(
      segment.refEnd - segment.refStart
    ).toLocaleString()} bp of reference)`;

  const height = layout.height;

  const open = (
    segment: number,
    walk: number | null,
    event: React.MouseEvent,
  ) => {
    setCard({ segment, walk, x: event.clientX, y: event.clientY });
    onHover(null);
  };

  const walkTip = (
    event: React.MouseEvent,
    segment: VariantSegment,
    walk: VariantWalk,
  ) =>
    onHover({
      x: event.clientX,
      y: event.clientY,
      title: `walk ${walk.index} of ${segment.walks.length}`,
      lines: [
        `${walk.lanes.length} of ${segment.haplotypes} haplotypes`,
        walk.nodes.length
          ? `${walk.nodes.length} node${walk.nodes.length === 1 ? "" : "s"}, ${walk.label} against the reference's allele`
          : `skips the site: a deletion (${walk.label})`,
        "drawn across the place its nodes are, not as long as it is",
        region(segment),
        ...(walk.isReference ? ["the reference's walk"] : []),
        ...(walk.sameSpelling
          ? ["spells the same bases as another walk here, through other nodes"]
          : []),
        "click for its nodes and haplotypes",
      ],
    });

  return (
    <div className="pgv-variants" style={{ width, height }}>
      <svg
        /* Its own hearing, not the shared .pgv-svg class: that turns the
           pointer off for the layer the linear view lays over its bars, and
           on here it left every bubble deaf to the hover and the click. */
        className="pgv-variant-svg"
        width={width}
        height={height}
        onClick={() => setCard(null)}
        onMouseLeave={() => onHover(null)}
      >
        <rect
          className="pgv-ruler-ground"
          x={0}
          y={0}
          width={width}
          height={RULER_H}
        />
        <Ruler
          ticks={rulerTicks(
            model,
            (graphX) => axis.px(graphX),
            frame ? frame.width / Math.max(1, frame.endBp - frame.startBp) : axis.scale,
          )}
          height={RULER_H}
          from={0}
          to={width}
        />

        {/* From each walk to the walks its haplotypes take at the next
            site, as thick as how many do; under everything. */}
        {layout.links.map((link, i) => {
          const bend = (link.x2 - link.x1) / 2;
          /* Past a long deletion, over the top of the sites it skips rather
             than through their bubbles. */
          const lift = link.skips
            ? Math.max(RULER_H + 12, Math.min(link.y1, link.y2) - 28)
            : null;
          return (
            <path
              key={`link-${i}`}
              className={`pgv-variant-link${link.skips ? " pgv-variant-skip" : ""}`}
              stroke={LINK_COLORS[(link.from - 1) % LINK_COLORS.length]}
              d={
                lift === null
                  ? `M${link.x1} ${link.y1} C${link.x1 + bend} ${link.y1} ${link.x2 - bend} ${link.y2} ${link.x2} ${link.y2}`
                  : `M${link.x1} ${link.y1} C${link.x1 + 12} ${lift} ${link.x2 - 12} ${lift} ${link.x2} ${link.y2}`
              }
              strokeWidth={link.width}
            >
              <title>{`${link.haplotypes} haplotypes`}</title>
            </path>
          );
        })}

        {/* Stretches everyone shares: a dash, much shorter than the stretch. */}
        {segments.map((segment, i) => {
          if (segment.kind !== "same") return null;
          const x1 = axis.px(segment.x0);
          const x2 = axis.px(segment.x1);
          if (x2 - x1 < 3) return null;
          return (
            <line
              key={`same-${i}`}
              className="pgv-variant-same"
              x1={x1 + 1.5}
              x2={x2 - 1.5}
              /* In a strip of their own under the ruler: on the bubbles'
                 row they ran into the lines between them and read as one
                 long line through the window. */
              y1={VARIANT_SAME_Y}
              y2={VARIANT_SAME_Y}
              onMouseMove={(event) =>
                onHover({
                  x: event.clientX,
                  y: event.clientY,
                  title: "the same in every haplotype",
                  lines: [
                    region(segment),
                    "drawn much shorter than it is",
                  ],
                })
              }
            />
          );
        })}

        {/* A circle per unique walk, most common on the line. */}
        {layout.circles.map(({ segment: at, walk, cx, cy, r, rx }) => {
          const segment = segments[at];
          const picked =
            card?.segment === at && (card.walk === walk.index || card.walk === null);
          return (
            <g
              key={`${at}-${walk.index}`}
              className={`pgv-variant-walk${walk.isReference ? " pgv-variant-ref" : ""}${
                picked ? " pgv-variant-picked" : ""
              }`}
              onMouseMove={(event) => walkTip(event, segment, walk)}
              onClick={(event) => {
                event.stopPropagation();
                open(at, walk.index, event);
              }}
            >
              <ellipse
                cx={cx}
                cy={cy}
                rx={rx}
                ry={r}
                style={walk.isReference ? { stroke: REF_COLOR } : undefined}
              />
              {/* Its bases' share of its range, from the middle out. */}
              {walk.fill > 0 && (
                <ellipse
                  className="pgv-variant-fill"
                  cx={cx}
                  cy={cy}
                  rx={Math.max(0.75, rx * walk.fill - 1)}
                  ry={Math.max(0.75, r - 2)}
                />
              )}
              {r >= LABEL_MIN_R && rx >= LABEL_MIN_R ? (
                <text className="pgv-variant-count" x={cx} y={cy}>
                  {walk.lanes.length}
                </text>
              ) : (
                walk.index === 1 && (
                  <text className="pgv-variant-count-out" x={cx} y={cy - r - 3}>
                    {walk.lanes.length}
                  </text>
                )
              )}
              {/* How many walks here spell the same bases through other
                  nodes, at the top right of the site. */}
              {walk.index === 1 && segment.sameSpelling > 0 && (
                <text
                  className="pgv-variant-spelling"
                  x={cx + rx * 0.8 + 2}
                  y={cy - r * 0.8}
                >
                  {segment.sameSpelling}
                </text>
              )}
            </g>
          );
        })}

        {/* Lengths, since widths say where and not how long: each walk's
            under it, each shared stretch's over its dash. Only where the
            text fits; the tooltip says it either way. */}
        {layout.circles.map(({ segment: at, walk, cx, cy, r, rx }) =>
          walk.label.length * LABEL_CHAR_PX < rx * 2 ? (
            <text
              key={`len-${at}-${walk.index}`}
              className="pgv-variant-length"
              x={cx}
              y={cy + r + 11}
            >
              {walk.label}
            </text>
          ) : null,
        )}
        {segments.map((segment, i) => {
          if (segment.kind !== "same") return null;
          const bp = segment.refEnd - segment.refStart;
          /* A stretch the reference has no bases in says nothing by "0 bp". */
          if (!(bp > 0)) return null;
          const label = bpLabel(bp);
          const wide = axis.px(segment.x1) - axis.px(segment.x0);
          if (label.length * LABEL_CHAR_PX > wide) return null;
          return (
            <text
              key={`same-len-${i}`}
              className="pgv-variant-length"
              x={(axis.px(segment.x0) + axis.px(segment.x1)) / 2}
              y={VARIANT_SAME_Y - 4}
            >
              {label}
            </text>
          );
        })}

        {layout.more.map(({ segment: at, cx, y, count }) => (
          <text
            key={`more-${at}`}
            className="pgv-variant-more"
            x={cx}
            y={y}
            onClick={(event) => {
              event.stopPropagation();
              open(at, null, event);
            }}
          >
            +{count}
          </text>
        ))}
      </svg>

      {card && segments[card.segment] && (
        <VariantCard
          key={`${card.segment}:${card.walk}:${card.x}:${card.y}`}
          model={model}
          segment={segments[card.segment]}
          walk={card.walk}
          x={card.x}
          y={card.y}
          onClose={() => setCard(null)}
        />
      )}
    </div>
  );
}

export default memo(VariantBubbleView);
