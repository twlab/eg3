import React, { useEffect, useState } from "react";
import _ from "lodash";

import { ClipLoader } from "react-spinners";
import {
  ViewExpansion,
  TrackModel,
  LinearDrawingModel,
  trackOptionMap,
  getDisplayModeFunction,
  OpenInterval,
} from "wuepgg3-track";

interface Highlight {
  start: number;
  end: number;
  display: boolean;
  color: string;
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
}
export const getHighlightedXs = (
  interval: OpenInterval,
  visData: ViewExpansion,
  legendWidth: number,
  tracks?: TrackModel[],
  trackData?: any
): OpenInterval => {
  const { viewWindowRegion, viewWindow } = visData;
  // console.log(trackData)
  const navBuilds = tracks
    ? tracks
        .map((k) => trackData[k.getId()].alignment)
        .filter((x) => x)
        .map((x) => x.navContextBuilder)
        .filter((x) => x)
    : []; //remove rough mode adjustment
  // console.log(navBuilds)
  let start, end;
  let newIntervalStart = interval.start,
    newIntervalEnd = interval.end;
  // navBuilds.forEach(build => {
  //     newIntervalStart = build.convertOldCoordinates(newIntervalStart);
  //     newIntervalEnd = build.convertOldCoordinates(newIntervalEnd);
  //     return; // only execute once - not working
  // })
  if (navBuilds.length) {
    newIntervalStart = navBuilds[0].convertOldCoordinates(newIntervalStart);
    newIntervalEnd = navBuilds[0].convertOldCoordinates(newIntervalEnd);
  }
  const drawModel = new LinearDrawingModel(
    viewWindowRegion,
    viewWindow.getLength()
  );
  const xRegion = drawModel.baseSpanToXSpan(
    new OpenInterval(newIntervalStart, newIntervalEnd)
  );
  start = Math.max(legendWidth, xRegion.start + legendWidth);
  end = xRegion.end + legendWidth;
  if (end <= start) {
    start = -1;
    end = 0;
  }
  return new OpenInterval(start, end);
};

const ScreenshotUI: React.FC<Props> = (props) => {
  const [display, setDisplay] = useState<string>("");
  const [buttonDisabled, setButtonDisabled] = useState<string>("");
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
        ?.querySelectorAll(".Track") ?? []
    );

    // Copy relevant properties from original elements
    const tracksData = tracks.map((track) => ({
      clientHeight: track.clientHeight,
      clone: track.cloneNode(true),
      biDirectional: [],
    }));

    const boxHeight = tracks.reduce(
      (acc, cur) => acc + cur.clientHeight,
      11 * tracks.length
    );
    const boxWidth = props.windowWidth + 120;
    const xmlns = "http://www.w3.org/2000/svg";
    const svgElem = document.createElementNS(xmlns, "svg");

    const width = props.windowWidth + 120;
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
      const legendWidth = 120 + 1;
      let trackHeight = clientHeight + 1;
      const trackLabelText =
        ele.children[0].children[0].querySelector(
          ".TrackLegend-label"
        ).textContent;
      const chrLabelText = ele.children[0].querySelector(
        ".TrackLegend-chrLabel"
      )
        ? ele.children[0].querySelector(".TrackLegend-chrLabel").textContent
        : null;
      const trackLegendAxisSvgs =
        ele.children[0].children[0].querySelectorAll("svg");
      const originalAxis =
        tracks[idx].children[0].children[0].querySelectorAll("svg");

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
        labelSvg.setAttributeNS(null, "width", `${legendWidth - 32}`);
        labelSvg.setAttributeNS(null, "height", `${trackHeight}`);

        const div = document.createElement("div");
        div.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        div.style.cssText = `width: ${
          legendWidth - 42
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
      if (trackLegendAxisSvgs.length > 0) {
        const x2 = legendWidth - originalAxis[0].clientWidth;
        trackLegendAxisSvgs.forEach((trackLegendAxisSvg, index: number) => {
          trackLegendAxisSvg.setAttribute("id", "legendAxis" + index + idx);
          trackLegendAxisSvg.setAttribute("x", x2 + "");
          trackLegendAxisSvg.setAttribute(
            "y",
            index * originalAxis[index].clientHeight + y + ""
          );
          svgElemg.appendChild(trackLegendAxisSvg);
        });
      }

      const options = (props.tracks[idx] || {}).options;
      const trackG = document.createElementNS(xmlns, "g");
      //y here will add space between tracks, it adds more for each track

      if (eleSvgs.length > 0) {
        x += legendWidth;
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
      clipX = legendWidth;
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

    const xS = highlights.map(
      (h) => new OpenInterval(h.start + 120, h.end + 120)
    );
    highlights.forEach((item, idx) => {
      const rect = document.createElementNS(xmlns, "rect");
      rect.setAttribute("x", xS[idx].start + "");
      rect.setAttribute("width", xS[idx].getLength() + "");
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
    const { tracks, trackData, highlights, viewWindow } = props;

    // document.documentElement.style.setProperty("--bg-color", "white");
    // document.documentElement.style.setProperty("--font-color", "#222");

    const trackSvgElements = tracks
      .filter(
        (track) =>
          !(
            track.type in
            { dynamic: "", dbedgraph: "", dynamichic: "", dynamiclongrange: "" }
          )
      )
      .map((trackModel, index) => {
        const id = trackModel.id;
        const createSVGData = trackData[`${id}`].fetchData;

        const newTrackState = { ...createSVGData.trackState };
        newTrackState["viewWindow"] = viewWindow;
        let svgResult = getDisplayModeFunction({
          genomeName: createSVGData.genomeName,
          genesArr: createSVGData.genesArr,
          trackState: newTrackState,
          windowWidth: createSVGData.windowWidth,
          configOptions: createSVGData.configOptions,
          basesByPixel: createSVGData.basesByPixel,
          trackModel,
          getGenePadding: trackOptionMap[`${trackModel.type}`].getGenePadding,
          ROW_HEIGHT: trackOptionMap[`${trackModel.type}`].ROW_HEIGHT,
          genomeConfig: createSVGData.genomeConfig,
        });

        return (
          <div
            className={"Track"}
            key={index}
            style={{
              borderBottom: "1px solid #d3d3d3",
              width: createSVGData.windowWidth + 120,
              position: "relative", // Position these elements absolutely
            }}
          >
            {svgResult}
            {highlights.length > 0
              ? highlights.map((item, index) => {
                  return (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        position: "absolute",
                        top: 0, // Adjust this accordingly to place above the track, e.g., '-10px'
                        left: item.start + 120,
                        width: item.end - item.start,
                        height: "100%",
                      }}
                    >
                      <div
                        key={index}
                        style={{
                          backgroundColor: item.color,
                          top: "0",
                          height: "100%",
                          width: item.end - item.start,
                          pointerEvents: "none", // This makes the highlighted area non-interactive
                        }}
                      ></div>
                    </div>
                  );
                })
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
      "Please wait for the following browser view to finish loading, then click the Download button below to download the browser view as an SVG file."
    );
  }
  useEffect(() => {
    if (props.trackData && Object.keys(props.trackData).length > 0) {
      setMsg(
        "Please wait for the following browser view to finish loading, then click the Download button below to download the browser view as an SVG file."
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
          <div style={{ display: "flex", gap: "1ch" }}>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginBottom: "2ch" }}
              onClick={downloadSvg}
            >
              ⬇ Download SVG
            </button>

            <button
              className="btn btn-primary btn-sm"
              style={{ marginBottom: "2ch" }}
              onClick={updateScreenshot}
            >
              📷 Retake Screenshot
            </button>
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
