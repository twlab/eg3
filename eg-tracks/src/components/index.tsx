import Gene from "../models/TrackModel";
import { memo, useEffect, useState } from "react";
import { TrackState } from "./GenomeView/TrackComponents/CommonTrackStateChangeFunctions.tsx/createNewTrackState";
import { TrackModel } from "../models/TrackModel";
import { GenomeConfig } from "../models/genomes/GenomeConfig";
import { getGenomeConfig } from "../models/genomes/allGenomes";
import { DisplayedRegionModel, trackOptionMap } from "../models";
import { GenomeCoordinate } from "@/types";
import NavigationContext from "@/models/NavigationContext";
import { fetchGenomicData } from "@/getRemoteData/fetchDataFunction";
interface GenomeVisualizationProps {
  genomeName: string;
  type: string;
  options?: { [key: string]: any }; // Adjust as needed
  viewRegion?: any;
  windowWidth?: number;
}

const GenomeViewer: React.FC<GenomeVisualizationProps> = memo(
  function GenomeViewer({
    genomeName,
    options,
    type,
    viewRegion,
    windowWidth = 1200,
  }) {
    const [drawData, setDrawData] = useState<{ [key: string]: any } | null>(
      null
    );
    useEffect(() => {
      //         genomeName,
      // genesArr,
      // trackState,
      // windowWidth,
      // configOptions,
      // basesByPixel,
      // trackModel,
      // getGenePadding,
      // ROW_HEIGHT = 2,
      // genomeConfig,

      //   type: "bigwig",
      //   name: "example bigwig",
      //   url: "",
      //   options: {
      //     color: "blue",
      //   },
      // }

      // {
      //       primaryGenName: genomeConfig.genome.getName(),
      //    not need   initial: initial,
      //   not need    side: trackSide,
      //   not need    xDist: curDragX,
      //  not need     genomicFetchCoord: genomicFetchCoord,
      //       regionLoci: regionLoci,
      //       visData: newVisData,
      //  not nneed regionExpandLoci: regionExpandLoci,
      //       viewWindow: viewWindow,
      //    not need  initVisData: initial
      //         ? initExpandBpLoci.map((item, index) => {
      //             return {
      //               visRegion: new DisplayedRegionModel(
      //                 genomeConfig.navContext,
      //                 item.start,
      //                 item.end
      //               ),
      //               viewWindowRegion: new DisplayedRegionModel(
      //                 genomeConfig.navContext,
      //                 initBpLoci[index].start,
      //                 initBpLoci[index].end
      //               ),
      //               visWidth: trackWindowWidth * 3,

      //               viewWindow: curViewWindow,
      //             };
      //           })
      //         : "",
      //     };

      if (!drawData) {
        const genomeConfig = getGenomeConfig(genomeName);
        if (genomeConfig && type) {
          const newDrawData: { [key: string]: any } = {};
          newDrawData["genomeConfig"] = genomeConfig;
          newDrawData["options"] = options
            ? { ...trackOptionMap[type], ...options }
            : { ...trackOptionMap[type] };
          const userViewRegion = genomeConfig.navContext.parse(
            viewRegion as GenomeCoordinate
          );

          const navContext = genomeConfig.navContext as NavigationContext;

          newDrawData["userViewRegion"] = new DisplayedRegionModel(
            navContext,
            ...userViewRegion
          );
          newDrawData["basesByPixel"] =
            windowWidth / (userViewRegion.end - userViewRegion.start);
        }
      }
    }, []);

    useEffect(() => {
      if (drawData) {
      }
    }, [genomeName]);

    useEffect(() => {
      if (drawData) {
      }
    }, [viewRegion]);
    return (
      <div>
        {/* Component implementation using props */}
        <h1>{genomeName}</h1>
        {/* Render genesArr, trackState, and other properties as needed */}
      </div>
    );
  }
);

export default GenomeViewer;
