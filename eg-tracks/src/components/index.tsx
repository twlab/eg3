import { memo, useEffect, useRef, useState } from "react";
import { TrackModel } from "../models/TrackModel";
import { getGenomeConfig } from "../models/genomes/allGenomes";
import {
  ChromosomeInterval,
  DisplayedRegionModel,
  formatDataByType,
  getDisplayModeFunction,
  interactionTracks,
  OpenInterval,
  trackOptionMap,
} from "../models";
import { GenomeCoordinate } from "../types";
import NavigationContext from "../models/NavigationContext";
import { fetchGenomicData } from "../getRemoteData/fetchFunctions";
import { HicSource } from "../getRemoteData/hicSource";
import { testCustomGenome } from "./testCustomGenome";
import { GenomeSerializer } from "../genome-hub";
import "./GenomeView/track.css";
import { geneClickToolTipMap } from "./GenomeView/TrackComponents/renderClickTooltipMap";
import ReactDOM from "react-dom";
import BamSource from "../getRemoteData/BamSource";
import { generateUUID } from "../util";
/**
 * Configuration for a single track in GenomeViewer.
 * @property {string} type - The type of the track (required).
 * @property {string} url - Data source URL for the track.
 * @property {string} name - Name of the track.
 * @property {object} options - Additional options for the track.
 */
export interface TracksProps {
  url?: string;
  name?: string;
  options?: { [key: string]: any };
  type: string;
  showOnHubLoad?: boolean;
  metadata?: { [key: string]: any };
}
/**
 * Props for the GenomeViewer component.
 * @property {string} genomeName - Name of the genome to display.
 * @property {TracksProps[]} tracks - Array of track configuration objects (datahub).
 * @property {string} viewRegion - Genomic region to display as a string.
 * @property {number} windowWidth - Width of the track.
 * @property {any} customGenome - Optional custom genome object.
 */
interface GenomeViewerProps {
  genomeName: string;
  tracks: TracksProps[];
  viewRegion?: string;
  windowWidth?: number;
  customGenome?: any;
}

const DEFAULT_WINDOW_WIDTH = 1200;
/**
 * GenomeViewer visualizes a section of a genome as a track
 */
const GenomeViewer: React.FC<GenomeViewerProps> = memo(function GenomeViewer({
  genomeName,
  tracks,
  viewRegion,
  windowWidth,
}) {
  const latestGenomeKey = useRef(genomeName);
  const [viewerElement, setViewerElement] = useState<any>(null);
  const [toolTip, setToolTip] = useState<any>(null);
  const [toolTipVisible, setToolTipVisible] = useState(false);
  const fetchInstances = useRef<{ [key: string]: any }>({});

  const block = useRef<HTMLInputElement>(null);
  function onClose() {
    setToolTip(null);
  }

  // MARK:Con/Reg/Opt
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

  function getRegion(genomeConfig: any) {
    if (viewRegion) return viewRegion;
    if (genomeConfig?.defaultRegion) return genomeConfig.defaultRegion;
    return null;
  }
  function validateInputs(region: any): string | null {
    if (!region) {
      return "Invalid region";
    }
    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return "Invalid data source";
    }

    return null;
  }
  function getOptions(type: string, userOptions?: any) {
    const defaults = trackOptionMap[type]?.defaultOptions || {};
    return userOptions
      ? {
          ...defaults,
          ...userOptions,
          packageVersion: true,
          trackManagerRef: interactionTracks.has(type) ? block : null,
        }
      : {
          ...defaults,
          packageVersion: true,
          trackManagerRef: interactionTracks.has(type) ? block : null,
        };
  }
  function getTrackModels(genomeConfig: any, genomeViewId: string) {
    let trackModelArr: TrackModel[] = [];
    if (customElements && genomeConfig.defaultTracks && !tracks) {
      trackModelArr = genomeConfig.defaultTracks
        .map((track, idx) => {
          if (track.type) {
            track.id = `${genomeViewId}-${idx}`;
            track.options = getOptions(
              track.type,
              track.options ? track.options : {}
            );
            return track;
          }
          return undefined;
        })
        .filter(Boolean); // removes undefined entries
    }
    // Create TrackModel array for each data source
    else
      trackModelArr = tracks.map(
        (track, idx) =>
          new TrackModel({
            type: track.type,
            name: track.name
              ? track.name
              : track.type === "ruler"
              ? "ruler"
              : `track ${idx + 1}`,
            url: track.url,
            options: getOptions(track.type, track.options),
            id: generateUUID(),
          })
      );

    trackModelArr.forEach((track) => {
      if (track.type === "hic") {
        if (!fetchInstances.current[`${track.id}`]) {
          fetchInstances.current[`${track.id}`] = new HicSource(track.url);
        }
      } else if (track.type === "dynamichic") {
        track.tracks?.map((_item: any, index: string | number) => {
          fetchInstances.current[`${track.id}` + "subtrack" + `${index}`] =
            new HicSource(track.tracks![index].url);
        });
      } else if (
        track.type in
        { matplot: "", dynamic: "", dynamicbed: "", dynamiclongrange: "" }
      ) {
        track.tracks?.map((trackModel: any, index: any) => {
          trackModel.id = `${track.id}` + "subtrack" + `${index}`;
        });
      } else if (track.type === "bam") {
        fetchInstances.current[`${track.id}`] = new BamSource(track.url);
      }
    });

    return trackModelArr;
  }
  // MARK: View/Track

  function createViewRegionData(
    genomeConfig: any,
    region: any,

    width: number,
    trackModels: TrackModel[]
  ) {
    const navContext = genomeConfig.navContext as NavigationContext;
    const parsedRegion = genomeConfig.navContext.parse(
      region as GenomeCoordinate
    );
    const userViewRegion = new DisplayedRegionModel(
      navContext,
      ...parsedRegion
    );

    return {
      genomeConfig,
      userViewRegion,
      primaryGenName: genomeConfig.genome?.getName?.() || genomeName,
      basesByPixel: width / (parsedRegion.end - parsedRegion.start),
      genomicLoci: [ChromosomeInterval.parse(region)],
      trackModelArr: trackModels,
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

  // MARK: Fetch/format
  async function fetchDrawData(
    viewRegionData: any,
    width: number,
    prevFetchResults?: any
  ) {
    if (!prevFetchResults) {
      const results = await fetchGenomicData([viewRegionData]);
      const fetchPromises: Array<Promise<void>> = [];
      results[0].fetchResults.forEach((track) => {
        if (track.trackModel.type === "hic") {
          fetchPromises.push(
            fetchInstances.current[`${track.trackModel.id}`]
              .getData(
                viewRegionData.visData.visRegion,
                viewRegionData.visData.visRegion.getWidth() / width
                  ? width
                  : DEFAULT_WINDOW_WIDTH,
                track.trackModel.options
              )
              .then((res: any) => {
                track.result = res;
              })
          );
        } else if (track.trackModel.type === "bam") {
          fetchPromises.push(
            fetchInstances.current[`${track.trackModel.id}`]
              .getData(viewRegionData.genomicLoci)
              .then((res: any) => {
                track.result = res;
              })
          );
        }
      });
      await Promise.all(fetchPromises);

      const trackData = results[0].fetchResults.map((item) => {
        const trackState = {
          viewWindow: viewRegionData.viewWindow,
          startWindow: 0,
          visRegion: viewRegionData.visData.visRegion,
          visWidth: width,
        };

        function renderTooltip(event, gene) {
          const genomeConfig = viewRegionData.genomeConfig;
          const currtooltip = geneClickToolTipMap[`${item.trackModel.type}`]({
            gene,
            feature: gene,
            snp: gene,
            vcf: gene,
            trackModel: item.trackModel,
            pageX: event.pageX,
            pageY: event.pageY,
            name: genomeConfig.genome._name,
            onClose: onClose,
            isThereG3dTrack: false,
            setShow3dGene: null,
            configOptions: item.trackModel.options,
          });
          setToolTipVisible(true);
          setToolTip(ReactDOM.createPortal(currtooltip, document.body));
        }

        function renderTooltipModbed(
          event,
          feature,
          bs,
          type,
          onCount = "",
          onPct = "",
          total = ""
        ) {
          let currtooltip;
          if (type === "norm") {
            currtooltip = geneClickToolTipMap["normModbed"]({
              bs,
              pageX: event.pageX,
              pageY: event.pageY,
              feature,
              onClose,
            });
          } else {
            currtooltip = geneClickToolTipMap["barModbed"]({
              feature,
              pageX: event.pageX,
              pageY: event.pageY,
              onCount,
              onPct,
              total,
              onClose,
            });
          }
          setToolTipVisible(true);
          setToolTip(currtooltip);
        }

        return {
          genomeName: viewRegionData.primaryGenName,
          genesArr: formatDataByType(item.result, item.trackModel.type),
          trackState,
          windowWidth: width,
          configOptions: item.trackModel.options,
          basesByPixel: viewRegionData.basesByPixel,
          trackModel: item.trackModel,
          getGenePadding:
            trackOptionMap[`${item.trackModel.type}`]?.getGenePadding,
          ROW_HEIGHT: trackOptionMap[`${`${item.trackModel.type}`}`].ROW_HEIGHT,
          genomeConfig: viewRegionData.genomeConfig,
          renderTooltip:
            item.trackModel.type === "modbed"
              ? renderTooltipModbed
              : renderTooltip,
        };
      });

      return trackData;
    } else {
      const trackData = prevFetchResults.map((item) => {
        const trackState = {
          viewWindow: viewRegionData.viewWindow,
          startWindow: 0,
          visRegion: viewRegionData.visData.visRegion,
          visWidth: width,
        };
        return {
          genomeName: viewRegionData.primaryGenName,
          genesArr: item.genesArr,
          trackState,
          windowWidth: width,
          configOptions: item.trackModel.options,
          basesByPixel: viewRegionData.basesByPixel,
          trackModel: item.trackModel,
          getGenePadding:
            trackOptionMap[`${item.trackModel.type}`]?.getGenePadding,
          ROW_HEIGHT: trackOptionMap[`${item.trackModel.type}`].ROW_HEIGHT,
          genomeConfig: viewRegionData.genomeConfig,
        };
      });
      return trackData;
    }
  }

  // MARK: CreateSvg
  function createGenomeViewElement(genomeDrawData: any) {
    return genomeDrawData.map((item) => {
      const svgResult = getDisplayModeFunction(item);

      return (
        <div
          key={item.trackModel.id}
          style={{
            borderBottom: "1px solid #d3d3d3",
            width: (windowWidth || DEFAULT_WINDOW_WIDTH) + 120,
          }}
        >
          {typeof svgResult === "object" &&
          Object.prototype.hasOwnProperty.call(svgResult, "numHidden")
            ? svgResult.component
            : svgResult}
        </div>
      );
    });
  }

  async function updateViewerElement({
    genomeConfig,
    region,
    width,
    genomeKey,
    prevGenomeDrawData,
  }) {
    const checkInput = validateInputs(region);
    if (checkInput) {
      setViewerElement(checkInput);
      return;
    }

    const trackModels = getTrackModels(genomeConfig, genomeKey);
    const viewRegionData = createViewRegionData(
      genomeConfig,
      region,
      width,
      trackModels
    );
    const genomeDrawData = await fetchDrawData(
      viewRegionData,
      width,
      prevGenomeDrawData
    );
    const element = createGenomeViewElement(genomeDrawData);

    setViewerElement({
      element,
      genomeDrawData,
      genomeConfig,
      genomeKey,
    });
  } // MARK: UseEffects
  useEffect(() => {
    async function handle() {
      latestGenomeKey.current = generateUUID();
      const genomeConfig = getConfig();
      if (!genomeConfig) {
        setViewerElement("Invalid genome");
        return;
      }
      const region = getRegion(genomeConfig);
      const width = windowWidth || DEFAULT_WINDOW_WIDTH;

      await updateViewerElement({
        genomeConfig,
        region,
        width,
        genomeKey: latestGenomeKey.current,
        prevGenomeDrawData: undefined,
      });
    }
    handle();
  }, [genomeName, customElements]);
  // MARK: NonInit UE
  useEffect(() => {
    if (viewerElement && latestGenomeKey.current === viewerElement.genomeKey) {
      async function handle() {
        const genomeConfig = viewerElement.genomeConfig;
        const region = getRegion(genomeConfig);
        const width = windowWidth || DEFAULT_WINDOW_WIDTH;

        await updateViewerElement({
          genomeConfig,
          region,
          width,
          genomeKey: viewerElement.genomeKey,
          prevGenomeDrawData: undefined,
        });
      }
      handle();
    }
  }, [viewRegion, tracks]);

  useEffect(() => {
    if (viewerElement && latestGenomeKey.current === viewerElement.genomeKey) {
      async function handle() {
        const genomeConfig = viewerElement.genomeConfig;
        const region = getRegion(genomeConfig);
        const width = windowWidth || DEFAULT_WINDOW_WIDTH;

        await updateViewerElement({
          genomeConfig,
          region,
          width,
          genomeKey: viewerElement.genomeKey,
          prevGenomeDrawData: viewerElement.genomeDrawData,
        });
      }
      handle();
    }
  }, [windowWidth]);

  // MARK: Render
  return (
    <div
      ref={block}
      style={{
        display: "flex",

        position: "relative",
      }}
    >
      {!viewerElement ? (
        ""
      ) : typeof viewerElement === "string" ? (
        <div style={{ color: "red" }}>{viewerElement}</div>
      ) : (
        <div>
          <div className={toolTipVisible ? "visible" : "hidden"}>{toolTip}</div>
          {viewerElement.element}
        </div>
      )}
    </div>
  );
});

export default GenomeViewer;
