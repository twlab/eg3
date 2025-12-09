import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import OpenInterval from "../../../../models/OpenInterval";

import { ensureMaxListLength } from "../../../../models/util";
import TrackModel from "../../../../models/TrackModel";
export const MAX_NUMBER_THUMBNAILS = 384; // image number of 1 run in idr web UI

export const THUMBNAIL_PADDING = 2;
export const CORS_PROXY = "https://epigenome.wustl.edu/cors";
interface ImageProperties {
  viewWindow: any;
  width: number;
  height: number;
  thumbnailHeight: number;
  imageAspectRatio: number;

  data: any; // You can replace 'any' with a more specific type if you know the structure of 'data'
  trackModel: any; // Similarly, replace 'any' with a more specific type if you know the structure of 'trackmodel'
}
interface ComponentState {
  imageData: any[]; // Assuming imageData is an array, you can replace 'any' with a more specific type if needed
  isLoading: boolean;
}

export class OmeroSvgVisualizer extends React.PureComponent<
  ImageProperties,
  ComponentState
> {
  static propTypes = {
    options: PropTypes.object,
    data: PropTypes.array.isRequired,
    viewWindow: PropTypes.instanceOf(OpenInterval),
    width: PropTypes.number,
    trackModel: PropTypes.instanceOf(TrackModel),
    imageAspectRatio: PropTypes.number,
  };

  constructor(props) {
    super(props);
    this.state = {
      imageData: [],
      isLoading: false,
    };
  }

  async componentDidMount() {
    await this.fetchAllImage();
  }

  async componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.data !== this.props.data) {
      await this.fetchAllImage();
    }
  }

  fetchAllImage = async () => {
    const { data } = this.props;
    const imageAllIds = _.flatten(
      data.map((d) => d.images.map((img) => img.imageId))
    );
    const imageIds = ensureMaxListLength(imageAllIds, MAX_NUMBER_THUMBNAILS);
    const promises = imageIds.map((id) => this.fetchImageData(id));
    const imageData = await Promise.all(promises);
    this.setState({ imageData });
  };

  fetchImageData = async (imgId) => {
    try {
      const { thumbnailData, thumbnailUrl, thumbnailUrlSuffix } =
        this.props.trackModel.apiConfig;
      if (thumbnailData) {
        const url = `${thumbnailData}/?id=${imgId}`;
        const req = await fetch(url);
        return req.data[imgId];
      } else {
        //if data api not working, or doesn't allow cors, fetch image as array buffer instead with cors proxy
        const url = `${CORS_PROXY}/${thumbnailUrl}/${imgId}/${thumbnailUrlSuffix}`;
        // const imgData = this.imageToDataURL(url, function (dataUrl) {
        //     return dataUrl;
        // });
        // return imgData;
        // return url;
        this.setState({ isLoading: true });
        const imgData = await this.getBase64(url);
        this.setState({ isLoading: false });
        return imgData;
      }
    } catch (error) {
      console.error(error);
    }
  };

  // canvas approach
  // imageToDataURL = (src, callback, outputFormat) => {
  //     const { thumbnailHeight, imageAspectRatio } = this.props;
  //     const imageWidth = thumbnailHeight * imageAspectRatio;
  //     const img = new Image();
  //     img.crossOrigin = "Anonymous";
  //     img.onload = function () {
  //         const canvas = document.createElement("CANVAS");
  //         const ctx = canvas.getContext("2d");
  //         canvas.height = thumbnailHeight;
  //         canvas.width = imageWidth;
  //         ctx.drawImage(this, 0, 0);
  //         const dataURL = canvas.toDataURL(outputFormat);
  //         callback(dataURL);
  //     };
  //     img.src = src;
  //     if (img.complete || img.complete === undefined) {
  //         img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
  //         img.src = src;
  //     }
  // };

  // get from https://github.com/axios/axios/issues/513#issuecomment-347919776
  // this not work either if CORS is disabled
  getBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type");
      if (!contentType) {
        throw new Error("Content-Type header is missing");
      }
      const base64String = `data:${contentType};base64,${Buffer.from(
        arrayBuffer
      ).toString("base64")}`;
      return base64String;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  };

  render() {
    const { viewWindow, width, height, thumbnailHeight, imageAspectRatio } =
      this.props;
    const { imageData, isLoading } = this.state;
    const imageWidth = thumbnailHeight * imageAspectRatio;
    let x = 0,
      y = THUMBNAIL_PADDING,
      rowImgCount = 0;
    const imgs = imageData.map((img, idx) => {
      x =
        viewWindow.start +
        (idx - rowImgCount) * (THUMBNAIL_PADDING + imageWidth);
      if (x + imageWidth > viewWindow.end) {
        x = viewWindow.start;
        y += THUMBNAIL_PADDING + thumbnailHeight;
        rowImgCount = idx;
      }
      return (
        <image
          key={idx}
          xlinkHref={img}
          x={x}
          y={y}
          height={thumbnailHeight}
          width={imageWidth}
        />
      );
    });
    if (isLoading) {
      return <p>Loading...</p>;
    } else {
      return (
        <svg
          width={width}
          height={height}
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
        >
          {imgs}
        </svg>
      );
    }
  }
}
