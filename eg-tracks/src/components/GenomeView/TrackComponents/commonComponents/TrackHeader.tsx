import React, { useLayoutEffect, useRef, useState } from "react";

import TrackModel from "../../../../models/TrackModel";
import LinearDrawingModel from "../../../../models/LinearDrawingModel";
import { BASE_COLORS, Sequence } from "../GenomeAlignComponents/Sequence";
import { TranslatableG } from "../geneAnnotationTrackComponents/TranslatableG";
import { AXIS_WIDTH, drawLegendAxis } from "./TrackLegend";
import type { LegendAxisProps } from "./TrackLegend";
import { PILL_H } from "../PangenomeComponents/Visualization/legendRows";
import type { LegendRow } from "../PangenomeComponents/Visualization/legendRows";
import { CopyRulers } from "../PangenomeComponents/Visualization/CopyRulerView";
import type { LabelEnd } from "../PangenomeComponents/Visualization/CopyRulerView";
import type { LaneCopies } from "../PangenomeComponents/Visualization/copyRuler";
import { blockRing, blockTone } from "../PangenomeComponents/Visualization/blockColor";

import "./TrackHeader.css";

/* ══════════════════════════════════════════════════════════════════════════
   The pangenome view's legend (PLAN-remastered-2.md section 3, in
   eg3/claude-memory; mockup diagrams/copy-ruler-aero.html).

   The other views give each track a box in a column on the left, 120 px by
   default. The pangenome view has none: the drawing starts at the left
   edge, so the region typed is the region shown, and each track's legend
   is a glass label over its top-left corner, as UCSC writes a track's name
   over the track. What the column held moves here:
   - the track's name (the label, with an orb in the graph's blue or a
     haplotype's green);
   - the ruler's chromosome and the bases' colours;
   - a numerical track's y-axis, at the data's left edge;
   - a haplotype's rows, one label each in the empty strip above the
     row's bar (legendRows.ts): its name and the row's own range on
     screen as one label, a dot in its bar's colour, "reverse" on a row
     read on the other strand; every label starts at the track's left, so
     none moves when another's words change;
   - the loading and "items hidden" chips after the first label, and last
     the haplotype's note ("23 deletions too small to see");
   - for a haplotype with copies of a duplicated stretch (legend.copies,
     copyRuler.ts): a title over its copy ruler ("HG002#2 · in place, 4
     copies"), the ruler with a pin a row, a tab before each copy's rows,
     each row's dot numbered as its pin is, and a faint line from each
     label to its row's place on the ruler (CopyRulerView.tsx).

   The test tools read the legend by its classes (TrackLegend-wrap, -label,
   -note, -row, -row-dim) and its shape: the rows found from the wrap's
   parent, the name the first label of the track. Both are kept.
   ══════════════════════════════════════════════════════════════════════════ */

/** The room at the track's left. */
const EDGE = 4;
/** Where the label's line sits on a track with no rows: 1 px down, as a
    pill sits in its strip. */
const LINE_TOP = 1;

interface TrackHeaderProps {
  trackModel: TrackModel;
  /** What the track's draw gave its legend (TrackFactory's `legend`): the
      props the column's TrackLegend is given. */
  legend: any;
  /** The legend's height, as TrackFactory works it out for the column. */
  height: number;
  /** The track's name. */
  label: string;
  /** The user's colour for the legend's words (options.legendFontColor). */
  fontColor?: string;
  /** The orb's colour: the graph's blue; on a haplotype's rows, the dot's:
      its bar's own colour. */
  orbColor?: string;
  /** The pangenome's own tracks: drawn on the view's light ground in both
      themes, so their glass stays light. */
  light?: boolean;
  /** A haplotype's lane: its label sits in the empty strip above its first
      row, with nothing under it to blur. */
  lane?: boolean;
  /** The graph's own row: the label lets the pointer through to the
      reference bar, which has a card for every node (and the tests hover
      it there). */
  passThrough?: boolean;
  /** The loading and hidden chips, as TrackFactory makes them. */
  chips?: React.ReactNode;
}

/** The ruler's key: the chromosome on screen (two joined by a dash when
    the region spans them; gaps left out), and whether a base is wide
    enough to be drawn as its letter, which is when the bases' colours
    help. As TrackLegend works it out for the column. */
function rulerKeyOf(legend: any): { chrom: string; bases: boolean } | null {
  const region = legend?.trackViewRegion;
  const selected = legend?.selectedRegion;
  if (!region || !selected) return null;
  const bases =
    new LinearDrawingModel(region, legend.trackWidth).basesToXWidth(1) >
    Sequence.MIN_X_WIDTH_PER_BASE;
  const names: string[] = selected
    .getFeatureSegments()
    .filter((s: any) => s && s.feature.getName() !== "Gap")
    .map((s: any) => s.feature.getName());
  const ends = [names[0], names[names.length - 1]].filter(
    (name, i, all) => name && all.indexOf(name) === i,
  );
  return { chrom: ends.join("–"), bases };
}

/** A y-axis at the data's left edge, on a pale strip so its numbers read
    over the data: the column's axis (drawLegendAxis), drawn the same. */
function HeaderAxis({ top, axis }: { top: number; axis: LegendAxisProps }) {
  const gRef = useRef<SVGGElement | null>(null);
  useLayoutEffect(() => {
    drawLegendAxis(gRef.current, axis);
  }, [
    axis.axisScale,
    axis.axisScaleReverse,
    axis.height,
    axis.hideFirstAxisLabel,
    axis.noShiftFirstAxisLabel,
  ]);
  const tall = axis.axisScaleReverse ? axis.height * 0.5 : axis.height;
  return (
    <svg
      className="TrackHeader-axis"
      width={AXIS_WIDTH}
      height={tall}
      style={{ top }}
      aria-hidden="true"
    >
      <rect
        className="TrackHeader-axis-ground"
        width={AXIS_WIDTH}
        height={tall}
      />
      <TranslatableG
        innerRef={(node) => {
          gRef.current = node;
        }}
        x={AXIS_WIDTH - 1}
      />
    </svg>
  );
}

/** One row's label: the haplotype's name and the row's own range on
    screen, as one label, with a dot in the bar's colour, "reverse" on a
    row read on the other strand from end to end, and the contig only
    where the haplotype's rows lie on more than one. The whole story is in
    its hover title; dimmed when nothing of the row is on screen. Its
    `data-region` keeps the region with its contig, as the column wrote
    it and the test tools read it. The first row's label is the
    haplotype's title: `head`. In a lane with copies the dot carries the
    row's number, as its pin on the copy ruler does, and the label under
    the pointer lights its pin and line: `onHot`. */
function RowPill({
  row,
  color,
  head,
  selected,
  style,
  hot,
  onHot,
  innerRef,
  bare,
}: {
  row: LegendRow;
  color?: string;
  head?: boolean;
  /** Without the haplotype's name: a row of a lane with copies, whose
      title over the ruler names it (the user, 2026-11-15: "the legend in
      the copies row dont need the hap name"). */
  bare?: boolean;
  selected?: boolean;
  style?: React.CSSProperties;
  hot?: boolean;
  onHot?: (on: boolean) => void;
  innerRef?: (node: HTMLDivElement | null) => void;
}) {
  const classes = [
    "TrackLegend-row",
    row.dim ? "TrackLegend-row-dim" : "",
    head ? "TrackLegend-row-head" : "",
    bare ? "TrackLegend-row-bare" : "",
    hot ? "TrackLegend-row-hot" : "",
    selected ? "TrackHeader-selected" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={classes}
      style={style}
      title={row.title}
      data-region={row.lines.join("")}
      ref={innerRef}
      onMouseEnter={onHot ? () => onHot(true) : undefined}
      onMouseLeave={onHot ? () => onHot(false) : undefined}
    >
      {row.name ? (
        <>
          {color && row.pin !== undefined ? (
            <span
              className="TrackHeader-pin"
              style={{ backgroundColor: color, borderColor: blockRing(color) }}
            >
              {row.pin}
            </span>
          ) : head && color ? (
            /* The haplotype's main legend: the reference's orb, in the
               bar's colour a shade deeper, so it shows on the glass as the
               reference's does (the user, 2026-11-15). */
            <span
              className="TrackHeader-orb"
              style={{ ["--orb" as any]: blockTone(color) }}
            />
          ) : (
            color && (
              <span
                className="TrackHeader-dot"
                style={{ backgroundColor: color, borderColor: blockRing(color) }}
              />
            )
          )}
          {!bare && <span className="TrackLegend-label">{row.name}</span>}
          <span className="TrackLegend-range">
            {bare ? "" : ": "}
            {row.contig ? `${row.contig}:` : ""}
            {row.range}
          </span>
          {row.reverse && <span className="TrackLegend-tag">reverse</span>}
        </>
      ) : (
        row.lines.map((line, j) => <span key={j}>{line}</span>)
      )}
    </div>
  );
}

export default function TrackHeader({
  trackModel,
  legend,
  height,
  label,
  fontColor,
  orbColor,
  light,
  lane,
  passThrough,
  chips,
}: TrackHeaderProps) {
  const rows: LegendRow[] = legend?.rows ?? [];
  const note: string | undefined = legend?.note;
  /* A haplotype with copies: its rulers and tabs (copyRuler.ts). */
  const copies: LaneCopies | undefined = legend?.copies;
  /* The row whose label or pin is under the pointer. */
  const [hot, setHot] = useState<number | null>(null);
  /* Where each row's label ends: the line to its pin starts there. A
     label is as wide as its words, so it is measured. */
  const pills = useRef<Array<HTMLDivElement | null>>([]);
  const [ends, setEnds] = useState<Array<LabelEnd | null>>([]);
  const isRuler = trackModel.type === "ruler";
  const ruler = isRuler ? rulerKeyOf(legend) : null;
  const name = isRuler
    ? ""
    : trackModel?.options?.label
      ? trackModel.options.label
      : label || "";

  /* A matplot's or a dynamic track's own tracks, each in its colour. */
  const subTracks =
    trackModel.type in { matplot: "", dynamic: "", dynamicbed: "" } &&
    trackModel.tracks?.length
      ? trackModel.tracks.map((track: any) => ({
          name: track?.label || track?.options?.label || track?.name || "",
          color: track?.options?.color || "blue",
        }))
      : [];

  /* The y-axis, and methylc's second one for its other strand under it,
     given what the column's two TrackLegends are given (TrackFactory). */
  const axes: Array<{ top: number; axis: LegendAxisProps }> = [];
  if (legend?.axisScale && height > 0) {
    axes.push({
      top: 0,
      axis: {
        height,
        axisScale: legend.axisScale,
        noShiftFirstAxisLabel: legend.noShiftFirstAxisLabel,
      },
    });
  }
  const reverse = legend?.reverseStrandLegendProps;
  if (reverse?.axisScale && reverse.height > 0) {
    axes.push({
      /* Under the first, as the column stacked their boxes: methylc's own
         box takes its height and no more (TrackLegend.tsx). */
      top: height + (trackModel.type === "methylc" ? 0 : 2),
      axis: {
        height: reverse.height,
        axisScale: reverse.axisScale,
        axisScaleReverse: reverse.axisScaleReverse,
        hideFirstAxisLabel: reverse.hideFirstAxisLabel,
        noShiftFirstAxisLabel: reverse.noShiftFirstAxisLabel,
      },
    });
  }
  const left = EDGE + (axes.length ? AXIS_WIDTH : 0);
  useLayoutEffect(() => {
    if (!copies) {
      if (ends.length) setEnds([]);
      return;
    }
    const next = rows.map((row, i) => {
      const pill = pills.current[i];
      return pill ? { x: left + pill.offsetWidth + 2, y: row.top + PILL_H / 2 } : null;
    });
    if (JSON.stringify(next) !== JSON.stringify(ends)) setEnds(next);
  });

  /* A haplotype's rows carry its name, each in its own label at the
     track's left: the track has no label besides, and no label's place
     depends on another's width. */
  const named = rows.length > 0 && !!rows[0].name;
  const hasLabel =
    !named && !!(name || ruler?.chrom || subTracks.length || note);
  /* With copies the haplotype's title is over its first ruler, and no
     row's label is the title. */
  const titled = !!copies && named;
  const titleOf = (at: number) => {
    const one = copies!.rulers[at];
    /* "Maybe more" where the copies are counted; an unknown number says it
       already. */
    const more = one.mightBeMore && !/^unknown/.test(one.count);
    return (
      <div
        className={`TrackHeader-glass TrackHeader-title${trackModel.isSelected ? " TrackHeader-selected" : ""}`}
        title={`${rows[0].name} has more than one copy of a stretch of the reference here${copies!.nameContigs ? `, on ${one.contig}` : ""}: ${one.count}. The ruler shows where they lie in its own sequence.${one.mightBeMore ? " The search stopped at its limit: there may be more." : ""}`}
      >
        {orbColor && (
          /* The reference's orb, in the bar's colour (the user, 2026-11-15:
             "the dot in the main legend of haps dont have the same style as
             the ref main legend"). */
          <span
            className="TrackHeader-orb"
            style={{ ["--orb" as any]: blockTone(orbColor) }}
          />
        )}
        <span className="TrackLegend-label">{rows[0].name}</span>
        <span className="TrackHeader-count">
          {copies!.nameContigs ? `· ${one.contig} ` : ""}· {one.count}
          {more ? ", maybe more" : ""}
        </span>
      </div>
    );
  };

  const title = [
    isRuler ? "Ruler" : name,
    ruler?.chrom,
    ...subTracks.map((track) => track.name),
  ]
    .filter(Boolean)
    .join("\n");
  const glass = [
    "TrackHeader-glass",
    "TrackHeader-label",
    lane ? "" : "TrackHeader-blur",
    passThrough ? "TrackHeader-pass" : "",
    trackModel.isSelected ? "TrackHeader-selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`TrackHeader TrackLegend-wrap${light ? " TrackHeader-light" : ""}`}
    >
      {axes.map((one, i) => (
        <HeaderAxis key={i} top={one.top} axis={one.axis} />
      ))}
      {titled && (
        <CopyRulers
          copies={copies!}
          color={orbColor ?? "#94a3b8"}
          ends={ends}
          hot={hot}
          onHot={setHot}
        />
      )}
      {titled &&
        copies!.rulers.slice(1).map((one, i) => (
          <div
            key={one.contig}
            style={{ position: "absolute", left, top: one.top + LINE_TOP }}
          >
            {titleOf(i + 1)}
          </div>
        ))}
      <div
        className="TrackHeader-line"
        style={{
          left,
          top: titled
            ? copies!.rulers[0].top + LINE_TOP
            : (rows[0]?.top ?? LINE_TOP),
        }}
      >
        {hasLabel && (
          <div
            className={glass}
            title={title}
            style={fontColor ? { color: fontColor } : undefined}
          >
            {orbColor && (
              <span
                className="TrackHeader-orb"
                style={{ ["--orb" as any]: orbColor }}
              />
            )}
            {name && <span className="TrackLegend-label">{name}</span>}
            {ruler?.chrom && (
              <span className="TrackLegend-chrLabel">{ruler.chrom}</span>
            )}
            {ruler?.bases && (
              <span className="TrackHeader-bases" aria-hidden="true">
                {Object.entries(BASE_COLORS).map(([base, color]) => (
                  <span key={base} style={{ backgroundColor: color }}>
                    {base}
                  </span>
                ))}
              </span>
            )}
            {subTracks.length > 0 && (
              <span className="TrackLegend-subLabels">
                {subTracks.map((track, i) => (
                  <span key={i} style={{ color: track.color }}>
                    {track.name}
                  </span>
                ))}
              </span>
            )}
            {note && <span className="TrackLegend-note">{note}</span>}
          </div>
        )}
        {titled && titleOf(0)}
        {rows[0] && !titled && (
          <RowPill
            row={rows[0]}
            color={orbColor}
            head
            selected={trackModel.isSelected}
          />
        )}
        {chips}
        {named && note && <span className="TrackLegend-note">{note}</span>}
      </div>
      {(titled ? rows : rows.slice(1)).map((row, i) => {
        const n = titled ? i : i + 1;
        return (
          <RowPill
            key={n}
            row={row}
            color={orbColor}
            style={{ position: "absolute", top: row.top, left }}
            hot={titled && hot === n}
            bare={titled}
            onHot={titled ? (on) => setHot(on ? n : null) : undefined}
            innerRef={
              titled
                ? (node) => {
                    pills.current[n] = node;
                  }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
