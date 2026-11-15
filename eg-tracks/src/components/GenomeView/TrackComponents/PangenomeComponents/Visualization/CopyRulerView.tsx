import React, { useId } from "react";

import { blockRing, blockTone } from "./blockColor";
import { RULER } from "./copyRuler";
import type { CopyRuler, LaneCopies, RulerStretch } from "./copyRuler";
import { RULER_H, TAB_H } from "./laneLayout";

/* ══════════════════════════════════════════════════════════════════════════
   The copy rulers and tabs of a haplotype with copies, drawn in its track's
   header (TrackHeader.tsx), which does not pan (PLAN-remastered-2.md
   section 3, steps 3 and 4, in eg3/claude-memory; mockup
   diagrams/copy-ruler-aero.html). Where everything sits is copyRuler.ts's;
   the room for it in the lane is laneLayout.ts's, and the drawing under
   the header leaves that room empty but for each tab's line.

   Colours: a copy is its haplotype's own colour, every second copy a shade
   deeper (blockColor.ts), so no new hue enters; the anchor sites slate; a
   cut hatched; a stretch not placed on CHM13 white with a dashed edge,
   labelled own sequence, its hover saying it is not read in this CHM13
   region; the stretch of each row on screen amber. A pin is a row's dot,
   numbered as the row's label is.
   ══════════════════════════════════════════════════════════════════════════ */

/** Where a row's label ends, from the lane's top-left: the faint line to
    its pin starts there. */
export interface LabelEnd {
  x: number;
  y: number;
}

/** About what a character of the ruler's 9 px words takes. */
const CHAR = 5.2;
const fits = (label: string, room: number) => label.length > 0 && label.length * CHAR + 8 <= room;

const AMBER = "#f59e0b";
/** An amber mark wider than this is a band along the bar's foot, this
    tall. */
const MARK_LINE_MAX = 4;
const MARK_BAND_H = 3;

/** A copy's shade. */
export const toneOf = (color: string, tone: 0 | 1 | null): string => (tone === 1 ? blockTone(color) : color);

/** The chevrons of a copy's part: > read forward, < backward, 16 px apart,
    none where the copy's name is written. */
function chevrons(part: { x0: number; x1: number; backward: boolean }, y: number, skip: [number, number] | null): string {
  let d = "";
  const way = part.backward ? -1 : 1;
  for (let x = part.x0 + 8; x <= part.x1 - 5; x += 16) {
    if (skip && x > skip[0] - 5 && x < skip[1] + 5) continue;
    d += `M${(x - 2 * way).toFixed(1)} ${y - 3}L${(x + 2 * way).toFixed(1)} ${y}L${(x - 2 * way).toFixed(1)} ${y + 3}`;
  }
  return d;
}

function Stretch({ one, color, hatch }: { one: RulerStretch; color: string; hatch: string }) {
  const y = RULER.barTop;
  const h = RULER.barH;
  const w = Math.max(0.5, one.x1 - one.x0);
  const mid = (one.x0 + one.x1) / 2;
  const cy = y + h / 2;
  if (one.kind === "anchor") {
    return (
      <g>
        <rect className="pgv-ruler-anchor" x={one.x0} y={y} width={w} height={h}>
          <title>{one.title}</title>
        </rect>
        {fits(one.label, w) && (
          <text className="pgv-ruler-word pgv-ruler-word-light" x={mid} y={cy + 3.2} textAnchor="middle">
            {one.label}
          </text>
        )}
      </g>
    );
  }
  /* A stretch not placed on CHM13 is drawn, white with a dashed edge and
     labelled own sequence, so it shows there is sequence there (drawn as
     nothing it read as a deletion); its hover says it is not read in this
     CHM13 region. Under a pixel wide (7 bp between two copies on a 130 kb
     ruler) it is not drawn: its sliver would sit on its neighbour. A cut
     is always drawn. */
  if (one.kind === "unplaced" && one.x1 - one.x0 < 1) return null;
  if (one.kind === "cut" || one.kind === "unplaced") {
    const said = fits(one.label, w);
    return (
      <g>
        <rect className={`pgv-ruler-${one.kind}`} x={one.x0 + 0.5} y={y + 0.5} width={Math.max(0.5, w - 1)} height={h - 1} fill={one.kind === "cut" ? `url(#${hatch})` : undefined}>
          <title>{one.title}</title>
        </rect>
        {said && (
          <text className="pgv-ruler-word" x={mid} y={cy + 3.2} textAnchor="middle">
            {one.label}
          </text>
        )}
      </g>
    );
  }
  /* A copy, or the uncut stretch. */
  const fill = toneOf(color, one.tone);
  const said = fits(one.label, w - 8);
  const half = said ? (one.label.length * CHAR + 8) / 2 : 0;
  const skip: [number, number] | null = said ? [mid - half, mid + half] : null;
  return (
    <g>
      <rect x={one.x0} y={y} width={w} height={h} fill={fill} stroke={blockRing(color)} strokeOpacity={0.55} strokeWidth={1}>
        <title>{one.title}</title>
      </rect>
      {one.parts.slice(1).map((part, k) => (
        <line key={k} className="pgv-ruler-part" x1={part.x0} x2={part.x0} y1={y} y2={y + h} />
      ))}
      <path className="pgv-ruler-chevron" d={one.parts.map((part) => chevrons(part, cy, skip)).join("")} />
      {said && (
        <>
          <rect className="pgv-ruler-name-ground" x={mid - half} y={y + 1.5} width={half * 2} height={h - 3} rx={3} />
          <text className="pgv-ruler-name" x={mid} y={cy + 3.2} textAnchor="middle">
            {one.label}
          </text>
        </>
      )}
    </g>
  );
}

function Ruler({ ruler, color, hatch, hot, onHot }: { ruler: CopyRuler; color: string; hatch: string; hot: number | null; onHot: (row: number | null) => void }) {
  const barBottom = RULER.barTop + RULER.barH;
  return (
    <g transform={`translate(0 ${ruler.top})`} className="pgv-ruler" data-contig={ruler.contig}>
      {/* What the walk did not cover shows as the line alone. */}
      <line className="pgv-ruler-line" x1={ruler.x0} x2={ruler.x1} y1={RULER.barTop + RULER.barH / 2} y2={RULER.barTop + RULER.barH / 2} />
      {ruler.stretches.map((one, k) => (
        <Stretch key={k} one={one} color={color} hatch={hatch} />
      ))}
      {ruler.ticks.map((tick) => (
        <g key={tick.label}>
          <line className="pgv-ruler-tick" x1={tick.x} x2={tick.x} y1={barBottom} y2={barBottom + 3} />
          <text className="pgv-ruler-tick-label" x={tick.x} y={RULER.tickLabelY} textAnchor={tick.x > ruler.x1 - 30 ? "end" : tick.x < ruler.x0 + 30 ? "start" : "middle"}>
            {tick.label}
          </text>
        </g>
      ))}
      {/* The stretch of each row on screen: a line across the bar while it
          is narrow, a band along the bar's foot once it is wide, so it
          never hides a copy. */}
      {ruler.marks.map((mark) => {
        const wide = mark.x1 - mark.x0 > MARK_LINE_MAX;
        return (
          <rect
            key={mark.row}
            className="pgv-ruler-mark"
            data-row={mark.row}
            x={mark.x0}
            y={wide ? barBottom - MARK_BAND_H + 1 : RULER.barTop - 1}
            width={mark.x1 - mark.x0}
            height={wide ? MARK_BAND_H : RULER.barH + 2}
            fill={AMBER}
          />
        );
      })}
      {ruler.pins.map((pin) =>
        ruler.crowded ? (
          <circle key={pin.row} className={`pgv-ruler-pin-small${pin.dim ? " pgv-ruler-pin-dim" : ""}`} data-row={pin.row} cx={pin.at} cy={RULER.barTop - 4} r={2.5} fill={color} stroke={blockRing(color)} />
        ) : (
          <g
            key={pin.row}
            className={`pgv-ruler-pin${pin.dim ? " pgv-ruler-pin-dim" : ""}${hot === pin.row ? " pgv-ruler-pin-hot" : ""}`}
            data-row={pin.row}
            onMouseEnter={() => onHot(pin.row)}
            onMouseLeave={() => onHot(null)}
          >
            <line x1={pin.x} y1={RULER.pinY + RULER.pinR} x2={pin.at} y2={RULER.barTop} stroke={blockRing(color)} />
            <circle cx={pin.x} cy={RULER.pinY} r={RULER.pinR} fill={color} stroke={blockRing(color)} />
            <text x={pin.x} y={RULER.pinY + 3.1} textAnchor="middle">
              {pin.n}
            </text>
            <title>{`Row ${pin.n}${pin.dim ? ": nothing of it is on screen" : ": where its stretch on screen lies"}`}</title>
          </g>
        ),
      )}
    </g>
  );
}

/** The faint line from a row's label to where the row lies on its ruler. */
function lineTo(from: LabelEnd, x: number, y: number): string {
  const reach = Math.min(120, Math.max(30, (from.y - y) / 2));
  return `M${from.x.toFixed(1)} ${from.y.toFixed(1)}C${(from.x + 40).toFixed(1)} ${from.y.toFixed(1)} ${x.toFixed(1)} ${(y + reach).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
}

/**
 * A lane's rulers, tabs and lines. `ends` are where the rows' labels end
 * (measured by the header), `hot` the row whose label or pin is under the
 * pointer.
 */
export function CopyRulers({ copies, color, ends, hot, onHot }: { copies: LaneCopies; color: string; ends: ReadonlyArray<LabelEnd | null>; hot: number | null; onHot: (row: number | null) => void }) {
  const hatch = `pgv-ruler-hatch-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <>
      {/* Behind each ruler's band, a glass panel from the band's top down to
          the line its first tab stands on, edge to edge (the user, 2026-11-15:
          "make the bg of this part like a glass panel, down to behind the first
          glass legend", "fill the gap on the left and right too"). First, so
          all the rest lies over it. */}
      {copies.rulers.map((ruler) => (
        <div
          key={`panel ${ruler.contig}`}
          className="pgv-ruler-panel"
          style={{ top: ruler.top, left: 0, width: copies.width, height: RULER_H + TAB_H }}
          aria-hidden="true"
        />
      ))}
      <svg className="pgv-rulers" width={copies.width} height={copies.height} aria-hidden="true">
        <defs>
          <pattern id={hatch} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={5} height={5} fill="#fff" />
            <line x1={0} y1={0} x2={0} y2={5} stroke="#94a3b8" strokeWidth={2} />
          </pattern>
        </defs>
        {copies.rulers.flatMap((ruler) =>
          ruler.pins.map((pin) => {
            const from = ends[pin.row];
            if (!from) return null;
            return (
              <path
                key={`${ruler.contig} ${pin.row}`}
                className={`pgv-ruler-lead${hot === pin.row ? " pgv-ruler-lead-hot" : ""}${pin.dim ? " pgv-ruler-lead-dim" : ""}`}
                data-row={pin.row}
                d={lineTo(from, pin.at, ruler.top + RULER.barTop + RULER.barH + 1)}
              />
            );
          }),
        )}
        {copies.rulers.map((ruler) => (
          <Ruler key={ruler.contig} ruler={ruler} color={color} hatch={hatch} hot={hot} onHot={onHot} />
        ))}
      </svg>
      {copies.rulers.map((ruler) => (
        <div
          key={ruler.contig}
          className="pgv-ruler-caption"
          style={{ top: ruler.top + RULER.barTop + 0.5, left: RULER.captionLeft, width: RULER.captionWidth }}
          title={`Where the copies lie in the haplotype's own coordinates${copies.nameContigs ? ` (${ruler.contig})` : ""}. Amber: the stretch of each row on screen.${ruler.mightBeMore ? " The search stopped at its limit: there may be more copies." : ""}`}
        >
          <span>{ruler.caption}</span>
          <span className="pgv-ruler-key">
            <i style={{ background: AMBER }} />
            in view
          </span>
        </div>
      ))}
      {copies.tabs.map((tab) => (
        <React.Fragment key={tab.row}>
          <div className="pgv-copy-tab" data-row={tab.row} style={{ top: tab.top + 3, height: TAB_H - 3 }} title={tab.title}>
            {tab.tone !== null && <i style={{ background: toneOf(color, tab.tone), borderColor: blockRing(color) }} />}
            {tab.text}
          </div>
          {tab.between && (
            <div
              className="pgv-copy-between"
              style={{ top: tab.top + TAB_H - 7, left: Math.max(copies.width / 2, 14 + tab.text.length * 5.8 + 60 + tab.between.length * 2.7) }}
              title="What lies between this copy and the one before it, in the haplotype's own coordinates"
            >
              {tab.between}
            </div>
          )}
        </React.Fragment>
      ))}
    </>
  );
}
