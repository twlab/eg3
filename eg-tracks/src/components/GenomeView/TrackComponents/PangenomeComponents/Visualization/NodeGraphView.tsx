import Ruler, { rulerTicks } from "./Ruler";
import { useMemo, memo } from "react";
import type { GraphNode, PangenomeModel } from "./pangenomeModel";
import type { HoverTarget } from "./LinearPathView";
import { baseCentres, nodeDetailLines, sequenceSize } from "./nodeDetail";

/* ══════════════════════════════════════════════════════════════════════════
   Node view - the variation graph itself, drawn the way the vg papers draw it.

   The tube map answers "where does each haplotype go", and pays for it: every
   node is tall enough to stack every haplotype in the graph, and every
   haplotype is a tube running the full width of the picture.

   This view answers "what is the shape of the graph". Nodes are sized by their
   sequence and edges are drawn between them, with nothing running through a
   node that does not need to.

     merged   - one line per connection, its weight showing how many
                haplotypes take it. Nodes stay thin.
     expanded - one strand per haplotype per connection, in the haplotype's
                own colour. Nodes grow just enough to land them.

   Either way the ends are fanned out in the order of the nodes they join, so
   edges splay apart instead of crossing, and a connection that skips over
   other nodes arcs above the row on a tier of its own.
   ══════════════════════════════════════════════════════════════════════════ */

const LEFT_PAD = 24;
const RIGHT_PAD = 32;
const RULER_H = 32;

const NODE_H = 32;
const ROW_GAP = 32;
/** A one-base node still has to be clickable and visible. */
const MIN_NODE_W = 9;
/** Room between neighbouring nodes for their edges to fan out in. */
const COLUMN_GAP = 26;
/** Extra room where several connections leave one boundary at once. */
const FAN_GAP = 9;
/** Vertical step between tiers of skip arcs. */
const ARC_STEP = 12;
const SEQ_H = 16;

/* Expanded mode only. */
const STRAND_PITCH = 8;
const STRAND_PAD = 8;

interface NodeGraphViewProps {
  model: PangenomeModel;
  pxPerBase: number;
  highlight: string | null;
  onHighlight: (key: string | null) => void;
  onHover: (target: HoverTarget | null) => void;
  onSelectNode: (id: string | null) => void;
  selectedNode: string | null;
  showSequence: boolean;
  /** Draw one strand per haplotype instead of one line per connection. */
  expanded: boolean;
}

interface Box {
  node: GraphNode;
  left: number;
  right: number;
  top: number;
  height: number;
}

interface DrawnEdge {
  key: string;
  from: string;
  to: string;
  lanes: string[];
  d: string;
  weight: number;
  skips: boolean;
}

/** One haplotype's strand across a single connection, in expanded mode. */
interface Strand {
  key: string;
  lane: string;
  color: string;
  d: string;
  skips: boolean;
  /** Set on the short runs inside a node, which are hidden until asked for. */
  node?: string;
}

function NodeGraphView({
  model,
  pxPerBase,
  highlight,
  onHighlight,
  onHover,
  onSelectNode,
  selectedNode,
  showSequence,
  expanded,
}: NodeGraphViewProps) {
  const layout = useMemo(() => {
    const rankOf = (id: string) => {
      const n = model.nodeById.get(id);
      return n ? n.column * 1000 + n.row : 0;
    };
    const laneRank = new Map(model.lanes.map((l) => [l.key, l.index]));
    const laneColor = new Map(model.lanes.map((l) => [l.key, l.color]));

    /* ── Columns ──────────────────────────────────────────────────────
       A column is one site; its width is the widest allele in it, so nodes
       keep their relative sizes. A boundary several connections leave at
       once gets extra room to fan out in. */
    const leaving = new Array(model.columns.length).fill(0);
    model.edges.forEach((edge) => {
      const from = model.nodeById.get(edge.from);
      if (from) leaving[from.column] += 1;
    });

    const widthOf = (node: GraphNode) =>
      Math.max(MIN_NODE_W, node.length * pxPerBase);

    const columnLeft: number[] = [];
    let cursor = LEFT_PAD;
    model.columns.forEach((column, i) => {
      columnLeft[i] = cursor;
      const fan = Math.max(0, Math.min(leaving[i] - 1, 4)) * FAN_GAP;
      cursor +=
        Math.max(MIN_NODE_W, column.width * pxPerBase) + COLUMN_GAP + fan;
    });
    const contentWidth = cursor;

    /* ── What lands on each side of each node ─────────────────────────
       Grouping by the node at the other end, then by haplotype, is what
       keeps the ends in the same order as their destinations - which is
       what stops them crossing. */
    interface Port {
      lane: string | null; // null in merged mode: one port per connection
      other: string;
      edge: string;
    }
    const outPorts = new Map<string, Port[]>();
    const inPorts = new Map<string, Port[]>();
    const add = (map: Map<string, Port[]>, key: string, port: Port) => {
      const list = map.get(key);
      if (list) list.push(port);
      else map.set(key, [port]);
    };

    model.edges.forEach((edge) => {
      if (!model.nodeById.has(edge.from) || !model.nodeById.has(edge.to)) return;
      if (expanded) {
        for (const lane of edge.lanes) {
          add(outPorts, edge.from, { lane, other: edge.to, edge: edge.key });
          add(inPorts, edge.to, { lane, other: edge.from, edge: edge.key });
        }
      } else {
        add(outPorts, edge.from, { lane: null, other: edge.to, edge: edge.key });
        add(inPorts, edge.to, { lane: null, other: edge.from, edge: edge.key });
      }
    });

    const order = (list: Port[]) =>
      list.sort(
        (a, b) =>
          rankOf(a.other) - rankOf(b.other) ||
          (laneRank.get(a.lane ?? "") ?? 0) - (laneRank.get(b.lane ?? "") ?? 0),
      );
    outPorts.forEach(order);
    inPorts.forEach(order);

    /* ── Node heights ─────────────────────────────────────────────────
       Merged nodes are thin. Expanded ones grow to whichever side has more
       to land, and no further. */
    const heightOf = (node: GraphNode) => {
      if (!expanded) return NODE_H;
      const sides = Math.max(
        outPorts.get(node.id)?.length ?? 0,
        inPorts.get(node.id)?.length ?? 0,
        1,
      );
      return Math.max(NODE_H, sides * STRAND_PITCH + STRAND_PAD * 2);
    };

    const rowHeights = new Array(model.rowCount).fill(NODE_H);
    model.nodes.forEach((node) => {
      rowHeights[node.row] = Math.max(rowHeights[node.row], heightOf(node));
    });

    /* ── Skip arcs ────────────────────────────────────────────────────
       A connection jumping over other nodes rides above the row. Two share a
       tier only if their spans do not overlap - greedy interval
       partitioning. Counted before the rows are placed, because the header
       has to be deep enough to hold them. */
    const spanOf = (id: string) => {
      const node = model.nodeById.get(id)!;
      const left = columnLeft[node.column];
      return { left, right: left + widthOf(node) };
    };

    const skipRanges: Array<{ key: string; x1: number; x2: number }> = [];
    model.edges.forEach((edge) => {
      const from = model.nodeById.get(edge.from);
      const to = model.nodeById.get(edge.to);
      if (!from || !to || to.column <= from.column + 1) return;
      skipRanges.push({
        key: edge.key,
        x1: spanOf(edge.from).right,
        x2: spanOf(edge.to).left,
      });
    });

    const tierOf = new Map<string, number>();
    const tierEnd: number[] = [];
    skipRanges
      .sort((a, b) => a.x1 - b.x1 || b.x2 - a.x2)
      .forEach((arc) => {
        let tier = tierEnd.findIndex((end) => end <= arc.x1);
        if (tier === -1) {
          tier = tierEnd.length;
          tierEnd.push(0);
        }
        tierEnd[tier] = arc.x2;
        tierOf.set(arc.key, tier);
      });

    const headerY = RULER_H + 16 + tierEnd.length * ARC_STEP;
    const arcCeiling = headerY - 12;

    const rowTops: number[] = [];
    let y = headerY;
    rowHeights.forEach((h, r) => {
      rowTops[r] = y;
      y += h + ROW_GAP + (showSequence ? SEQ_H : 0);
    });

    const boxes = new Map<string, Box>();
    model.nodes.forEach((node) => {
      const left = columnLeft[node.column];
      boxes.set(node.id, {
        node,
        left,
        right: left + widthOf(node),
        top: rowTops[node.row],
        height: heightOf(node),
      });
    });

    const portY = (box: Box, index: number, count: number) =>
      box.top + ((index + 1) / (count + 1)) * box.height;

    const findPort = (map: Map<string, Port[]>, id: string, edge: string, lane: string | null) => {
      const list = map.get(id) ?? [];
      const index = list.findIndex(
        (p) => p.edge === edge && p.lane === lane,
      );
      const box = boxes.get(id)!;
      return portY(box, index < 0 ? 0 : index, list.length);
    };

    const curve = (
      x1: number, y1: number, x2: number, y2: number,
      skips: boolean, tier: number,
    ) => {
      if (skips) {
        const peak = arcCeiling - tier * ARC_STEP;
        return (
          `M ${x1} ${y1} C ${x1 + 18} ${peak} ${x2 - 18} ${peak} ${x2} ${y2}`
        );
      }
      if (y1 === y2) return `M ${x1} ${y1} L ${x2} ${y2}`;
      const reach = Math.max((x2 - x1) * 0.5, 10);
      return `M ${x1} ${y1} C ${x1 + reach} ${y1} ${x2 - reach} ${y2} ${x2} ${y2}`;
    };

    const drawn: DrawnEdge[] = [];
    const strands: Strand[] = [];

    model.edges.forEach((edge) => {
      const from = boxes.get(edge.from);
      const to = boxes.get(edge.to);
      if (!from || !to) return;
      const skips = to.node.column > from.node.column + 1;
      const tier = tierOf.get(edge.key) ?? 0;

      if (!expanded) {
        drawn.push({
          key: edge.key,
          from: edge.from,
          to: edge.to,
          lanes: edge.lanes,
          weight: edge.lanes.length,
          skips,
          d: curve(
            from.right,
            findPort(outPorts, edge.from, edge.key, null),
            to.left,
            findPort(inPorts, edge.to, edge.key, null),
            skips,
            tier,
          ),
        });
        return;
      }

      for (const lane of edge.lanes) {
        strands.push({
          key: `${edge.key}|${lane}`,
          lane,
          color: laneColor.get(lane) ?? "#7b8db0",
          skips,
          d: curve(
            from.right,
            findPort(outPorts, edge.from, edge.key, lane),
            to.left,
            findPort(inPorts, edge.to, edge.key, lane),
            skips,
            tier,
          ),
        });
      }
    });

    /* In expanded mode a haplotype can land on one height and leave on
       another; a short run inside the node says so, rather than leaving the
       strand looking severed. */
    const throughs: Strand[] = [];
    if (expanded) {
      model.nodes.forEach((node) => {
        const box = boxes.get(node.id)!;
        const outs = outPorts.get(node.id) ?? [];
        const ins = inPorts.get(node.id) ?? [];
        for (const lane of node.lanes) {
          const i = ins.findIndex((p) => p.lane === lane);
          const o = outs.findIndex((p) => p.lane === lane);
          if (i < 0 || o < 0) continue;
          const y1 = portY(box, i, ins.length);
          const y2 = portY(box, o, outs.length);
          throughs.push({
            key: `${node.id}~${lane}`,
            node: node.id,
            lane,
            color: laneColor.get(lane) ?? "#7b8db0",
            skips: false,
            d:
              y1 === y2
                ? `M ${box.left} ${y1} L ${box.right} ${y2}`
                : `M ${box.left} ${y1} C ${box.left + (box.right - box.left) / 2} ${y1} ` +
                  `${box.right - (box.right - box.left) / 2} ${y2} ${box.right} ${y2}`,
          });
        }
      });
    }

    /* Where a position along the graph lands, given that the columns
       have room between them: find the column it falls in, then step
       into it. Without this a mark on a round number would drift by
       however many gaps preceded it. */
    const pxAtGraphX = (graphX: number): number | null => {
      const columns = model.columns;
      let lo = 0;
      let hi = columns.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (columns[mid].x <= graphX) lo = mid;
        else hi = mid - 1;
      }
      const column = columns[lo];
      if (!column || graphX < column.x) return null;
      return columnLeft[lo] + (graphX - column.x) * pxPerBase;
    };

    return {
      boxes,
      pxAtGraphX,
      drawn,
      strands,
      throughs,
      width: contentWidth + RIGHT_PAD,
      height: y - ROW_GAP + SEQ_H + 12,
    };
  }, [model, pxPerBase, expanded, showSequence]);



  const seqSize = sequenceSize(pxPerBase);
  const dimLane = (lane: string) => highlight !== null && highlight !== lane;

  return (
    <svg
      className="pgv-svg"
      width={layout.width}
      height={layout.height}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelectNode(null)}
    >
      {/* ── Ruler ─────────────────────────────────────────────────────── */}
      <Ruler
        ticks={rulerTicks(model, layout.pxAtGraphX, pxPerBase)}
        height={RULER_H}
        from={LEFT_PAD}
        to={layout.width - RIGHT_PAD}
      />

      {/* ── Node boxes, under the connections so the strands stay visible
              where they cross a node ─────────────────────────────────── */}
      {model.nodes.map((node) => {
        const box = layout.boxes.get(node.id)!;
        const lit = highlight === null || node.lanes.includes(highlight);
        return (
          <g
            key={node.id}
            className={`pgv-graph-node${node.onReference ? "" : " pgv-node-alt"}${
              lit ? "" : " pgv-dim"
            }${selectedNode === node.id ? " pgv-node-picked" : ""}${
              expanded ? " pgv-graph-node-open" : ""
            }`}
            onClick={(event) => {
              event.stopPropagation();
              onSelectNode(selectedNode === node.id ? null : node.id);
            }}
            onMouseMove={(event) =>
              onHover({
                x: event.clientX,
                y: event.clientY,
                title: `node ${node.id}`,
                lines: nodeDetailLines(node, model),
              })
            }
          >
            <rect
              x={box.left}
              y={box.top}
              width={box.right - box.left}
              height={box.height}
              rx={3}
            />
          </g>
        );
      })}

      {/* ── Connections ───────────────────────────────────────────────── */}
      <g>
        {layout.drawn.map((edge) => (
          <path
            key={edge.key}
            className={`pgv-graph-edge${edge.skips ? " pgv-graph-skip" : ""}${
              highlight === null || edge.lanes.includes(highlight)
                ? ""
                : " pgv-dim"
            }`}
            d={edge.d}
            strokeWidth={0.7 + Math.min(edge.weight, 10) * 0.22}
            onClick={(event) => {
              event.stopPropagation();
              if (edge.lanes.length !== 1) return;
              const only = edge.lanes[0];
              onHighlight(highlight === only ? null : only);
            }}
            onMouseMove={(event) =>
              onHover({
                x: event.clientX,
                y: event.clientY,
                title: `${edge.from} → ${edge.to}`,
                lines: [
                  `used by ${edge.weight} of ${model.lanes.length} haplotypes`,
                  edge.skips
                    ? "skips over the nodes between them"
                    : "joins neighbouring nodes",
                ],
              })
            }
          />
        ))}

        {/* What a strand does inside a node is clutter until you want it,
            so the runs stay hidden until a node or a haplotype is picked. */}
        {layout.throughs
          .filter(
            (run) => run.node === selectedNode || run.lane === highlight,
          )
          .map((run) => (
            <path
              key={run.key}
              className="pgv-graph-through"
              d={run.d}
              stroke={run.color}
            />
          ))}

        {layout.strands.map((strand) => (
          <path
            key={strand.key}
            className={`pgv-graph-strand${
              strand.skips ? " pgv-graph-strand-skip" : ""
            }${dimLane(strand.lane) ? " pgv-dim" : ""}`}
            d={strand.d}
            stroke={strand.color}
            onClick={(event) => {
              event.stopPropagation();
              onHighlight(highlight === strand.lane ? null : strand.lane);
            }}
            onMouseMove={(event) => {
              const lane = model.lanes.find((l) => l.key === strand.lane);
              if (!lane) return;
              onHover({
                x: event.clientX,
                y: event.clientY,
                title: lane.label,
                lines: [
                  `${lane.sample} · haplotype ${lane.haplotype} · ${lane.contig}`,
                  strand.skips
                    ? "takes a connection that skips ahead"
                    : "takes this connection",
                ],
              });
            }}
          />
        ))}
      </g>

      {/* ── Sequences last, so nothing is drawn over them ─────────────── */}
      {showSequence &&
        model.nodes.map((node) => {
          const box = layout.boxes.get(node.id)!;
          if (node.length === 0) return null;
          return (
            <text
              key={`seq-${node.id}`}
              className="pgv-seq pgv-seq-over"
              /* This view widens a node that would be too small to click,
                 so a base here is the box divided by the sequence, not the
                 zoom - otherwise the letters spill past a short node. */
              x={baseCentres(
                box.left,
                node.length,
                (box.right - box.left) / node.length,
              )}
              y={box.top + box.height + SEQ_H - 4}
              textAnchor="middle"
              fontSize={seqSize}
            >
              {node.sequence}
            </text>
          );
        })}
    </svg>
  );
}

/**
 * Wrapped, because the drawing is the expensive part of this view and it
 * only changes when its props do. The container holds those props still
 * between renders, so a hover - which no longer touches React state at
 * all - cannot reach this.
 */
export default memo(NodeGraphView);
