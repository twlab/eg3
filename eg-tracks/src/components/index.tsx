import Gene from "../models/TrackModel";
import { memo, useEffect, useState } from "react";
import { TrackState } from "./GenomeView/TrackComponents/CommonTrackStateChangeFunctions.tsx/createNewTrackState";
import { TrackModel } from "../models/TrackModel";
import { GenomeConfig } from "../models/genomes/GenomeConfig";
import { getGenomeConfig } from "../models/genomes/allGenomes";
import {
  ChromosomeInterval,
  DisplayedRegionModel,
  formatDataByType,
  getDisplayModeFunction,
  OpenInterval,
  trackOptionMap,
  twoDataTypeTracks,
} from "../models";
import { GenomeCoordinate } from "@/types";
import NavigationContext from "@/models/NavigationContext";
import { fetchGenomicData } from "../getRemoteData/fetchDataFunction";
interface GenomeVisualizationProps {
  genomeName: string;
  type: string;
  url?: string;
  options?: { [key: string]: any }; // Adjust as needed
  viewRegion?: any;
  windowWidth?: number;
}

const GenomeViewer: React.FC<GenomeVisualizationProps> = memo(
  function GenomeViewer({
    genomeName,
    type,
    url = "",
    options,

    viewRegion = "chr7:27053397-27373765",
    windowWidth = 1200,
  }) {
    const [drawData, setDrawData] = useState<any>(null);
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
      async function handle() {
        if (!drawData) {
          const genomeConfig = getGenomeConfig(genomeName);
          if (genomeConfig && type) {
            const newDrawData: { [key: string]: any } = {};
            newDrawData["genomeConfig"] = genomeConfig;
            newDrawData["options"] = options
              ? {
                  ...trackOptionMap[type].defaultOptions,
                  ...options,
                  packageVersion: true,
                }
              : {
                  ...trackOptionMap[type].defaultOptions,
                  packageVersion: true,
                };
            const userViewRegion = genomeConfig.navContext.parse(
              viewRegion as GenomeCoordinate
            );

            const navContext = genomeConfig.navContext as NavigationContext;

            newDrawData["userViewRegion"] = new DisplayedRegionModel(
              navContext,
              ...userViewRegion
            );
            newDrawData["id"] = crypto.randomUUID();
            newDrawData["primaryGenName"] = genomeName;
            newDrawData["basesByPixel"] =
              windowWidth / (userViewRegion.end - userViewRegion.start);
            newDrawData["genomicLoci"] = [ChromosomeInterval.parse(viewRegion)];
            newDrawData["trackModelArr"] = [
              new TrackModel({
                type,
                name: "example bigwig",
                url,
                options: {
                  color: "blue",
                },
                id: newDrawData["id"],
              }),
            ];

            newDrawData["viewWindow"] = new OpenInterval(0, windowWidth);
            newDrawData["visData"] = {
              visWidth: windowWidth,
              visRegion: new DisplayedRegionModel(
                genomeConfig.navContext,
                userViewRegion.start,
                userViewRegion.end
              ),
              viewWindow: new OpenInterval(0, windowWidth),
              viewWindowRegion: new DisplayedRegionModel(
                genomeConfig.navContext,
                userViewRegion.start,
                userViewRegion.end
              ),
            };

            const fetchDrawData = await fetchGenomicData([newDrawData]);

            newDrawData["genesArr"] = formatDataByType(
              fetchDrawData[0].fetchResults[0].result,
              type
            );
            const newTrackState: { [key: string]: any } = {};
            newTrackState["viewWindow"] = new OpenInterval(0, windowWidth);
            newTrackState["startWindow"] = 0;
            newTrackState["visRegion"] = newDrawData.visData.visRegion;
            newTrackState["visWidth"] = windowWidth;
            newDrawData["trackState"] = newTrackState;

            const genomeElement = getDisplayModeFunction({
              genomeName: genomeName,
              genesArr: newDrawData.genesArr,
              trackState: newTrackState,
              windowWidth: windowWidth,
              configOptions: newDrawData.options,
              basesByPixel: newDrawData.basesByPixel,
              trackModel: newDrawData["trackModelArr"][0],
              getGenePadding: trackOptionMap[`${type}`].getGenePadding,
              ROW_HEIGHT: trackOptionMap[`${type}`].ROW_HEIGHT,
              genomeConfig: genomeConfig,
            });
            setDrawData(genomeElement);
          }
        }
      }
      handle();
    }, []);

    // useEffect(() => {
    //   if (drawData) {
    //   }
    // }, [genomeName]);

    // useEffect(() => {
    //   if (drawData) {
    //   }
    // }, [viewRegion]);
    return (
      <>
        {!drawData ? (
          ""
        ) : (
          <div
            style={{
              borderBottom: "1px solid #d3d3d3",
              width: windowWidth + 120,
            }}
          >
            {drawData}
          </div>
        )}
      </>
    );
  }
);

export default GenomeViewer;
