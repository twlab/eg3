import React, { useEffect, useState } from "react";
import _ from "lodash";
import { jsPDF } from "jspdf";
import "svg2pdf.js"; // augments jsPDF instances with the .svg() method
import Button from "../../../../ui/button/Button";
import {
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";

import { ClipLoader } from "react-spinners";
import {
  trackOptionMap,
  getDisplayModeFunction,
  LinearDrawingModel,
} from "wuepgg3-track";

interface Highlight {
  start: number;
  end: number;
  display: boolean;
  color: string;
  xPos: number;
  width: number;
}

interface Props {
  highlights: Highlight[];
  needClip: boolean;
  legendWidth: number;
  primaryView: any;
  darkTheme: boolean;
  tracks: any[];
  trackData: any;
  metadataTerms: any;
  viewRegion?: any;
  retakeScreenshot: any;
  windowWidth: number;
  viewWindow: any;
  selectedRegionSet?: boolean;
}
// export const getHighlightedXs = (
//   interval: OpenInterval,
//   visData: ViewExpansion,
//   legendWidth: number,
//   tracks?: TrackModel[],
//   trackData?: any
// ): OpenInterval => {
//   const { viewWindowRegion, viewWindow } = visData;
//   // console.log(trackData)
//   const navBuilds = tracks
//     ? tracks
//         .map((k) => trackData[k.getId()].alignment)
//         .filter((x) => x)
//         .map((x) => x.navContextBuilder)
//         .filter((x) => x)
//     : []; //remove rough mode adjustment
//   // console.log(navBuilds)
//   let start, end;
//   let newIntervalStart = interval.start,
//     newIntervalEnd = interval.end;
//   // navBuilds.forEach(build => {
//   //     newIntervalStart = build.convertOldCoordinates(newIntervalStart);
//   //     newIntervalEnd = build.convertOldCoordinates(newIntervalEnd);
//   //     return; // only execute once - not working
//   // })
//   if (navBuilds.length) {
//     newIntervalStart = navBuilds[0].convertOldCoordinates(newIntervalStart);
//     newIntervalEnd = navBuilds[0].convertOldCoordinates(newIntervalEnd);
//   }
//   const drawModel = new LinearDrawingModel(
//     viewWindowRegion,
//     viewWindow.getLength()
//   );
//   const xRegion = drawModel.baseSpanToXSpan(
//     new OpenInterval(newIntervalStart, newIntervalEnd)
//   );
//   start = Math.max(legendWidth, xRegion.start + legendWidth);
//   end = xRegion.end + legendWidth;
//   if (end <= start) {
//     start = -1;
//     end = 0;
//   }
//   return new OpenInterval(start, end);
// };

// Mirrors VerticalDivider.tsx: computes the x positions (in the track's own
// visRegion/viewWindowRegion pixel space) where a region-set track switches
// from one feature segment to the next, so the same divider lines shown in
// the live view can also be drawn into the screenshot preview and export.
function getRegionSetDividerXs(visData: any): number[] {
  if (!visData?.visRegion?.getFeatureSegments) {
    return [];
  }
  const { visRegion, viewWindowRegion, viewWindow } = visData;
  const drawModel = new LinearDrawingModel(
    viewWindowRegion,
    viewWindow.getLength(),
  );
  const xs: number[] = [];
  let x = 0;
  let featureSegments;
  try {
    featureSegments = visRegion.getFeatureSegments();
  } catch {
    return [];
  }
  for (const segment of featureSegments) {
    if (x > 0) {
      xs.push(x);
    }
    x += drawModel.basesToXWidth(segment.getLength());
  }
  return xs;
}

const ScreenshotUI: React.FC<Props> = (props) => {
  const [display, setDisplay] = useState<string>("");
  const [svgView, setSvgView] = useState<any>(null);
  const [msg, setMsg] = useState<string>("");
  // const svgDataURL = (svg: SVGElement) => {
  //   const svgAsXML = new XMLSerializer().serializeToString(svg);
  //   return "data:image/svg+xml," + encodeURIComponent(svgAsXML);
  // };

  const prepareSvg = () => {
    const {
      highlights,
      needClip,
      legendWidth,
      primaryView,
      darkTheme,
      viewWindow,
    } = props;

    const tracks = Array.from(
      document
        .querySelector("#screenshotContainer")
        ?.querySelectorAll(".Track") ?? [],
    );

    // Copy relevant properties from original elements
    const tracksData = tracks.map((track) => ({
      clientHeight: track.clientHeight,
      clone: track.cloneNode(true),
      biDirectional: [],
    }));

    const boxHeight = tracks.reduce(
      (acc, cur) => acc + cur.clientHeight,
      11 * tracks.length,
    );
    const boxWidth = props.windowWidth + props.legendWidth + 1;
    const xmlns = "http://www.w3.org/2000/svg";
    const svgElem = document.createElementNS(xmlns, "svg");

    const width = props.windowWidth + props.legendWidth + 1;
    svgElem.setAttributeNS(null, "width", width + "");
    svgElem.setAttributeNS(null, "height", boxHeight + "");
    svgElem.setAttributeNS(null, "font-family", "Arial, Helvetica, sans-serif");
    svgElem.style.display = "block";

    const defs = document.createElementNS(xmlns, "defs");
    const style = document.createElementNS(xmlns, "style");
    const bg = darkTheme ? "#222" : "white";
    const fg = darkTheme ? "white" : "#222";
    style.innerHTML = `:root { --bg-color: ${bg}; --font-color: ${fg}; } .svg-text-bg { fill: var(--font-color); } .svg-line-bg { stroke: var(--font-color); }`;
    defs.appendChild(style);
    svgElem.appendChild(defs);

    if (darkTheme) {
      const rect = document.createElementNS(xmlns, "rect");
      rect.setAttribute("x", "0");
      rect.setAttribute("y", "0");
      rect.setAttribute("width", boxWidth + "");
      rect.setAttribute("height", boxHeight + "");
      rect.setAttribute("fill", "#222");
      svgElem.appendChild(rect);
    }

    const svgElemg = document.createElementNS(xmlns, "g");
    const svgElemg2 = document.createElementNS(xmlns, "g");
    const translateX = needClip ? -viewWindow.start : 0;
    const clipDef = document.createElementNS(xmlns, "defs");
    const clipPath = document.createElementNS(xmlns, "clipPath");
    clipPath.setAttributeNS(null, "id", "cutoff-legend-space");

    let clipWidth, clipHeight, clipX;
    let x = 0,
      y = 5;

    tracksData.forEach(({ clientHeight, clone: ele }, idx) => {
      const currLegendWidth = props.legendWidth + 1;
      let trackHeight = clientHeight + 1;
      // Search the whole track clone (not just children[0].children[0]) since
      // some track types (e.g. matplot/dynamicbed with subtrack labels) wrap
      // the legend in an extra level of nesting. querySelector still finds it
      // anywhere in the subtree; fall back to "" if it's genuinely missing
      // (e.g. legend height was 0 for that render) instead of throwing.
      const trackLabelText =
        ele.querySelector(".TrackLegend-label")?.textContent ?? "";
      const chrLabelText = ele.children[0].querySelector(
        ".TrackLegend-chrLabel",
      )
        ? ele.children[0].querySelector(".TrackLegend-chrLabel").textContent
        : null;
      // Multi-label tracks (matplot/dynamic/dynamicbed) render a grid of
      // per-subtrack labels, each with its own color. Grab the live node so
      // those colors are preserved when cloned into the SVG below.
      const subLabelsNode = (ele as Element).querySelector(
        ".TrackLegend-subLabels",
      );
      const trackLegendAxisSvgs =
        ele.children[0]?.children[0]?.querySelectorAll("svg") ?? [];
      const originalAxis =
        tracks[idx].children[0]?.children[0]?.querySelectorAll("svg") ?? [];

      let eleSvgs: Array<any> = [];
      let originalSvgs: any = [];
      const children = ele.children[0].children;
      let svgCount = 0;

      for (let i = 0; i < children.length; i++) {
        if (children[i].tagName.toLowerCase() === "svg") {
          svgCount++;
        }
      }
      let biDirectHeight: Array<any> = [];
      // for normal tracks there children[0] has the form [div, svg]
      if (svgCount > 0) {
        eleSvgs = [ele.children[0].children[1]];
        originalSvgs = [tracks[idx].children[0].children[1]];
        biDirectHeight.push(trackHeight);
      }
      // for track with two svg like methylc, has the form [div, div], latter div has 2 svg [svg, svg]
      else {
        eleSvgs = ele.children[0].children[1].querySelectorAll("svg");
        originalSvgs =
          tracks[idx].children[0].children[1].querySelectorAll("svg");
      }

      const yoffset = 7;
      if (trackLabelText) {
        const labelSvg = document.createElementNS(xmlns, "foreignObject");
        labelSvg.setAttributeNS(null, "x", x);
        labelSvg.setAttributeNS(null, "y", y);
        labelSvg.setAttributeNS(null, "width", `${currLegendWidth - 32}`);
        labelSvg.setAttributeNS(null, "height", `${trackHeight}`);

        const div = document.createElement("div");
        div.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        div.style.cssText = `width: ${
          currLegendWidth - 42
        }px; font-size: 9px; white-space: normal; word-wrap: break-word; color: ${fg};`;
        div.textContent = trackLabelText;

        labelSvg.appendChild(div);
        svgElemg.appendChild(labelSvg);
      }
      if (chrLabelText) {
        const labelSvg = document.createElementNS(xmlns, "text");
        labelSvg.setAttributeNS(null, "x", x + 15 + "");
        labelSvg.setAttributeNS(null, "y", y + 35 + "");
        labelSvg.setAttributeNS(null, "font-size", "12px");
        const textNode = document.createTextNode(chrLabelText);
        labelSvg.setAttribute("class", "svg-text-bg");
        labelSvg.appendChild(textNode);
        svgElemg.appendChild(labelSvg);
      }
      if (subLabelsNode) {
        // Rebuild the per-subtrack labels as explicit stacked block divs.
        // (grid/flex layout isn't reliably honored in the SVG render path, so
        // a cloned grid ends up on a single line.) Each label keeps its own
        // color, read from the live node. Anchored to the bottom of the legend
        // to match the in-app layout (the grid uses align-items: end).
        const labelSvg = document.createElementNS(xmlns, "foreignObject");
        labelSvg.setAttributeNS(null, "x", x + "");
        labelSvg.setAttributeNS(null, "y", y + "");
        labelSvg.setAttributeNS(null, "width", `${currLegendWidth - 32}`);
        labelSvg.setAttributeNS(null, "height", `${trackHeight}`);

        const wrap = document.createElement("div");
        wrap.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        wrap.style.cssText = `display: flex; flex-direction: column; justify-content: flex-end; width: ${
          currLegendWidth - 42
        }px; height: ${trackHeight}px; font-size: 10px;`;

        Array.from(subLabelsNode.children).forEach((child) => {
          const text = child.textContent ?? "";
          if (!text) {
            return;
          }
          const color = (child as HTMLElement).style.color || fg;
          const line = document.createElement("div");
          line.style.cssText = `display: block; color: ${color}; white-space: normal; word-wrap: break-word;`;
          line.textContent = text;
          wrap.appendChild(line);
        });

        labelSvg.appendChild(wrap);
        svgElemg.appendChild(labelSvg);
      }
      if (trackLegendAxisSvgs.length > 0) {
        const x2 = currLegendWidth - originalAxis[0].clientWidth;
        trackLegendAxisSvgs.forEach((trackLegendAxisSvg, index: number) => {
          trackLegendAxisSvg.setAttribute("id", "legendAxis" + index + idx);
          trackLegendAxisSvg.setAttribute("x", x2 + "");
          trackLegendAxisSvg.setAttribute(
            "y",
            index * originalAxis[index].clientHeight + y + "",
          );
          svgElemg.appendChild(trackLegendAxisSvg);
        });
      }

      const options = (props.tracks[idx] || {}).options;
      const trackG = document.createElementNS(xmlns, "g");
      //y here will add space between tracks, it adds more for each track

      if (eleSvgs.length > 0) {
        x += currLegendWidth;
        let yoff = 0; // when bi-directional numerical track is not symmetric, need a tempory variable to hold y offset
        eleSvgs.forEach((eleSvg, idx2) => {
          eleSvg.setAttribute("id", "svg" + idx + idx2);
          eleSvg.setAttribute("x", x + "");
          eleSvg.setAttribute("y", yoff + y + "");
          if (options && options.backgroundColor) {
            const rect = document.createElementNS(xmlns, "rect");
            rect.setAttribute("id", "backRect" + idx);
            rect.setAttribute("x", x + "");
            rect.setAttribute("y", yoff + y + "");
            rect.setAttribute("width", originalSvgs[idx2] + "");
            rect.setAttribute("height", originalSvgs[idx2] + "");
            rect.setAttribute("fill", options.backgroundColor);
            trackG.appendChild(rect);
          }

          yoff += originalSvgs[idx2].clientHeight; // do this before appendChild
          trackG.appendChild(eleSvg);
        });

        if (props.selectedRegionSet) {
          const trackId = (props.tracks[idx] || {}).id;
          const visData =
            trackId !== undefined
              ? props.trackData[trackId]?.visData
              : undefined;
          getRegionSetDividerXs(visData).forEach((dividerX, dividerIdx) => {
            const dividerLine = document.createElementNS(xmlns, "line");
            dividerLine.setAttribute("id", `regionDivider${idx}-${dividerIdx}`);
            dividerLine.setAttribute("x1", x + dividerX + "");
            dividerLine.setAttribute("x2", x + dividerX + "");
            dividerLine.setAttribute("y1", y + "");
            dividerLine.setAttribute("y2", y + trackHeight + "");
            dividerLine.setAttribute("stroke", "gray");
            trackG.appendChild(dividerLine);
          });
        }
      }

      trackG.setAttributeNS(null, "transform", `translate(${translateX})`);
      svgElemg2.appendChild(trackG);

      y += trackHeight;
      const sepLine = document.createElementNS(xmlns, "line");
      sepLine.setAttribute("x1", "0");
      sepLine.setAttribute("y1", y + "");
      sepLine.setAttribute("x2", boxWidth + "");
      sepLine.setAttribute("y2", y + "");
      sepLine.setAttribute("stroke", "#9AA6B2");
      svgElemg.appendChild(sepLine);
      x = 0;
      clipX = currLegendWidth;
    });

    clipHeight = boxHeight;
    clipWidth = boxWidth - clipX;
    const clipRect = document.createElementNS(xmlns, "rect");
    clipRect.setAttribute("x", clipX + "");
    clipRect.setAttribute("y", "0");
    clipRect.setAttribute("width", clipWidth + "");
    clipRect.setAttribute("height", clipHeight + "");
    clipPath.appendChild(clipRect);
    clipDef.appendChild(clipPath);

    if (needClip) {
      svgElem.appendChild(clipDef);
      svgElemg2.setAttributeNS(null, "clip-path", "url(#cutoff-legend-space)");
    }

    svgElem.appendChild(svgElemg);
    svgElem.appendChild(svgElemg2);
    svgElem.setAttribute("xmlns", xmlns);

    highlights.forEach((item) => {
      const rect = document.createElementNS(xmlns, "rect");
      rect.setAttribute("x", legendWidth + item.xPos - props.xOffset + "");
      rect.setAttribute("width", item.width + "");
      rect.setAttribute("height", boxHeight + "");
      rect.setAttribute("fill", item.color);
      svgElem.appendChild(rect);
    });

    return new XMLSerializer().serializeToString(svgElem);
  };

  const downloadSvg = () => {
    const svgContent = prepareSvg();

    const preface = '<?xml version="1.0" standalone="no"?>\r\n';
    const svgBlob = new Blob([preface, svgContent], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    const dl = document.createElement("a");
    dl.setAttribute("href", svgUrl);
    dl.setAttribute("download", new Date().toISOString() + "_eg.svg");
    dl.click();
  };

  const downloadPdf = async () => {
    const svgContent = prepareSvg();

    const fg = props.darkTheme ? "white" : "#222";
    const bg = props.darkTheme ? "#222" : "white";

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");

    // svg2pdf does not resolve CSS custom properties: it reads the <style>
    // rule (e.g. `.svg-text-bg { fill: var(--font-color) }`) literally and its
    // color parser chokes on `var(...)`, leaving all legend/axis text and the
    // axis lines with no valid fill/stroke (invisible). Bake the variables down
    // to concrete colors so svg2pdf can parse them.
    svgDoc.querySelectorAll("style").forEach((styleEl) => {
      styleEl.textContent = (styleEl.textContent || "")
        .replace(/var\(--font-color\)/g, fg)
        .replace(/var\(--bg-color\)/g, bg);
    });

    const SVG_NS = "http://www.w3.org/2000/svg";

    // d3 formats negative ticks with the Unicode minus sign (U+2212), which is
    // not in jsPDF's standard font encoding, so axis labels like "-2.8" lose
    // the sign (and shift) in the PDF. Normalize to an ASCII hyphen-minus.
    svgDoc.querySelectorAll("text, tspan").forEach((el) => {
      if (el.children.length === 0 && el.textContent?.includes("\u2212")) {
        el.textContent = el.textContent.replace(/\u2212/g, "-");
      }
    });

    // Measure with the same font the labels render in, so we can wrap to width.
    const measureCtx = document.createElement("canvas").getContext("2d");
    if (measureCtx) measureCtx.font = "9px Arial, Helvetica, sans-serif";
    const measure = (s: string) =>
      measureCtx ? measureCtx.measureText(s).width : s.length * 5;

    const wrapLabel = (label: string, maxWidth: number): string[] => {
      const lines: string[] = [];
      let line = "";
      const commit = () => {
        if (line) lines.push(line);
        line = "";
      };
      for (const token of label.split(/(\s+)/)) {
        if (token === "") continue;
        if (/^\s+$/.test(token)) {
          if (measure(line + token) <= maxWidth) line += token;
          else commit();
          continue;
        }
        let word = token;
        while (word) {
          if (measure(line + word) <= maxWidth) {
            line += word;
            break;
          }
          if (!line) {
            // single word wider than the column: hard-break it
            let i = word.length;
            while (i > 1 && measure(word.slice(0, i)) > maxWidth) i--;
            lines.push(word.slice(0, i));
            word = word.slice(i);
          } else {
            commit();
          }
        }
      }
      commit();
      return lines.map((l) => l.trim());
    };

    // foreignObject containing HTML can't be rendered by svg2pdf (and taints
    // canvases). Replace each one with native SVG <text> lines, wrapping the
    // label to the legend column width instead of truncating with an ellipsis.
    // Color via inline style, which outranks the stylesheet rule in svg2pdf's
    // attribute resolution, so the label is guaranteed to be colored. Cap the
    // line count to the track height so the label can't overlap the next track.
    const LINE_HEIGHT = 10;
    svgDoc.querySelectorAll("foreignObject").forEach((fo) => {
      const x = parseFloat(fo.getAttribute("x") || "0");
      const y = parseFloat(fo.getAttribute("y") || "0");
      const height = parseFloat(fo.getAttribute("height") || "20");
      const width = parseFloat(fo.getAttribute("width") || "80");
      const label = fo.textContent?.trim() || "";

      const maxLines = Math.max(1, Math.floor((height - 2) / LINE_HEIGHT));
      let lines = wrapLabel(label, width - 4);
      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
        const last = lines[maxLines - 1];
        lines[maxLines - 1] = last.replace(/.$/, "") + "\u2026";
      }

      const g = svgDoc.createElementNS(SVG_NS, "g");
      lines.forEach((ln, i) => {
        const text = svgDoc.createElementNS(SVG_NS, "text");
        text.setAttribute("x", String(x + 2));
        text.setAttribute("y", String(y + 9 + i * LINE_HEIGHT));
        text.setAttribute("font-size", "9px");
        text.style.fill = fg;
        text.textContent = ln;
        g.appendChild(text);
      });
      fo.parentNode?.replaceChild(g, fo);
    });

    const tracks = Array.from(
      document
        .querySelector("#screenshotContainer")
        ?.querySelectorAll(".Track") ?? [],
    );
    const boxHeight = tracks.reduce(
      (acc, cur) => acc + cur.clientHeight,
      11 * tracks.length,
    );
    const boxWidth = props.windowWidth + props.legendWidth + 1;

    // svg2pdf renders the SVG into the PDF as native vector shapes and
    // selectable/editable text (instead of a flattened raster image). It reads
    // computed styles, so the SVG must be attached to the live DOM for its
    // <style> rules (.svg-text-bg, --font-color, etc.) to resolve.
    const svgEl = svgDoc.documentElement as unknown as SVGSVGElement;
    const holder = document.createElement("div");
    holder.style.cssText = "position:fixed;left:-99999px;top:0;";
    holder.appendChild(svgEl);
    document.body.appendChild(holder);

    try {
      const orientation = boxWidth > boxHeight ? "landscape" : "portrait";
      const pdf = new jsPDF({
        orientation,
        unit: "px",
        format: [boxWidth, boxHeight],
      });
      await pdf.svg(svgEl, {
        x: 0,
        y: 0,
        width: boxWidth,
        height: boxHeight,
      });
      pdf.save(new Date().toISOString() + "_eg.pdf");
    } catch (err) {
      console.error("Failed to generate editable PDF", err);
    } finally {
      document.body.removeChild(holder);
    }
  };
  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center", // Centers children horizontally
      paddingTop: "20px",
      height: "100vh", // Full height to center within the whole view height
    },
    message: {
      fontWeight: "bold",
      marginBottom: "10px", // Add some space between the message and the loader
    },
  };
  // const downloadPdf = () => {
  //   const svgContent = prepareSvg();
  //   const tracks = Array.from(
  //     document
  //       .querySelector("#screenshotContainer")
  //       ?.querySelectorAll(".Track") ?? []
  //   );
  //   const boxHeight = tracks.reduce(
  //     (acc, cur) => acc + cur.clientHeight,
  //     11 * tracks.length
  //   );
  //   const boxWidth = tracks[1].clientWidth;
  //   // create a new jsPDF instance
  //   // Create a new jsPDF instance
  //   const pdf = new jsPDF("landscape", "px", [boxWidth, boxHeight]);

  //   // Create a temporary PDF container
  //   const pdfContainer = document.createElement("div");
  //   document.body.appendChild(pdfContainer);
  //   pdfContainer.innerHTML = svgContent;

  //   // Use svg2pdf to render the SVG into the PDF instance
  //   svg2pdf(pdfContainer.querySelector("svg"), pdf, {
  //     xOffset: 0,
  //     yOffset: 0,
  //     scale: 1,
  //   });

  //   // get the data URI
  //   pdf.save(new Date().toISOString() + "_eg.pdf");
  //   setDisplay("none");
  //   setButtonDisabled("disabled");
  // };

  const makeSvgTrackElements = () => {
    const {
      tracks,
      trackData,
      highlights,
      viewWindow,
      legendWidth,
      windowWidth,
      xOffset,
      selectedRegionSet,
    } = props;

    // document.documentElement.style.setProperty("--bg-color", "white");
    // document.documentElement.style.setProperty("--font-color", "#222");
    console.log(props.legendWidth);
    const trackSvgElements = tracks
      .filter(
        (track) =>
          !(
            track.type in
            {
              dynamic: "",
              dbedgraph: "",
              dynamichic: "",
              dynamiclongrange: "",
              dynamicbed: "",
            }
          ),
      )
      .map((trackModel, index) => {
        const id = trackModel.id;
        const createSVGData = trackData[`${id}`];

        const newTrackState = { ...createSVGData.trackState };
        newTrackState.viewWindow = viewWindow;
        let svgResult = getDisplayModeFunction({
          genomeName: createSVGData.genomeName,
          genesArr: createSVGData.genesArr,
          trackState: newTrackState,
          windowWidth: createSVGData.windowWidth,
          configOptions: createSVGData.configOptions,
          basesByPixel: createSVGData.basesByPixel,
          trackModel: createSVGData.trackModel,
          getGenePadding: trackOptionMap[`${trackModel.type}`].getGenePadding,
          ROW_HEIGHT: trackOptionMap[`${trackModel.type}`].ROW_HEIGHT,
          genomeConfig: createSVGData.genomeConfig,
          groupScale: newTrackState.groupScale,
          xvaluesData: createSVGData.xvaluesData
            ? createSVGData.xvaluesData
            : null,
          isError: createSVGData.isError,
          legendWidth: props.legendWidth ? props.legendWidth : 120,
          placeFeature: createSVGData.placeFeature,
        });

        return (
          <div
            className={"Track"}
            key={index}
            style={{
              borderBottom: "1px solid #d3d3d3",

              position: "relative", // Position these elements absolutely
            }}
          >
            {typeof svgResult === "object" &&
            Object.prototype.hasOwnProperty.call(svgResult, "numHidden")
              ? svgResult.component
              : svgResult}
            {highlights.length > 0
              ? highlights.map((item, index) => {
                  return (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: legendWidth,
                        width: windowWidth,
                        height: "100%",
                        pointerEvents: "none",
                        zIndex: 5,
                      }}
                    >
                      <div
                        key={index}
                        style={{
                          position: "absolute",
                          backgroundColor: item.color,
                          top: 0,
                          height: "100%",
                          left: 0,
                          transform: `translateX(${item.xPos - xOffset}px)`,
                          width: item.width,
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                  );
                })
              : ""}
            {selectedRegionSet
              ? getRegionSetDividerXs(createSVGData.visData).map(
                  (x, dividerIdx) => (
                    <div
                      key={"divider" + dividerIdx}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: legendWidth + x,
                        height: "100%",
                        borderRight: "1px solid gray",
                        pointerEvents: "none",
                      }}
                    />
                  ),
                )
              : ""}
          </div>
        );
      });
    setMsg("");
    return trackSvgElements;
  };
  function updateScreenshot() {
    props.retakeScreenshot();
    setMsg(
      "Please wait for the following browser view to finish loading, then click the Download button below to download the browser view as an SVG file.",
    );
  }
  useEffect(() => {
    if (props.trackData && Object.keys(props.trackData).length > 0) {
      setMsg(
        "Please wait for the following browser view to finish loading, then click the Download button below to download the browser view as an SVG file.",
      );
    }
  }, [props.trackData]);

  useEffect(() => {
    if (
      props.trackData &&
      Object.keys(props.trackData).length > 0 &&
      msg !== ""
    ) {
      const timeoutId = setTimeout(() => {
        const elements = makeSvgTrackElements();
        setSvgView(elements);
      }, 250); // Adding a small delay to ensure the message is rendered
      return () => clearTimeout(timeoutId);
    }
  }, [msg, props.trackData]);

  return (
    <div style={{ display, backgroundColor: "var(--bg-color)" }}>
      {msg !== "" ? (
        <div style={styles.container}>
          <p style={styles.message}>{msg}</p>
          <ClipLoader color="#09f" loading={true} size={24} />
        </div>
      ) : (
        ""
      )}
      {svgView ? (
        <>
          <div className="font-italic">
            You can get the updated view of the tracks by retaking your
            screenshot.
          </div>
          <div style={{ display: "flex", gap: "1ch", marginBottom: "2ch" }}>
            <Button
              onClick={downloadSvg}
              backgroundColor="tint"
              leftIcon={<ArrowDownTrayIcon style={{ width: 15, height: 15 }} />}
              style={{
                width: "fit-content",
                padding: "4px 8px",
                fontSize: "14px",
              }}
            >
              Download SVG
            </Button>

            <Button
              onClick={downloadPdf}
              leftIcon={
                <DocumentArrowDownIcon style={{ width: 15, height: 15 }} />
              }
              style={{
                width: "fit-content",
                padding: "4px 8px",
                fontSize: "14px",
                backgroundColor: "#C0392B",
                color: "white",
              }}
            >
              Download PDF
            </Button>

            <Button
              onClick={updateScreenshot}
              outlined
              leftIcon={<CameraIcon style={{ width: 15, height: 15 }} />}
              style={{
                width: "fit-content",
                padding: "4px 8px",
                fontSize: "14px",
                backgroundColor: "white",
                color: "#374151",
              }}
            >
              Retake Screenshot
            </Button>
          </div>
          <div id="screenshotContainer">{svgView}</div>
          {/* <div id="pdfContainer"></div> */}
        </>
      ) : (
        ""
      )}
    </div>
  );
};

export default ScreenshotUI;
