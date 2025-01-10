import React from "react";
import { scaleLinear } from "d3-scale";
import _ from "lodash";
import { TranslatableG } from "../geneAnnotationTrackComponents/TranslatableG";
import { FiberDisplayModes } from "../../../../trackConfigs/config-menu-models.tsx/DisplayModes";
import AnnotationArrows from "../commonComponents/annotation/AnnotationArrows";

const DOT_BP_PIXEL_CUTOFF = 2.5;

interface Feature {
  getName: () => string;
  ons: number[];
  offs: number[];
  strand: string;
}

interface Placement {
  feature: Feature;
  xSpan: [number, number];
  visiblePart: {
    relativeStart: number;
    relativeEnd: number;
  };
}

interface FiberAnnotationProps {
  placement: Placement;
  y?: number;
  color?: string;
  color2?: string;
  rowHeight?: any;
  isMinimal?: boolean;
  displayMode?: string;
  hiddenPixels?: number;
  hideMinimalItems?: boolean;
  pixelsPadding?: number;
  renderTooltip?: any;
  onHideTooltip?: any;
}

class FiberAnnotation extends React.Component<FiberAnnotationProps> {
  render() {
    const {
      placement,
      y,
      color,
      color2,
      isMinimal,
      hiddenPixels,
      rowHeight,
      renderTooltip,
      onHideTooltip,
      displayMode,
      hideMinimalItems,
      pixelsPadding,
    } = this.props;
    const { feature, xSpan, visiblePart } = placement;
    const { relativeStart, relativeEnd } = visiblePart;
    const segmentWidth = relativeEnd - relativeStart;
    const [startX, endX] = xSpan;
    const width = endX - startX;
    if (width < hiddenPixels!) {
      return null;
    }
    if (isMinimal) {
      if (hideMinimalItems) {
        return null;
      }
      return (
        <TranslatableG
          y={y}
          onMouseEnter={(event) => renderTooltip(event, feature, 0)}
          onMouseOut={onHideTooltip}
        >
          <rect
            x={startX}
            y={0}
            width={width}
            height={rowHeight}
            fill={color}
            opacity={0.2}
          />
        </TranslatableG>
      );
    }
    const bpPixel = (1 / segmentWidth) * width;
    if (bpPixel < DOT_BP_PIXEL_CUTOFF) {
      const mainBody =
        displayMode === FiberDisplayModes.AUTO ? (
          <rect
            x={startX}
            y={rowHeight}
            width={width}
            height={1}
            fill="gray"
            opacity={0.5}
          />
        ) : null;
      const intWidth = Math.round(width);
      const xMap = Array(intWidth).fill(null); // relative x from 0 to width, like in feature aggregator
      for (let x = 0; x < intWidth; x++) {
        xMap[x] = { on: 0, off: 0 };
      }
      feature.ons.forEach((rbs) => {
        const bs = Math.abs(rbs);
        if (bs >= relativeStart && bs < relativeEnd) {
          const x = Math.floor(((bs - relativeStart) / segmentWidth) * width);
          if (x < intWidth) {
            xMap[x].on += 1;
          }
        }
      });
      feature.offs.forEach((rbs) => {
        const bs = Math.abs(rbs);
        if (bs >= relativeStart && bs < relativeEnd) {
          const x = Math.floor(((bs - relativeStart) / segmentWidth) * width);
          if (x < intWidth) {
            xMap[x].off += 1;
          }
        }
      });
      const totals = xMap.map((x) => x.on + x.off);
      const maxValue = _.max(totals);
      const pcts = xMap.map((x, i) => x.on / totals[i]);
      const bars: Array<any> = [];
      const barWidth = Math.max(bpPixel, 1);
      const scale = scaleLinear()
        .domain([0, 1])
        .range([0, rowHeight])
        .clamp(true);
      const bgScale = scaleLinear()
        .range([0.2, 0.9])
        .domain([0, maxValue])
        .clamp(true);
      xMap.forEach((x, idx) => {
        if (x.on || x.off) {
          if (displayMode === FiberDisplayModes.AUTO) {
            bars.push(
              <rect
                key={idx + "bgbar"}
                x={startX + idx}
                y={0}
                height={rowHeight}
                width={barWidth + (pixelsPadding || 0)}
                fill="lightgray"
                opacity={bgScale(totals[idx])}
              />
            );
            const barHeight = scale(pcts[idx]);
            bars.push(
              <rect
                key={idx + "fgbar"}
                x={startX + idx}
                y={rowHeight - barHeight}
                height={barHeight}
                width={barWidth + (pixelsPadding || 0)}
                fill={color}
                opacity={0.7}
                onMouseEnter={(event) =>
                  renderTooltip(
                    event,
                    feature,
                    undefined,
                    "bar",
                    x.on,
                    pcts[idx],
                    totals[idx]
                  )
                }
                onMouseOut={onHideTooltip}
              />
            );
          } else {
            const fillColor = pcts[idx] >= 0.5 ? color : color2;
            bars.push(
              <rect
                key={idx + "fgrect"}
                x={startX + idx}
                y={0}
                height={rowHeight}
                width={barWidth + (pixelsPadding || 0)}
                fill={fillColor}
                opacity={1}
                onMouseEnter={(event) =>
                  renderTooltip(
                    event,
                    feature,
                    undefined,
                    "bar",
                    x.on,
                    pcts[idx],
                    totals[idx]
                  )
                }
                onMouseOut={onHideTooltip}
              />
            );
          }
        }
      });

      return (
        <TranslatableG y={y}>
          {mainBody}
          {bars}
        </TranslatableG>
      );
    } else {
      const mainBody = (
        <rect
          x={startX}
          y={rowHeight * 0.5}
          width={width}
          height={1}
          fill="gray"
          opacity={0.5}
        />
      );
      const arrows = feature.strand !== "." && (
        <AnnotationArrows
          startX={startX}
          endX={endX}
          y={rowHeight * 0.25}
          height={rowHeight * 0.5}
          opacity={0.75}
          isToRight={feature.strand !== "-"}
          color="grey"
          separation={100}
        />
      );
      const blocks: Array<any> = [];
      feature.ons.forEach((rbs, idx) => {
        const bs = Math.abs(rbs);
        if (bs >= relativeStart && bs < relativeEnd) {
          const fillColor = rbs > 0 ? color : color2;
          if (displayMode === FiberDisplayModes.AUTO) {
            const radius = Math.min(
              Math.max(bpPixel * 0.5, 2),
              rowHeight * 0.5
            );
            const blockStart =
              startX + ((bs - relativeStart + 0.5) / segmentWidth) * width;
            const cy = rbs > 0 ? 0.4 * rowHeight : 0.6 * rowHeight;
            blocks.push(
              <circle
                key={idx + "fg"}
                cx={blockStart}
                cy={cy}
                r={radius}
                fill={fillColor}
                stroke={fillColor}
                strokeWidth={2}
                opacity={0.7}
                onMouseEnter={(event) =>
                  renderTooltip(event, feature, bs, "norm")
                }
                onMouseOut={onHideTooltip}
              />
            );
          } else {
            const rwidth = Math.max(1, bpPixel);
            const x = startX + ((bs - relativeStart) / segmentWidth) * width;
            const y = rbs > 0 ? 0 : 0.5 * rowHeight;
            blocks.push(
              <rect
                key={idx + "fg"}
                x={x}
                y={y}
                height={rowHeight * 0.5}
                width={rwidth}
                fill={fillColor}
                strokeWidth={0}
                opacity={0.6}
                onMouseEnter={(event) =>
                  renderTooltip(event, feature, bs, "norm")
                }
                onMouseOut={onHideTooltip}
              />
            );
          }
        }
      });
      feature.offs.forEach((rbs, idx) => {
        const bs = Math.abs(rbs);
        if (bs >= relativeStart && bs < relativeEnd) {
          if (displayMode === FiberDisplayModes.AUTO) {
            const fillColor = rbs > 0 ? color : color2;
            const radius = Math.min(
              Math.max(bpPixel * 0.5, 2),
              rowHeight * 0.5
            );
            const blockStart =
              startX + ((bs - relativeStart + 0.5) / segmentWidth) * width;
            const cy = rbs > 0 ? 0.4 * rowHeight : 0.6 * rowHeight;
            blocks.push(
              <circle
                key={idx + "bg"}
                cx={blockStart}
                cy={cy}
                r={radius}
                fill={fillColor}
                stroke={fillColor}
                strokeWidth={2}
                fillOpacity={0}
                opacity={0.7}
                onMouseEnter={(event) =>
                  renderTooltip(event, feature, bs, "norm")
                }
                onMouseOut={onHideTooltip}
              />
            );
          } else {
            const rwidth = Math.max(1, bpPixel);
            const x = startX + ((bs - relativeStart) / segmentWidth) * width;
            const y = rbs > 0 ? 0 : 0.5 * rowHeight;
            blocks.push(
              <rect
                key={idx + "bg"}
                x={x}
                y={y}
                height={rowHeight * 0.5}
                width={rwidth}
                fill="lightgrey"
                strokeWidth={0}
                opacity={0.5}
                onMouseEnter={(event) =>
                  renderTooltip(event, feature, bs, "norm")
                }
                onMouseOut={onHideTooltip}
              />
            );
          }
        }
      });

      return (
        <TranslatableG y={y}>
          {mainBody}
          {arrows}
          {blocks}
        </TranslatableG>
      );
    }
  }
}

export default FiberAnnotation;
