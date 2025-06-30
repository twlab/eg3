import React from "react";
import PropTypes from "prop-types";
import { Model, Actions } from "flexlayout-react"; // Import named exports
import OpenInterval from "../../../../models/OpenInterval";
import { MAX_NUMBER_THUMBNAILS } from "./OmeroTrackComponents";
import {
  ensureMaxListLength,
  niceCount,
  variableIsObject,
} from "../../../../models/util";
// import {
//   addTabSetToLayout,
//   tabIdExistInLayout,
// } from "../../../../models/layoutUtils";
import TrackModel from "../../../../models/TrackModel";
// import { withTooltip } from "../commonComponents/tooltip/withTooltip";
// import Tooltip from "../commonComponents/tooltip/Tooltip";

const apiConfig = {
  detailUrl: "https://idr.openmicroscopy.org/webclient/img_detail",
  imageUrl: "https://idr.openmicroscopy.org/webclient/render_image",
  imageUrlSuffix: "",
  thumbnailData: "https://idr.openmicroscopy.org/webclient/get_thumbnails",
  thumbnailUrl: "https://idr.openmicroscopy.org/webclient/render_thumbnail",
  thumbnailUrlSuffix: "",
};
interface ObjectAsTableProps {
  title?: string;
  content: any;
}

interface OmeroHtmlVisualizerProps {
  options?: any;
  data: { images: { imageId: string }[] }[];
  viewWindow: OpenInterval;
  trackModel: TrackModel;
  imageAspectRatio: number;
  layout?: any;
  layoutModel: any;
  thumbnailHeight: any;
  height: any;
  onSetImageInfo: any;
  onSetLayout?: (layout: any) => void;
  onShowTooltip?: (tooltip: React.ReactNode) => void;
  onHideTooltip?: () => void;
  isThereG3dTrack: boolean;
}

export function ObjectAsTable(props: ObjectAsTableProps) {
  const { title, content } = props;

  if (typeof content === "string") {
    return <div>{content}</div>;
  }

  const rows = Object.entries(content).map((values, idx) => {
    let tdContent;
    if (React.isValidElement(values[1])) {
      tdContent = values[1];
    } else if (variableIsObject(values[1])) {
      tdContent = <ObjectAsTable content={values[1]} />;
    } else {
      tdContent = Array.isArray(values[1]) ? values[1].join(" > ") : values[1];
    }
    return (
      <tr key={idx}>
        <td>{values[0]}</td>
        <td>{tdContent}</td>
      </tr>
    );
  });

  const tableTitle = title ? <h6>{title}</h6> : "";

  return (
    <React.Fragment>
      {tableTitle}
      <table className="table table-sm table-striped">
        <tbody>{rows}</tbody>
      </table>
    </React.Fragment>
  );
}

class OmeroHtmlVisualizer extends React.PureComponent<OmeroHtmlVisualizerProps> {
  static propTypes = {
    options: PropTypes.object,
    data: PropTypes.array.isRequired,
    viewWindow: PropTypes.instanceOf(OpenInterval),
    trackModel: PropTypes.instanceOf(TrackModel),
    imageAspectRatio: PropTypes.number,
  };

  newPanelWithImage = (
    imageId: string,
    imageUrl: string,
    imageUrlSuffix: string,
    detailUrl: string
  ) => {
    const tabsetId = "tabset" + imageId;
    if (tabIdExistInLayout(this.props.layout, imageId)) {
      // Image already rendered, highlight it by making the tabset active
      this.props.layoutModel.doAction(Actions.setActiveTabset(tabsetId));
      return;
    }

    const addLayout = {
      type: "tabset",
      id: tabsetId,
      children: [
        {
          type: "tab",
          name: "Image",
          component: "omero",
          id: imageId,
          config: {
            imageId,
            tabId: imageId,
            imageUrl,
            imageUrlSuffix,
            detailUrl,
          },
        },
      ],
    };

    const layout = addTabSetToLayout(addLayout, this.props.layout);
    this.props.onSetLayout!(layout);
  };

  renderTooltip = (
    event: React.MouseEvent,
    imgHash: Record<string, any>,
    imgId: string,
    imageUrl: string,
    imageUrlSuffix: string,
    detailUrl: string
  ) => {
    const dataTable = imgHash[imgId];
    const detailButton = dataTable.details.id ? (
      <a
        href={dataTable.details.id}
        role="button"
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-success btn-sm"
      >
        See details in 4DN data portal
      </a>
    ) : null;

    const tooltip = (
      //   <Tooltip
      //     pageX={event.pageX}
      //     pageY={event.pageY}
      //     onClose={this.props.onHideTooltip}
      //     hideArrow={true}
      //   >
      <>
        <div>
          <button
            type="button"
            className="btn btn-info btn-sm"
            onClick={() =>
              this.newPanelWithImage(imgId, imageUrl, imageUrlSuffix, detailUrl)
            }
          >
            View larger image
          </button>{" "}
          {detailButton}
        </div>
        <ObjectAsTable content={dataTable.details} />
      </>
      //   </Tooltip>
    );

    this.props.onShowTooltip!(tooltip);
  };

  render() {
    const {
      viewWindow,
      data,
      thumbnailHeight,
      height,
      trackModel,
      imageAspectRatio,
    } = this.props;

    const imageHash: Record<string, any> = {};
    data.forEach((d) => {
      d.images.forEach((img) => {
        imageHash[img.imageId] = img;
      });
    });

    const imageAllIds = Object.keys(imageHash);
    const imageIds = ensureMaxListLength(imageAllIds, MAX_NUMBER_THUMBNAILS);
    const imageHeight = `${thumbnailHeight}px`;
    const imageWidth = `${thumbnailHeight * imageAspectRatio}px`;
    const containerWidth = `${viewWindow.end - viewWindow.start}px`;
    const leftPadding = `${viewWindow.start}px`;
    const gtc = `repeat(auto-fill, minmax(${imageWidth}, 1fr))`;

    const {
      thumbnailUrl,
      thumbnailUrlSuffix,
      imageUrl,
      imageUrlSuffix,
      detailUrl,
    } = apiConfig;

    const imgs = imageIds.map((imageId) => {
      const url = `${thumbnailUrl}/${imageId}/${thumbnailUrlSuffix}`;
      return (
        <div
          key={imageId}
          style={{ width: imageWidth, height: imageHeight, padding: 0 }}
          onClick={(e) =>
            this.renderTooltip(
              e,
              imageHash,
              imageId,
              imageUrl,
              imageUrlSuffix,
              detailUrl
            )
          }
        >
          <img
            style={{ width: "100%", height: "auto" }}
            src={url}
            alt={imageId}
          />
        </div>
      );
    });

    return (
      <div
        style={{
          position: "relative",
          left: leftPadding,
          width: containerWidth,
          height,
          display: "grid",
          gap: "2px",
          gridTemplateColumns: gtc,
          justifyItems: "center",
          alignItems: "start",
          marginBottom: "2px",
        }}
      >
        {imgs}
      </div>
    );
  }
}

export default OmeroHtmlVisualizer;
