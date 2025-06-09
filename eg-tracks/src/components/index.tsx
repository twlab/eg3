import { memo, useEffect, useState } from "react";
import { TrackModel } from "../models/TrackModel";
import { getGenomeConfig } from "../models/genomes/allGenomes";
import {
  ChromosomeInterval,
  DisplayedRegionModel,
  formatDataByType,
  getDisplayModeFunction,
  OpenInterval,
  trackOptionMap,
} from "../models";
import { GenomeCoordinate } from "@/types";
import NavigationContext from "@/models/NavigationContext";
import { fetchGenomicData } from "../getRemoteData/fetchDataFunction";
import { testCustomGenome } from "./testCustomGenome";
import { GenomeSerializer } from "../genome-hub";

interface DataSource {
  url: string;
  options?: { [key: string]: any };
}

interface GenomeVisualizationProps {
  genomeName?: string;
  type?: string;
  dataSources: DataSource[];
  viewRegion?: any;
  windowWidth?: number;
  customGenome?: string;
}

const DEFAULT_WINDOW_WIDTH = 1200;

const GenomeViewer: React.FC<GenomeVisualizationProps> = memo(
  function GenomeViewer({
    genomeName,
    type,
    dataSources,
    viewRegion,
    windowWidth,
  }) {
    const [drawData, setDrawData] = useState<any>(null);

    // Helper: Get genome config (custom or named)
    function getConfig() {
      if (testCustomGenome) {
        try {
          return GenomeSerializer.deserialize(testCustomGenome);
        } catch {
          return null;
        }
      }
      if (genomeName) {
        return getGenomeConfig(genomeName);
      }
      return null;
    }

    // Helper: Get region (from props or genome default)
    function getRegion(genomeConfig: any) {
      if (viewRegion) return viewRegion;
      if (genomeConfig?.defaultRegion) return genomeConfig.defaultRegion;
      return null;
    }

    // Helper: Get options (spread with default)
    function getOptions(type: string, userOptions?: any) {
      const defaults = trackOptionMap[type]?.defaultOptions || {};
      return userOptions
        ? { ...defaults, ...userOptions, packageVersion: true }
        : { ...defaults, packageVersion: true };
    }

    // Create draw data for fetch
    function createDrawData(
      genomeConfig: any,
      region: any,
      type: string,
      dataSources: DataSource[],
      width: number,
      genomeViewId: string
    ) {
      const navContext = genomeConfig.navContext as NavigationContext;
      const parsedRegion = genomeConfig.navContext.parse(
        region as GenomeCoordinate
      );
      const userViewRegion = new DisplayedRegionModel(
        navContext,
        ...parsedRegion
      );

      let trackModelArr: TrackModel[];
      if (customElements && genomeConfig.defaultTracks && !dataSources) {
        trackModelArr = genomeConfig.defaultTracks
          .map((track, idx) => {
            if (track.type && track.type === type) {
              track.id = `${genomeViewId}-${idx}`;
              track.options = getOptions(
                type,
                track.options ? track.options : {}
              );
              return track;
            }
            return undefined;
          })
          .filter(Boolean); // removes undefined entries
      } else {
        // Create TrackModel array for each data source
        trackModelArr = dataSources.map(
          (source, idx) =>
            new TrackModel({
              type,
              name: `track ${idx + 1}`,
              url: source.url,
              options: getOptions(type, source.options),
              id: `${genomeViewId}-${idx}`,
            })
        );
      }

      return {
        genomeConfig,
        userViewRegion,
        primaryGenName: genomeConfig.genome?.getName?.() || genomeName,
        basesByPixel: width / (parsedRegion.end - parsedRegion.start),
        genomicLoci: [ChromosomeInterval.parse(region)],
        trackModelArr,
        viewWindow: new OpenInterval(0, width),
        visData: {
          visWidth: width,
          visRegion: new DisplayedRegionModel(
            navContext,
            parsedRegion.start,
            parsedRegion.end
          ),
          viewWindow: new OpenInterval(0, width),
          viewWindowRegion: new DisplayedRegionModel(
            navContext,
            parsedRegion.start,
            parsedRegion.end
          ),
        },
      };
    }

    // Fetch data
    async function fetchDrawData(drawData: any, type: string, width: number) {
      const fetchResult = await fetchGenomicData([drawData]);
      const trackData = fetchResult[0].fetchResults.map((item) => {
        const trackState = {
          viewWindow: drawData.viewWindow,
          startWindow: 0,
          visRegion: drawData.visData.visRegion,
          visWidth: width,
        };
        return {
          genomeName: drawData.primaryGenName,
          genesArr: formatDataByType(item.result, type),
          trackState,
          windowWidth: width,
          configOptions: item.trackModel.options,
          basesByPixel: drawData.basesByPixel,
          trackModel: item.trackModel,
          getGenePadding: trackOptionMap[type]?.getGenePadding,
          ROW_HEIGHT: trackOptionMap[`${type}`].ROW_HEIGHT,
          genomeConfig: drawData.genomeConfig,
        };
      });

      return trackData;
    }

    // Make genome element
    function makeGenomeElement(trackDrawData: any) {
      return trackDrawData.map((item) => {
        const svgResult = getDisplayModeFunction(item);

        return (
          <div
            key={item.trackModel.id}
            style={{
              borderBottom: "1px solid #d3d3d3",
              width: (windowWidth || DEFAULT_WINDOW_WIDTH) + 120,
            }}
          >
            {svgResult}
          </div>
        );
      });
    }

    useEffect(() => {
      async function handle() {
        // 1. Get genome config
        const genomeConfig = getConfig();

        if (!genomeConfig) {
          setDrawData("Invalid genome");
          return;
        }

        // 2. Get region
        const region = getRegion(genomeConfig);
        if (!region) {
          setDrawData("Invalid region");
          return;
        }

        // 3. Check type and dataSources
        if (
          !dataSources ||
          !Array.isArray(dataSources) ||
          dataSources.length === 0
        ) {
          setDrawData("Invalid data source");
          return;
        }
        if (!type || !trackOptionMap[type]) {
          setDrawData("Invalid type");
          return;
        }

        if (dataSources.some((source) => !source.url)) {
          setDrawData("All dataSources must have a url");
          return;
        }

        // 4. Get window width
        const width = windowWidth || DEFAULT_WINDOW_WIDTH;

        // 5. Create draw data
        const drawDataObj = createDrawData(
          genomeConfig,
          region,
          type,
          dataSources,
          width,
          crypto.randomUUID()
        );

        // 6. Fetch and format data
        const trackDrawData = await fetchDrawData(drawDataObj, type, width);

        // 7. Make element
        const element = makeGenomeElement(trackDrawData);

        setDrawData(element);
      }
      handle();
    }, [genomeName, type, dataSources, viewRegion, windowWidth]);

    return !drawData ? (
      ""
    ) : typeof drawData === "string" ? (
      <div style={{ color: "red" }}>{drawData}</div>
    ) : (
      drawData
    );
  }
);

export default GenomeViewer;
