import React, { useEffect, useState } from "react";
import _ from "lodash";
import ReactModal from "react-modal";
import withAutoDimensions from "./withAutoDimensions";
import HighlightRegion, { getHighlightedXs } from "./HighlightRegion";
import OpenInterval from "../../../models/OpenInterval";
import { GroupedTrackManager } from "./GroupedTrackManager";
import {
  displayModeComponentMap,
  getDisplayModeFunction,
} from "../TrackComponents/displayModeComponentMap";
import { trackOptionMap } from "../TrackComponents/defaultOptionsMap";
import TrackLegend from "../TrackComponents/commonComponents/TrackLegend";
import { objToInstanceAlign } from "../TrackManager";
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
  isOpen: any;
  handleCloseModal: any;
  windowWidth: number;
}

const ScreenshotUI: React.FC<Props> = (props) => {
  const [display, setDisplay] = useState<string>("block");
  const [buttonDisabled, setButtonDisabled] = useState<string>("");
  const [svgView, setSvgView] = useState<any>(<div></div>);
  // const svgDataURL = (svg: SVGElement) => {
  //   const svgAsXML = new XMLSerializer().serializeToString(svg);
  //   return "data:image/svg+xml," + encodeURIComponent(svgAsXML);
  // };

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
    svgElem.setAttributeNS(null, "viewBox", "0 0 " + boxWidth + " " + boxHeight);
    //add the width of the track and tracklegend to to correctly view all the svg
    const width = props.windowWidth + 20 + 120;
    svgElem.setAttributeNS(null, "width", width + "");
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
    const svgElemg = document.createElementNS(xmlns, "g"); // for labels, separate lines etc
    const svgElemg2 = document.createElementNS(xmlns, "g"); // for tracks contents
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
        const textNode = document.createTextNode(trackLabelText);
        labelSvg.setAttribute("class", "svg-text-bg");
        labelSvg.appendChild(textNode);
        svgElemg.appendChild(labelSvg);
      }

      const chrLabelText = ele.children[0].querySelector(
        ".TrackLegend-chrLabel"
      );

      // if (chrLabelText) {
      //   const labelSvg = document.createElementNS(xmlns, "text");
      //   labelSvg.setAttributeNS(null, "x", x + 15 + "");
      //   labelSvg.setAttributeNS(null, "y", y + 35 + "");
      //   labelSvg.setAttributeNS(null, "font-size", "12px");
      //   const textNode = document.createTextNode(chrLabelText);
      //   labelSvg.setAttribute("class", "svg-text-bg");
      //   labelSvg.appendChild(textNode);
      //   svgElemg.appendChild(labelSvg);
      // }
      const trackLegendAxisSvgs = ele.children[0].querySelectorAll("svg"); // methylC has 2 svgs in legend
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
      // deal with track contents
      const options = props.tracks[idx].options;
      const eleSvgs = ele.querySelectorAll("svg"); // bi-directional numerical track has 2 svgs!

      const trackG = document.createElementNS(xmlns, "g");
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
            rect.setAttribute("width", eleSvg.clientWidth + "");
            rect.setAttribute("height", eleSvg.clientHeight + "");
            rect.setAttribute("fill", options.backgroundColor);
            trackG.appendChild(rect);
          }
          yoff += eleSvg.clientHeight; // do this before appendChild
          trackG.appendChild(eleSvg);
        });
      }
      trackG.setAttributeNS(null, "transform", `translate(${translateX})`);
      svgElemg2.appendChild(trackG);
      // metadata ?
      y += trackHeight;
      // y += 1; //draw separare line
      const sepLine = document.createElementNS(xmlns, "line");
      sepLine.setAttribute("id", "line" + idx);
      sepLine.setAttribute("x1", "0");
      sepLine.setAttribute("y1", y + "");
      sepLine.setAttribute("x2", boxWidth + "");
      sepLine.setAttribute("y2", y + "");
      sepLine.setAttribute("stroke", "gray");
      svgElemg.appendChild(sepLine);
      // y += 1;
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
    // highlights
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
    document.body.appendChild(dl); // This line makes it work in Firefox.
    //dl.setAttribute("href", this.svgDataURL(svgElem)); //chrome network error on svg > 1MB
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
    const { tracks, trackData } = props;

    document.documentElement.style.setProperty("--bg-color", "white");
    document.documentElement.style.setProperty("--font-color", "#222");

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
        let svgResult = getDisplayModeFunction({
          genomeName: createSVGData.genomeName,
          genesArr: createSVGData.genesArr,
          trackState: createSVGData.trackState,
          windowWidth: createSVGData.windowWidth + 120,
          configOptions: createSVGData.configOptions,

          trackModel,
          getGenePadding: trackOptionMap[`${trackModel.type}`].getGenePadding,
          ROW_HEIGHT: trackOptionMap[`${trackModel.type}`].ROW_HEIGHT,
        });

        return svgResult

          ;
      });

    return trackSvgElements;
  };

  useEffect(() => {
    if (props.trackData && Object.keys(props.trackData).length > 0) {
      setSvgView(makeSvgTrackElements());
    }
  }, [props.trackData]);

  return (
    <>
      {" "}
      <ReactModal
        isOpen={props.isOpen}
        contentLabel="Gene & Region search"
        ariaHideApp={false}
        onRequestClose={props.handleCloseModal}
        shouldCloseOnOverlayClick={true}
      >
        <span
          className="text-right"
          style={{
            cursor: "pointer",
            color: "red",
            fontSize: "2em",
            position: "absolute",
            top: "-5px",
            right: "15px",
            zIndex: 5,
          }}
          onClick={props.handleCloseModal}
        >
          ×
        </span>
        <div>
          <p>
            Please wait for the following browser view to finish loading, <br />
            then click the Download button below to download the browser view as
            an SVG file.
          </p>
          <div className="font-italic">
            <strong>Download SVG</strong> is recommended.
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ marginBottom: "2ch" }}
            onClick={downloadSvg}
          // disabled={buttonDisabled === "disabled"}
          >
            ⬇ Download SVG
          </button>{" "}
          {/* <button
            className="btn btn-success btn-sm"
            style={{ marginBottom: "2ch" }}
            onClick={downloadPdf}
            // disabled={buttonDisabled === "disabled"}
          >
            ⬇ Download PDF
          </button> */}
          <div
            id="screenshotContainer"
            style={{ width: props.windowWidth + 20 + 120 }}
          >
            {svgView}
          </div>
          <div id="pdfContainer"></div>
        </div>{" "}
      </ReactModal>
    </>
  );
};

export default ScreenshotUI;
