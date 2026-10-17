import { memo, useEffect, useState } from "react";
import VariantCard from "./VariantCard";
import type { BandAxis, DrawFrame, PangenomeModel } from "./pangenomeModel";
import { REF_COLOR, deletionSize } from "./pangenomeModel";
import type { HoverTarget } from "./LinearPathView";
import { VARIANT_EXIT_Y, VARIANT_SAME_Y, bpLabel } from "./variantBubbles";
import type {
  VariantArcLabel,
  VariantExit,
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
/** How far a line out of the band runs level before its size, and how far
    from a bubble it turns up to that level at the least. */
const EXIT_STUB = 10;
const EXIT_TURN = 8;
/** The line out of the band where its haplotypes are on the reference, in
    a stretch everyone shares: the shared stretches' own grey. */
const EXIT_SHARED = "#8a8f97";

interface VariantBubbleViewProps {
  model: PangenomeModel;
  frame?: DrawFrame;
  axis: BandAxis;
  segments: VariantSegment[];
  layout: VariantLayout;
  /** The deletions running out of the band, and the long ones' sizes on
      their arcs; see variantDeletions. */
  deletions?: { exits: VariantExit[]; arcs: VariantArcLabel[] };
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
  axis,
  segments,
  layout,
  deletions,
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

  /* Each line out of the band: from its bubble up to the level the sizes
     are written at, and on a little past where the haplotypes leave the
     reference - or in from there and down into the bubble they take next.
     Where they are on the reference there, it starts from the strip of
     shared stretches instead. With where its size goes, kept clear of the
     sizes already placed. */
  const exitY = VARIANT_EXIT_Y;
  const placedText: Array<[number, number]> = [];
  const exitShapes = (deletions?.exits ?? []).map((exit) => {
    const right = exit.side === "right";
    const turn = exit.from
      ? right
        ? Math.max(exit.x, exit.from.x + EXIT_TURN)
        : Math.min(exit.x, exit.from.x - EXIT_TURN)
      : exit.x;
    const end = right ? turn + EXIT_STUB : turn - EXIT_STUB;
    let d: string;
    if (exit.from) {
      const mid = (exit.from.x + turn) / 2;
      const bend = `C${mid} ${exit.from.y} ${mid} ${exitY} ${turn} ${exitY}`;
      d = right
        ? `M${exit.from.x} ${exit.from.y} ${bend} L${end} ${exitY}`
        : `M${end} ${exitY} L${turn} ${exitY} C${mid} ${exitY} ${mid} ${exit.from.y} ${exit.from.x} ${exit.from.y}`;
    } else {
      d = right
        ? `M${turn} ${VARIANT_SAME_Y + 3} L${turn} ${exitY} L${end} ${exitY}`
        : `M${end} ${exitY} L${turn} ${exitY} L${turn} ${VARIANT_SAME_Y + 3}`;
    }
    const textX = right ? end + 3 : end - 3;
    const span: [number, number] = right
      ? [textX, textX + exit.text.length * LABEL_CHAR_PX]
      : [textX - exit.text.length * LABEL_CHAR_PX, textX];
    const clear = !placedText.some(([a, b]) => span[0] < b + 4 && a < span[1] + 4);
    if (clear) placedText.push(span);
    return { exit, d, textX, showText: clear };
  });
  const exitTip = (event: React.MouseEvent, exit: VariantExit) =>
    onHover({
      x: event.clientX,
      y: event.clientY,
      title: `${exit.lanes.length} haplotype${exit.lanes.length === 1 ? "" : "s"}`,
      lines: [
        `a deletion of ${deletionSize(exit.bp)}: ${exit.lanes.length === 1 ? "its" : "their"} walk skips ${contig}:${exit.refFrom.toLocaleString()}–${exit.refTo.toLocaleString()}`,
        `which runs past this band, to the ${exit.side}`,
        ...exit.lanes
          .slice(0, 8)
          .map((key) => model.lanes.find((lane) => lane.key === key)?.label ?? key),
        ...(exit.lanes.length > 8 ? [`and ${exit.lanes.length - 8} more`] : []),
      ],
    });

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

        {/* From each walk to the walks its haplotypes take at the next
            site, as thick as how many do; under everything. */}
        {layout.links.map((link, i) => {
          const bend = (link.x2 - link.x1) / 2;
          /* Past a long deletion, over the top of the sites it skips rather
             than through their bubbles. */
          const lift = link.lift;
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

        {/* Out of the band, past a deletion running to its edge: under the
            bubbles, as the links are. */}
        {exitShapes.map(({ exit, d }, i) => (
          <path
            key={`exit-${i}`}
            className="pgv-variant-link pgv-variant-skip"
            stroke={
              exit.from
                ? LINK_COLORS[(exit.from.walk - 1) % LINK_COLORS.length]
                : EXIT_SHARED
            }
            d={d}
            strokeWidth={exit.width}
            onMouseMove={(event) => exitTip(event, exit)}
          />
        ))}

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

        {/* Each deletion's size: after the line out of the band, and at
            the top of a long one's arc where it fits there. */}
        {exitShapes.map(({ exit, textX, showText }, i) =>
          showText ? (
            <text
              key={`exit-len-${i}`}
              className="pgv-variant-exit"
              x={textX}
              y={exitY}
              textAnchor={exit.side === "right" ? "start" : "end"}
              onMouseMove={(event) => exitTip(event, exit)}
            >
              {exit.text}
            </text>
          ) : null,
        )}
        {(deletions?.arcs ?? []).map((arc, i) =>
          arc.text.length * LABEL_CHAR_PX < arc.room ? (
            <text
              key={`arc-len-${i}`}
              className="pgv-variant-exit"
              x={arc.x}
              y={arc.y}
              textAnchor="middle"
            >
              {arc.text}
            </text>
          ) : null,
        )}

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
