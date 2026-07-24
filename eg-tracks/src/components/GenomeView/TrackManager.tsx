import {
  createRef,
  memo,
  // startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import OpenInterval from "../../models/OpenInterval";
import { FeatureSegment } from "../../models/FeatureSegment";
import ChromosomeInterval from "../../models/ChromosomeInterval";
import Feature from "../../models/Feature";
import NavigationContext from "../../models/NavigationContext";
import { trackOptionMap } from "./TrackComponents/defaultOptionsMap";
import TrackModel from "../../models/TrackModel";
import _, { throttle } from "lodash";
import ConfigMenuComponent from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";
// import HighlightMenu from "./ToolComponents/HighlightMenu";
import TrackFactory from "./TrackComponents/TrackFactory";
import { SelectableGenomeArea } from "./genomeNavigator/SelectableGenomeArea";
import React from "react";
import { getTrackConfig } from "../../trackConfigs/config-menu-models.tsx/getTrackConfig";
import { trackUsingExpandedLoci } from "./TrackComponents/CommonTrackStateChangeFunctions.tsx/cacheFetchedData";
import { trackGlobalState } from "./TrackComponents/CommonTrackStateChangeFunctions.tsx/trackGlobalState";
import { GenomeConfig } from "../../models/genomes/GenomeConfig";
import { niceBpCount } from "../../models/util";
import { GenomeCoordinate, ITrackModel, Tool } from "../../types";
import {
  GroupedTrackManager,
  numericalTracks,
  numericalTracksGroup,
} from "./TrackComponents/GroupedTrackManager";
import GenomeNavigator from "./genomeNavigator/GenomeNavigator";

import { SortableList } from "./TrackComponents/commonComponents/chr-order/SortableTrack";
import { interactionTracks } from "./TrackComponents/displayModeComponentMap";
import MetadataHeader from "./ToolComponents/MetadataHeader";
// import { fetchGenomicData } from "../../getRemoteData/fetchData";
// import { fetchGenomeAlignData } from "../../getRemoteData/fetchGenomeAlign";
import { arraysHaveSameTrackModels } from "../../util";
import { generateUUID } from "../../util";

import OutsideClickDetector from "./TrackComponents/commonComponents/OutsideClickDetector";
import { motion } from "framer-motion";
import MetadataSelectionMenu from "./ToolComponents/MetadataSelectionMenu";
import { ChevronRightIcon } from "@primer/octicons-react";
import EscapeHandlerContext from "../../lib/EscapeHandlerContext";
import { fetchGenomicData } from "../../getRemoteData/fetchFunctions";
import { LinearDrawingModel } from "../../models";

/**
 * Filters trackModels of type "genomealign" from the first array where their IDs
 * don't exist in the second array
 * @param {TrackModel[]} trackModelsArray1 - First array of trackModels to filter from
 * @param {TrackModel[]} trackModelsArray2 - Second array of trackModels to check IDs against
 * @returns {TrackModel[]} Array of trackModels with type "genomealign" whose IDs are not in the second array
 */

export const convertTrackModelToITrackModel = (
  track: TrackModel,
): ITrackModel => ({
  name: track.name,
  type: track.type,
  filetype: track.filetype,
  options: track.options,
  url: track.url,
  indexUrl: track.indexUrl,
  metadata: track.metadata,
  queryEndpoint: track.queryEndpoint,
  querygenome: track.querygenome,
  id: track.id,
  isSelected: track.isSelected,
  tracks: track.tracks,
});
const groupManager = new GroupedTrackManager();

export const zoomFactors: { [key: string]: { [key: string]: any } } = {
  [Tool.ZoomOutOneThirdFold]: {
    factor: 4 / 3,
    text: "⅓×",
    title: "Zoom out 1/3-fold",
  },
  [Tool.ZoomOutOneFold]: {
    factor: 2,
    text: "1×",
    title: "Zoom out 1-fold (Alt+O)",
  },
  [Tool.ZoomOutFiveFold]: { factor: 5, text: "5×", title: "Zoom out 5-fold" },
  [Tool.ZoomInOneThirdFold]: {
    factor: 2 / 3,
    text: "⅓×",
    title: "Zoom in 1/3-fold",
  },
  [Tool.ZoomInOneFold]: {
    factor: 0.5,
    text: "1×",
    title: "Zoom in 1-fold (Alt+I)",
  },
  [Tool.ZoomInFiveFold]: { factor: 0.2, text: "5×", title: "Zoom in 5-fold" },
};

function sumArray(numbers: Array<any>) {
  let total = 0;
  for (let i = 0; i < numbers.length; i++) {
    total += numbers[i];
  }
  return total;
}
const MIN_VIEW_REGION_SIZE = 5;

export function objToInstanceAlign(alignment: { [key: string]: any }) {
  if (!alignment) {
    return;
  }
  let visRegionFeatures: Feature[] = [];

  for (let feature of alignment._navContext._features) {
    let newChr = new ChromosomeInterval(
      feature.locus.chr,
      feature.locus.start,
      feature.locus.end,
    );
    visRegionFeatures.push(
      new Feature(feature.name, newChr, feature.strand, feature.value),
    );
  }

  let visRegionNavContext = new NavigationContext(
    alignment._navContext._name,
    visRegionFeatures,
  );

  let visRegion = new DisplayedRegionModel(
    visRegionNavContext,
    alignment._startBase,
    alignment._endBase,
  );
  return visRegion;
}

export function bpNavToGenNav(bpNaletr: Array<any>, genome: GenomeConfig) {
  let genRes: Array<any> = [];
  for (let bpNav of bpNaletr) {
    let genomeFeatureSegment: Array<FeatureSegment> =
      genome.navContext.getFeaturesInInterval(
        "start" in bpNav ? bpNav.start : bpNav._startBase,
        "end" in bpNav ? bpNav.end : bpNav._endBase,
      );

    genRes.push(genomeFeatureSegment.map((item, _index) => item.getLocus()));
  }

  return genRes;
}
const reCalcAgg = new Set([
  "aggregateMethod",
  "smooth",
  "hiddenPixels",
  "displayMode",
  "height",
  "rowHeight",
  "maxRows",
  "hideMinimalItems",
  "sortItems",
  "smooth",
]);
interface TrackManagerProps {
  windowWidth: number;
  legendWidth: number;
  userViewRegion?: any;
  genomeConfig: any;
  highlights: Array<any>;
  tracks: Array<TrackModel>;
  onNewRegion: (startbase: number, endbase: number) => void;
  onNewHighlight: (highlightState: Array<any>) => void;
  onTracksChange: (trackSelected: TrackModel[]) => void;
  onNewRegionSelect: (
    startbase: number,
    endbase: number,
    highlightSearch: boolean,
  ) => void;
  tool: any;
  Toolbar: { [key: string]: any };
  viewRegion?: any;
  showGenomeNav?: boolean;
  showToolBar?: boolean;
  setScreenshotData: any;
  isScreenShotOpen: boolean;
  selectedRegionSet: any;
  setShow3dGene: any;
  infiniteScrollWorkers: React.MutableRefObject<{
    worker: {
      fetchWorker: Worker;
      hasOnMessage: boolean;
      processingCount: number;
    }[];
  } | null>;
  fetchGenomeAlignWorker: React.MutableRefObject<{
    fetchWorker: Worker;
    hasOnMessage: boolean;
  } | null>;
  isThereG3dTrack: boolean;
  currentState?: any;
  darkTheme: boolean;
}
const TrackManager: React.FC<TrackManagerProps> = memo(function TrackManager({
  windowWidth,
  legendWidth,
  genomeConfig,
  userViewRegion,
  highlights,
  tracks,
  viewRegion,
  onNewRegion,
  onNewHighlight,
  onTracksChange,
  onNewRegionSelect,
  tool,
  Toolbar,
  showGenomeNav,
  showToolBar,
  isThereG3dTrack,
  setScreenshotData,
  selectedRegionSet,
  isScreenShotOpen,
  setShow3dGene,
  infiniteScrollWorkers,
  fetchGenomeAlignWorker,
  currentState,
  darkTheme,
}) {
  const escapeRef = useContext(EscapeHandlerContext);
  //useRef to store data between states without re render the component
  const completedFetchedRegion = useRef<{ [key: string]: any }>({
    key: -0,
    done: {},
    groups: {},
    selected: {},
  });

  const initialLoad = useRef(true);
  const curGenomeConfig = useRef<any>(null);
  const useFineModeNav = useRef(false);
  const lastSelectedTool = useRef<string | null>("Drag");
  const dragOn = useRef(true);
  const prevWindowWidth = useRef<number>(0);
  const windowWidthRef = useRef<number>(windowWidth);
  windowWidthRef.current = windowWidth;
  const trackManagerId = useRef("");
  const leftStartCoord = useRef(0);
  const rightStartCoord = useRef(0);
  const bpRegionSize = useRef(0);
  const pixelPerBase = useRef(0);
  const block = useRef<HTMLInputElement>(null);
  const bpX = useRef(0);
  const maxBp = useRef(0);
  const minBp = useRef(0);
  const selectedTracks = useRef<{ [key: string]: any }>({});
  // Tracks the metadata term/value whose tracks are currently highlighted via
  // the MetadataHeader, so clicking the same value again toggles the highlight off.
  const activeColorSelection = useRef<{
    metaDataKey: string;
    value: string;
  } | null>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  // const mouseGenomicPositionRef = useRef({ basePair: 0, chromosome: "" });
  const mouseRelativePositionRef = useRef({ x: 0, y: 0 });

  const horizontalLineRef = useRef<any>(0);
  const verticalLineRef = useRef<any>(0);
  const isMouseInsideRef = useRef(false);
  const parentRectCache = useRef<DOMRect | null>(null);
  const rafId = useRef<number | null>(null);
  const stateSize = useRef(currentState.limit);
  const stateIdx = useRef(currentState.index);
  const padding = Math.max(8, Math.min(12, windowWidthRef.current * 0.008));
  const fontSize = Math.max(12, Math.min(12, windowWidthRef.current * 0.009));

  const trackManagerState = useRef<any>({
    bundleId: "",
    customTracksPool: [],
    darkTheme: false,
    genomeName: genomeConfig.genome.getName(),
    highlights: [
      /* HighlightInterval objects */
    ],
    isShowingNavigator: true,
    layout: {
      global: {},
      layout: {},
      borders: [],
    },
    metadataTerms: [],
    regionSetView: null,
    regionSets: [],
    caches: {},
    globalConfig: {
      viewWindow: new OpenInterval(
        windowWidthRef.current,
        windowWidthRef.current * 2,
      ),
    },

    viewRegion: userViewRegion,
    trackLegendWidth: legendWidth,
    tracks: [],
  });

  const configMenuPos = useRef<{ [key: string]: any }>({});
  const lastDragX = useRef(0);

  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const basePerPixel = useRef(0);
  const frameID = useRef(0);
  const trackWrapperRef = useRef<HTMLDivElement>(null);

  const lastX = useRef(0);
  const dragX = useRef(0);
  const hasGenomeAlign = useRef(false);
  const isToolSelected = useRef(false);
  const side = useRef("right");
  const isDragging = useRef(false);
  const rightSectionSize = useRef<Array<any>>([windowWidthRef.current]);
  const leftSectionSize = useRef<Array<any>>([]);
  const preloadedTracks = useRef<{ [key: string]: any }>({});
  const screenshotDataObj = useRef<{ [key: string]: any }>({});
  const preload = useRef<boolean>(false);
  const dataIdx = useRef(-0);
  const globalTrackState = useRef<{ [key: string]: any }>({
    rightIdx: 0,
    leftIdx: 1,
    viewWindow: new OpenInterval(
      windowWidthRef.current,
      windowWidthRef.current * 2,
    ),
    trackStates: {},
  });
  const updateLinePosition = useRef(
    throttle((x, y) => {
      horizontalLineRef.current.style.transform = `translateY(${y}px)`;
      verticalLineRef.current.style.transform = `translate3d(${x}px, 0, 0)`;
    }, 16),
  ).current;
  const startingBpArr = useRef<Array<any>>([]);
  const viewWindowConfigData = useRef<{
    viewWindow: OpenInterval;
    groupScale: any;
    dataIdx: number;
    contextNavCoord: { [key: string]: any };
  } | null>(null);

  // These states are used to update the tracks with new fetch(data);
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
  const [messageData, setMessageData] = useState<{ [key: string]: any }>({});
  const [trackComponents, setTrackComponents] = useState<Array<any>>([]);
  const [isShowingEditMenu, setIsShowingEditMenu] = useState(false);
  const [selectedTool, setSelectedTool] = useState<{ [key: string]: any }>({
    isSelected: false,
    title: "none",
  });
  const [draw, setDraw] = useState<{ [key: string]: any }>({});

  const [highlightElements, setHighLightElements] = useState<Array<any>>([]);
  const [configMenu, setConfigMenu] = useState<{ [key: string]: any } | null>(
    null,
  );
  const [metaSets, setMetaSets] = useState<{ [key: string]: any }>({
    suggestedMetaSets: new Set(),
    terms: new Array(),
    termValues: {} as { [term: string]: string[] },
  });

  const [viewWindowConfigChange, setViewWindowConfigChange] = useState<null | {
    [key: string]: any;
  }>(null);

  // MOUSE EVENTS FUNCTION HANDLER, HOW THE TRACK WILL CHANGE BASED ON WHAT THE USER DOES: DRAGGING, MOUSESCROLL, CLICK
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  // MARK: FetchQueue
  //popqueue when fetching data. Lifo
  const messageQueue = useRef<any>([]);

  const genomeAlignMessageQueue = useRef<any>([]);

  const curViewWindowRegion = useMemo(() => {
    if (
      draw?.completedFetchedRegion?.current?.key &&
      useFineModeNav.current &&
      globalTrackState.current.trackStates?.[
        draw?.completedFetchedRegion?.current?.key
      ]?.trackState?.genomicFetchCoord?.[genomeConfig.genome.getName()]
        ?.primaryVisData?.viewWindowRegion
    ) {
      const primaryVisData =
        globalTrackState.current.trackStates?.[
          draw.completedFetchedRegion.current.key
        ]?.trackState?.genomicFetchCoord?.[genomeConfig.genome.getName()]
          ?.primaryVisData;
      const viewWindowRegion = objToInstanceAlign(
        primaryVisData.viewWindowRegion,
      );

      return objToInstanceAlign(viewWindowRegion);
    } else {
      const primaryVisData =
        globalTrackState.current.trackStates?.[
          draw.completedFetchedRegion?.current.key
        ]?.trackState?.genomicFetchCoord?.[genomeConfig.genome.getName()]
          ?.primaryVisData;
      if (!primaryVisData) {
        return userViewRegion;
      }
      const viewWindowRegion = objToInstanceAlign(
        primaryVisData.viewWindowRegion,
      );
      return viewWindowRegion;
    }
  }, [draw]);

  useEffect(() => {
    if (highlights) {
      let highlightElement = createHighlight(highlights);
      if (highlightElement) setHighLightElements([...highlightElement]);
    }
  }, [curViewWindowRegion]);

  const throttleViewRegion = (callback, limit) => {
    let timeoutId: any = null;
    return (...args) => {
      if (!timeoutId) {
        callback(...args);
        timeoutId = setTimeout(() => {
          timeoutId = null;
        }, limit);
      }
    };
  };
  // Cancel any in-flight fetch operations on workers. Prefer graceful abort
  // via postMessage({type: 'abort'}) but fall back to terminate() if needed.
  // function cancelPendingWorkerFetches() {
  //   try {
  //     if (
  //       infiniteScrollWorkers &&
  //       infiniteScrollWorkers.current &&
  //       Array.isArray(infiniteScrollWorkers.current.worker)
  //     ) {
  //       infiniteScrollWorkers.current.worker.forEach((w: any) => {
  //         try {
  //           w.fetchWorker.postMessage?.({ type: "abort" });
  //         } catch (e) {
  //           try {
  //             w.fetchWorker.terminate?.();
  //           } catch (err) {
  //             // ignore
  //           }
  //         }
  //       });
  //     }

  //     if (fetchGenomeAlignWorker && fetchGenomeAlignWorker.current) {
  //       try {
  //         fetchGenomeAlignWorker.current.fetchWorker.postMessage?.({
  //           type: "abort",
  //         });
  //       } catch (e) {
  //         try {
  //           fetchGenomeAlignWorker.current.fetchWorker.terminate?.();
  //         } catch (err) {
  //           // ignore
  //         }
  //       }
  //     }
  //   } catch (err) {
  //     // defensive: swallow any unexpected errors
  //   }
  // }
  const onNewRegionSelectRef = useRef(onNewRegionSelect);
  onNewRegionSelectRef.current = onNewRegionSelect;

  const throttleOnNewRegionSelect = useRef(
    throttleViewRegion((startbase, endbase, highlightSearch) => {
      onNewRegionSelectRef.current(startbase, endbase, highlightSearch);
    }, 150),
  );

  function getMessageData() {
    const lociMap: {
      [trackId: string]: Array<{
        missingIdx: any;
        genomicLoci: any;
      }>;
    } = {};

    messageQueue.current.forEach((messageArr: any) => {
      if (messageArr && Array.isArray(messageArr)) {
        // If missingIdx and genomicLoci are properties of the array itself
        messageArr.forEach((message: any) => {
          if (message.trackModelArr && Array.isArray(message.trackModelArr)) {
            message.trackModelArr.forEach((trackModel: any) => {
              if (trackModel && trackModel.id) {
                if (!lociMap[trackModel.id]) {
                  lociMap[trackModel.id] = [];
                }
                lociMap[trackModel.id].push({
                  missingIdx: message.missingIdx,
                  genomicLoci: message.genomicLoci,
                });
              }
            });
            return;
          }
        });
      }
    });

    return lociMap;
  }

  const enqueueMessage = (message: Array<any>) => {
    messageQueue.current.push(message);

    processQueue();
  };
  const enqueueGenomeAlignMessage = (message: { [key: string]: any }) => {
    if (hasGenomeAlign.current && !useFineModeNav.current) {
      genomeAlignMessageQueue.current = [message];
    } else {
      genomeAlignMessageQueue.current.push(message);
    }

    processGenomeAlignQueue();
  };
  // const processQueue = async () => {
  //   if (messageQueue.current.length === 0) {
  //     setMessageData({});
  //     return;
  //   }

  //   setMessageData(getMessageData());

  //   const message = messageQueue.current.pop();

  //   // split an array into N contiguous chunks
  //   function splitArrayIntoChunks(arr, numChunks) {
  //     const chunkSize = Math.ceil(arr.length / numChunks);
  //     const chunks: Array<any> = [];
  //     for (let i = 0; i < numChunks; i++) {
  //       const start = i * chunkSize;
  //       const end = start + chunkSize;
  //       chunks.push(arr.slice(start, end));
  //     }
  //     return chunks;
  //   }

  //   // Send messages to worker workers
  //   if (
  //     infiniteScrollWorkers.current &&
  //     infiniteScrollWorkers.current.worker.length > 0
  //   ) {
  //     const numWorkers = infiniteScrollWorkers.current.worker.length;

  //     for (let i = 0; i < numWorkers; i++) {
  //       const messagesForWorker: Array<any> = [];
  //       for (const msgObj of message) {
  //         if (
  //           Array.isArray(msgObj.trackModelArr) &&
  //           msgObj.trackModelArr.length > 0
  //         ) {
  //           const chunks = splitArrayIntoChunks(
  //             msgObj.trackModelArr,
  //             numWorkers,
  //           );
  //           if (chunks[i].length > 0) {
  //             messagesForWorker.push({ ...msgObj, trackModelArr: chunks[i] });
  //           }
  //         }
  //       }

  //       if (
  //         messagesForWorker.length > 0 &&
  //         messagesForWorker[0].trackDataIdx === dataIdx.current
  //       ) {
  //         if (infiniteScrollWorkers.current.worker[i].hasOnMessage === false) {
  //           infiniteScrollWorkers.current.worker[i].fetchWorker.onmessage =
  //             createInfiniteOnMessage;
  //           infiniteScrollWorkers.current.worker[i].hasOnMessage = true;
  //         }
  //         infiniteScrollWorkers.current.worker[i].fetchWorker.postMessage(
  //           messagesForWorker,
  //         );
  //       }
  //     }
  //   }
  // };
  const processQueue = async () => {
    if (messageQueue.current.length === 0) {
      setMessageData({});
      return;
    }

    setMessageData(getMessageData());

    const message = messageQueue.current.pop();

    // Send each track to the worker with the least active processes
    if (
      infiniteScrollWorkers.current &&
      infiniteScrollWorkers.current.worker.length > 0 &&
      message.length > 0 &&
      message[0].trackDataIdx === dataIdx.current
    ) {
      // Ensure all workers have onmessage set
      for (const workerObj of infiniteScrollWorkers.current.worker) {
        if (workerObj.hasOnMessage === false) {
          // workerObj.fetchWorker.onmessage = async (event) => {
          //   await createInfiniteOnMessage(event);
          //   if (infiniteScrollWorkers.current) {

          //     if (areAllWorkersIdle()) {
          //       queueRegionToFetch(dataIdx.current);
          //     }
          //   }
          // };
          workerObj.fetchWorker.onmessage = createInfiniteOnMessage;

          workerObj.hasOnMessage = true;
        }
      }

      // Loop through each track and assign to least-busy worker
      for (let j = 0; j < message.length; j++) {
        const newMessage = _.cloneDeep(message[j]);

        for (const track of message[j].trackModelArr) {
          // hic tracks are fetched on the main thread (no worker) and the
          // results are handed directly to createInfiniteOnMessage. dynamichic
          // is just several hic files in `tracks`, so it takes the same path —
          // hic data comes back as GenomeInteraction instances, and postMessage
          // would strip them down to plain objects.

          if (track.type === "hic" || track.type === "dynamichic") {
            fetchGenomicData([{ ...newMessage, trackModelArr: [track] }])
              .then((results) => {
                if (results) {
                  createInfiniteOnMessage({ data: results });
                }
              })
              .catch((error) => {
                console.error(`Error fetching ${track.type} data:`, error);
              });
            continue;
          }

          // Find the worker with the fewest active processes
          let leastBusyIdx = 0;
          let minCount =
            infiniteScrollWorkers.current.worker[0].processingCount;
          for (
            let i = 1;
            i < infiniteScrollWorkers.current.worker.length;
            i++
          ) {
            if (
              infiniteScrollWorkers.current.worker[i].processingCount < minCount
            ) {
              minCount =
                infiniteScrollWorkers.current.worker[i].processingCount;
              leastBusyIdx = i;
            }
          }

          infiniteScrollWorkers.current.worker[leastBusyIdx].processingCount++;
          infiniteScrollWorkers.current.worker[
            leastBusyIdx
          ].fetchWorker.postMessage([
            { ...newMessage, trackModelArr: [track], _workerIdx: leastBusyIdx },
          ]);
        }
      }
    }
  };
  const processGenomeAlignQueue = () => {
    if (genomeAlignMessageQueue.current.length === 0) {
      return;
    }

    const message = genomeAlignMessageQueue.current.pop();
    if (fetchGenomeAlignWorker.current) {
      if (fetchGenomeAlignWorker.current.hasOnMessage === false) {
        fetchGenomeAlignWorker.current.fetchWorker.onmessage =
          createGenomeAlignOnMessage;
        fetchGenomeAlignWorker.current.hasOnMessage = true;
      }
      fetchGenomeAlignWorker.current!.fetchWorker.postMessage(message);
    }
  };

  // MARK: mouseAction

  const handleMouseEnter = useCallback(() => {
    isMouseInsideRef.current = true;
    // Cache the bounding rect when mouse enters
    if (block.current) {
      parentRectCache.current = block.current.getBoundingClientRect();
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    isMouseInsideRef.current = false;
    // Clear the cached rect when mouse leaves
    parentRectCache.current = null;
    // Cancel any pending animation frame
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    // Hide crosshair lines when mouse leaves
    if (horizontalLineRef.current && verticalLineRef.current) {
      horizontalLineRef.current.style.display = "none";
      verticalLineRef.current.style.display = "none";
    }
  }, []);

  function handleMove(e: { clientX: number; clientY: number; pageX: number }) {
    if (isMouseInsideRef.current) {
      // Use cached rect instead of calling getBoundingClientRect on every move.
      // block can be unmounted (e.g. while the screenshot view is open) even
      // though this document-level listener is still attached, so guard the
      // ref instead of dereferencing null.
      const parentRect =
        parentRectCache.current || block.current?.getBoundingClientRect();
      if (parentRect) {
        const x = e.clientX - parentRect.left;
        const y = e.clientY - parentRect.top;

        // Update all mouse position references
        mousePositionRef.current = { x: e.clientX, y: e.clientY };
        mouseRelativePositionRef.current = { x, y };

        // Use requestAnimationFrame to throttle crosshair updates

        if (rafId.current !== null) {
          cancelAnimationFrame(rafId.current);
        }
        rafId.current = requestAnimationFrame(() => {
          if (horizontalLineRef.current && verticalLineRef.current) {
            horizontalLineRef.current.style.display = "block";
            verticalLineRef.current.style.display = "block";
            updateLinePosition(x, y);
          }
          rafId.current = null;
        });
      }
    } else {
      // Hide crosshair lines when mouse is outside
      if (horizontalLineRef.current && verticalLineRef.current) {
        horizontalLineRef.current.style.display = "none";
        verticalLineRef.current.style.display = "none";
      }
    }

    if (dragOn.current === false) {
      return;
    }
    if (!isDragging.current || isToolSelected.current) {
      return;
    }

    const deltaX = lastX.current - e.pageX;
    lastX.current = e.pageX;
    let tempDragX = dragX.current;
    tempDragX -= deltaX;

    const totalBases = curGenomeConfig.current?.navContext?._totalBases;

    // The whole data region already fits in the view, so there is nothing to
    // scroll to — block all movement regardless of nav mode. This is the
    // unified home for what used to be scattered `selectedRegionSet &&
    // bpRegionSize === totalBases` special-cases: a region-set view loads the
    // full region into the full window (bpRegionSize === totalBases), and full
    // zoom-out does the same, so both are simply "whole region in view".
    if (totalBases !== undefined && bpRegionSize.current >= totalBases) {
      return;
    }

    if (
      side.current === "right" &&
      -tempDragX >=
        Math.floor(sumArray(rightSectionSize.current) + windowWidthRef.current)
    ) {
      return;
    } else if (
      side.current === "left" &&
      tempDragX >=
        Math.floor(sumArray(leftSectionSize.current) + windowWidthRef.current)
    ) {
      return;
    }

    // Stop at the actual data-region edges for partial views. The section-size
    // checks above only cap how many fetched windows we've scrolled through,
    // not where the underlying data ends, so without this you can keep dragging
    // into empty space past the start (0) or end (totalBases) of the region —
    // the drag updates even though handleMouseUp will refuse to commit it.
    // Project the committed start bp for tempDragX using the same mapping
    // handleMouseUp uses in coarse mode (leftStartCoord + -dragX * basePerPixel)
    // and block once the view would run off either edge. Only applied in coarse
    // mode: fine-mode commits use getRegionOffsetByX, which already clamps to
    // [0, totalBases-1], and the linear projection is only approximate there.
    if (
      !useFineModeNav.current &&
      totalBases !== undefined &&
      basePerPixel.current > 0
    ) {
      const projectedStartBp =
        leftStartCoord.current + -tempDragX * basePerPixel.current;
      if (
        projectedStartBp < 0 ||
        projectedStartBp + bpRegionSize.current > totalBases
      ) {
        return;
      }
    }
    dragX.current -= deltaX;

    //can change speed of scroll by mutipling dragX.current by 0.5 when setting the track position
    // .5 = * 1 ,1 =
    cancelAnimationFrame(frameID.current);

    frameID.current = requestAnimationFrame(() => {
      if (trackWrapperRef.current) {
        trackWrapperRef.current.style.transform = `translate3d(${dragX.current}px, 0, 0)`;
        trackWrapperRef.current
          .querySelectorAll(".Track-border-container")
          .forEach((border) => {
            (border as HTMLElement).style.transform =
              `translate3d(${-dragX.current}px, 0, 0)`;
          });
      }

      trackComponents.forEach((component) => {
        if (component.legendRef.current) {
          (component.legendRef.current as HTMLElement).style.transform =
            `translate3d(${-dragX.current}px, 0, 0)`;
        }
      });
    });
  }

  function handleMouseDown(e: any) {
    if (e.button !== 0) {
      // If not the left button, exit the function
      return;
    }

    isDragging.current = true;
    lastX.current = e.pageX;

    if (horizontalLineRef.current && verticalLineRef.current) {
      horizontalLineRef.current.style.display = "none";
      verticalLineRef.current.style.display = "none";
    }
    e.preventDefault();
  }
  function getRegionOffsetByX(
    region: DisplayedRegionModel,
    xDiff: number,
  ): OpenInterval {
    // Why -1?  When the mouse moves to the right, parts on the left move into view.  Ergo, we're moving the view
    // region to the left.  Vice-versa for moving the mouse to the left.
    const basesPerPixel = region.getWidth() / windowWidthRef.current;
    const baseDiff = Math.round(-1 * basesPerPixel * xDiff);
    const navContext = region.getNavigationContext();
    const [start, end] = region.getContextCoordinates();

    const newStart = navContext.toGaplessCoordinate(
      Math.max(0, start + baseDiff),
    );
    const newEnd = navContext.toGaplessCoordinate(
      Math.min(end + baseDiff, navContext.getTotalBases() - 1),
    );
    return new OpenInterval(newStart, newEnd);
  }

  function currentRegionAsString(segments: FeatureSegment[]): string {
    if (segments.length === 1) {
      return segments[0].toString();
    } else {
      const first = segments[0];
      const last = segments[segments.length - 1];

      return first.toStringWithOther(last);
    }
  }
  // function areAllWorkersIdle(): boolean {
  //   if (
  //     !infiniteScrollWorkers.current ||
  //     infiniteScrollWorkers.current.worker.length === 0
  //   ) {
  //     return true;
  //   }

  //   return infiniteScrollWorkers.current.worker.every(
  //     (w) => w.processingCount === 0,
  //   );
  // }
  function handleMouseUp() {
    isDragging.current = false;
    if (horizontalLineRef.current && verticalLineRef.current) {
      horizontalLineRef.current.style.display = "block";
      verticalLineRef.current.style.display = "block";
    }
    if (lastDragX.current === dragX.current || !curGenomeConfig.current) {
      return;
    }
    lastDragX.current = dragX.current;
    let curBp;
    let curBpInterval;
    if (
      useFineModeNav.current &&
      globalTrackState.current.trackStates?.[dataIdx.current]?.trackState
        ?.genomicFetchCoord[genomeConfig.genome.getName()]?.primaryVisData
        ?.viewWindowRegion
    ) {
      const primaryVisData =
        globalTrackState.current.trackStates?.[dataIdx.current]?.trackState
          ?.genomicFetchCoord[genomeConfig.genome.getName()]?.primaryVisData;

      curBpInterval = getRegionOffsetByX(
        objToInstanceAlign(primaryVisData.viewWindowRegion),
        (dragX.current % windowWidthRef.current) -
          (side.current === "left" ? windowWidthRef.current : 0),
      );
      curBp = curBpInterval.start;
      const genomeFeatureSegment: Array<FeatureSegment> =
        genomeConfig.navContext.getFeaturesInInterval(
          curBpInterval.start,
          curBpInterval.end,
        );

      const newCoordinate = currentRegionAsString(
        genomeFeatureSegment,
      ) as GenomeCoordinate;
    } else {
      curBp = leftStartCoord.current + -dragX.current * basePerPixel.current;

      if (
        curBp > curGenomeConfig.current.navContext._totalBases ||
        curBp <= 0
      ) {
        return;
      }
      trackManagerState.current.viewRegion._startBase = curBp;
      trackManagerState.current.viewRegion._endBase =
        curBp + bpRegionSize.current;
      curBpInterval = { start: curBp, end: curBp + bpRegionSize.current };
    }
    onNewRegion(curBpInterval.start, curBpInterval.end);

    bpX.current = curBp;

    const curDataIdx = Math.ceil(dragX.current / windowWidthRef.current);
    if (dragX.current > 0 && side.current === "right") {
      side.current = "left";
    } else if (dragX.current <= 0 && side.current === "left") {
      side.current = "right";
    }

    let curViewWindow =
      side.current === "right"
        ? new OpenInterval(
            -(
              (dragX.current % windowWidthRef.current) +
              -windowWidthRef.current
            ),
            -(
              (dragX.current % windowWidthRef.current) +
              -windowWidthRef.current
            ) + windowWidthRef.current,
          )
        : new OpenInterval(
            windowWidthRef.current * 3 -
              ((dragX.current % windowWidthRef.current) +
                windowWidthRef.current),
            windowWidthRef.current * 3 -
              (dragX.current % windowWidthRef.current),
          );

    if (
      -dragX.current >= sumArray(rightSectionSize.current) &&
      dragX.current < 0
    ) {
      rightSectionSize.current.push(windowWidthRef.current);

      createRegionTrackState(0, "right", curViewWindow);
    } else if (
      dragX.current >= sumArray(leftSectionSize.current) &&
      dragX.current > 0
    ) {
      leftSectionSize.current.push(windowWidthRef.current);
      createRegionTrackState(0, "left", curViewWindow);
    }
    globalTrackState.current.viewWindow = curViewWindow;
    if (dataIdx.current === curDataIdx) {
      viewWindowConfigData.current = {
        viewWindow: curViewWindow,
        groupScale: null,
        dataIdx: curDataIdx,
        contextNavCoord: { start: curBp, end: curBp + bpRegionSize.current },
      };
    } else {
      dataIdx.current = curDataIdx;

      if (
        globalTrackState.current.trackStates[curDataIdx]?.trackState.visData
      ) {
        queueRegionToFetch(curDataIdx);
        // if (!hasGenomeAlign.current && areAllWorkersIdle()) {
        //   queueRegionToFetch(curDataIdx);
        // } else if (hasGenomeAlign.current) {
        //   queueRegionToFetch(curDataIdx);
        // }
      }
    }
  }

  // MARK: GloCONFIG
  // FUNCTIONS HANDLER FOR WHEN CONFIG FOR TRACKS CHANGES OR WHEN USER IS SELECTING MULITPLE TRACKS
  // the trackmanager will handle the config menu when mutiple  tracks are selected otherwise each
  // track will create their own configmenu.
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________

  function handleRetryFetchTrack(id: string) {
    const curTrack = trackManagerState.current.caches[id];

    for (const cacheDataIdx in curTrack) {
      if (isInteger(cacheDataIdx)) {
        if ("dataCache" in trackManagerState.current.caches[id][cacheDataIdx]) {
          delete trackManagerState.current.caches[id][cacheDataIdx].dataCache;
        }
      }
    }

    delete completedFetchedRegion.current.done[id];
    queueRegionToFetch(dataIdx.current);
  }
  const handleReorder = useCallback(
    (order: Array<any>) => {
      const newOrder: Array<any> = [];
      for (const item of order) {
        newOrder.push(_.cloneDeep(item.trackModel));
      }

      trackManagerState.current.tracks = _.cloneDeep(newOrder);

      onTracksChange(_.cloneDeep(trackManagerState.current.tracks));
    },
    [onTracksChange],
  );
  function updateGlobalTrackConfig(config: any) {
    if (!trackManagerState.current.globalConfig) {
      trackManagerState.current.globalConfig = {};
    }
    trackManagerState.current.globalConfig[`${config.trackModel.id}`] =
      _.cloneDeep(config);
  }
  function createConfigMenuData(
    trackId: any,
    key: string | number | null = null,
    value: string | number | null = null,
  ) {
    let menuComponents: Array<any> = [];
    let optionsObjects: Array<any> = [];
    const curtracks: Array<any> = [];
    const selectCount = Object.keys(selectedTracks.current).length;
    let fileInfos: { [key: string]: any } = {};
    for (const config in selectedTracks.current) {
      let trackModel = _.cloneDeep(
        trackManagerState.current.tracks.find(
          (trackModel) => trackModel.id === config,
        ) || null,
      );
      if (trackModel) {
        trackModel.options =
          trackManagerState.current.globalConfig &&
          trackManagerState.current.globalConfig[`${config}`] !== undefined &&
          trackManagerState.current.globalConfig[`${config}`].configOptions !==
            undefined
            ? _.cloneDeep(
                trackManagerState.current.globalConfig[`${config}`]
                  .configOptions,
              )
            : {};

        if (value && key === "displayMode") {
          trackModel.options!.displayMode = value;
        }
        if (value && key === "scoreScale") {
          trackModel.options!.scoreScale = value;
        }
        if (value && key === "yScale") {
          trackModel.options!.yScale = value;
        }
        if (trackModel.type === "hic") {
          fileInfos[`${trackModel.id}`] =
            trackManagerState.current.caches[`${trackModel.id}`]?.fileInfos;
        }

        trackModel.options!["trackId"] = config;
        const trackConfig = getTrackConfig(trackModel);
        const menuItems = trackConfig.getMenuComponents();

        menuComponents.push(menuItems);
        optionsObjects.push(trackModel.options);
        curtracks.push(trackModel);
      }
    }

    const commonMenuComponents: Array<any> = _.intersection(...menuComponents);

    let newUnique = generateUUID();
    return {
      key: newUnique,
      handleDelete,
      handleAdd,
      pageX: configMenuPos.current.left,
      pageY: configMenuPos.current.top,
      viewportX: configMenuPos.current.viewportX,
      viewportY: configMenuPos.current.viewportY,
      onConfigMenuClose: onConfigMenuClose,
      selectCount: selectCount,
      configOptions: optionsObjects,
      items: commonMenuComponents,
      onConfigChange,
      blockRef: block,
      tracks: curtracks,
      fileInfos: fileInfos,
      trackId: trackId,
    };
  }

  function onConfigChange(
    key: string,
    value: string | number,
    trackId: string | null = null,
  ) {
    let newSelected: { [key: string]: any } = {};
    // these are options that changes the configMenu so we need to recreate the
    // the configmenu

    let groupChange = false;
    if (key === "displayMode" || key === "scoreScale" || key === "yScale") {
      setConfigMenu(createConfigMenuData(trackId, key, value));
    }
    // separate label because we don't to apply label to all tracks
    if (key === "label" && trackId) {
      trackManagerState.current.tracks.map((item) => {
        if (item.id === trackId) {
          let oldOption = _.cloneDeep(item.options);
          let newVal = _.cloneDeep(value);
          item.options = { ...oldOption, [key]: String(newVal) };
          newSelected[`${trackId}`] = { [key]: value };
        }
      });
    } else {
      trackManagerState.current.tracks.map((item) => {
        if (item.isSelected) {
          let oldOption = _.cloneDeep(item.options);
          let newVal = _.cloneDeep(value);
          item.options = { ...oldOption, [key]: newVal };
          newSelected[`${item.id}`] = { [key]: value };
          if (key === "normalization" || key === "binSize") {
            updateGlobalTrackConfig({
              configOptions: {
                ...(trackManagerState.current.globalConfig &&
                trackManagerState.current.globalConfig[`${item.id}`]
                  ? trackManagerState.current.globalConfig[`${item.id}`]
                      .configOptions
                  : {}),
                ...item.options,
              },
              trackModel: item,
              id: item.id,
              usePrimaryNav: false,
            });

            const curCacheTrack = trackManagerState.current.caches[item.id];
            for (const cacheDataIdx in curCacheTrack) {
              if (isInteger(cacheDataIdx)) {
                if (
                  "dataCache" in
                  trackManagerState.current.caches[item.id][cacheDataIdx]
                ) {
                  completedFetchedRegion.current.done[key] = false;
                  trackManagerState.current.caches[item.id][cacheDataIdx] = {};
                }
              }
            }
          } else if (key === "yMax" || key === "yMin" || key === "yScale") {
            const cfgForItem =
              trackManagerState.current.globalConfig &&
              trackManagerState.current.globalConfig[item.id] &&
              trackManagerState.current.globalConfig[item.id].configOptions
                ? trackManagerState.current.globalConfig[item.id].configOptions
                : null;

            const groupVal = cfgForItem ? cfgForItem.group : null;

            if (groupVal) {
              groupChange = true;
              for (const cfgId in trackManagerState.current.globalConfig) {
                const cfg = trackManagerState.current.globalConfig[cfgId];
                if (
                  cfg &&
                  cfg.configOptions &&
                  cfg.configOptions.group === groupVal
                ) {
                  // update only this key on the group's configOptions
                  cfg.configOptions = { ...cfg.configOptions, [key]: value };

                  const tm = trackManagerState.current.tracks.find(
                    (t: any) => `${t.id}` === `${cfgId}`,
                  );

                  if (tm) {
                    let oldOption = _.cloneDeep(tm.options);
                    let newVal = _.cloneDeep(value);
                    tm.options = { ...oldOption, [key]: newVal };
                    newSelected[`${cfgId}`] = { [key]: value };

                    updateGlobalTrackConfig({
                      configOptions: {
                        ...(trackManagerState.current.globalConfig &&
                        trackManagerState.current.globalConfig[`${cfgId}`]
                          ? trackManagerState.current.globalConfig[`${cfgId}`]
                              .configOptions
                          : {}),
                        ...tm.options,
                      },
                      trackModel: tm,
                      id: cfgId,
                      usePrimaryNav: false,
                    });
                  } else {
                    // ensure global config persists even if trackModel not present
                    updateGlobalTrackConfig({
                      configOptions: { ...cfg.configOptions },
                      trackModel: null,
                      id: cfgId,
                      usePrimaryNav: false,
                    });
                  }
                }
              }
            } else {
              try {
                const idStr = `${item.id}`;
                const tm =
                  trackManagerState.current.tracks.find(
                    (t: any) => `${t.id}` === idStr,
                  ) || null;
                let currentOptions: any = {};
                if (
                  trackManagerState.current.globalConfig &&
                  trackManagerState.current.globalConfig[idStr]
                ) {
                  currentOptions =
                    trackManagerState.current.globalConfig[idStr]
                      .configOptions || {};
                } else if (tm) {
                  currentOptions = {
                    ...(trackOptionMap[tm.type]
                      ? trackOptionMap[`${tm.type}`].defaultOptions
                      : {}),
                    ...(tm.options || {}),
                  };
                }

                const merged = { ...currentOptions, ...newSelected[idStr] };

                updateGlobalTrackConfig({
                  configOptions: merged,
                  trackModel: tm,
                  id: idStr,
                  trackIdx: trackManagerState.current.tracks.findIndex(
                    (t: any) => `${t.id}` === idStr,
                  ),
                });
              } catch (e) {
                // ignore per-track propagation errors
              }
            }
          } else {
            if (key === "aggregateMethod") {
              const curCacheTrack = trackManagerState.current.caches[item.id];
              for (const cacheDataIdx in curCacheTrack) {
                if (isInteger(cacheDataIdx)) {
                  if (
                    "xvalues" in
                    trackManagerState.current.caches[item.id][cacheDataIdx]
                  ) {
                    delete trackManagerState.current.caches[item.id][
                      cacheDataIdx
                    ].xvalues;
                  }
                }
              }
            }
            try {
              const idStr = `${item.id}`;
              const tm =
                trackManagerState.current.tracks.find(
                  (t: any) => `${t.id}` === idStr,
                ) || null;
              let currentOptions: any = {};
              if (
                trackManagerState.current.globalConfig &&
                trackManagerState.current.globalConfig[idStr]
              ) {
                currentOptions =
                  trackManagerState.current.globalConfig[idStr].configOptions ||
                  {};
              } else if (tm) {
                currentOptions = {
                  ...(trackOptionMap[tm.type]
                    ? trackOptionMap[`${tm.type}`].defaultOptions
                    : {}),
                  ...(tm.options || {}),
                };
              }

              const merged = { ...currentOptions, ...newSelected[idStr] };

              updateGlobalTrackConfig({
                configOptions: merged,
                trackModel: tm,
                id: idStr,
                trackIdx: trackManagerState.current.tracks.findIndex(
                  (t: any) => `${t.id}` === idStr,
                ),
              });
            } catch (e) {
              // ignore per-track propagation errors
            }
          }
        }
      });
    }

    const bpCoordStart = trackManagerState.current.viewRegion._startBase
      ? trackManagerState.current.viewRegion._startBase
      : leftStartCoord.current;
    const bpCoordEnd = trackManagerState.current.viewRegion._endBase
      ? trackManagerState.current.viewRegion._endBase
      : rightStartCoord.current + bpRegionSize.current;
    const tempViewWindowConfig =
      viewWindowConfigData.current !== null
        ? _.cloneDeep(viewWindowConfigData.current)
        : {
            viewWindow: new OpenInterval(
              windowWidthRef.current,
              windowWidthRef.current * 2,
            ),
            groupScale: null,
            dataIdx: dataIdx.current,
            contextNavCoord: { start: bpCoordStart, end: bpCoordEnd },
          };

    if (key === "normalization" || key === "binSize") {
      queueRegionToFetch(dataIdx.current);
    } else if (key !== "legendFontColor" && key !== "label") {
      tempViewWindowConfig["tracksToDrawId"] = newSelected;

      if (reCalcAgg.has(key) || groupChange) {
        aggViewWindowData(
          tempViewWindowConfig.viewWindow,
          dataIdx.current,
          tempViewWindowConfig["tracksToDrawId"],
        );
      }
      const curTrackToDrawId = tempViewWindowConfig["tracksToDrawId"] || {};

      // for (let key in curTrackToDrawId) {
      //   if (completedFetchedRegion.current.done[key] === false) {

      //     delete curTrackToDrawId[key];
      //   }
      // }
      if (Object.keys(curTrackToDrawId).length > 0) {
        // console.log("same region draw cachhe data", curTrackToDrawId);
        setViewWindowConfigChange({
          dataIdx: dataIdx.current,
          viewWindow: tempViewWindowConfig.viewWindow,
          groupScale:
            globalTrackState.current.trackStates[dataIdx.current].trackState[
              "groupScale"
            ],
          trackToDrawId: curTrackToDrawId,
        });
      }
    }

    onTracksChange(_.cloneDeep(trackManagerState.current.tracks));
  }

  function renderTrackSpecificConfigMenu(
    x: number,
    y: number,
    trackId: string,
    viewportX: number,
    viewportY: number,
  ) {
    configMenuPos.current = { left: x, top: y, viewportX, viewportY };

    setConfigMenu(createConfigMenuData(trackId));
  }
  function handleShiftSelect(e: any, trackDetails: any) {
    if (e.shiftKey) {
      const trackId = trackDetails;
      let isSelected;

      if (selectedTracks.current[trackId] === "") {
        isSelected = false;
      } else {
        isSelected = true;
      }

      if (!isSelected) {
        delete selectedTracks.current[trackId];
      } else {
        selectedTracks.current[trackId] = "";
      }

      const newTracks = trackManagerState.current.tracks.map((trackModel) => {
        if (trackModel.id in selectedTracks.current) {
          return new TrackModel({
            ...trackModel,
            isSelected: true,
          });
        } else {
          return new TrackModel({
            ...trackModel,
            isSelected: false,
          });
        }
      });
      trackManagerState.current.tracks = newTracks;

      if (initialLoad.current) {
        // During initial load, also update trackComponents to reflect the selection
        const updatedComponents = trackComponents.map((component) => ({
          ...component,
          trackModel:
            newTracks.find((t) => t.id === component.trackModel.id) ||
            component.trackModel,
        }));
        setTrackComponents(updatedComponents);
      }

      onTracksChange(newTracks);

      if (configMenu && Object.keys(selectedTracks.current).length > 0) {
        renderTrackSpecificConfigMenu(
          e.pageX,
          e.pageY,
          trackId,
          e.clientX,
          e.clientY,
        );
      } else {
        setConfigMenu(null);
      }
    } else {
      const trackId = trackDetails;

      if (
        trackId &&
        Object.keys(selectedTracks.current).length > 0 &&
        !(trackId in selectedTracks.current)
      ) {
        onTrackUnSelect();
        onTracksChange(_.cloneDeep(trackManagerState.current.tracks));
        setConfigMenu(null);
      }
    }
  }
  function handleRightClick(e: any, trackDetails: any) {
    e.preventDefault();

    if (trackDetails.trackModel.id in selectedTracks.current) {
      renderTrackSpecificConfigMenu(
        e.pageX,
        e.pageY,
        trackDetails.trackModel.id,
        e.clientX,
        e.clientY,
      );
    } else {
      onTrackUnSelect();

      const newTracks = trackManagerState.current.tracks.map((trackModel) => {
        if (trackModel.id === trackDetails.trackModel.id) {
          return new TrackModel({
            ...trackModel,
            isSelected: true,
          });
        }
        return trackModel;
      });

      trackManagerState.current.tracks = newTracks;

      if (initialLoad.current) {
        // During initial load, also update trackComponents to reflect the selection
        const updatedComponents = trackComponents.map((component) => ({
          ...component,
          trackModel:
            newTracks.find((t) => t.id === component.trackModel.id) ||
            component.trackModel,
        }));
        setTrackComponents(updatedComponents);
      }

      selectedTracks.current[`${trackDetails.trackModel.id}`] = "";

      onTracksChange(newTracks);
      renderTrackSpecificConfigMenu(
        e.pageX,
        e.pageY,
        trackDetails.trackModel.id,
        e.clientX,
        e.clientY,
      );
    }
  }

  const onConfigMenuClose = useCallback(() => {
    setConfigMenu(null);
  }, []);

  const onTrackUnSelect = useCallback(() => {
    if (Object.keys(selectedTracks.current).length !== 0) {
      trackManagerState.current.tracks.forEach((trackModel) => {
        trackModel.isSelected = false;
      });

      selectedTracks.current = {};
    }
    // The metadata-value highlight is no longer active once tracks are cleared.
    activeColorSelection.current = null;
  }, [onTracksChange]);

  const handleDelete = useCallback(
    (idArr: Array<any>) => {
      const tempTracks: Array<TrackModel> = [];
      for (let i = 0; i < trackManagerState.current.tracks.length; i++) {
        const track = trackManagerState.current.tracks[i];
        if (!idArr.includes(String(track.id))) {
          const tmpTrack = _.cloneDeep(track);
          tmpTrack["changeConfigInitial"] = true;
          tempTracks.push(tmpTrack);
        }
      }
      trackManagerState.current.tracks = tempTracks;

      for (const id of idArr) {
        if (id in selectedTracks.current) {
          delete selectedTracks.current[id];
        }
      }
      onTracksChange(_.cloneDeep(trackManagerState.current.tracks));

      if (idArr.length > 0) {
        onConfigMenuClose();
      }
    },
    [onTracksChange, onConfigMenuClose],
  );

  function handleAdd(tracks: Array<any>, trackType) {
    let newTrack: TrackModel | null = null;
    if (trackType === "matplot") {
      newTrack = new TrackModel({
        id: generateUUID(),
        type: "matplot",
        name: "matplot wrap",
        tracks,
      });
    }

    if (newTrack) {
      trackManagerState.current.tracks = [
        ...trackManagerState.current.tracks,
        newTrack,
      ];

      onTracksChange(_.cloneDeep(trackManagerState.current.tracks));
      onConfigMenuClose();
    }
  }
  // MARK: RegionTrackState
  // FUNCTION TO FETCH DATA AND CHANGE STATE TO INDICATE THERE ARE NEW DATA AFTER GETTING NAV COORD TELLING THE each TRACK
  // COMPONENTS TO UPDATE AND DRAW WITH THE NEW DATA
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________

  async function createRegionTrackState(
    initial: number = 0,
    trackSide: string,
    viewWindow: OpenInterval,
  ) {
    // chr7:154586411-chr8:2287416
    if (!curGenomeConfig.current) {
      return;
    }
    let curFetchRegionNav;
    let genomicLoci: Array<ChromosomeInterval> = [];
    let initBpLoci: Array<any> = [];
    let initExpandBpLoci: Array<any> = [];
    let newVisData;
    let regionExpandLoci;
    let regionLoci: Array<any>;

    if (initial === 1) {
      initExpandBpLoci = [
        { start: minBp.current - bpRegionSize.current * 2, end: maxBp.current },
        {
          start: minBp.current - bpRegionSize.current,
          end: maxBp.current + bpRegionSize.current,
        },
        { start: minBp.current, end: maxBp.current + bpRegionSize.current * 2 },
      ];

      initBpLoci.push({
        start: minBp.current - bpRegionSize.current,
        end: minBp.current,
      });
      initBpLoci.push({
        start: maxBp.current - bpRegionSize.current,
        end: maxBp.current,
      });
      initBpLoci.push({
        start: maxBp.current,
        end: maxBp.current + bpRegionSize.current,
      });

      startingBpArr.current = [
        minBp.current - bpRegionSize.current,
        minBp.current,
        minBp.current + bpRegionSize.current,
      ];

      curFetchRegionNav = new DisplayedRegionModel(
        curGenomeConfig.current.navContext,
        minBp.current,
        maxBp.current,
      );

      const curVisRegion = new DisplayedRegionModel(
        curGenomeConfig.current.navContext,
        minBp.current - bpRegionSize.current,
        maxBp.current + bpRegionSize.current,
      );

      const pixelsPerBase =
        windowWidthRef.current / curFetchRegionNav.getWidth();
      const expandedWidth = curVisRegion.getWidth() * pixelsPerBase;

      const originalContextInterval = curFetchRegionNav.getContextCoordinates();
      const expandedContextInterval = curVisRegion.getContextCoordinates();

      const leftBaseDiff =
        originalContextInterval.start - expandedContextInterval.start;
      const rightBaseDiff =
        expandedContextInterval.end - originalContextInterval.end;

      const leftExtraPixels = leftBaseDiff * pixelsPerBase;
      const rightExtraPixels = rightBaseDiff * pixelsPerBase;

      newVisData = {
        visWidth:
          selectedRegionSet &&
          bpRegionSize.current ===
            curGenomeConfig.current.navContext._totalBases
            ? expandedWidth - rightExtraPixels
            : expandedWidth,
        visRegion: curVisRegion,
        viewWindow:
          selectedRegionSet &&
          bpRegionSize.current ===
            curGenomeConfig.current.navContext._totalBases
            ? new OpenInterval(0, expandedWidth - rightExtraPixels)
            : new OpenInterval(
                leftExtraPixels,
                expandedWidth - rightExtraPixels,
              ),
        viewWindowRegion: curFetchRegionNav,
      };

      let expandedGenomeFeatureSegment: Array<FeatureSegment> =
        curGenomeConfig.current.navContext.getFeaturesInInterval(
          minBp.current - bpRegionSize.current,
          maxBp.current + bpRegionSize.current,
        );

      regionExpandLoci = expandedGenomeFeatureSegment.map((item, _index) =>
        item.getLocus(),
      );
      minBp.current = minBp.current - bpRegionSize.current * 2;
      maxBp.current = maxBp.current + bpRegionSize.current * 2;

      regionLoci = bpNavToGenNav(initBpLoci, curGenomeConfig.current);
    } else {
      if (trackSide === "right") {
        curFetchRegionNav = new DisplayedRegionModel(
          curGenomeConfig.current.navContext,
          maxBp.current - bpRegionSize.current,
          maxBp.current,
        );
        let genomeFeatureSegment: Array<FeatureSegment> =
          curGenomeConfig.current.navContext.getFeaturesInInterval(
            maxBp.current - bpRegionSize.current,
            maxBp.current,
          );

        genomicLoci = genomeFeatureSegment.map((item, _index) =>
          item.getLocus(),
        );
        let regionGenomeFeatureSegment: Array<FeatureSegment> =
          curGenomeConfig.current.navContext.getFeaturesInInterval(
            maxBp.current - bpRegionSize.current * 2,
            maxBp.current - bpRegionSize.current,
          );
        let regionNav = new DisplayedRegionModel(
          curGenomeConfig.current.navContext,
          maxBp.current - bpRegionSize.current * 2,
          maxBp.current - bpRegionSize.current,
        );
        regionLoci = regionGenomeFeatureSegment.map((item, _index) =>
          item.getLocus(),
        );

        const curVisRegion = new DisplayedRegionModel(
          curGenomeConfig.current.navContext,
          maxBp.current - bpRegionSize.current * 3,
          maxBp.current,
        );

        const pixelsPerBase = windowWidthRef.current / regionNav.getWidth();
        const expandedWidth = curVisRegion.getWidth() * pixelsPerBase;

        const originalContextInterval = regionNav.getContextCoordinates();
        const expandedContextInterval = curVisRegion.getContextCoordinates();

        const leftBaseDiff =
          originalContextInterval.start - expandedContextInterval.start;
        const rightBaseDiff =
          expandedContextInterval.end - originalContextInterval.end;

        const leftExtraPixels = leftBaseDiff * pixelsPerBase;
        const rightExtraPixels = rightBaseDiff * pixelsPerBase;

        newVisData = {
          visWidth:
            selectedRegionSet &&
            bpRegionSize.current ===
              curGenomeConfig.current.navContext._totalBases
              ? rightExtraPixels
              : expandedWidth,
          visRegion: curVisRegion,
          viewWindow:
            selectedRegionSet &&
            bpRegionSize.current ===
              curGenomeConfig.current.navContext._totalBases
              ? new OpenInterval(0, rightExtraPixels)
              : new OpenInterval(
                  leftExtraPixels,
                  expandedWidth - rightExtraPixels,
                ),
          viewWindowRegion: regionNav,
        };

        let expandedGenomeFeatureSegment: Array<FeatureSegment> =
          curGenomeConfig.current.navContext.getFeaturesInInterval(
            maxBp.current - bpRegionSize.current * 3,
            maxBp.current,
          );

        regionExpandLoci = expandedGenomeFeatureSegment.map((item, _index) =>
          item.getLocus(),
        );
        startingBpArr.current.push(maxBp.current - bpRegionSize.current);
        maxBp.current = maxBp.current + bpRegionSize.current;
      } else {
        curFetchRegionNav = new DisplayedRegionModel(
          curGenomeConfig.current.navContext,
          minBp.current,
          minBp.current + bpRegionSize.current,
        );
        let genomeFeatureSegment: Array<FeatureSegment> =
          curGenomeConfig.current.navContext.getFeaturesInInterval(
            minBp.current,
            minBp.current + bpRegionSize.current,
          );

        genomicLoci = genomeFeatureSegment.map((item, _index) =>
          item.getLocus(),
        );
        let regionGenomeFeatureSegment: Array<FeatureSegment> =
          curGenomeConfig.current.navContext.getFeaturesInInterval(
            minBp.current + bpRegionSize.current,
            minBp.current + bpRegionSize.current * 2,
          );
        let regionNav = new DisplayedRegionModel(
          curGenomeConfig.current.navContext,
          minBp.current + bpRegionSize.current,
          minBp.current + bpRegionSize.current * 2,
        );
        regionLoci = regionGenomeFeatureSegment.map((item, _index) =>
          item.getLocus(),
        );

        const curVisRegion = new DisplayedRegionModel(
          curGenomeConfig.current.navContext,
          minBp.current,
          minBp.current + bpRegionSize.current * 3,
        );

        const pixelsPerBase = windowWidthRef.current / regionNav.getWidth();
        const expandedWidth = curVisRegion.getWidth() * pixelsPerBase;

        const originalContextInterval = regionNav.getContextCoordinates();
        const expandedContextInterval = curVisRegion.getContextCoordinates();

        const leftBaseDiff =
          originalContextInterval.start - expandedContextInterval.start;

        const rightBaseDiff =
          expandedContextInterval.end - originalContextInterval.end;

        const leftExtraPixels = leftBaseDiff * pixelsPerBase;
        const rightExtraPixels = rightBaseDiff * pixelsPerBase;

        newVisData = {
          visWidth:
            selectedRegionSet &&
            bpRegionSize.current ===
              curGenomeConfig.current.navContext._totalBases
              ? rightExtraPixels
              : expandedWidth,
          visRegion: curVisRegion,
          viewWindow:
            selectedRegionSet &&
            bpRegionSize.current ===
              curGenomeConfig.current.navContext._totalBases
              ? new OpenInterval(0, rightExtraPixels)
              : new OpenInterval(
                  leftExtraPixels,
                  expandedWidth - rightExtraPixels,
                ),
          viewWindowRegion: regionNav,
        };

        let expandedGenomeFeatureSegment: Array<FeatureSegment> =
          curGenomeConfig.current.navContext.getFeaturesInInterval(
            minBp.current,
            minBp.current + bpRegionSize.current * 3,
          );

        regionExpandLoci = expandedGenomeFeatureSegment.map((item, _index) =>
          item.getLocus(),
        );
        startingBpArr.current.unshift(minBp.current);
        minBp.current = minBp.current - bpRegionSize.current;
      }
    }
    // AFTER Creating the new nav CACHE THE NAV OF THE VISISTED REGION
    let genomicFetchCoord: { [key: string]: any } = {};
    genomicFetchCoord[`${curGenomeConfig.current.genome.getName()}`] = {
      genomicLoci,
      regionExpandLoci: initExpandBpLoci[1],
    };
    genomicFetchCoord[`${curGenomeConfig.current.genome.getName()}`][
      "primaryVisData"
    ] = newVisData;

    let curDragX = dragX.current;

    let newTrackState = {
      primaryGenName: curGenomeConfig.current.genome.getName(),
      initial: initial,
      side: trackSide,
      xDist: curDragX,
      genomicFetchCoord: genomicFetchCoord,
      regionLoci: regionLoci,
      visData: newVisData,
      regionExpandLoci: regionExpandLoci,
      viewWindow: viewWindow,
      initVisData: initial
        ? initExpandBpLoci.map((item, index) => {
            const regionNav = new DisplayedRegionModel(
              curGenomeConfig.current?.navContext,
              initBpLoci[index].start,
              initBpLoci[index].end,
            );
            const curVisRegion = new DisplayedRegionModel(
              curGenomeConfig.current?.navContext,
              item.start,
              item.end,
            );

            const pixelsPerBase = windowWidthRef.current / regionNav.getWidth();
            const expandedWidth = curVisRegion.getWidth() * pixelsPerBase;

            const originalContextInterval = regionNav.getContextCoordinates();
            const expandedContextInterval =
              curVisRegion.getContextCoordinates();

            const leftBaseDiff =
              originalContextInterval.start - expandedContextInterval.start;
            const rightBaseDiff =
              expandedContextInterval.end - originalContextInterval.end;

            const leftExtraPixels = leftBaseDiff * pixelsPerBase;
            const rightExtraPixels = rightBaseDiff * pixelsPerBase;

            return {
              visWidth:
                selectedRegionSet &&
                bpRegionSize.current ===
                  curGenomeConfig.current?.navContext._totalBases
                  ? expandedWidth - rightExtraPixels
                  : expandedWidth,
              visRegion: curVisRegion,
              viewWindow: new OpenInterval(
                leftExtraPixels,
                expandedWidth - rightExtraPixels,
              ),
              viewWindowRegion: regionNav,
            };
          })
        : "",
    };

    trackGlobalState({
      trackState: newTrackState,
      globalTrackState: globalTrackState,
    });
  }

  // MARK: onmessInfin
  const createInfiniteOnMessage = async (
    event: MessageEvent | { [key: string]: any },
  ) => {
    await Promise.all(
      event.data.map(async (dataItem: any) => {
        const trackToDrawId: { [key: string]: any } = dataItem.trackToDrawId
          ? dataItem.trackToDrawId
          : {};
        const regionDrawIdx = dataItem.trackDataIdx;
        if (globalTrackState.current.trackStates[regionDrawIdx] === undefined) {
          return Promise.resolve();
        }
        const curTrackState = {
          ...globalTrackState.current.trackStates[regionDrawIdx].trackState,
          primaryGenName: curGenomeConfig.current?.genome.getName(),
        };

        await Promise.all(
          dataItem.fetchResults.map(
            async (item: {
              id: any;
              name: string;
              result: any;
              metadata: any;
              trackModel: any;
              curFetchNav: any;
              fileInfos: any;
              errorType: any;
            }) => {
              trackToDrawId[`${item.id}`] = "";
              await createCache({
                trackState: curTrackState,
                result: item.result,
                id: item.id,
                trackType: item.trackModel.type
                  ? item.trackModel.type
                  : item.name
                    ? item.name
                    : "",
                metadata: item.metadata,
                trackModel: item.trackModel,
                curFetchNav: item.name === "bam" ? item.curFetchNav : "",
                missingIdx: dataItem.missingIdx,
                trackDataIdx: dataItem.trackDataIdx,
                fileInfos: item.fileInfos,
                errorType: item.errorType,
              });
            },
          ),
        ).then(() => {
          const currentDataIdx = dataIdx.current;
          const idxArr = [
            currentDataIdx - 1,
            currentDataIdx,
            currentDataIdx + 1,
          ];

          const cacheKeysWithData: { [key: string]: boolean } = {};

          for (let trackToDrawKey in trackToDrawId) {
            const cache = trackManagerState.current.caches[trackToDrawKey];

            if (cache) {
              if (cache["error"]) {
                cacheKeysWithData[trackToDrawKey] = false;
              } else if (
                useFineModeNav.current ||
                cache.useExpandedLoci ||
                !cache.usePrimaryNav
              ) {
                // For fine mode or expanded loci, only check current index

                if (
                  (cache[currentDataIdx] &&
                    cache[currentDataIdx]["dataCache"]) ||
                  !cache.usePrimaryNav
                ) {
                  cacheKeysWithData[trackToDrawKey] = false;
                }
              } else {
                //  normal mode check all three indices
                let hasAllRegionData = true;
                for (let idx of idxArr) {
                  if (!cache[idx] || !cache[idx].dataCache) {
                    hasAllRegionData = false;
                    break;
                  }
                }
                if (hasAllRegionData) {
                  cacheKeysWithData[trackToDrawKey] = false;
                }
              }
            }
          }

          // if we have valid cached data

          if (Object.keys(cacheKeysWithData).length > 0) {
            if (completedFetchedRegion.current.key !== currentDataIdx) {
              completedFetchedRegion.current.key = currentDataIdx;
              completedFetchedRegion.current.done = {};
              completedFetchedRegion.current.groups = {};
            }

            checkDrawData({
              trackDataIdx: dataItem.trackDataIdx,
              initial: dataItem.initial,
              trackToDrawId: cacheKeysWithData,
              missingIdx: dataItem.missingIdx,
              curDataIdx: dataItem.trackDataIdx,
            });

            processQueue();
          }
        });
      }),
    )
      .then(() => {
        // Decrement the processing count for this worker after all items complete
        const workers = infiniteScrollWorkers.current?.worker;
        if (workers) {
          // Find the worker that posted this message by matching the source
          // We decrement the least-count worker that is > 0 as a proxy,
          // but since event.source is not available in onmessage we track via
          // a workerIndex embedded in the message data.
          const workerIdx = event.data[0]?._workerIdx;
          if (workerIdx !== undefined && workers[workerIdx]) {
            workers[workerIdx].processingCount = Math.max(
              0,
              workers[workerIdx].processingCount - 1,
            );
          }
        }
      })
      .catch((error) => {
        console.error("Error in createInfiniteOnMessage:", error);
        // Decrement on error too
        const workers = infiniteScrollWorkers.current?.worker;
        if (workers) {
          const workerIdx = event.data[0]?._workerIdx;
          if (workerIdx !== undefined && workers[workerIdx]) {
            workers[workerIdx].processingCount = Math.max(
              0,
              workers[workerIdx].processingCount - 1,
            );
          }
        }
      });
  };

  //MARK: onmessGenAl;

  const createGenomeAlignOnMessage = (
    event: MessageEvent | { [key: string]: any },
  ) => {
    const regionDrawIdx = event.data.navData.trackDataIdx;

    const curTrackState = {
      ...globalTrackState.current.trackStates[regionDrawIdx].trackState,
      primaryGenName: curGenomeConfig.current?.genome.getName(),
      ...event.data.navData,
    };
    const fetchNewRegion = event.data.navData.fetchNewRegion;
    const fetchedDragX = event.data.navData.dragX;
    // Process all fetch results with promises
    Promise.all(
      Object.values(event.data.fetchResults).map((item: any) =>
        createCache({
          trackState: curTrackState,
          result: item.records,
          id: item.id,
          trackType: item.trackModel.type,
          metadata: item.metadata,
          trackModel: item.trackModel,
          curFetchNav: item.name === "bam" ? item.curFetchNav : "",
          missingIdx: curTrackState.missingIdx,
          trackDataIdx: event.data.navData.trackDataIdx,
          queryGenome: item.query,
          errorType: item.errorType,
        }),
      ),
    )
      .then(() => {
        try {
          globalTrackState.current.trackStates[
            curTrackState.missingIdx
              ? curTrackState.missingIdx
              : curTrackState.trackDataIdx
          ].trackState["startWindow"] =
            event.data.navData.regionSetStartBp !== 0
              ? curTrackState.genomicFetchCoord[
                  curGenomeConfig.current?.genome.getName()
                ].primaryVisData.viewWindow.start
              : 0;

          globalTrackState.current.trackStates[
            curTrackState.missingIdx
              ? curTrackState.missingIdx
              : curTrackState.trackDataIdx
          ].trackState.genomicFetchCoord = curTrackState.genomicFetchCoord;
          globalTrackState.current.trackStates[
            curTrackState.missingIdx
              ? curTrackState.missingIdx
              : curTrackState.trackDataIdx
          ].trackState["visWidth"] =
            curTrackState.genomicFetchCoord[
              curGenomeConfig.current?.genome.getName()
            ].primaryVisData.visWidth;

          if (isInteger(curTrackState.missingIdx)) {
            const trackToDrawId: { [key: string]: any } = {};
            for (const track of trackManagerState.current.tracks) {
              if (track.type === "genomealign") {
                trackToDrawId[track.id] = false;
              }
            }

            if (curTrackState.fetchAfterGenAlignTracks.length > 0) {
              for (const dataForFetch of curTrackState.fetchAfterGenAlignTracks) {
                dataForFetch["genomicFetchCoord"] =
                  curTrackState.genomicFetchCoord;
              }
              if (
                completedFetchedRegion.current.key !==
                curTrackState.trackDataIdx
              ) {
                completedFetchedRegion.current.key = curTrackState.trackDataIdx;
                completedFetchedRegion.current.done = {};
                completedFetchedRegion.current.groups = {};
              }
              if (fetchNewRegion || fetchedDragX === dragX.current) {
                checkDrawData({
                  curDataIdx: curTrackState.trackDataIdx,
                  isInitial: undefined,
                  trackToDrawId,
                  missingIdx: curTrackState.missingIdx,
                  trackDataIdx: curTrackState.trackDataIdx,
                });

                enqueueMessage(curTrackState.fetchAfterGenAlignTracks);
              }
            } else {
              checkDrawData({
                curDataIdx: curTrackState.trackDataIdx,
                isInitial: 0,
                trackToDrawId,
                missingIdx: curTrackState.missingIdx,
              });
            }
          }
          // else {
          //   enqueueMessage(curTrackState.fetchAfterGenAlignTracks);
          // }

          processGenomeAlignQueue();
        } catch (error) {
          if (
            completedFetchedRegion.current.key !== curTrackState.trackDataIdx
          ) {
            completedFetchedRegion.current.key = curTrackState.trackDataIdx;
            completedFetchedRegion.current.done = {};
            completedFetchedRegion.current.groups = {};
          }
          const trackToDrawId: { [key: string]: any } = {};
          for (const key in trackManagerState.current.caches) {
            if (
              trackManagerState.current.caches[key].trackType ===
                "genomealign" &&
              trackManagerState.current.caches[key].error
            ) {
              trackToDrawId[key] = false;
            }
          }

          if (curTrackState.fetchAfterGenAlignTracks.length > 0) {
            curTrackState["genomicFetchCoord"] = null;

            enqueueMessage(curTrackState.fetchAfterGenAlignTracks);
          }
          checkDrawData({
            curDataIdx: curTrackState.trackDataIdx,
            isInitial: 0,
            trackToDrawId,
            missingIdx: curTrackState.missingIdx,
          });
        }
      })
      .catch((error) => {
        console.error("Error in createGenomeAlignOnMessage:", error);
        if (completedFetchedRegion.current.key !== curTrackState.trackDataIdx) {
          completedFetchedRegion.current.key = curTrackState.trackDataIdx;
          completedFetchedRegion.current.done = {};
          completedFetchedRegion.current.groups = {};
        }
        const trackToDrawId: { [key: string]: any } = {};
        for (const key in trackManagerState.current.caches) {
          if (
            trackManagerState.current.caches[key].trackType === "genomealign" &&
            trackManagerState.current.caches[key].error
          ) {
            trackToDrawId[key] = false;
          }
        }

        if (curTrackState.fetchAfterGenAlignTracks.length > 0) {
          curTrackState["genomicFetchCoord"] = null;

          enqueueMessage(curTrackState.fetchAfterGenAlignTracks);
        }
        checkDrawData({
          curDataIdx: curTrackState.trackDataIdx,
          isInitial: 0,
          trackToDrawId,
          missingIdx: curTrackState.missingIdx,
        });
      });
  };
  // MARK: queueRegion

  function queueRegionToFetch(regionIdx: number) {
    if (!curGenomeConfig.current) {
      return;
    }
    const trackToDrawId: { [key: string]: any } = {};

    let needToFetch = false;
    const curIdx = regionIdx;
    const idxArr = [regionIdx - 1, regionIdx, regionIdx + 1];

    let needToFetchGenAlign = false;

    for (const [key, curTrackCache] of Object.entries(
      trackManagerState.current.caches,
    ) as [string, any][]) {
      let hasAllRegionData = true;

      for (const idx of idxArr) {
        if (!(idx in curTrackCache)) {
          if (
            (curTrackCache.useExpandedLoci || !curTrackCache.usePrimaryNav) &&
            idx !== curIdx
          ) {
          } else {
            trackManagerState.current.caches[key][idx] = {};
          }
        }

        if (idx in curTrackCache) {
          if (
            (curTrackCache.useExpandedLoci || !curTrackCache.usePrimaryNav) &&
            idx !== curIdx
          ) {
            continue;
          }

          const isGenomeAlignTrack = curTrackCache.trackType === "genomealign";

          const dataCacheKeyMissing =
            !("dataCache" in curTrackCache[idx]) ||
            ((isGenomeAlignTrack || !curTrackCache.usePrimaryNav) &&
              !useFineModeNav.current);

          if (curIdx === idx && isGenomeAlignTrack && dataCacheKeyMissing) {
            needToFetchGenAlign = true;
            hasAllRegionData = false;
            needToFetch = true;
          } else if (dataCacheKeyMissing) {
            hasAllRegionData = false;
            needToFetch = true;
          }
        }
      }

      if (hasAllRegionData) {
        trackToDrawId[key] = false;
      }
    }

    if (needToFetch) {
      const dataToFetchArr: Array<any> = [];
      for (const curDataIdx of idxArr) {
        let trackToFetch: Array<TrackModel> = [];
        let trackState =
          curDataIdx in globalTrackState.current.trackStates
            ? globalTrackState.current.trackStates[curDataIdx]?.trackState
            : "";

        for (const key in trackManagerState.current.caches) {
          const curTrackCache = trackManagerState.current.caches[key];

          if (
            ((curTrackCache.useExpandedLoci || !curTrackCache.usePrimaryNav) &&
              curDataIdx !== curIdx) ||
            curTrackCache.trackType === "genomealign"
          ) {
            continue;
          }

          if (
            curDataIdx in curTrackCache &&
            (!("dataCache" in curTrackCache[curDataIdx]) ||
              (!curTrackCache.usePrimaryNav && !useFineModeNav.current))
          ) {
            let curTrackModel: any = trackManagerState.current.tracks.find(
              (trackModel: any) =>
                trackModel.id === Number(key) || trackModel.id === key,
            );

            if (curTrackModel) {
              trackManagerState.current.caches[key][curDataIdx]["dataCache"] =
                null;
              const tempTrackModel = _.cloneDeep(curTrackModel);
              tempTrackModel["error"] = curTrackCache.error;

              tempTrackModel["shouldPlaceRegion"] =
                curTrackCache.firstLoad &&
                curTrackCache.usePrimaryNav &&
                !curTrackCache.useExpandedLoci;

              if (
                tempTrackModel["shouldPlaceRegion"] &&
                curDataIdx !== curIdx
              ) {
                continue;
              }

              trackToFetch.push(tempTrackModel);
            }
          }
        }

        if (trackToFetch.length > 0) {
          const genName = curGenomeConfig.current.genome.getName();
          dataToFetchArr.push({
            primaryGenName: genName,
            trackModelArr: trackToFetch,
            visData: trackState.visData
              ? trackState.visData
              : trackState.genomicFetchCoord
                ? trackState.genomicFetchCoord[`${genName}`].primaryVisData
                : "",
            genomicLoci: trackState.regionLoci,
            visRegion: trackState.visRegion
              ? trackState.visRegion
              : trackState.genomicFetchCoord
                ? trackState.genomicFetchCoord[`${genName}`].primaryVisData
                    .visRegion
                : "",
            regionExpandLoci: trackState.regionExpandLoci,
            useFineModeNav: useFineModeNav.current,
            windowWidth: windowWidthRef.current,
            bpRegionSize: bpRegionSize.current,
            trackDataIdx: curIdx,
            missingIdx: curDataIdx,
            genomicFetchCoord: trackState?.genomicFetchCoord,
          });
        }
      }

      for (const key in trackManagerState.current.caches) {
        trackManagerState.current.caches[key]["firstLoad"] = false;
      }

      if (hasGenomeAlign.current && needToFetchGenAlign) {
        const genomeAlignTracks = trackManagerState.current.tracks.filter(
          (items, _index) => {
            return items.type === "genomealign";
          },
        );

        // MARK: addGenAlign
        const curTrackState =
          globalTrackState.current.trackStates[curIdx].trackState;

        let genomeFeatureSegment: Array<FeatureSegment> =
          curGenomeConfig.current.navContext.getFeaturesInInterval(
            bpX.current,
            bpX.current + bpRegionSize.current,
          );

        const regionLoci = genomeFeatureSegment.map((item, _index) =>
          item.getLocus(),
        );

        enqueueGenomeAlignMessage({
          trackToFetch: genomeAlignTracks,
          visData: curTrackState.visData,
          genomicLoci: curTrackState.regionLoci,
          viewWindowGenomicLoci: regionLoci,
          primaryGenName: curGenomeConfig.current.genome.getName(),
          trackModelArr: genomeAlignTracks,
          regionExpandLoci: curTrackState.regionExpandLoci,
          useFineModeNav: useFineModeNav.current,
          windowWidth: windowWidthRef.current,
          bpRegionSize: bpRegionSize.current,
          fetchAfterGenAlignTracks: dataToFetchArr,
          trackDataIdx: curIdx,
          missingIdx: curIdx,
          fetchNewRegion: true,
        });
      } else {
        enqueueMessage(dataToFetchArr);
      }
    }

    if (
      Object.keys(trackToDrawId).length > 0 &&
      (!needToFetchGenAlign ||
        (hasGenomeAlign.current && !useFineModeNav.current)) &&
      !initialLoad.current
    ) {
      if (dataIdx.current !== completedFetchedRegion.current.key) {
        completedFetchedRegion.current.key = dataIdx.current;
        completedFetchedRegion.current.done = {};
        completedFetchedRegion.current.groups = {};
        // console.log("New Region using cache data", logTrackDraw);
        checkDrawData({
          curDataIdx: dataIdx.current,
          isInitial: 0,
          trackToDrawId: { ...trackToDrawId },
        });
      }
    }
  }
  // create a useRef object, that keep track of the current dataidx most current view
  // if data Idx from new fetch is diff then, go back to empty object.
  // each track that gets finish get put into the useref
  // setDrawData of the current tracks id that has data ready so {'id': true, 'id2:false}:,
  // check in trackfactory if the track is already drawn  bhy checking the object if its null, nulll means when
  // another track updates and the current track is already drawn we ignore it .

  // MARK: checkDrawData

  function isMemoryOver2GB(): boolean {
    const memory = (performance as any).memory;
    if (!memory) return false; // Not supported (non-Chromium browsers)

    const usedMB = memory.usedJSHeapSize / (1024 * 1024);
    return usedMB > 1500;
  }
  function checkDrawData(newDrawData) {
    if (isMemoryOver2GB()) {
      for (const key in trackManagerState.current.caches) {
        const curTrack = trackManagerState.current.caches[key];
        const cacheKeys = Object.keys(curTrack)
          .filter((k) => isInteger(k))
          .map(Number)
          .sort((a, b) => a - b);
        let minIdx, maxIdx;

        minIdx = dataIdx.current - 1;
        maxIdx = dataIdx.current + 1;

        for (const cacheDataIdx of cacheKeys) {
          if (cacheDataIdx < minIdx || cacheDataIdx > maxIdx) {
            if (trackManagerState.current.caches[key][cacheDataIdx]) {
              trackManagerState.current.caches[key][cacheDataIdx] = {};
            }
          }
        }
      }
    }
    if (newDrawData && Object.keys(newDrawData.trackToDrawId).length > 0) {
      let curViewWindow;
      const genomeName = curGenomeConfig.current?.genome.getName();
      if (
        useFineModeNav.current &&
        globalTrackState.current.trackStates[newDrawData.curDataIdx].trackState
          .genomicFetchCoord
      ) {
        let trackState = {
          ...globalTrackState.current.trackStates[newDrawData.curDataIdx]
            .trackState,
        };

        const primaryVisData =
          trackState.genomicFetchCoord[genomeName].primaryVisData;

        const startViewWindow = primaryVisData.viewWindow;
        const tmpCur = globalTrackState.current.viewWindow;
        let tmpStart;
        let tmpEnd;
        if (tmpCur) {
          tmpStart = tmpCur.start;
          tmpEnd = tmpCur.end;
        } else {
          tmpStart = 0;
          tmpEnd = 1;
        }
        let curBpInterval;
        const viewWindowRegion = objToInstanceAlign(
          primaryVisData.viewWindowRegion,
        );

        curBpInterval = getRegionOffsetByX(
          objToInstanceAlign(viewWindowRegion),
          (dragX.current % windowWidthRef.current) -
            (side.current === "left" ? windowWidthRef.current : 0),
        );
        onNewRegion(curBpInterval.start, curBpInterval.end);
        const start = tmpStart - windowWidthRef.current + startViewWindow.start;
        const end = start + windowWidthRef.current;
        curViewWindow = new OpenInterval(start, end);
      } else if (
        selectedRegionSet &&
        bpRegionSize.current === curGenomeConfig.current.navContext._totalBases
      ) {
        curViewWindow = new OpenInterval(0, windowWidthRef.current);
      } else {
        curViewWindow = globalTrackState.current.viewWindow;
      }

      for (const trackId in newDrawData.trackToDrawId) {
        let configOptions;
        let curTrackModel;
        if (
          trackManagerState.current.globalConfig &&
          trackId in trackManagerState.current.globalConfig
        ) {
          configOptions =
            trackManagerState.current.globalConfig[trackId].configOptions;
        } else {
          curTrackModel = getTrackModelById(trackId);

          if (
            curTrackModel &&
            trackOptionMap[
              `${trackManagerState.current.caches[trackId].trackType}`
            ]
          ) {
            configOptions = {
              ...trackOptionMap[
                `${trackManagerState.current.caches[trackId].trackType}`
              ].defaultOptions,
              ...curTrackModel.options,
            };
          }
        }

        if (
          configOptions &&
          configOptions.group &&
          trackManagerState.current.caches[trackId].trackType in
            numericalTracksGroup
        ) {
          const groupId = configOptions.group;

          if (!completedFetchedRegion.current.groups[`${groupId}`]) {
            completedFetchedRegion.current.groups[`${groupId}`] = {};
          }
          completedFetchedRegion.current.groups[`${groupId}`][`${trackId}`] =
            newDrawData.trackToDrawId[`${trackId}`];
        } else {
          aggViewWindowData(curViewWindow, newDrawData.curDataIdx, {
            [trackId]: false,
          });
          completedFetchedRegion.current.done[`${trackId}`] =
            newDrawData.trackToDrawId[`${trackId}`];
        }
      }

      for (const groupId in completedFetchedRegion.current.groups) {
        const fetchFinishGroupKeys = Object.keys(
          completedFetchedRegion.current.groups[`${groupId}`],
        );

        const groupKeyInState = new Set(
          trackManagerState.current.tracks
            .filter(
              (track) =>
                track.options && String(track.options.group) === groupId,
            )
            .map((track) => track.id),
        );

        let haveAllGroupElements = true;
        for (let trackId of fetchFinishGroupKeys) {
          if (!groupKeyInState.has(trackId)) {
            haveAllGroupElements = false;
            break;
          }
          if (
            completedFetchedRegion.current?.groups?.done?.[trackId] &&
            completedFetchedRegion.current.groups.done[trackId] === true
          ) {
            haveAllGroupElements = false;
            break;
          }
        }
        if (haveAllGroupElements) {
          // Check if all values in the group are true

          aggViewWindowData(curViewWindow, newDrawData.curDataIdx, {
            ...completedFetchedRegion.current.groups[`${groupId}`],
          });
          completedFetchedRegion.current.done = {
            ...completedFetchedRegion.current.done,
            ...completedFetchedRegion.current.groups[`${groupId}`],
          };
        }
      }

      // startTransition(() =>
      setDraw({
        trackToDrawId: { ...completedFetchedRegion.current.done },
        viewWindow:
          bpRegionSize.current ===
          curGenomeConfig.current.navContext._totalBases
            ? { start: 0, end: windowWidthRef.current }
            : curViewWindow,
        completedFetchedRegion,
      });
      // ,
      // );
    }
  }

  // MARK: createCache
  async function createCache(fetchRes: { [key: string]: any }) {
    const result = fetchRes.result;

    if (fetchRes["fileInfos"]) {
      trackManagerState.current.caches[`${fetchRes.id}`]["fileInfos"] =
        fetchRes.fileInfos;
    }

    if (
      isInteger(fetchRes.missingIdx) &&
      trackManagerState.current.caches[`${fetchRes.id}`][fetchRes.missingIdx]
    ) {
      const currDataIdx = fetchRes.trackDataIdx
        ? fetchRes.trackDataIdx
        : dataIdx.current;
      const initialIdx = [currDataIdx + 1, currDataIdx, currDataIdx - 1];

      // Cache the RAW fetched data for every track type. Model objects are
      // built lazily downstream (in getGroupScale / the draw path) only for the
      // view that needs them, instead of formatting every fetched region up
      // front, which spiked memory right after each fetch.
      const formattedData = result;
      // const formattedData = formatDataByType(
      //   result, fetchRes.trackModel.type
      // )
      if (fetchRes?.errorType) {
        trackManagerState.current.caches[`${fetchRes.id}`]["error"] =
          fetchRes?.errorType;
      } else {
        if (fetchRes.trackModel.shouldPlaceRegion) {
          for (let i = 0; i < 3; i++) {
            // Raw data isn't split per region; the aggregator clips to the view
            // region and dedups, so all 3 indices share the same raw groups.
            trackManagerState.current.caches[`${fetchRes.id}`][initialIdx[i]][
              "dataCache"
            ] = formattedData;
          }
        } else {
          trackManagerState.current.caches[`${fetchRes.id}`][
            fetchRes.missingIdx
          ]["dataCache"] = formattedData;
        }
      }
    }
  }

  // MARK: TOOL
  // handle SELECTABLE DRAG AREA TO GET DATA FOR TOOL FUNCTIONS and other tools functions
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________

  function onRegionSelected(
    startbase: number,
    endbase: number,
    toolTitle: number | string = "isJump",
    highlightSearch: boolean = false,
  ) {
    // console.log(startbase, endbase, "SELECT REGION");
    // const genomeFeatureSegment: Array<FeatureSegment> =
    //   genomeConfig.navContext.getFeaturesInInterval(startbase, endbase);

    // const newCoordinate = currentRegionAsString(
    //   genomeFeatureSegment,
    // ) as GenomeCoordinate;
    // console.log(newCoordinate, "SELECT");

    const newLength = endbase - startbase;

    if (newLength < MIN_VIEW_REGION_SIZE) {
      const amountToExpand = 0.5 * (MIN_VIEW_REGION_SIZE - newLength);
      startbase -= amountToExpand;
      endbase += amountToExpand;
    }

    // drag select zoom in or zoom factor options or regionController/highlight jump
    if (
      String(toolTitle) in zoomFactors ||
      toolTitle === Tool.Zoom ||
      toolTitle === Tool.PanLeft ||
      toolTitle === Tool.PanRight ||
      toolTitle === "isJump"
    ) {
      trackManagerState.current.viewRegion._startBase = startbase;
      trackManagerState.current.viewRegion._endBase = endbase;
      // onNewRegionSelect(startbase, endbase, highlightSearch);
      throttleOnNewRegionSelect.current(startbase, endbase, highlightSearch);
    }
    // adding new highlight region
    else if (toolTitle === Tool.Highlight) {
      let newHightlight = {
        start: startbase,
        end: endbase,
        display: true,
        color: "rgba(0, 123, 255, 0.25)",
        tag: "",
      };
      const tmpHighlight = [...highlights, newHightlight];
      onNewHighlight(tmpHighlight);
    }
  }
  function convertOldCoordinates(
    base: number,
    _gaps,
    _cumulativeGapBases,
  ): number {
    const index = _.sortedIndexBy(_gaps, { contextBase: base }, "contextBase");
    const gapBases = _cumulativeGapBases[index] || 0; // Out-of-bounds index can happen if there are no gaps.

    return base + gapBases;
  }
  function createHighlight(highlightArr: Array<any>) {
    let resHighlights: Array<any> = [];

    const navBuilds =
      globalTrackState.current.trackStates?.[
        draw?.completedFetchedRegion?.current?.key
      ]?.trackState?.genomicFetchCoord?.[genomeConfig.genome.getName()]
        ?.navContextBuilder;

    const drawModel = new LinearDrawingModel(
      curViewWindowRegion,
      windowWidthRef.current,
    );

    for (const curhighlight of highlightArr) {
      let newIntervalEnd;
      let newIntervalStart;

      if (navBuilds) {
        newIntervalStart = convertOldCoordinates(
          curhighlight.start,
          navBuilds._gaps,
          navBuilds._cumulativeGapBases,
        );
        newIntervalEnd = convertOldCoordinates(
          curhighlight.end,
          navBuilds._gaps,
          navBuilds._cumulativeGapBases,
        );
      } else {
        newIntervalStart = curhighlight.start;
        newIntervalEnd = curhighlight.end;
      }

      const xRegion = drawModel.baseSpanToXSpan(
        new OpenInterval(newIntervalStart, newIntervalEnd),
      );

      const start =
        xRegion.start +
        Math.floor(-dragX.current / windowWidthRef.current) *
          windowWidthRef.current;

      const end =
        xRegion.end +
        Math.floor(-dragX.current / windowWidthRef.current) *
          windowWidthRef.current;
      let tmpObj = {
        xPos: start,
        width: end - start,
        side: "right",
        start: curhighlight.start,
        end: curhighlight.end,
        color: curhighlight.color,
        display: curhighlight.display,
        tag: curhighlight.tag,
      };

      resHighlights.push(tmpObj);
    }

    return resHighlights;
  }

  function toolSelect(toolTitle: string) {
    const newSelectedTool: { [key: string]: any } = {};
    newSelectedTool["isSelected"] = false;

    if (toolTitle === Tool.PanLeft) {
      onRegionSelected(
        Math.round(bpX.current - bpRegionSize.current),
        Math.round(bpX.current),
        toolTitle,
      );
    } else if (toolTitle === Tool.PanRight) {
      onRegionSelected(
        Math.round(bpX.current + bpRegionSize.current),
        Math.round(bpX.current + bpRegionSize.current * 2),
        toolTitle,
      );
    } else if (String(toolTitle) in zoomFactors) {
      let useDisplayFunction = new DisplayedRegionModel(
        curGenomeConfig.current?.navContext,
        bpX.current,
        bpX.current + bpRegionSize.current,
      );
      let res = useDisplayFunction.zoom(zoomFactors[`${toolTitle}`].factor);
      onRegionSelected(
        res._startBase as number,
        res._endBase as number,
        toolTitle,
      );
    } else if (tool.tool === Tool.Drag) {
      newSelectedTool.isSelected = false;
    } else {
      if (
        tool.tool &&
        tool.tool !== Tool.highlightMenu &&
        tool.tool !== Tool.ReorderMany &&
        tool.tool !== Tool.History
      ) {
        newSelectedTool.isSelected = true;
      }
    }

    // if (!tool.tool) {
    //   newSelectedTool["title"] = Tool.Drag;
    // } else {
    newSelectedTool["title"] = toolTitle;
    // }

    isToolSelected.current = newSelectedTool.isSelected;

    return newSelectedTool;
  }
  // MARK: InitState
  // state management functions
  //______________________________________________________________________________________________________________
  //______________________________________________________________________________________________________________
  //______________________________________________________________________________________________________________

  function initTrackFetchCache(initTrackModel: { [key: string]: any }) {
    if (!trackManagerState.current.caches[`${initTrackModel.id}`]) {
      trackManagerState.current.caches[`${initTrackModel.id}`] = {};
    }

    if (initTrackModel.type === "genomealign") {
      if (basePerPixel.current < 10) {
        useFineModeNav.current = true;
      }

      hasGenomeAlign.current = true;
    }

    if (
      initTrackModel.type in
      {
        matplot: "",
        dynamic: "",
        dynamicbed: "",
        dynamiclongrange: "",
        dynamichic: "",
      }
    ) {
      initTrackModel.tracks?.map((trackModel: TrackModel, index: any) => {
        trackModel.id = `${initTrackModel.id}` + "subtrack" + `${index}`;
      });
    }
    trackManagerState.current.caches[`${initTrackModel.id}`]["queryGenome"] =
      "querygenome" in initTrackModel && initTrackModel.querygenome
        ? initTrackModel.querygenome
        : "genome" in initTrackModel.metadata && initTrackModel.metadata.genome
          ? initTrackModel.metadata.genome
          : curGenomeConfig.current.genome.getName();

    const queryGenome =
      trackManagerState.current.caches[`${initTrackModel.id}`]["queryGenome"];
    trackManagerState.current.caches[`${initTrackModel.id}`]["usePrimaryNav"] =
      queryGenome && queryGenome !== curGenomeConfig.current.genome.getName()
        ? false
        : true;

    trackManagerState.current.caches[`${initTrackModel.id}`][
      "useExpandedLoci"
    ] = initTrackModel.type in trackUsingExpandedLoci;
    trackManagerState.current.caches[`${initTrackModel.id}`]["firstLoad"] =
      true;
    trackManagerState.current.caches[`${initTrackModel.id}`]["trackType"] =
      initTrackModel.type;
    // Ensure the canonical trackModel lives in trackManagerState.current.tracks
    const existing = getTrackModelById(initTrackModel.id);
    if (existing) {
      // replace the existing trackModel in place
      trackManagerState.current.tracks = trackManagerState.current.tracks.map(
        (t: any) =>
          String(t.id) === String(initTrackModel.id) ? initTrackModel : t,
      );
    } else {
      trackManagerState.current.tracks.push(initTrackModel);
    }
    trackManagerState.current.caches[`${initTrackModel.id}`]["error"] = null;

    const tm = initTrackModel;
    if (!trackManagerState.current.globalConfig) {
      trackManagerState.current.globalConfig = {};
    }
    let trackManagerRef = {};
    if (interactionTracks.has(tm.type)) {
      trackManagerRef = { trackManagerRef: block.current };
    }
    trackManagerState.current.globalConfig[`${tm.id}`] = {
      configOptions: {
        ...(trackOptionMap[tm.type]
          ? trackOptionMap[`${tm.type}`].defaultOptions
          : {}),
        ...(tm.options || {}),
        ...trackManagerRef,
        usePrimaryNav:
          trackManagerState.current.caches[`${initTrackModel.id}`][
            "usePrimaryNav"
          ],
      },
      trackModel: tm,
      id: tm.id,
    };
  }

  function getTrackModelById(id: any) {
    return (
      trackManagerState.current.tracks.find(
        (t: any) => String(t.id) === String(id),
      ) || null
    );
  }
  const refreshState = () => {
    // Reset useRef letiables
    initialLoad.current = true;
    completedFetchedRegion.current = {
      key: -0,
      done: {},
      groups: {},
    };
    useFineModeNav.current = false;
    trackManagerId.current = "";
    leftStartCoord.current = 0;
    rightStartCoord.current = 0;
    bpRegionSize.current = 0;
    pixelPerBase.current = 0;

    messageQueue.current = [];
    bpX.current = 0;
    maxBp.current = 0;
    minBp.current = 0;
    selectedTracks.current = {};
    mousePositionRef.current = { x: 0, y: 0 };
    trackManagerState.current = {
      bundleId: "",
      customTracksPool: [],
      darkTheme: false,
      genomeName: curGenomeConfig.current
        ? curGenomeConfig.current.genome.getName()
        : "",
      highlights: [],
      isShowingNavigator: true,
      layout: {
        global: {},
        layout: {},
        borders: [],
      },
      metadataTerms: [],
      regionSetView: null,
      regionSets: [],
      viewRegion: new DisplayedRegionModel(
        curGenomeConfig.current.navContext,
        curGenomeConfig.current.defaultRegion.start,
        curGenomeConfig.current.defaultRegion.end,
      ),
      trackLegendWidth: legendWidth,
      tracks:
        tracks && tracks.length >= 0
          ? tracks.filter((trackModel) => trackModel.type !== "g3d")
          : curGenomeConfig.current.defaultTracks,
    };

    configMenuPos.current = {};
    lastDragX.current = 0;
    basePerPixel.current = 0;
    frameID.current = 0;
    lastX.current = 0;
    dragX.current = 0;
    side.current = "right";
    isDragging.current = false;
    rightSectionSize.current = [windowWidthRef.current];
    leftSectionSize.current = [];

    // let highlightElement = createHighlight(highlights);
    globalTrackState.current = {
      rightIdx: 0,
      leftIdx: 1,
      viewWindow: new OpenInterval(
        windowWidthRef.current,
        windowWidthRef.current * 2,
      ),
      trackStates: {},
    };
    trackManagerState.current.caches = {};
    // setHighLightElements([...highlightElement]);
    dataIdx.current = -0;

    setConfigMenu(null);
  };

  function initializeTracks() {
    // set initial track manager control values and create fetch instance for track that can't use worker like hic.

    leftStartCoord.current = curGenomeConfig.current.defaultRegion.start;
    rightStartCoord.current = curGenomeConfig.current.defaultRegion.end;

    bpRegionSize.current = rightStartCoord.current - leftStartCoord.current;
    basePerPixel.current = bpRegionSize.current / windowWidthRef.current;
    pixelPerBase.current = windowWidthRef.current / bpRegionSize.current;

    bpX.current = leftStartCoord.current;
    maxBp.current = rightStartCoord.current;
    minBp.current = leftStartCoord.current;

    const newTrackComponents: Array<any> = [];

    // loop through trackmanager checking to see if the track is already created else if create a new one with default valuies

    for (let i = 0; i < trackManagerState.current.tracks.length; i++) {
      // else if (trackManagerState.current.tracks[i].type === "bam") {
      //   fetchInstances.current[`${trackManagerState.current.tracks[i].id}`] =
      //     new BamSource(trackManagerState.current.tracks[i].url);
      // }

      const newLegendRef = createRef();

      trackManagerState.current.tracks[i]["legendWidth"] = legendWidth;
      initTrackFetchCache(trackManagerState.current.tracks[i]);
      newTrackComponents.push({
        trackIdx: i,
        id: trackManagerState.current.tracks[i].id,
        component: TrackFactory,
        legendRef: newLegendRef,
        trackModel: trackManagerState.current.tracks[i],
        hasAllRegionData: false,
      });
    }

    // initialize globalTrackConfig for each track
    addTermToMetaSets(trackManagerState.current.tracks);

    createRegionTrackState(
      1,
      "right",
      new OpenInterval(windowWidthRef.current, windowWidthRef.current * 2),
    );

    queueRegionToFetch(0);

    setTrackComponents(newTrackComponents);
  }
  // MARK: sigTrackLoad
  function signalTrackLoadComplete(trackId: any) {
    if (preload.current) {
      preloadedTracks.current[`${trackId}`] = "";
      if (
        Object.keys(preloadedTracks.current).length === trackComponents.length
      ) {
        preloadedTracks.current = {};
        preload.current = false;
        initialLoad.current = false;
        setSelectedTool((prevState) => {
          if (
            tool.tool &&
            (tool.tool === Tool.Reorder ||
              tool.tool === Tool.Highlight ||
              tool.tool === Tool.Zoom)
          ) {
            const newSelectedTool = toolSelect(tool.tool);
            return newSelectedTool;
          } else {
            return {
              isSelected: false,
              title: Tool.Drag,
            };
          }
        });
        // When a track refreshes or a new genome is initialize, we
        // select the region that was selected before the refresh after the track is
        // created
        // if (highlights) {
        //   let highlightElement = createHighlight(highlights);
        //   if (highlightElement) setHighLightElements([...highlightElement]);
        // }
        const isSelected: Array<any> = [];
        tracks.map((item) => {
          if (item.isSelected) {
            isSelected.push(item.id);
          }
        });

        for (const key in selectedTracks.current) {
          if (!(key in isSelected)) {
            if (trackComponents) {
              if (trackComponents) {
                for (const component of trackComponents) {
                  if (component.id === key) {
                    // component.legendRef.current.style.backgroundColor = "white";
                    delete selectedTracks.current[key];
                  }
                }
              }
            }
          }
        }
        for (const key of isSelected) {
          if (key! in selectedTracks.current) {
            continue;
          } else {
            for (const component of trackComponents) {
              if (component.id === key) {
                // component.legendRef.current.style.backgroundColor =
                //   "lightblue";
                selectedTracks.current[key!] = "";
              }
            }
          }
        }
      }
    }
  }
  function getHighlightedXs() {
    let resHighlights: Array<any> = [];

    const navBuilds =
      globalTrackState.current.trackStates?.[
        draw?.completedFetchedRegion?.current?.key
      ]?.trackState?.genomicFetchCoord?.[genomeConfig.genome.getName()]
        ?.navContextBuilder;

    const drawModel = new LinearDrawingModel(
      curViewWindowRegion,
      windowWidthRef.current,
    );

    for (const curhighlight of highlights) {
      let newIntervalEnd;
      let newIntervalStart;

      if (navBuilds) {
        newIntervalStart = convertOldCoordinates(
          curhighlight.start,
          navBuilds._gaps,
          navBuilds._cumulativeGapBases,
        );
        newIntervalEnd = convertOldCoordinates(
          curhighlight.end,
          navBuilds._gaps,
          navBuilds._cumulativeGapBases,
        );
      } else {
        newIntervalStart = curhighlight.start;
        newIntervalEnd = curhighlight.end;
      }

      const xRegion = drawModel.baseSpanToXSpan(
        new OpenInterval(newIntervalStart, newIntervalEnd),
      );
      const start = xRegion.start;

      const end = xRegion.end;
      let tmpObj = {
        xPos: start,
        width: end - start,
        side: "right",
        start: curhighlight.start,
        end: curhighlight.end,
        color: curhighlight.color,
        display: curhighlight.display,
        tag: curhighlight.tag,
      };

      resHighlights.push(tmpObj);
    }
    return resHighlights;
  }
  function sentScreenshotData(trackDataObj: { trackId: any }) {
    screenshotDataObj.current[`${trackDataObj.trackId}`] = trackDataObj;
    if (
      Object.keys(screenshotDataObj.current).length === trackComponents.length
    ) {
      const curTracks = trackManagerState.current.tracks.filter(
        (trackModel) => trackModel.type !== "g3d",
      );

      const convertedITrackModel = curTracks
        .filter((item) => {
          if (
            item.type === "dynamicbed" ||
            item.type === "dynamic" ||
            item.type === "dynamichic" ||
            item.type === "dynamiclongrange"
          ) {
            return false;
          }

          const screenshotData =
            screenshotDataObj &&
            screenshotDataObj.current &&
            screenshotDataObj.current[`${item.id}`];

          if (screenshotData && screenshotData.isError) {
            // remove errored entry from screenshot data and exclude from converted tracks
            try {
              delete screenshotDataObj.current[`${item.id}`];
            } catch (e) {}
            return false;
          }

          return true;
        })
        .map((item) => convertTrackModelToITrackModel(item));
      // When the view spans (or exceeds) the entire data region there is no
      // 3-window expansion to offset against: the data occupies a single
      // window anchored at x=0. Applying the usual windowWidth offset here
      // shifts the drawn content out of the clip region (translateX =
      // -viewWindow.start in ScreenshotUI), producing a blank screenshot. Use
      // no offset with the viewWindow anchored at 0. A region-set view is just
      // a special case of this (it loads the full region into the full window,
      // so bpRegionSize === totalBases), so it needs no separate condition.
      const totalBases = curGenomeConfig.current?.navContext?._totalBases;
      const noViewWindowOffset =
        totalBases !== undefined && bpRegionSize.current >= totalBases;

      const currViewWindow = noViewWindowOffset
        ? new OpenInterval(0, windowWidthRef.current)
        : globalTrackState.current.viewWindow;
      let trackState = _.cloneDeep(
        globalTrackState.current?.trackStates?.[dataIdx.current]?.trackState,
      );

      // xDiff is the scroll delta of the current window from the fetch's
      // default (centered) position: globalTrackState.viewWindow.start sits at
      // windowWidth when unscrolled and shifts as you drag, so subtracting
      // windowWidth yields how far we've scrolled within the expanded region.
      // Using windowWidth here (rather than visData.viewWindow.start) keeps this
      // correct when the fetch expansion is clamped by the data edge — i.e. when
      // the view spans a large fraction (~60%+) of the whole data region. There
      // visData.viewWindow.start (leftExtraPixels) is < windowWidth, and the old
      // formula over-shifted every feature/highlight by
      // (windowWidth - visData.viewWindow.start).
      const xDiff = noViewWindowOffset
        ? 0
        : currViewWindow.start - windowWidthRef.current;

      const sameRegionViewWindow = noViewWindowOffset
        ? { start: 0, end: windowWidthRef.current }
        : {
            start:
              trackState?.genomicFetchCoord[trackState.primaryGenName]
                ?.primaryVisData?.viewWindow?.start + xDiff,
            end:
              trackState?.genomicFetchCoord[trackState.primaryGenName]
                ?.primaryVisData?.viewWindow?.end + xDiff,
          };
      const newScreenShot = getHighlightedXs();
      setScreenshotData({
        tracks: convertedITrackModel,
        trackData: screenshotDataObj.current,
        highlights: newScreenShot,
        viewWindow: sameRegionViewWindow,
        windowWidth: windowWidthRef.current,
        legendWidth,
        xOffset: xDiff,
        selectedRegionSet: selectedRegionSet,
      });
      screenshotDataObj.current = {};
    }
  }

  // MARK: METATERMS
  function addTermToMetaSets(tracks: Array<any>) {
    setMetaSets((prev) => {
      const allKeys = tracks.map((track) => Object.keys(track.metadata));
      const metaKeys = _.union(...allKeys);
      const toBeAdded = metaKeys.filter((key) => !prev.terms.includes(key));
      if (toBeAdded.length === 0) return prev;
      const newSuggestedMetaSets = new Set([
        ...prev.suggestedMetaSets,
        ...toBeAdded,
      ]);
      return { ...prev, suggestedMetaSets: newSuggestedMetaSets };
    });
  }
  function onNewTerms(newTermsList: Array<any>) {
    setMetaSets((prev) => {
      const newSuggestedMetaSets = new Set(
        [...prev.suggestedMetaSets].filter(
          (term) => !newTermsList.includes(term),
        ),
      );
      const newTerms = Array.from(new Set([...prev.terms, ...newTermsList]));
      return {
        ...prev,
        terms: newTerms,
        suggestedMetaSets: newSuggestedMetaSets,
      };
    });
  }

  function onRemoveTerm(termsToRemove: string[]) {
    setMetaSets((prev) => {
      const newTerms = prev.terms.filter((t) => !termsToRemove.includes(t));
      const newSuggestedMetaSets = new Set(prev.suggestedMetaSets);
      termsToRemove.forEach((term) => newSuggestedMetaSets.add(term));
      return {
        ...prev,
        terms: newTerms,
        suggestedMetaSets: newSuggestedMetaSets,
      };
    });
  }
  async function onColorBoxClick(metaDataKey, value) {
    await onConfigMenuClose();
    const stringValue = value;

    // Clicking the value that's already highlighting tracks toggles it back off,
    // deselecting/unhighlighting every track.
    const isSameSelection =
      activeColorSelection.current !== null &&
      activeColorSelection.current.metaDataKey === metaDataKey &&
      activeColorSelection.current.value === stringValue;

    const newSelectedTracks: { [key: string]: any } = {};
    // Always rebuild the full track array (every track, in order) so the parent's
    // track list length never changes on a selection-only update.
    const newTrackModelArr: Array<any> = trackManagerState.current.tracks.map(
      (track) => {
        if (isSameSelection || !track.metadata) {
          return new TrackModel({ ...track, isSelected: false });
        }
        const metaStringValue = Array.isArray(track.metadata[`${metaDataKey}`])
          ? track.metadata[`${metaDataKey}`][
              track.metadata[`${metaDataKey}`].length - 1
            ]
          : track.metadata[`${metaDataKey}`];
        if (
          track.metadata[`${metaDataKey}`] &&
          metaStringValue === stringValue
        ) {
          newSelectedTracks[`${track.id}`] = "";
          return new TrackModel({ ...track, isSelected: true });
        }
        return new TrackModel({ ...track, isSelected: false });
      },
    );

    // Keep the ref in sync with what we hand to the parent (every other selection
    // handler does this) so subsequent clicks diff against the current state.
    trackManagerState.current.tracks = newTrackModelArr;
    selectedTracks.current = newSelectedTracks;
    activeColorSelection.current = isSameSelection
      ? null
      : { metaDataKey, value: stringValue };
    onTracksChange(newTrackModelArr);
  }

  // MARK: USEEFFECTS
  // USEEFFECTS
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________

  // Recompute termValues whenever the active terms list changes.
  // Runs after render so trackManagerState.current.tracks is always up to date.
  useEffect(() => {
    if (metaSets.terms.length === 0) return;
    const currentTracks = trackManagerState.current.tracks;
    if (!currentTracks || currentTracks.length === 0) return;
    const newTermValues: { [term: string]: string[] } = {};
    for (const term of metaSets.terms) {
      const values = new Set<string>();
      currentTracks.forEach((track: any) => {
        const v = track.metadata?.[term];
        if (v !== undefined && v !== null && v !== "") {
          if (Array.isArray(v)) v.forEach((vi: any) => values.add(String(vi)));
          else values.add(String(v));
        }
      });
      newTermValues[term] = Array.from(values);
    }
    setMetaSets((prev) => ({ ...prev, termValues: newTermValues }));
  }, [metaSets.terms]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // terminate the worker and listener when TrackManager  is unmounted

    const parentElement = block.current;
    const clearCachedRect = () => {
      parentRectCache.current = null;
    };
    if (parentElement) {
      parentElement.addEventListener("mouseenter", handleMouseEnter);
      parentElement.addEventListener("mouseleave", handleMouseLeave);
      window.addEventListener("scroll", clearCachedRect, true);
    }

    if (genomeConfig) {
      curGenomeConfig.current = _.cloneDeep(genomeConfig);
      prevWindowWidth.current = windowWidthRef.current;
      curGenomeConfig.current["defaultRegion"] = new OpenInterval(
        userViewRegion._startBase!,
        userViewRegion._endBase!,
      );
      curGenomeConfig.current["navContext"] = userViewRegion._navContext;

      trackManagerState.current.genomeName = genomeConfig.genome.getName();
      trackManagerState.current.tracks =
        tracks && tracks.length >= 0
          ? tracks.filter((trackModel) => trackModel.type !== "g3d")
          : genomeConfig.defaultTracks.filter(
              (trackModel) => trackModel.type !== "g3d",
            );

      initializeTracks();
      preload.current = true;

      escapeRef.current = () => {
        if (Object.keys(selectedTracks.current).length > 0) {
          onTrackUnSelect();
          onTracksChange(_.cloneDeep(trackManagerState.current.tracks));
          onConfigMenuClose();
        }
      };
    }
    return () => {
      // Clear ref data and remove event listeners to prevent memory leaks after component unmounts
      refreshState();
      // Reset hasOnMessage so the next TrackManager instance re-binds its own closures
      if (infiniteScrollWorkers.current) {
        infiniteScrollWorkers.current.worker.forEach((workerObj) => {
          workerObj.hasOnMessage = false;
        });
      }
      if (fetchGenomeAlignWorker.current) {
        fetchGenomeAlignWorker.current.hasOnMessage = false;
      }
      if (parentElement) {
        parentElement.removeEventListener("mouseenter", handleMouseEnter);
        parentElement.removeEventListener("mouseleave", handleMouseLeave);
        window.removeEventListener("scroll", clearCachedRect, true);
      }

      // document.removeEventListener("pointermove", handleMove);
      // document.removeEventListener("pointerup", handleMouseUp);

      // console.log("trackmanager terminate");
    };
  }, []);

  useEffect(() => {
    // add Listenser again because javacript dom only have the old trackComponents value
    // it gets the trackComponents at creation so when trackComponent updates we need to
    // add the listener so it can get the most updated trackCom
    // this also include other state changes values such windowWidth

    cancelAnimationFrame(frameID.current);
    frameID.current = requestAnimationFrame(() => {
      if (trackWrapperRef.current) {
        trackWrapperRef.current.style.transform = `translate3d(${dragX.current}px, 0, 0)`;
        trackWrapperRef.current
          .querySelectorAll(".Track-border-container")
          .forEach((border) => {
            (border as HTMLElement).style.transform =
              `translate3d(${-dragX.current}px, 0, 0)`;
          });
      }

      trackComponents.forEach((component) => {
        if (component.legendRef.current) {
          (component.legendRef.current as HTMLElement).style.transform =
            `translate3d(${-dragX.current}px, 0, 0)`;
        }
      });
    });

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleMouseUp);

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleMouseUp);
    };
  }, [trackComponents, windowWidthRef.current]);

  useEffect(() => {
    if (!initialLoad.current) {
      const toggleTool = tool.tool;

      if (tool.tool === "Drag") {
        dragOn.current = true;
      } else if (lastSelectedTool.current === "Drag" && toggleTool === null) {
        dragOn.current = false;
      }
      if (toggleTool !== null) {
        lastSelectedTool.current = toggleTool;
        setSelectedTool(toolSelect(toggleTool));
      } else {
        dragOn.current = false;
        setSelectedTool({
          isSelected: false,
          title: null,
        });
      }
    }
  }, [tool.tool]);

  useEffect(() => {
    if (!initialLoad.current && tool.actionTool) {
      toolSelect(tool.actionTool);
    }
  }, [tool.actionCount]);

  // MARK: trackSizeCha
  function deleteCache() {
    for (const key in trackManagerState.current.caches) {
      const trackCache = trackManagerState.current.caches[key];

      // if (trackCache.trackType === "genomealign") {
      for (const dataKey in trackCache) {
        if (isInteger(dataKey)) {
          if (trackManagerState.current.caches[key][dataKey].xvalues) {
            delete trackManagerState.current.caches[key][dataKey].xvalues;
          }
          if (trackManagerState.current.caches[key][dataKey].placeFeature) {
            delete trackManagerState.current.caches[key][dataKey].placeFeature;
          }

          delete trackManagerState.current.caches[key][dataKey].dataCache;
        }
        // }
        // } else {
        //   for (const cacheDataIdx in trackCache) {
        //     if (isInteger(cacheDataIdx)) {
        //       if (
        //         "xvalues" in trackManagerState.current.caches[key][cacheDataIdx]
        //       ) {
        //         delete trackManagerState.current.caches[key][cacheDataIdx]
        //           .xvalues;
        //       }
        //     }
        //   }
      }
    }

    if (basePerPixel.current < 10) {
      useFineModeNav.current = true;
    } else {
      useFineModeNav.current = false;
    }
  }
  function trackSizeChange() {
    if (!curGenomeConfig.current) return;

    const currDataIdx = dataIdx.current;
    const regionIdx = [currDataIdx + 1, currDataIdx, currDataIdx - 1];
    for (let idx of regionIdx) {
      if (!globalTrackState.current?.trackStates?.[idx]) {
        return;
      }
    }
    if (selectedRegionSet) {
      const updatedGenomeConfig = _.cloneDeep(curGenomeConfig.current);
      if (userViewRegion) {
        updatedGenomeConfig.defaultRegion = new OpenInterval(
          userViewRegion._startBase!,
          userViewRegion._endBase!,
        );
        updatedGenomeConfig.navContext = userViewRegion._navContext;
      } else {
        updatedGenomeConfig.defaultRegion = new OpenInterval(
          viewRegion._startBase,
          viewRegion._endBase,
        );
        updatedGenomeConfig.navContext = viewRegion._navContext;
      }
      curGenomeConfig.current = updatedGenomeConfig;

      preload.current = true;

      refreshState();
      initializeTracks();
    } else {
      const trackToDrawId: { [key: string]: any } = {};
      completedFetchedRegion.current.key = dataIdx.current;
      completedFetchedRegion.current.done = {};
      completedFetchedRegion.current.groups = {};
      // for (const cacheKey in trackManagerState.current.caches) {
      //   trackToDrawId[cacheKey] = false;
      //   completedFetchedRegion.current.done[cacheKey] = false;
      // }
      const prevStateWindowWidth = prevWindowWidth.current;

      const newWindowWidth = windowWidthRef.current;
      prevWindowWidth.current = windowWidthRef.current;

      for (let id in globalTrackState.current.trackStates) {
        const curTrackState = _.cloneDeep(
          globalTrackState.current.trackStates[id].trackState,
        );
        if (!curTrackState.visData) {
          continue;
        }

        const prevXDist =
          globalTrackState.current.trackStates[id].trackState.xDist;

        const newXDist = (prevXDist / prevStateWindowWidth) * newWindowWidth;

        const curFetchRegionNav =
          globalTrackState.current.trackStates[id].trackState.visData
            .viewWindowRegion;

        const curVisRegion =
          globalTrackState.current.trackStates[id].trackState.visData.visRegion;

        const pixelsPerBase =
          windowWidthRef.current / curFetchRegionNav.getWidth();
        const expandedWidth = curVisRegion.getWidth() * pixelsPerBase;

        const originalContextInterval =
          curFetchRegionNav.getContextCoordinates();
        const expandedContextInterval = curVisRegion.getContextCoordinates();

        const leftBaseDiff =
          originalContextInterval.start - expandedContextInterval.start;
        const rightBaseDiff =
          expandedContextInterval.end - originalContextInterval.end;

        const leftExtraPixels = leftBaseDiff * pixelsPerBase;
        const rightExtraPixels = rightBaseDiff * pixelsPerBase;

        const newVisData = {
          visWidth:
            selectedRegionSet &&
            bpRegionSize.current ===
              curGenomeConfig.current.navContext._totalBases
              ? expandedWidth - rightExtraPixels
              : expandedWidth,
          visRegion: curVisRegion,
          viewWindow:
            selectedRegionSet &&
            bpRegionSize.current ===
              curGenomeConfig.current.navContext._totalBases
              ? new OpenInterval(0, expandedWidth - rightExtraPixels)
              : new OpenInterval(
                  leftExtraPixels,
                  expandedWidth - rightExtraPixels,
                ),
          viewWindowRegion: curFetchRegionNav,
        };

        curTrackState.xDist = newXDist;
        if (curTrackState["visData"]) {
          curTrackState.visData = newVisData;
        }
        if (
          "genomicFetchCoord" in
          globalTrackState.current.trackStates[id].trackState
        ) {
          curTrackState.genomicFetchCoord = {};
          curTrackState.genomicFetchCoord[`${curTrackState.primaryGenName}`] =
            {};
          curTrackState.genomicFetchCoord[
            `${curTrackState.primaryGenName}`
          ].primaryVisData = _.cloneDeep(newVisData);
        }
        globalTrackState.current.trackStates[id].trackState = curTrackState;
      }

      basePerPixel.current = bpRegionSize.current / windowWidthRef.current;
      pixelPerBase.current = windowWidthRef.current / bpRegionSize.current;

      dragX.current = dragX.current * (newWindowWidth / prevStateWindowWidth);

      (leftStartCoord.current - curGenomeConfig.current.defaultRegion.start) *
        pixelPerBase.current;
      for (let i = 0; i < rightSectionSize.current.length; i++) {
        rightSectionSize.current[i] = windowWidthRef.current;
      }
      for (let i = 0; i < leftSectionSize.current.length; i++) {
        leftSectionSize.current[i] = windowWidthRef.current;
      }

      const newViewWindow =
        side.current === "right"
          ? new OpenInterval(
              -(
                (dragX.current % windowWidthRef.current) +
                -windowWidthRef.current
              ),
              -(
                (dragX.current % windowWidthRef.current) +
                -windowWidthRef.current
              ) + windowWidthRef.current,
            )
          : new OpenInterval(
              windowWidthRef.current * 3 -
                ((dragX.current % windowWidthRef.current) +
                  windowWidthRef.current),
              windowWidthRef.current * 3 -
                (dragX.current % windowWidthRef.current),
            );

      globalTrackState.current.viewWindow = newViewWindow;
      if (hasGenomeAlign.current) {
        if (basePerPixel.current < 10) {
          useFineModeNav.current = true;
        } else {
          useFineModeNav.current = false;
        }

        deleteCache();

        queueRegionToFetch(dataIdx.current);
        const tmpArr = [...trackComponents];
        setTrackComponents(tmpArr);
      } else {
        for (const key in trackManagerState.current.caches) {
          const curTrack = trackManagerState.current.caches[key];
          trackToDrawId[key] = false;
          for (const cacheDataIdx in curTrack) {
            if (isInteger(cacheDataIdx)) {
              if (
                "xvalues" in trackManagerState.current.caches[key][cacheDataIdx]
              ) {
                delete trackManagerState.current.caches[key][cacheDataIdx]
                  .xvalues;
              }
              if (
                "placeFeature" in
                trackManagerState.current.caches[key][cacheDataIdx]
              ) {
                delete trackManagerState.current.caches[key][cacheDataIdx]
                  .placeFeature;
              }
            }
          }
        }
        const tmpArr = [...trackComponents];

        setTrackComponents(tmpArr);
        checkDrawData({
          curDataIdx: dataIdx.current,
          isInitial: 0,
          trackToDrawId,
        });
      }
      let highlightElement = createHighlight(highlights);
      setHighLightElements([...highlightElement]);
      parentRectCache.current = null;
    }
  }
  // MARK: viewWindowConfig
  function aggViewWindowData(
    viewWindow,
    dataIdx,
    tracksToDraw: any = undefined,
  ) {
    if (viewWindow && dataIdx !== undefined && dataIdx !== null) {
      const trackDataObj: Array<any> = [];
      const trackToDrawId = tracksToDraw
        ? tracksToDraw
        : Object.entries(trackManagerState.current.caches).reduce(
            (acc: { [key: string]: any }, [k, v]: [string, any]) => {
              if (v && v.usePrimaryNav) acc[k] = false;
              return acc;
            },
            {},
          );
      let primaryVisData;

      for (let key in trackToDrawId) {
        const cacheTrackData = trackManagerState.current.caches[key];

        const curTrackModel = getTrackModelById(key);
        let configOptions;
        if (
          cacheTrackData["error"] ||
          !trackOptionMap[`${cacheTrackData.trackType}`]
        ) {
          continue;
        }
        if (
          cacheTrackData.trackType in
          {
            hic: "",
            longrange: "",
            biginteraction: "",
            dynamichic: "",
            dynamiclongrange: "",
          }
        ) {
          trackToDrawId[key] = false;
          continue;
        }
        if (
          trackManagerState.current.globalConfig &&
          key in trackManagerState.current.globalConfig
        ) {
          configOptions =
            trackManagerState.current.globalConfig[key].configOptions;
        } else {
          if (curTrackModel) {
            configOptions = {
              ...trackOptionMap[`${cacheTrackData.trackType}`].defaultOptions,
              ...curTrackModel.options,
            };
          }
        }

        if (!configOptions) {
          continue;
        }

        let combinedData: any = [];
        let hasData = true;
        // if (
        // (
        // !cacheTrackData?.[dataIdx]?.["xvalues"]
        // &&
        // curTrackModel.type in numericalTracks) || ((!(cacheTrackData.trackType in numericalTracks) &&
        //   configOptions.displayMode !== "density") && configOptions?.displayMode === "full"

        // && !cacheTrackData?.[dataIdx]?.["placeFeature"]
        // )
        // &&

        //   cacheTrackData.usePrimaryNav
        // ) {

        let currIdx = dataIdx + 1;
        // combine data from view region and adjacent regions using dataIdx
        if (configOptions?.group && !cacheTrackData?.usePrimaryNav) {
          if (cacheTrackData[dataIdx]?.dataCache) {
            combinedData.push(cacheTrackData[dataIdx]);
          } else {
            hasData = false;
          }
        } else {
          for (let i = 0; i < 3; i++) {
            if (cacheTrackData[currIdx]?.dataCache) {
              combinedData.push(cacheTrackData[currIdx]);
            } else {
              hasData = false;
              break;
            }
            currIdx--;
          }
        }
        // }

        if (hasData) {
          const trackState = {
            ...globalTrackState.current.trackStates[dataIdx].trackState,
          };
          let visRegion;

          if (cacheTrackData.trackType !== "genomealign") {
            primaryVisData =
              trackState.genomicFetchCoord[trackState.primaryGenName]
                .primaryVisData;
            visRegion = !cacheTrackData.usePrimaryNav
              ? trackState.genomicFetchCoord[
                  trackManagerState.current.caches[key].queryGenome
                ].queryRegion
              : primaryVisData.visRegion;

            if (typeof visRegion === "object") {
              visRegion = objToInstanceAlign(visRegion);
            }

            trackDataObj.push({
              id: key,
              data: combinedData,
              visRegion: visRegion,
              visWidth: primaryVisData.visWidth
                ? primaryVisData.visWidth
                : windowWidthRef.current * 3,
              configOptions,
              usePrimaryNav: cacheTrackData.usePrimaryNav,
              trackModel: curTrackModel,
            });
          }

          trackToDrawId[key] = false;
        }
        // else {
        //   delete trackToDrawId[key]
        // }
      }
      // TO-DO so far only group primary nav tracks, not track that align to secondary genome align, or nonprimary with primary

      const groupScale = groupManager.getGroupScale(
        trackDataObj,
        primaryVisData && primaryVisData.visWidth
          ? primaryVisData.visWidth
          : windowWidthRef.current * 3,
        viewWindow,
        dataIdx,
        trackManagerState,
      );

      globalTrackState.current.trackStates[dataIdx].trackState["groupScale"] =
        globalTrackState.current.trackStates[dataIdx].trackState["groupScale"]
          ? {
              ...globalTrackState.current.trackStates[dataIdx].trackState[
                "groupScale"
              ],
              ...groupScale,
            }
          : groupScale;

      return trackToDrawId;
    } else {
      return {};
    }
  }

  // MARK: useeffects_____________________________________________________________

  useEffect(() => {
    if (highlights && initialLoad.current === false) {
      let highlightElement = createHighlight(highlights);
      setHighLightElements([...highlightElement]);
    }
  }, [highlights]);

  // MARK: [tracks]

  function isInteger(str: string): boolean {
    const num = Number(str);

    return str !== null && !isNaN(num) && Number.isInteger(num);
  }

  useEffect(() => {
    if (!initialLoad.current && tracks && tracks.length === 0) {
      setTrackComponents([]);
    } else if (
      (!initialLoad.current &&
        tracks &&
        !tracks.every((item) => item.waitToUpdate)) ||
      (initialLoad.current &&
        tracks.every((item) => item.changeConfigInitial)) ||
      (initialLoad.current &&
        tracks.length > 0 &&
        trackManagerState.current.tracks.length === 0)
    ) {
      const filteredTracks = tracks.filter(
        (trackModel) => trackModel.type !== "g3d",
      );
      for (let i = 0; i < filteredTracks.length; i++) {
        filteredTracks[i]["changeConfigInitial"] = false;
      }
      const tracksInView = [...trackComponents.map((item) => item.trackModel)];
      // const tracksRemoved = tracksInView.filter(
      //   (trackInView) =>
      //     !filteredTracks.some((track) => track.id === trackInView.id)
      // );

      if (!arraysHaveSameTrackModels(filteredTracks, tracksInView)) {
        const newGenomealignTracks = filteredTracks.filter(
          (item) => item.type === "genomealign",
        );
        const genomealignTracksInView = tracksInView.filter(
          (item) => item.type === "genomealign",
        );
        if (
          !arraysHaveSameTrackModels(
            newGenomealignTracks,
            genomealignTracksInView,
          )
        ) {
          deleteCache();

          if (
            newGenomealignTracks.length === 0 &&
            genomealignTracksInView.length > 0
          ) {
            for (let key in globalTrackState.current.trackStates) {
              const allTrackState = globalTrackState.current.trackStates[key];
              for (let key2 in allTrackState) {
                const trackState = allTrackState[key2];
                if (trackState["genomicFetchCoord"]) {
                  trackState.genomicFetchCoord[
                    `${curGenomeConfig.current?.genome.getName()}`
                  ]["primaryVisData"] = _.cloneDeep(
                    globalTrackState.current.trackStates[key].trackState
                      .visData,
                  );
                  const newGenomicFetchCoord = {
                    [curGenomeConfig.current?.genome.getName()]: _.cloneDeep(
                      trackState.genomicFetchCoord[
                        `${curGenomeConfig.current?.genome.getName()}`
                      ],
                    ),
                  };

                  trackState.genomicFetchCoord = newGenomicFetchCoord;
                }
              }
            }
          }
        }
        const newTrackId: { [key: string]: any } = {};
        for (const trackModel of filteredTracks) {
          newTrackId[`${trackModel.id}`] = {};
        }
        // check if a track inside trackmanager was deleted
        for (const key in trackManagerState.current.caches) {
          if (!(key in newTrackId)) {
            delete trackManagerState.current.caches[key];
          }
        }

        const newTrackComponents: Array<any> = [];

        const newAddedTrackModel: Array<any> = [];
        let checkHasGenAlign = false;
        for (let i = 0; i < filteredTracks.length; i++) {
          const curTrackModel = filteredTracks[i];

          let foundComp = false;

          // find tracks already in view
          for (let trackComponent of trackComponents) {
            if (trackComponent.trackModel.id === curTrackModel.id) {
              if (curTrackModel.type === "g3d") {
                continue;
              } else {
                if (trackComponent.trackModel.type === "genomealign") {
                  checkHasGenAlign = true;
                }
                newTrackComponents.push(trackComponent);
              }

              foundComp = true;
            }
          }
          // if not in view this means that this is the new track that was added.
          if (!foundComp) {
            newAddedTrackModel.push(curTrackModel);
            if (curTrackModel.type === "genomealign") {
              checkHasGenAlign = true;
            }

            //create initial state for the new track, give it all the prevregion trackstate, and trigger fetch by updating trackcomponents

            const newLegendRef = createRef();

            curTrackModel["legendWidth"] = legendWidth;

            newTrackComponents.push({
              trackIdx: i,
              id: curTrackModel.id,
              component: TrackFactory,

              legendRef: newLegendRef,
              trackModel: curTrackModel,
            });
            // completedFetchedRegion.current.done[curTrackModel.id] = false;
            initTrackFetchCache(curTrackModel);
          }
        }

        if (!checkHasGenAlign) {
          useFineModeNav.current = false;
          hasGenomeAlign.current = false;
        }

        trackManagerState.current.tracks = filteredTracks;

        setTrackComponents(newTrackComponents);
        queueRegionToFetch(dataIdx.current);
        onTracksChange(filteredTracks);
      } else {
        selectedTracks.current = {};
        // for options that don't need to redraw tracks, select, legend font color, reorder
        const newTrackComponents: Array<any> = [];

        let needToToUpdate = false;

        for (let i = 0; i < filteredTracks.length; i++) {
          const curTrackModel = filteredTracks[i];
          if (curTrackModel.id !== trackComponents[i].trackModel.id) {
            needToToUpdate = true;
          }
          if (
            curTrackModel.isSelected &&
            !selectedTracks?.current[`${curTrackModel.id}`]
          ) {
            selectedTracks.current[curTrackModel.id] = "";
            needToToUpdate = true;
          }
          // find tracks already in view

          for (let j = 0; j < trackComponents.length; j++) {
            const trackComponent = trackComponents[j];

            if (trackComponent.trackModel.id === curTrackModel.id) {
              if (
                trackComponent.trackModel.isSelected !==
                  curTrackModel.isSelected ||
                trackComponent.trackModel?.options?.legendFontColor !==
                  curTrackModel.options?.legendFontColor ||
                trackComponent.trackModel?.options?.label !==
                  curTrackModel.options?.label ||
                i !== j
              ) {
                trackComponent.trackModel = curTrackModel;

                needToToUpdate = true;
              }

              newTrackComponents.push(trackComponent);
            }
          }
        }

        if (needToToUpdate) {
          trackManagerState.current.tracks = filteredTracks;
          setTrackComponents(newTrackComponents);
        }

        if (filteredTracks.length === 0) {
          setTrackComponents([]);
          trackManagerState.current.tracks = [];
          return;
        }
      }
      addTermToMetaSets(filteredTracks);
    }
  }, [tracks]);
  // MARK: width, regions
  useEffect(() => {
    if (userViewRegion && !initialLoad.current && curGenomeConfig.current) {
      if (trackComponents) {
        const updatedGenomeConfig = _.cloneDeep(curGenomeConfig.current);
        updatedGenomeConfig.defaultRegion = new OpenInterval(
          userViewRegion._startBase!,
          userViewRegion._endBase!,
        );
        updatedGenomeConfig.navContext = userViewRegion._navContext;
        curGenomeConfig.current = updatedGenomeConfig;
        trackSizeChange();

        cancelAnimationFrame(frameID.current);
        frameID.current = requestAnimationFrame(() => {
          if (trackWrapperRef.current) {
            trackWrapperRef.current.style.transform = `translate3d(${dragX.current}px, 0, 0)`;
            trackWrapperRef.current
              .querySelectorAll(".Track-border-container")
              .forEach((border) => {
                (border as HTMLElement).style.transform =
                  `translate3d(${-dragX.current}px, 0, 0)`;
              });
          }

          trackComponents.forEach((component) => {
            if (component.legendRef.current) {
              (component.legendRef.current as HTMLElement).style.transform =
                `translate3d(${-dragX.current}px, 0, 0)`;
            }
          });
        });

        document.addEventListener("pointermove", handleMove);
        document.addEventListener("pointerup", handleMouseUp);

        document.addEventListener("mousemove", handleMove);
        document.addEventListener("mouseup", handleMouseUp);
      }
    }
  }, [windowWidthRef.current]);

  useEffect(() => {
    if (!initialLoad.current) {
      const updatedGenomeConfig = _.cloneDeep(genomeConfig);
      if (userViewRegion) {
        updatedGenomeConfig.defaultRegion = new OpenInterval(
          userViewRegion._startBase!,
          userViewRegion._endBase!,
        );
        updatedGenomeConfig.navContext = userViewRegion._navContext;
      } else {
        updatedGenomeConfig.defaultRegion = new OpenInterval(
          viewRegion._startBase,
          viewRegion._endBase,
        );
        updatedGenomeConfig.navContext = viewRegion._navContext;
      }
      curGenomeConfig.current = updatedGenomeConfig;

      preload.current = true;
      refreshState();
      initializeTracks();
    }
  }, [viewRegion]);

  useEffect(() => {
    // when we change states through history or redoundo, the currentState.limit is should be the same size
    // if size is different then new state are being added when not changed directly by the user
    if (
      currentState &&
      !initialLoad.current &&
      stateSize.current === currentState.limit
    ) {
      // this check current index of the state, should only change when its different from the prev index
      if (currentState.index !== stateIdx.current) {
        const updatedGenomeConfig = _.cloneDeep(genomeConfig);
        updatedGenomeConfig.defaultRegion = new OpenInterval(
          userViewRegion._startBase!,
          userViewRegion._endBase!,
        );
        updatedGenomeConfig.navContext = userViewRegion._navContext;
        curGenomeConfig.current = updatedGenomeConfig;

        preload.current = true;
        refreshState();
        initializeTracks();
      }
    }
    stateSize.current = currentState.limit;
    stateIdx.current = currentState.index;
  }, [currentState]);

  useEffect(() => {
    const toolbarContainer = document.getElementById("toolbar-container");
    if (toolbarContainer) {
      toolbarContainer.style.visibility = configMenu ? "hidden" : "visible";
    }
  }, [configMenu]);

  // MARK: viewWIndow useeffect
  useEffect(() => {
    if (viewWindowConfigData.current) {
      if (dataIdx.current === viewWindowConfigData.current.dataIdx) {
        // fetch and redraw every on every view change for only genomealign !useFine and its secondary genome tracks
        if (hasGenomeAlign.current && !useFineModeNav.current) {
          const trackToFetch: Array<TrackModel> = [];
          const dataToFetchArr: any = [];
          const genomeAlignTracks: Array<TrackModel> = [];
          const trackState =
            viewWindowConfigData.current.dataIdx in
            globalTrackState.current.trackStates
              ? globalTrackState.current.trackStates[
                  viewWindowConfigData.current.dataIdx
                ].trackState
              : "";

          for (const key in trackManagerState.current.caches) {
            const trackCache = trackManagerState.current.caches[key];
            const curtrackModel = getTrackModelById(key);
            if (trackCache.trackType === "genomealign") {
              genomeAlignTracks.push(curtrackModel);
            } else if (!trackCache.usePrimaryNav) {
              if (
                trackManagerState.current.caches[key][
                  viewWindowConfigData.current.dataIdx
                ]?.dataCache
              ) {
                delete trackManagerState.current.caches[key][
                  viewWindowConfigData.current.dataIdx
                ].dataCache;
              }
              trackToFetch.push(curtrackModel);
            }
          }

          let genomeFeatureSegment: Array<FeatureSegment> =
            curGenomeConfig.current?.navContext.getFeaturesInInterval(
              viewWindowConfigData.current.contextNavCoord.start,
              viewWindowConfigData.current.contextNavCoord.end,
            );

          const regionLoci = genomeFeatureSegment.map((item, _index) =>
            item.getLocus(),
          );

          const genName = curGenomeConfig.current?.genome.getName();
          dataToFetchArr.push({
            primaryGenName: genName,
            trackModelArr: trackToFetch,
            visData: trackState.visData
              ? trackState.visData
              : trackState.genomicFetchCoord
                ? trackState.genomicFetchCoord[`${genName}`].primaryVisData
                : "",
            genomicLoci: regionLoci,
            visRegion: trackState.visRegion
              ? trackState.visRegion
              : trackState.genomicFetchCoord
                ? trackState.genomicFetchCoord[`${genName}`].primaryVisData
                    .visRegion
                : "",
            regionExpandLoci: trackState.regionExpandLoci,
            useFineModeNav: useFineModeNav.current,
            windowWidth: windowWidthRef.current,
            bpRegionSize: bpRegionSize.current,
            trackDataIdx: viewWindowConfigData.current.dataIdx,
            missingIdx: viewWindowConfigData.current.dataIdx,
          });

          enqueueGenomeAlignMessage({
            trackToFetch: genomeAlignTracks,
            visData: trackState.visData
              ? trackState.visData
              : trackState.genomicFetchCoord
                ? trackState.genomicFetchCoord[`${genName}`].primaryVisData
                : "",
            genomicLoci: trackState.regionLoci,
            viewWindowGenomicLoci: regionLoci,
            primaryGenName: genName,
            trackModelArr: genomeAlignTracks,
            regionExpandLoci: trackState.regionExpandLoci,
            useFineModeNav: useFineModeNav.current,
            windowWidth: windowWidthRef.current,
            bpRegionSize: bpRegionSize.current,
            fetchAfterGenAlignTracks: dataToFetchArr,
            trackDataIdx: viewWindowConfigData.current.dataIdx,
            missingIdx: viewWindowConfigData.current.dataIdx,
            dragX: dragX.current,
            fetchNewRegion: false,
          });
        }
        //__________________________________________________________

        const curTracksToDrawId = {};

        let aggGroup = {};
        for (let key in trackManagerState.current.caches) {
          const globalConfig = trackManagerState.current.globalConfig;
          const cache = trackManagerState.current.caches[key];
          if (globalConfig && key in globalConfig) {
            const curConfigOptions = globalConfig[key].configOptions;

            if (curConfigOptions.group) {
              aggGroup[key] = false;
            }

            if (
              cache.trackType === "geneannotation" ||
              cache.trackType === "refbed" ||
              cache.trackType in numericalTracks ||
              cache.trackType === "matplot" ||
              cache.trackType === "dynamic" ||
              cache.trackType === "dynamichic" ||
              cache.trackType === "dynamiclongrange" ||
              interactionTracks.has(cache.trackType) ||
              curConfigOptions?.displayMode === "density" ||
              (cache.trackType === "genomealign" && !useFineModeNav.current) ||
              ((cache.trackType === "vcf" || cache.trackType === "modbed") &&
                curConfigOptions?.displayMode === "auto" &&
                bpRegionSize.current > 100000)
            ) {
              curTracksToDrawId[key] = false;
            }
          }
        }
        if (Object.keys(aggGroup).length > 0) {
          aggViewWindowData(
            viewWindowConfigData.current.viewWindow,
            viewWindowConfigData.current.dataIdx,
            aggGroup,
          );
        }
        if (Object.keys(curTracksToDrawId).length > 0) {
          setViewWindowConfigChange({
            dataIdx: dataIdx.current,
            viewWindow: viewWindowConfigData.current.viewWindow,
            groupScale:
              globalTrackState.current.trackStates[dataIdx.current].trackState[
                "groupScale"
              ],
            trackToDrawId: curTracksToDrawId,
          });
        }
      }
    }
  }, [viewWindowConfigData.current]);
  function checkOutsideClick() {
    if (Object.keys(selectedTracks.current).length > 0) {
      onTrackUnSelect();
      onTracksChange(_.cloneDeep(trackManagerState.current.tracks));
      setConfigMenu(null);
    }
  }
  function handleOutsideConfigClick() {
    if (configMenu) {
      setConfigMenu(null);
    }
  }

  // MARK: render________________________________________
  return (
    <div
      style={{
        backgroundColor: "var(--bg-color)",
        paddingLeft: "18px",
        marginBottom: "10px",
      }}
    >
      {windowWidthRef.current > 0 && userViewRegion && showGenomeNav && (
        <GenomeNavigator
          selectedRegion={userViewRegion}
          genomeConfig={genomeConfig}
          windowWidth={windowWidthRef.current + legendWidth}
          onRegionSelected={onRegionSelected}
        />
      )}
      <OutsideClickDetector onOutsideClick={checkOutsideClick}>
        {showToolBar === true ? (
          <div
            style={{
              backgroundColor: "var(--bg-color)",
              width: `${windowWidthRef.current + legendWidth}px`,
              marginTop: padding / 3,
              marginBottom: padding / 3,
              display: "flex",
              flexDirection: windowWidthRef.current <= 600 ? "column" : "row",
              alignItems: windowWidthRef.current <= 600 ? "stretch" : "center",
              justifyContent: "end",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "start",
                flexWrap: windowWidthRef.current <= 1080 ? "wrap" : "nowrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  position: "relative",
                  zIndex: 999,
                }}
              >
                <div style={{ position: "relative" }}>
                  {Toolbar.toolbar ? (
                    <Toolbar.toolbar
                      highlights={highlights}
                      onNewRegionSelect={
                        !onNewRegionSelect ? () => {} : onNewRegionSelect
                      }
                      windowWidth={windowWidthRef.current}
                      buttonPadding={padding / 2}
                    />
                  ) : (
                    ""
                  )}
                </div>
              </div>
              <span
                style={{ width: "1px" }}
                className="self-stretch bg-gray-300 dark:bg-gray-600"
              />
              {userViewRegion && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  <div
                    className="bg tool-element"
                    style={{
                      display: "flex",
                      paddingLeft: padding - 2,
                      paddingRight: 6,
                      alignItems: "center",
                      flexShrink: 0,
                      fontStyle: "italic",
                    }}
                  >
                    <p
                      style={{
                        backgroundColor: "var(cd --bg-color)",
                        color: "var(--font-color)",
                        fontSize: `${Math.max(13, fontSize)}px`,
                        margin: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {niceBpCount(
                        trackManagerState.current.viewRegion.getWidth(),
                      )}{" "}
                      in {Math.round(windowWidthRef.current)}px, 1px equals{" "}
                      {niceBpCount(basePerPixel.current, true)}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center" }}>
                <div className="MetadataHeader-button" style={{}}>
                  <button
                    onClick={() => setIsShowingEditMenu(!isShowingEditMenu)}
                    className="flex items-center rounded-xs px-1"
                    style={{
                      border: isShowingEditMenu
                        ? "1px solid #1e40af"
                        : "1px solid #1d4ed8",
                      backgroundColor: "#eff6ff",
                      color: isShowingEditMenu ? "#1d4ed8" : "#2563eb",
                      transition: "all 0.2s",
                    }}
                    title="Metadata options"
                  >
                    <span className="text-xs">Metadata</span>
                    <motion.div
                      animate={{ rotate: isShowingEditMenu ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRightIcon />
                    </motion.div>
                  </button>
                  <div>
                    <MetadataSelectionMenu
                      terms={metaSets.terms}
                      style={
                        isShowingEditMenu ? undefined : { display: "none" }
                      }
                      onNewTerms={onNewTerms}
                      suggestedMetaSets={metaSets.suggestedMetaSets}
                      onRemoveTerm={onRemoveTerm}
                      tracks={trackManagerState.current.tracks}
                      onTracksChange={(updatedTracks) => {
                        // Re-wrap as TrackModel instances in case MetadataSelectionMenu
                        // spread them into plain objects (losing prototype methods).
                        const asTrackModels = updatedTracks.map((t: any) =>
                          t instanceof TrackModel ? t : new TrackModel(t),
                        );
                        trackManagerState.current.tracks = asTrackModels;
                        onTracksChange(asTrackModels);
                        addTermToMetaSets(asTrackModels);
                        // Sync trackComponents so each track re-renders with updated metadata
                        setTrackComponents((prev) =>
                          prev.map((component) => ({
                            ...component,
                            trackModel:
                              asTrackModels.find(
                                (t: any) => t.id === component.trackModel.id,
                              ) ?? component.trackModel,
                          })),
                        );
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",

                marginTop: windowWidthRef.current <= 1080 ? padding / 2 : 0,
              }}
            >
              <MetadataHeader
                terms={metaSets.terms}
                onNewTerms={onNewTerms}
                suggestedMetaSets={metaSets.suggestedMetaSets}
                onRemoveTerm={onRemoveTerm}
                windowWidth={windowWidthRef.current}
                fontSize={Math.max(14, fontSize)}
                padding={padding}
                tracks={trackManagerState.current.tracks}
                termValues={metaSets.termValues}
                onTermValueClick={onColorBoxClick}
              />
            </div>
          </div>
        ) : (
          ""
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            outline: "1px solid #9AA6B2",

            width: `${windowWidthRef.current + legendWidth}px`,
            overflowX: "hidden",
            overflowY: "hidden",
          }}
        >
          <div
            onPointerDown={handleMouseDown}
            ref={block}
            style={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
              cursor: (() => {
                switch (tool.tool) {
                  case Tool.Reorder:
                    return "ns-resize";
                  case Tool.Highlight:
                    return "ew-resize";
                  case Tool.Zoom:
                    return "zoom-in";

                  default:
                    if (dragOn.current) {
                      return "pointer";
                    }
                    return "";
                }
              })(),
            }}
          >
            <div ref={horizontalLineRef} className="horizontal-line" />
            <div ref={verticalLineRef} className="vertical-line" />

            <div
              style={{
                display: "flex",
                flexDirection: "row",

                width: `${windowWidthRef.current + legendWidth}px`,
              }}
            >
              {trackComponents ? (
                <div ref={trackWrapperRef} onClick={handleOutsideConfigClick}>
                  <SortableList
                    items={trackComponents}
                    onChange={handleReorder}
                    renderItem={(item) => (
                      <SortableList.Item
                        id={item.id}
                        onMouseDown={(event) =>
                          handleShiftSelect(event, item.id)
                        }
                        onContextMenu={(event) => handleRightClick(event, item)}
                        selectedTool={selectedTool}
                      >
                        <div
                          key={item.id}
                          style={{
                            width: `${windowWidthRef.current + legendWidth}px`,
                            position: "relative",
                            paddingTop: "1px",
                            paddingBottom: "1px",
                          }}
                        >
                          {/* when selected we want to display an animated border, to do this we have a empty, noninteractable component above our 
                            track component, if we dont do this, the border will try to align with the track which has a difererent width from the view causing err.
                            */}
                          {item.trackModel.isSelected ? (
                            <div className="Track-border-container Track-selected-border"></div>
                          ) : (
                            <div className="Track-border-container"></div>
                          )}

                          <item.component
                            id={item.trackModel.id}
                            trackModel={item.trackModel}
                            legendRef={item.legendRef}
                            bpRegionSize={bpRegionSize.current}
                            useFineModeNav={useFineModeNav.current}
                            basePerPixel={basePerPixel.current}
                            side={side.current}
                            windowWidth={windowWidthRef.current}
                            genomeConfig={curGenomeConfig.current}
                            dataIdx={dataIdx.current}
                            setShow3dGene={setShow3dGene}
                            isThereG3dTrack={isThereG3dTrack}
                            dragX={dragX.current}
                            signalTrackLoadComplete={signalTrackLoadComplete}
                            sentScreenshotData={sentScreenshotData}
                            newDrawData={draw}
                            trackManagerState={trackManagerState}
                            globalTrackState={globalTrackState}
                            isScreenShotOpen={isScreenShotOpen}
                            highlightElements={highlightElements}
                            viewWindowConfigChange={viewWindowConfigChange}
                            metaSets={metaSets}
                            onColorBoxClick={onColorBoxClick}
                            userViewRegion={userViewRegion}
                            messageData={messageData}
                            Toolbar={Toolbar}
                            handleRetryFetchTrack={handleRetryFetchTrack}
                            initialLoad={initialLoad}
                            selectedRegionSet={selectedRegionSet}
                            legendWidth={legendWidth}
                          />
                        </div>
                      </SortableList.Item>
                    )}
                  />

                  {highlightElements.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: legendWidth,
                        width: windowWidthRef.current,
                        height: "100%",
                        pointerEvents: "none",
                        zIndex: 5,
                      }}
                    >
                      {highlightElements.map((item, index) => {
                        if (!item.display) return null;
                        return (
                          <div
                            key={index}
                            style={{
                              position: "absolute",
                              backgroundColor: item.color,
                              top: 0,
                              height: "100%",
                              left: 0,
                              transform: `translateX(${item.xPos}px)`,
                              width: item.width,
                              pointerEvents: "none",
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                ""
              )}

              <div
                style={{
                  display: "flex",
                  position: "absolute",

                  zIndex: 10,
                }}
              >
                {selectedTool &&
                selectedTool.isSelected &&
                (selectedTool.title === Tool.Highlight ||
                  selectedTool.title === Tool.Zoom) ? (
                  <SelectableGenomeArea
                    selectableRegion={curViewWindowRegion}
                    dragLimits={
                      new OpenInterval(
                        legendWidth,
                        windowWidthRef.current + legendWidth,
                      )
                    }
                    xOffset={
                      -(
                        (dragX.current % windowWidthRef.current) -
                        (side.current === "left" ? windowWidthRef.current : 0)
                      )
                    }
                    onRegionSelected={onRegionSelected}
                    selectedTool={selectedTool}
                  >
                    <div
                      style={{
                        height: block.current
                          ? block.current?.getBoundingClientRect().height
                          : 0,
                        zIndex: 3,
                        width: `${windowWidthRef.current + legendWidth}px`,
                      }}
                    ></div>
                  </SelectableGenomeArea>
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>
        </div>
        {configMenu ? (
          <ConfigMenuComponent
            key={configMenu.key}
            menuData={configMenu}
            darkTheme={darkTheme}
            parentBlockDimensions={trackWrapperRef.current?.getBoundingClientRect()}
            legendWidth={legendWidth}
          />
        ) : null}
      </OutsideClickDetector>
    </div>
  );
});
export default memo(TrackManager);
