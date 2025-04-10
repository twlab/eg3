import React, { useEffect, useState } from "react";
import _ from "lodash";
import OpenInterval from "../../../models/OpenInterval";
import { getHighlightedXs } from "./HighlightRegion";
import TrackLegend from "../TrackComponents/commonComponents/TrackLegend";
import { objToInstanceAlign } from "../TrackManager";
import { trackOptionMap } from "../TrackComponents/defaultOptionsMap";
import { getDisplayModeFunction } from "../TrackComponents/displayModeComponentMap";
import { ClipLoader } from "react-spinners";
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
}

const ScreenshotUI: React.FC<Props> = (props) => {
  const [display, setDisplay] = useState<string>("block");
  const [buttonDisabled, setButtonDisabled] = useState<string>("");
  const [svgView, setSvgView] = useState<any>(null);
  const [msg, setMsg] = useState<string>("");

  const prepareSvg = () => {
    const { highlights, needClip, legendWidth, primaryView, darkTheme } = props;
    const tracks: any = Array.from(
      document
        .querySelector("#screenshotContainer")
        ?.querySelectorAll(".Track") ?? []
    );

    const boxHeight = tracks.reduce(
      (acc, cur) => acc + cur.clientHeight,
      tracks.length
    );
    const boxWidth = tracks[0].clientWidth;
    const xmlns = "http://www.w3.org/2000/svg";
    const svgElem = document.createElementNS(xmlns, "svg");
    svgElem.setAttributeNS(null, "width", props.windowWidth + 120 + "");
    svgElem.setAttributeNS(null, "height", boxHeight + "");
    svgElem.setAttributeNS(null, "font-family", "Arial, Helvetica, sans-serif");
    svgElem.style.display = "block";
    const defs = document.createElementNS(xmlns, "defs");
    const style = document.createElementNS(xmlns, "style");
    const bg = darkTheme ? "#222" : "white";
    const fg = darkTheme ? "white" : "#222";
    style.innerHTML = `:root { --bg-color: ${bg}; --font-color: ${fg}; } .svg-text-bg {
      fill: var(--font-color);
    }
    .svg-line-bg {
      stroke: var(--font-color);
    }`;
    defs.appendChild(style);
    svgElem.appendChild(defs);

    if (darkTheme) {
      const rect = document.createElementNS(xmlns, "rect");
      rect.setAttribute("id", "bgcover");
      rect.setAttribute("x", "0");
      rect.setAttribute("y", "0");
      rect.setAttribute("width", boxWidth + "");
      rect.setAttribute("height", boxHeight + "");
      rect.setAttribute("fill", "#222");
      svgElem.appendChild(rect);
    }

    const svgElemg = document.createElementNS(xmlns, "g");
    const svgElemg2 = document.createElementNS(xmlns, "g");
    const translateX = needClip ? -primaryView.viewWindow.start : 0;
    const clipDef = document.createElementNS(xmlns, "defs");
    const clipPath = document.createElementNS(xmlns, "clipPath");
    clipPath.setAttributeNS(null, "id", "cutoff-legend-space");
    let clipWidth, clipHeight, clipX;
    let x = 0,
      y = 5;

    tracks.forEach((ele, idx) => {
      const legendWidth = 120;
      const trackHeight = ele.children[1].clientHeight + 3;
      const yoffset = trackHeight > 20 ? 24 : 14;

      const trackLabelText = ele.children[0].textContent;

      if (trackLabelText) {
        const labelSvg = document.createElementNS(xmlns, "text");
        labelSvg.setAttributeNS(null, "x", x + 4 + "");
        labelSvg.setAttributeNS(null, "y", y + yoffset + "");
        labelSvg.setAttributeNS(null, "font-size", "12px");
        labelSvg.setAttribute("class", "svg-text-bg");
        labelSvg.textContent = trackLabelText;
        svgElemg.appendChild(labelSvg);
      }

      const trackLegendAxisSvgs = ele.children[0].querySelectorAll("svg");
      if (trackLegendAxisSvgs.length > 0) {
        const x2 = x + legendWidth - trackLegendAxisSvgs[0].clientWidth;
        trackLegendAxisSvgs.forEach((trackLegendAxisSvg, idx3) => {
          trackLegendAxisSvg.setAttribute("id", "legendAxis" + idx + idx3);
          trackLegendAxisSvg.setAttribute("x", x2 + "");
          trackLegendAxisSvg.setAttribute(
            "y",
            idx3 * trackLegendAxisSvg.clientHeight + y + ""
          );
          svgElemg.appendChild(trackLegendAxisSvg);
        });
      }

      const options = props.tracks[idx].options;
      const eleSvgs = ele.querySelectorAll("svg");
      const trackG = document.createElementNS(xmlns, "g");
      if (eleSvgs.length > 0) {
        x += legendWidth;
        let yoff = 0;
        eleSvgs.forEach((eleSvg, idx2) => {
          eleSvg.setAttribute("id", "svg" + idx + idx2);
          eleSvg.setAttribute("x", x + "");
          eleSvg.setAttribute("y", yoff + y + "");
          if (options && options.backgroundColor) {
            const rect = document.createElementNS(xmlns, "rect");
            rect.setAttribute("id", "backRect" + idx);
            rect.setAttribute("x", x + "");
            rect.setAttribute("y", yoff + y + "");
            rect.setAttribute("width", eleSvg.clientWidth + "");
            rect.setAttribute("height", eleSvg.clientHeight + "");
            rect.setAttribute("fill", options.backgroundColor);
            trackG.appendChild(rect);
          }
          yoff += eleSvg.clientHeight;
          trackG.appendChild(eleSvg);
        });
      }
      trackG.setAttributeNS(null, "transform", `translate(${translateX})`);
      svgElemg2.appendChild(trackG);
      y += trackHeight;
      const sepLine = document.createElementNS(xmlns, "line");
      sepLine.setAttribute("id", "line" + idx);
      sepLine.setAttribute("x1", "0");
      sepLine.setAttribute("y1", y + "");
      sepLine.setAttribute("x2", boxWidth + "");
      sepLine.setAttribute("y2", y + "");
      sepLine.setAttribute("stroke", "gray");
      svgElemg.appendChild(sepLine);
      x = 0;
      clipX = legendWidth - 1;
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

    const xS = highlights.map((h) =>
      getHighlightedXs(
        new OpenInterval(h.start, h.end),
        primaryView,
        legendWidth
      )
    );
    highlights.forEach((item, idx) => {
      if (item.display) {
        const rect = document.createElementNS(xmlns, "rect");
        rect.setAttribute("id", "highlightRect" + idx);
        rect.setAttribute("x", xS[idx].start + "");
        rect.setAttribute("y", "0");
        rect.setAttribute("width", xS[idx].getLength() + "");
        rect.setAttribute("height", boxHeight + "");
        rect.setAttribute("fill", item.color);
        svgElem.appendChild(rect);
      }
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
    document.body.appendChild(dl);
    dl.setAttribute("href", svgUrl);
    dl.setAttribute("download", new Date().toISOString() + "_eg.svg");
    dl.click();
    setDisplay("none");
    setButtonDisabled("disabled");
    const pdfContainer = document.getElementById("pdfContainer");
    if (pdfContainer) {
      pdfContainer.innerHTML = svgContent;
    }
  };

  const makeSvgTrackElements = async () => {
    const { tracks, trackData } = props;

    document.documentElement.style.setProperty("var(--bg-color)", "white");
    document.documentElement.style.setProperty("var(--font-color)", "#222");

    const trackSvgElements = await tracks
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
        let newTrackLegend;
        console.log(createSVGData);
        let svgResult = getDisplayModeFunction({
          genomeName: createSVGData.genomeName,
          genesArr: createSVGData.genesArr,
          trackState: createSVGData.trackState,
          windowWidth: createSVGData.windowWidth,
          configOptions: createSVGData.configOptions,
          trackModel,
          getGenePadding: trackOptionMap[`${trackModel.type}`].getGenePadding,
          ROW_HEIGHT: trackOptionMap[`${trackModel.type}`].ROW_HEIGHT,
        });

        if (
          createSVGData.configOptions.displayMode === "full" ||
          trackModel.type === "ruler"
        ) {
          newTrackLegend = (
            <TrackLegend
              height={createSVGData.configOptions.height}
              trackModel={trackModel}
              label={trackModel.options.label}
              trackViewRegion={objToInstanceAlign(
                createSVGData.trackState.visData.visRegion
              )}
              selectedRegion={objToInstanceAlign(
                createSVGData.trackState.visData.viewWindowRegion
              )}
            />
          );
        }
        setMsg("");
        return (
          <div key={index} style={{ display: "flex" }}>
            {newTrackLegend ? newTrackLegend : ""}
            {svgResult}
          </div>
        );
      });

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
        makeSvgTrackElements().then((elements) => {
          setSvgView(elements);
        });
      }, 250); // Adding a small delay to ensure the message is rendered
      return () => clearTimeout(timeoutId);
    }
  }, [msg, props.trackData]);

  return (
    <div style={{ display, backgroundColor: "var(--bg-color)" }}>
      {msg !== "" ? (
        <>
          <ClipLoader color="#09f" loading={true} size={24} />
          <p>{msg}</p>
        </>
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
          <div id="pdfContainer"></div>
        </>
      ) : (
        ""
      )}
    </div>
  );
};

export default ScreenshotUI;
