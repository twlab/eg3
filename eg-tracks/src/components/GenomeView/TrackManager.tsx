import { createRef, memo, useEffect, useRef, useState } from "react";
const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import OpenInterval from "../../models/OpenInterval";
import { FeatureSegment } from "../../models/FeatureSegment";
import ChromosomeInterval from "../../models/ChromosomeInterval";
import Feature from "../../models/Feature";
import NavigationContext from "../../models/NavigationContext";
import { HicSource } from "../../getRemoteData/hicSource";
import { trackOptionMap } from "./TrackComponents/defaultOptionsMap";
import ThreedmolContainer from "./TrackComponents/3dmol/ThreedmolContainer";
import TrackModel from "../../models/TrackModel";
import _, { throttle } from "lodash";
import ConfigMenuComponent from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";
import HighlightMenu from "./ToolComponents/HighlightMenu";
import TrackFactory from "./TrackComponents/TrackFactory";
import BamSource from "../../getRemoteData/BamSource";
import { SelectableGenomeArea } from "./genomeNavigator/SelectableGenomeArea";
import React from "react";
import OutsideClickDetector from "./TrackComponents/commonComponents/OutsideClickDetector";
import { getTrackConfig } from "../../trackConfigs/config-menu-models.tsx/getTrackConfig";
import { TrackState } from "./TrackComponents/CommonTrackStateChangeFunctions.tsx/createNewTrackState";
import TrackRegionController from "./genomeNavigator/TrackRegionController";
import {
  getDeDupeArrMatPlot,
  trackUsingExpandedLoci,
} from "./TrackComponents/CommonTrackStateChangeFunctions.tsx/cacheFetchedData";
import { trackGlobalState } from "./TrackComponents/CommonTrackStateChangeFunctions.tsx/trackGlobalState";
import { GenomeConfig } from "../../models/genomes/GenomeConfig";
import { niceBpCount } from "../../models/util";
import { ITrackModel, Tool } from "../../types";
import {
  GroupedTrackManager,
  numericalTracks,
} from "./TrackComponents/GroupedTrackManager";
import GenomeNavigator from "./genomeNavigator/GenomeNavigator";

import { SortableList } from "./TrackComponents/commonComponents/chr-order/SortableTrack";
import { formatDataByType } from "./TrackComponents/displayModeComponentMap";
import MetadataHeader from "./ToolComponents/MetadataHeader";
// import { fetchGenomicData } from "../../getRemoteData/fetchData";
// import { fetchGenomeAlignData } from "../../getRemoteData/fetchGenomeAlign";
import {
  arraysHaveSameTrackModels,
  getGenomeAlignTracksNotInSecondArray,
} from "../../util";
import { generateUUID } from "../../util";
import { fetchGenomicData } from "../../getRemoteData/fetchFunctions";
const groupManager = new GroupedTrackManager();

/**
 * Filters trackModels of type "genomealign" from the first array where their IDs
 * don't exist in the second array
 * @param {TrackModel[]} trackModelsArray1 - First array of trackModels to filter from
 * @param {TrackModel[]} trackModelsArray2 - Second array of trackModels to check IDs against
 * @returns {TrackModel[]} Array of trackModels with type "genomealign" whose IDs are not in the second array
 */

export const convertTrackModelToITrackModel = (
  track: TrackModel
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
});

export const zoomFactors: { [key: string]: { [key: string]: any } } = {
  "6": { factor: 4 / 3, text: "⅓×", title: "Zoom out 1/3-fold" },
  "7": { factor: 2, text: "1×", title: "Zoom out 1-fold (Alt+O)" },
  "8": { factor: 5, text: "5×", title: "Zoom out 5-fold" },
  "9": { factor: 2 / 3, text: "⅓×", title: "Zoom in 1/3-fold" },
  "10": { factor: 0.5, text: "1×", title: "Zoom in 1-fold (Alt+I)" },
  "11": { factor: 0.2, text: "5×", title: "Zoom in 5-fold" },
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
  let visRegionFeatures: Feature[] = [];

  for (let feature of alignment._navContext._features) {
    let newChr = new ChromosomeInterval(
      feature.locus.chr,
      feature.locus.start,
      feature.locus.end
    );
    visRegionFeatures.push(new Feature(feature.name, newChr));
  }

  let visRegionNavContext = new NavigationContext(
    alignment._navContext._name,
    visRegionFeatures
  );

  let visRegion = new DisplayedRegionModel(
    visRegionNavContext,
    alignment._startBase,
    alignment._endBase
  );
  return visRegion;
}

export function bpNavToGenNav(bpNaletr: Array<any>, genome: GenomeConfig) {
  let genRes: Array<any> = [];
  for (let bpNav of bpNaletr) {
    let genomeFeatureSegment: Array<FeatureSegment> =
      genome.navContext.getFeaturesInInterval(
        "start" in bpNav ? bpNav.start : bpNav._startBase,
        "end" in bpNav ? bpNav.end : bpNav._endBase
      );

    genRes.push(genomeFeatureSegment.map((item, _index) => item.getLocus()));
  }

  return genRes;
}

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
    highlightSearch: boolean
  ) => void;
  tool: any;
  Toolbar: { [key: string]: any };
  viewRegion?: any;
  showGenomeNav: boolean;
  setScreenshotData: any;
  isScreenShotOpen: boolean;
  selectedRegionSet: any;
  setShow3dGene: any;
  infiniteScrollWorkers: React.MutableRefObject<{
    instance: { fetchWorker: Worker; hasOnMessage: boolean }[];
    worker: { fetchWorker: Worker; hasOnMessage: boolean }[];
  } | null>;
  fetchGenomeAlignWorker: React.MutableRefObject<{
    fetchWorker: Worker;
    hasOnMessage: boolean;
  } | null>;
  isThereG3dTrack: boolean;
  onHeightChange?: (height: number) => void; // Optional callback for height changes
}
const TrackManager: React.FC<TrackManagerProps> = memo(function TrackManager({
  windowWidth,
  legendWidth,
  genomeConfig,
  userViewRegion,
  highlights,
  tracks,

  onNewRegion,
  onNewHighlight,
  onTracksChange,
  onNewRegionSelect,
  tool,
  Toolbar,
  showGenomeNav,
  isThereG3dTrack,
  setScreenshotData,
  selectedRegionSet,
  isScreenShotOpen,
  setShow3dGene,
  infiniteScrollWorkers,
  fetchGenomeAlignWorker,
  onHeightChange,
}) {
  //useRef to store data between states without re render the component
  const completedFetchedRegion = useRef<{ [key: string]: any }>({
    key: -0,
    done: {},
  });
  const useFineModeNav = useRef(false);
  const prevWindowWidth = useRef<number>(0);
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
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const mouseGenomicPositionRef = useRef({ basePair: 0, chromosome: "" });
  const mouseRelativePositionRef = useRef({ x: 0, y: 0 });
  const lastClickTimeRef = useRef(0);
  const doubleClickThreshold = 300; // milliseconds
  const horizontalLineRef = useRef<any>(0);
  const verticalLineRef = useRef<any>(0);
  const trackFetchedDataCache = useRef<{ [key: string]: any }>({});
  const fetchInstances = useRef<{ [key: string]: any }>({});
  const isMouseInsideRef = useRef(false);
  const globalTrackConfig = useRef<{ [key: string]: any }>({
    viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
  });
  const trackManagerState = useRef<TrackState>({
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

    viewRegion: new DisplayedRegionModel(
      genomeConfig.navContext,
      genomeConfig.defaultRegion.start,
      genomeConfig.defaultRegion.end
    ),
    trackLegendWidth: legendWidth,
    tracks:
      tracks && tracks.length >= 0
        ? tracks.filter((trackModel) => trackModel.type !== "g3d")
        : genomeConfig.defaultTracks.filter(
            (trackModel) => trackModel.type !== "g3d"
          ),
  });

  const configMenuPos = useRef<{ [key: string]: any }>({});
  const lastDragX = useRef(0);

  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const basePerPixel = useRef(0);
  const frameID = useRef(0);
  const lastX = useRef(0);
  const dragX = useRef(0);
  const hasGenomeAlign = useRef(false);
  const isToolSelected = useRef(false);
  const needToFetchAddTrack = useRef(false);
  const side = useRef("right");
  const isDragging = useRef(false);
  const rightSectionSize = useRef<Array<any>>([windowWidth]);
  const leftSectionSize = useRef<Array<any>>([]);
  const preloadedTracks = useRef<{ [key: string]: any }>({});
  const screenshotDataObj = useRef<{ [key: string]: any }>({});
  const preload = useRef<boolean>(false);
  const dataIdx = useRef(-0);
  const globalTrackState = useRef<{ [key: string]: any }>({
    rightIdx: 0,
    leftIdx: 1,
    viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
    trackStates: {},
  });
  const updateLinePosition = useRef(
    throttle((x, y) => {
      horizontalLineRef.current.style.top = `${y}px`;
      verticalLineRef.current.style.left = `${x}px`;
    }, 10)
  ).current;
  const startingBpArr = useRef<Array<any>>([]);
  const viewWindowConfigData = useRef<{
    viewWindow: OpenInterval;
    groupScale: any;
    dataIdx: number;
  } | null>(null);

  // These states are used to update the tracks with new fetch(data);
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
  const [newDrawData, setNewDrawData] = useState<{ [key: string]: any } | null>(
    null
  );
  const [messageData, setMessageData] = useState<{ [key: string]: any }>({});
  [];
  const [trackComponents, setTrackComponents] = useState<Array<any>>([]);

  const [selectedTool, setSelectedTool] = useState<{ [key: string]: any }>({
    isSelected: false,
    title: "none",
  });
  const [draw, setDraw] = useState<{ [key: string]: any }>({});

  const [highlightElements, setHighLightElements] = useState<Array<any>>([]);
  const [configMenu, setConfigMenu] = useState<{ [key: string]: any } | null>(
    null
  );
  const [metaSets, setMetaSets] = useState<{ [key: string]: any }>({
    suggestedMetaSets: new Set(),
    terms: new Array(),
  });

  const [viewWindowConfigChange, setViewWindowConfigChange] = useState<null | {
    [key: string]: any;
  }>(null);
  const [applyTrackConfigChange, setApplyTrackConfigChange] = useState<{
    [key: string]: any;
  }>({});

  // MOUSE EVENTS FUNCTION HANDLER, HOW THE TRACK WILL CHANGE BASED ON WHAT THE USER DOES: DRAGGING, MOUSESCROLL, CLICK
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  // MARK: FetchQueue
  //popqueue when fetching data. Lifo
  const messageQueue = useRef<any>([]);
  const isWorkerBusy = useRef(false);
  const genomeAlignMessageQueue = useRef<any>([]);
  const isfetchGenomeAlignWorkerBusy = useRef(false);

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
  const throttleOnNewRegionSelect = useRef(
    throttleViewRegion((startbase, endbase, highlightSearch) => {
      onNewRegionSelect(startbase, endbase, highlightSearch);
    }, 150)
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
    genomeAlignMessageQueue.current.push(message);

    processGenomeAlignQueue();
  };
  const processQueue = async () => {
    if (messageQueue.current.length === 0) {
      setMessageData({});
      return;
    }

    setMessageData(getMessageData());
    const message = messageQueue.current.pop();

    // Split message by trackModelArr type
    const hicTypes = { hic: "", dynamichic: "", bam: "" };

    // message is an array of objects
    const intMessages: Array<any> = [];
    const normalMessages: Array<any> = [];

    for (const msgObj of message) {
      if (
        Array.isArray(msgObj.trackModelArr) &&
        msgObj.trackModelArr.length > 0
      ) {
        const intTrackModels: any[] = [];
        const normalTrackModels: any[] = [];
        for (const track of msgObj.trackModelArr) {
          if (track.type in hicTypes) {
            intTrackModels.push(track);
          } else {
            normalTrackModels.push(track);
          }
        }
        if (intTrackModels.length > 0) {
          intMessages.push({
            ...msgObj,
            trackModelArr: intTrackModels,
          });
        }
        if (normalTrackModels.length > 0) {
          normalMessages.push({
            ...msgObj,
            trackModelArr: normalTrackModels,
          });
        }
      }
    }

    // Helper to split an array into N chunks
    function splitArrayIntoChunks(arr, numChunks) {
      const chunks: Array<any> = Array.from({ length: numChunks }, () => []);
      arr.forEach((item, idx) => {
        chunks[idx % numChunks].push(item);
      });
      return chunks;
    }

    // Send intMessages to instance workers
    if (
      infiniteScrollWorkers.current &&
      (infiniteScrollWorkers.current.instance.length > 0 ||
        infiniteScrollWorkers.current.worker.length > 0)
    ) {

      if (
        intMessages.length > 0 &&
        infiniteScrollWorkers.current.instance.length > 0
      ) {
        const numWorkers = infiniteScrollWorkers.current.instance.length;
        for (let i = 0; i < numWorkers; i++) {
          const messagesForWorker: Array<any> = [];
          for (const msgObj of intMessages) {
            const chunks = splitArrayIntoChunks(
              msgObj.trackModelArr,
              numWorkers
            );
            if (chunks[i].length > 0) {
              messagesForWorker.push({ ...msgObj, trackModelArr: chunks[i] });
            }
          }
          if (messagesForWorker.length > 0) {
            infiniteScrollWorkers.current.instance[i].fetchWorker.postMessage(
              messagesForWorker
            );
          }
        }
      }

      // Send normalMessages to worker workers
      if (
        normalMessages.length > 0 &&
        infiniteScrollWorkers.current.worker.length > 0
      ) {
        const numWorkers = infiniteScrollWorkers.current.worker.length;
        for (let i = 0; i < numWorkers; i++) {
          const messagesForWorker: Array<any> = [];
          for (const msgObj of normalMessages) {
            const chunks = splitArrayIntoChunks(
              msgObj.trackModelArr,
              numWorkers
            );
            if (chunks[i].length > 0) {
              messagesForWorker.push({ ...msgObj, trackModelArr: chunks[i] });
            }
          }

          if (messagesForWorker.length > 0) {
            infiniteScrollWorkers.current.worker[i].fetchWorker.postMessage(
              messagesForWorker
            );
          }
        }
      }
    } else {

      // Send normalMessages to fetch functions (non-worker version)
      const numWorkers = message[0].trackModelArr.length;
      const chunks = splitArrayIntoChunks(message[0].trackModelArr, numWorkers);
      // Launch independent async operations for each chunk
      for (let i = 0; i < numWorkers; i++) {
        const messagesForWorker: Array<any> = [];
        for (const msgObj of message) {
          if (chunks[i].length > 0) {
            messagesForWorker.push({ ...msgObj, trackModelArr: chunks[i] });
          }
        }
        if (messagesForWorker.length > 0) {
          // Launch async operation without awaiting - process results independently
          fetchGenomicData(messagesForWorker)
            .then((results) => {
              // Call createInfiniteOnMessage once with the entire results array
              createInfiniteOnMessage({ data: results });
            })
            .catch((error) => {
              console.error("Error fetching genomic data:", error);
            });
        }
      }
    }
  };

  const processGenomeAlignQueue = () => {
    if (genomeAlignMessageQueue.current.length === 0) {
      return;
    }
    isfetchGenomeAlignWorkerBusy.current = true;
    const message = genomeAlignMessageQueue.current.pop();

    fetchGenomeAlignWorker.current!.fetchWorker.postMessage(message);
  };

  // MARK: mouseAction
  const handleKeyDown = (event: { key: string }) => {
    if (event.key === "Escape") {
      // let newSelectedTool: { [key: string]: any } = {};
      // newSelectedTool["tool"] = "none";
      // newSelectedTool["isSelected"] = false;
      // setSelectedTool(newSelectedTool);
      onTrackUnSelect();
      onConfigMenuClose();
    }
  };

  function handleMouseEnter() {
    isMouseInsideRef.current = true;
  }

  function handleMouseLeave() {
    isMouseInsideRef.current = false;
    // Hide crosshair lines when mouse leaves
    if (horizontalLineRef.current && verticalLineRef.current) {
      horizontalLineRef.current.style.display = "none";
      verticalLineRef.current.style.display = "none";
    }
  }

  function calculateGenomicPosition(x: number) {
    // Calculate the genomic position based on mouse x coordinate
    if (
      !trackManagerState.current.viewRegion._endBase ||
      !trackManagerState.current.viewRegion._startBase
    ) {
      return { basePair: 0, chromosome: "" };
    }

    const viewportBp =
      trackManagerState.current.viewRegion._endBase -
      trackManagerState.current.viewRegion._startBase;
    const pixelToBp = viewportBp / windowWidth;
    const mouseBp =
      trackManagerState.current.viewRegion._startBase +
      (x - legendWidth) * pixelToBp;

    // Find which chromosome this position belongs to
    let chromosome = "";
    if (genomeConfig.navContext && genomeConfig.navContext._features) {
      for (const feature of genomeConfig.navContext._features) {
        if (mouseBp >= feature.locus.start && mouseBp <= feature.locus.end) {
          chromosome = feature.locus.chr;
          break;
        }
      }
    }

    return { basePair: Math.round(mouseBp), chromosome };
  }

  function handleMove(e: { clientX: number; clientY: number; pageX: number }) {
    if (isMouseInsideRef.current) {
      const parentRect = block.current!.getBoundingClientRect();
      const x = e.clientX - parentRect.left;
      const y = e.clientY - parentRect.top;

      // Update all mouse position references
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
      mouseRelativePositionRef.current = { x, y };
      mouseGenomicPositionRef.current = calculateGenomicPosition(x);

      // Show and update crosshair lines
      if (horizontalLineRef.current && verticalLineRef.current) {
        horizontalLineRef.current.style.display = "block";
        verticalLineRef.current.style.display = "block";
        updateLinePosition(x, y);
      }
    } else {
      // Hide crosshair lines when mouse is outside
      if (horizontalLineRef.current && verticalLineRef.current) {
        horizontalLineRef.current.style.display = "none";
        verticalLineRef.current.style.display = "none";
      }
    }

    if (!isDragging.current || isToolSelected.current) {
      return;
    }

    const deltaX = lastX.current - e.pageX;
    lastX.current = e.pageX;
    let tempDragX = dragX.current;
    tempDragX -= deltaX;

    if (
      side.current === "right" &&
      -tempDragX >= Math.floor(sumArray(rightSectionSize.current) + windowWidth)
    ) {
      return;
    } else if (
      side.current === "left" &&
      tempDragX >= Math.floor(sumArray(leftSectionSize.current) + windowWidth)
    ) {
      return;
    }
    dragX.current -= deltaX;

    //can change speed of scroll by mutipling dragX.current by 0.5 when setting the track position
    // .5 = * 1 ,1 =
    cancelAnimationFrame(frameID.current);

    trackComponents.forEach((component, _i) => {
      frameID.current = requestAnimationFrame(() => {
        component.posRef.current!.style.transform = `translate3d(${dragX.current}px, 0px, 0)`;
      });
    });
  }

  function handleClick(e: MouseEvent) {
    if (isToolSelected.current) {
      return;
    }

    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - lastClickTimeRef.current;

    if (timeSinceLastClick < doubleClickThreshold) {
      handleDoubleClick(e);
    } else {
      handleSingleClick(e);
    }

    lastClickTimeRef.current = currentTime;
  }

  function handleSingleClick(e: MouseEvent) {
    console.log("Single click at:", {
      screen: { x: e.clientX, y: e.clientY },
      relative: mouseRelativePositionRef.current,
      genomic: mouseGenomicPositionRef.current,
    });

    // Add your single click logic here
    // For example, you might want to select a track or feature at this position
  }

  function handleDoubleClick(e: MouseEvent) {
    console.log("Double click at:", {
      screen: { x: e.clientX, y: e.clientY },
      relative: mouseRelativePositionRef.current,
      genomic: mouseGenomicPositionRef.current,
    });

    // Add your double click logic here
    // For example, you might want to zoom in on the clicked position
    const genomicPos = mouseGenomicPositionRef.current;
    if (
      genomicPos.basePair > 0 &&
      trackManagerState.current.viewRegion._endBase &&
      trackManagerState.current.viewRegion._startBase
    ) {
      const currentRegionSize =
        trackManagerState.current.viewRegion._endBase -
        trackManagerState.current.viewRegion._startBase;
      const newRegionSize = currentRegionSize / 2; // Zoom in 2x
      const newStart = Math.max(0, genomicPos.basePair - newRegionSize / 2);
      const newEnd = newStart + newRegionSize;

      onNewRegion(newStart, newEnd);
    }
  }

  function handleGenomeClick(e: MouseEvent, trackModel?: any) {
    e.preventDefault();
    console.log("Genome click at:", {
      screen: { x: e.clientX, y: e.clientY },
      relative: mouseRelativePositionRef.current,
      genomic: mouseGenomicPositionRef.current,
      track: trackModel,
    });

    // Add your context menu logic here
    // For example, you might want to show a context menu
  }

  function handleWheel(e: WheelEvent) {
    if (!isMouseInsideRef.current || isToolSelected.current) {
      return;
    }

    e.preventDefault();

    // Calculate zoom direction (positive = zoom out, negative = zoom in)
    const zoomDirection = e.deltaY > 0 ? 1 : -1;
    const zoomFactor = zoomDirection > 0 ? 1.2 : 0.8; // Zoom out 20% or zoom in 20%

    if (
      !trackManagerState.current.viewRegion._endBase ||
      !trackManagerState.current.viewRegion._startBase
    ) {
      return;
    }

    const currentStart = trackManagerState.current.viewRegion._startBase;
    const currentEnd = trackManagerState.current.viewRegion._endBase;
    const currentSize = currentEnd - currentStart;
    const newSize = currentSize * zoomFactor;

    // Calculate zoom center based on mouse position
    const mousePos = mouseGenomicPositionRef.current;
    let centerBp = mousePos.basePair;

    // If mouse position is not valid, use center of current view
    if (!centerBp || centerBp < currentStart || centerBp > currentEnd) {
      centerBp = currentStart + currentSize / 2;
    }

    // Calculate new start and end positions
    const newStart = Math.max(0, centerBp - newSize / 2);
    const newEnd = newStart + newSize;

    // Ensure we don't exceed genome bounds
    const maxBp = genomeConfig.navContext._totalBases || newEnd;
    if (newEnd > maxBp) {
      const adjustedStart = Math.max(0, maxBp - newSize);
      onNewRegion(adjustedStart, maxBp);
    } else {
      onNewRegion(newStart, newEnd);
    }

    console.log("Mouse wheel zoom:", {
      direction: zoomDirection > 0 ? "out" : "in",
      factor: zoomFactor,
      center: centerBp,
      newRegion: { start: newStart, end: newEnd },
    });
  }

  function handleMouseDown(e: any) {
    if (e.button !== 0) {
      // If not the left button, exit the function
      return;
    }

    isDragging.current = true;
    lastX.current = e.pageX;

    e.preventDefault();
  }

  function handleMouseUp() {
    isDragging.current = false;
    if (lastDragX.current === dragX.current) {
      return;
    }
    lastDragX.current = dragX.current;

    const curBp =
      leftStartCoord.current + -dragX.current * basePerPixel.current;

    if (curBp > genomeConfig.navContext._totalBases || curBp <= 0) {
      return;
    }
    trackManagerState.current.viewRegion._startBase = curBp;
    trackManagerState.current.viewRegion._endBase =
      curBp + bpRegionSize.current;

    onNewRegion(curBp, curBp + bpRegionSize.current);

    bpX.current = curBp;

    const curDataIdx = Math.ceil(dragX.current / windowWidth);
    if (dragX.current > 0 && side.current === "right") {
      side.current = "left";
    } else if (dragX.current <= 0 && side.current === "left") {
      side.current = "right";
    }

    let curViewWindow =
      side.current === "right"
        ? new OpenInterval(
            -((dragX.current % windowWidth) + -windowWidth),
            -((dragX.current % windowWidth) + -windowWidth) + windowWidth
          )
        : new OpenInterval(
            windowWidth * 3 - ((dragX.current % windowWidth) + windowWidth),
            windowWidth * 3 - (dragX.current % windowWidth)
          );

    const genomeName = genomeConfig.genome.getName();
    if (
      useFineModeNav.current &&
      globalTrackState.current.trackStates[curDataIdx].trackState
        .genomicFetchCoord
    ) {
      let trackState = {
        ...globalTrackState.current.trackStates[curDataIdx].trackState,
      };

      const primaryVisData =
        trackState.genomicFetchCoord[genomeName].primaryVisData;
      const startViewWindow = primaryVisData.viewWindow;
      const tmpCur = new OpenInterval(curViewWindow.start, curViewWindow.end);
      const start = tmpCur.start - windowWidth + startViewWindow.start;
      const end = start + windowWidth;
      curViewWindow = new OpenInterval(start, end);
    }

    if (
      -dragX.current >= sumArray(rightSectionSize.current) &&
      dragX.current < 0
    ) {
      rightSectionSize.current.push(windowWidth);

      fetchGenomeData(0, "right", curViewWindow);
    } else if (
      dragX.current >= sumArray(leftSectionSize.current) &&
      dragX.current > 0
    ) {
      leftSectionSize.current.push(windowWidth);
      fetchGenomeData(0, "left", curViewWindow);
    }

    if (dataIdx.current === curDataIdx) {
      viewWindowConfigData.current = {
        viewWindow: curViewWindow,
        groupScale: null,
        dataIdx: curDataIdx,
      };
    } else {
      dataIdx.current = curDataIdx;

      queueRegionToFetch(dataIdx.current);
    }

    globalTrackState.current.viewWindow = curViewWindow;
  }

  // MARK: TOUCH EVENTS
  // Touch event handlers that mirror mouse functionality
  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length !== 1) {
      return; // Only handle single touch
    }

    const touch = e.touches[0];
    isDragging.current = true;
    lastX.current = touch.pageX;

    e.preventDefault();
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length !== 1) {
      return; // Only handle single touch
    }

    const touch = e.touches[0];

    // Mirror the handleMove functionality
    handleMove({
      clientX: touch.clientX,
      clientY: touch.clientY,
      pageX: touch.pageX,
    });
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    // Mirror handleMouseUp functionality
    handleMouseUp();
  }

  // DOM touch event handlers for addEventListener
  function handleDOMTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) {
      return; // Only handle single touch
    }

    const touch = e.touches[0];
    isDragging.current = true;
    lastX.current = touch.pageX;

    e.preventDefault();
  }

  function handleDOMTouchMove(e: TouchEvent) {
    if (e.touches.length !== 1) {
      return; // Only handle single touch
    }

    const touch = e.touches[0];

    // Mirror the handleMove functionality
    handleMove({
      clientX: touch.clientX,
      clientY: touch.clientY,
      pageX: touch.pageX,
    });
  }

  function handleDOMTouchEnd(e: TouchEvent) {
    // Mirror handleMouseUp functionality
    handleMouseUp();
  }

  // MARK: GloCONFIG
  // FUNCTIONS HANDLER FOR WHEN CONFIG FOR TRACKS CHANGES OR WHEN USER IS SELECTING MULITPLE TRACKS
  // the trackmanager will handle the config menu when mutiple  tracks are selected otherwise each
  // track will create their own configmenu.
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________

  function updateGlobalTrackConfig(config: any) {
    globalTrackConfig.current[`${config.trackModel.id}`] = _.cloneDeep(config);
  }
  function createConfigMenuData(
    trackId: any,
    key: string | number | null = null,
    value: string | number | null = null
  ) {
    let menuComponents: Array<any> = [];
    let optionsObjects: Array<any> = [];
    const curtracks: Array<any> = [];
    const selectCount = Object.keys(selectedTracks.current).length;
    let fileInfos: { [key: string]: any } = {};
    for (const config in selectedTracks.current) {
      let trackModel = _.cloneDeep(
        trackManagerState.current.tracks.find(
          (trackModel) => trackModel.id === config
        ) || null
      );
      if (trackModel) {
        trackModel.options = _.cloneDeep(
          globalTrackConfig.current[`${config}`].configOptions
        );
        if (!trackModel.options) {
          trackModel.options = {};
        }
        if (value && key === "displayMode") {
          trackModel.options.displayMode = value;
        }
        if (value && key === "scoreScale") {
          trackModel.options.scoreScale = value;
        }
        if (trackModel.type === "hic") {
          fileInfos[`${trackModel.id}`] =
            fetchInstances.current[`${trackModel.id}`].getFileInfo();
        }
        trackModel.options["trackId"] = config;
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
    trackId: string | null = null
  ) {
    let newSelected: { [key: string]: any } = {};
    // these are options that changes the configMenu so we need to recreate the
    // the configmenu
    if (key === "displayMode" || key === "scoreScale") {
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
                ...globalTrackConfig.current[`${item.id}`].configOptions,
                ...item.options,
              },
              trackModel: item,
              id: item.id,
              usePrimaryNav: false,
            });

            const trackToDrawId = {};
            for (const key in trackFetchedDataCache.current) {
              if (key in selectedTracks.current) {
                trackToDrawId[key] = {};
                const curTrack = trackFetchedDataCache.current[key];

                for (const cacheDataIdx in curTrack) {
                  if (isInteger(cacheDataIdx)) {
                    if (
                      "dataCache" in
                      trackFetchedDataCache.current[key][cacheDataIdx]
                    ) {
                      delete trackFetchedDataCache.current[key][cacheDataIdx]
                        .dataCache;
                    }
                  }
                }
              }
            }
          } else if (key === "aggregateMethod") {
            const trackToDrawId = {};
            for (const key in trackFetchedDataCache.current) {
              if (key in selectedTracks.current) {
                trackToDrawId[key] = {};
                const curTrack = trackFetchedDataCache.current[key];

                for (const cacheDataIdx in curTrack) {
                  if (isInteger(cacheDataIdx)) {
                    if (
                      "xvalues" in
                      trackFetchedDataCache.current[key][cacheDataIdx]
                    ) {
                      delete trackFetchedDataCache.current[key][cacheDataIdx]
                        .xvalues;
                    }
                  }
                }
              }
            }
          }
        }
      });
    }
    if (key === "normalization" || key === "binSize") {
      queueRegionToFetch(dataIdx.current);
    } else {
      setApplyTrackConfigChange(newSelected);
    }

    onTracksChange(_.cloneDeep(trackManagerState.current.tracks));
  }

  function renderTrackSpecificConfigMenu(
    x: number,
    y: number,
    trackId: string
  ) {
    configMenuPos.current = { left: x, top: y };

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
        if (trackModel.id === trackId) {
          return new TrackModel({
            ...trackModel,
            isSelected: isSelected,
          });
        }
        return trackModel;
      });

      onTracksChange(newTracks);

      if (configMenu && Object.keys(selectedTracks.current).length > 0) {
        renderTrackSpecificConfigMenu(e.pageX, e.pageY, trackId);
      } else {
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
        trackDetails.trackModel.id
      );
    } else {
      onTrackUnSelect();
      trackManagerState.current.tracks.map((trackModel) => {
        if (trackModel.id === trackDetails.trackModel.id) {
          trackModel.isSelected = true;
        }
      });

      selectedTracks.current[`${trackDetails.trackModel.id}`] = "";

      onTracksChange(_.cloneDeep(trackManagerState.current.tracks));
      renderTrackSpecificConfigMenu(
        e.pageX,
        e.pageY,
        trackDetails.trackModel.id
      );
    }
  }

  function onConfigMenuClose() {
    setConfigMenu(null);
  }

  function onTrackUnSelect() {
    if (Object.keys(selectedTracks.current).length !== 0) {
      trackManagerState.current.tracks.map((trackModel) => {
        trackModel.isSelected = false;
      });

      selectedTracks.current = {};
      onTracksChange(_.cloneDeep(trackManagerState.current.tracks));
    }
  }

  function handleDelete(id: Array<any>) {
    trackManagerState.current.tracks = trackManagerState.current.tracks.filter(
      (item, _index) => {
        return !id.includes(String(item.id));
      }
    );

    onTracksChange(_.cloneDeep(trackManagerState.current.tracks));

    if (id.length > 0) {
      onConfigMenuClose();
    }
  }
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

    // onTracksChange();
  }
  // MARK: FETCHGEN
  // FUNCTION TO FETCH DATA AND CHANGE STATE TO INDICATE THERE ARE NEW DATA AFTER GETTING NAV COORD TELLING THE each TRACK
  // COMPONENTS TO UPDATE AND DRAW WITH THE NEW DATA
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  function handleReorder(order: Array<any>) {
    const newOrder: Array<any> = [];
    for (const item of order) {
      newOrder.push(_.cloneDeep(item.trackModel));
    }

    trackManagerState.current.tracks = _.cloneDeep(newOrder);

    // console.log(trackManagerState.current.tracks, newOrder, "order")

    onTracksChange(_.cloneDeep(trackManagerState.current.tracks));
  }

  async function fetchGenomeData(
    initial: number = 0,
    trackSide: string,
    viewWindow: OpenInterval
  ) {
    let curFetchRegionNav;
    let genomicLoci: Array<ChromosomeInterval> = [];
    let initBpLoci: Array<any> = [];
    let initExpandBpLoci: Array<any> = [];
    let newVisData;
    let regionExpandLoci;
    let regionLoci: Array<any>;

    const trackWindowWidth =
      selectedRegionSet &&
      bpRegionSize.current === genomeConfig.navContext._totalBases
        ? windowWidth / 3
        : windowWidth;
    const curViewWindow =
      selectedRegionSet &&
      bpRegionSize.current === genomeConfig.navContext._totalBases
        ? new OpenInterval(0, trackWindowWidth)
        : new OpenInterval(trackWindowWidth, trackWindowWidth * 2);
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
        genomeConfig.navContext,
        minBp.current,
        maxBp.current
      );

      newVisData = {
        visWidth: trackWindowWidth * 3,
        visRegion: new DisplayedRegionModel(
          genomeConfig.navContext,
          minBp.current - bpRegionSize.current,
          maxBp.current + bpRegionSize.current
        ),
        viewWindow: curViewWindow,
        viewWindowRegion: curFetchRegionNav,
      };

      let expandedGenomeFeatureSegment: Array<FeatureSegment> =
        genomeConfig.navContext.getFeaturesInInterval(
          minBp.current - bpRegionSize.current,
          maxBp.current + bpRegionSize.current
        );

      regionExpandLoci = expandedGenomeFeatureSegment.map((item, _index) =>
        item.getLocus()
      );
      minBp.current = minBp.current - bpRegionSize.current * 2;
      maxBp.current = maxBp.current + bpRegionSize.current * 2;

      regionLoci = bpNavToGenNav(initBpLoci, genomeConfig);
    } else {
      if (trackSide === "right") {
        curFetchRegionNav = new DisplayedRegionModel(
          genomeConfig.navContext,
          maxBp.current - bpRegionSize.current,
          maxBp.current
        );
        let genomeFeatureSegment: Array<FeatureSegment> =
          genomeConfig.navContext.getFeaturesInInterval(
            maxBp.current - bpRegionSize.current,
            maxBp.current
          );

        genomicLoci = genomeFeatureSegment.map((item, _index) =>
          item.getLocus()
        );
        let regionGenomeFeatureSegment: Array<FeatureSegment> =
          genomeConfig.navContext.getFeaturesInInterval(
            maxBp.current - bpRegionSize.current * 2,
            maxBp.current - bpRegionSize.current
          );
        let regionNav = new DisplayedRegionModel(
          genomeConfig.navContext,
          maxBp.current - bpRegionSize.current * 2,
          maxBp.current - bpRegionSize.current
        );
        regionLoci = regionGenomeFeatureSegment.map((item, _index) =>
          item.getLocus()
        );
        newVisData = {
          visWidth: trackWindowWidth * 3,
          visRegion: new DisplayedRegionModel(
            genomeConfig.navContext,
            maxBp.current - bpRegionSize.current * 3,
            maxBp.current
          ),
          viewWindow: curViewWindow,
          viewWindowRegion: regionNav,
        };

        let expandedGenomeFeatureSegment: Array<FeatureSegment> =
          genomeConfig.navContext.getFeaturesInInterval(
            maxBp.current - bpRegionSize.current * 3,
            maxBp.current
          );

        regionExpandLoci = expandedGenomeFeatureSegment.map((item, _index) =>
          item.getLocus()
        );
        startingBpArr.current.push(maxBp.current - bpRegionSize.current);
        maxBp.current = maxBp.current + bpRegionSize.current;
      } else {
        curFetchRegionNav = new DisplayedRegionModel(
          genomeConfig.navContext,
          minBp.current,
          minBp.current + bpRegionSize.current
        );
        let genomeFeatureSegment: Array<FeatureSegment> =
          genomeConfig.navContext.getFeaturesInInterval(
            minBp.current,
            minBp.current + bpRegionSize.current
          );

        genomicLoci = genomeFeatureSegment.map((item, _index) =>
          item.getLocus()
        );
        let regionGenomeFeatureSegment: Array<FeatureSegment> =
          genomeConfig.navContext.getFeaturesInInterval(
            minBp.current + bpRegionSize.current,
            minBp.current + bpRegionSize.current * 2
          );
        let regionNav = new DisplayedRegionModel(
          genomeConfig.navContext,
          minBp.current + bpRegionSize.current,
          minBp.current + bpRegionSize.current * 2
        );
        regionLoci = regionGenomeFeatureSegment.map((item, _index) =>
          item.getLocus()
        );
        newVisData = {
          visWidth: trackWindowWidth * 3,
          visRegion: new DisplayedRegionModel(
            genomeConfig.navContext,
            minBp.current,
            minBp.current + bpRegionSize.current * 3
          ),
          viewWindow: curViewWindow,
          viewWindowRegion: regionNav,
        };

        let expandedGenomeFeatureSegment: Array<FeatureSegment> =
          genomeConfig.navContext.getFeaturesInInterval(
            minBp.current,
            minBp.current + bpRegionSize.current * 3
          );

        regionExpandLoci = expandedGenomeFeatureSegment.map((item, _index) =>
          item.getLocus()
        );
        startingBpArr.current.unshift(minBp.current);
        minBp.current = minBp.current - bpRegionSize.current;
      }
    }
    // AFTER Creating the new nav CACHE THE NAV OF THE VISISTED REGION
    let genomicFetchCoord: { [key: string]: any } = {};
    genomicFetchCoord[`${genomeConfig.genome.getName()}`] = {
      genomicLoci,
      regionExpandLoci: initExpandBpLoci[1],
    };
    genomicFetchCoord[`${genomeConfig.genome.getName()}`]["primaryVisData"] =
      newVisData;

    let curDragX = dragX.current;

    let newTrackState = {
      primaryGenName: genomeConfig.genome.getName(),
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
            return {
              visRegion: new DisplayedRegionModel(
                genomeConfig.navContext,
                item.start,
                item.end
              ),
              viewWindowRegion: new DisplayedRegionModel(
                genomeConfig.navContext,
                initBpLoci[index].start,
                initBpLoci[index].end
              ),
              visWidth: trackWindowWidth * 3,

              viewWindow: curViewWindow,
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
    event: MessageEvent | { [key: string]: any }
  ) => {

    event.data.forEach(async (dataItem: any) => {
      const trackToDrawId: { [key: string]: any } = dataItem.trackToDrawId
        ? dataItem.trackToDrawId
        : {};
      const regionDrawIdx = dataItem.trackDataIdx;

      const curTrackState = {
        ...globalTrackState.current.trackStates[regionDrawIdx].trackState,
        primaryGenName: genomeConfig.genome.getName(),
      };

      await Promise.all(
        dataItem.fetchResults.map(
          async (
            item: {
              id: any;
              name: string;
              result: any;
              metadata: any;
              trackModel: any;
              curFetchNav: any;
            },
            _index: any
          ) => {
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
            });
          }
        )
      );

      const browserMemorySize: { [key: string]: any } = window.performance;

      // Check memory usage and free up if necessary
      if (
        browserMemorySize["memory"] &&
        browserMemorySize["memory"].usedJSHeapSize >
          browserMemorySize["memory"].jsHeapSizeLimit * 0.7
      ) {
        for (const key in trackFetchedDataCache.current) {
          const curTrack = trackFetchedDataCache.current[key];

          for (const cacheDataIdx in curTrack) {
            if (
              curTrack.trackType in trackUsingExpandedLoci &&
              isInteger(cacheDataIdx)
            ) {
              if (Number(cacheDataIdx) !== regionDrawIdx) {
                delete trackFetchedDataCache.current[key][cacheDataIdx]
                  .dataCache;
                if (
                  "records" in trackFetchedDataCache.current[key][cacheDataIdx]
                ) {
                  delete trackFetchedDataCache.current[key][cacheDataIdx]
                    .records;
                }
                if (
                  "xvalues" in trackFetchedDataCache.current[key][cacheDataIdx]
                ) {
                  delete trackFetchedDataCache.current[key][cacheDataIdx]
                    .xvalues;
                }
              }
            }
          }
        }
      }
      const drawData = {
        trackDataIdx: dataItem.trackDataIdx,
        initial: dataItem.initial,
        trackToDrawId: trackToDrawId,
        missingIdx: dataItem.missingIdx,
      };
      let curDrawData;
      let combineTrackToDrawId = {};

      curDrawData = drawData;
      combineTrackToDrawId = {
        ...combineTrackToDrawId,
        ...drawData.trackToDrawId,
      };

      if (curDrawData) {
        const idxArr = [
          dataIdx.current - 1,
          dataIdx.current,
          dataIdx.current + 1,
        ];
        const cacheKeysWithData = {};
        for (let trackToDrawKey in combineTrackToDrawId) {
          const cache = trackFetchedDataCache.current[trackToDrawKey];

          if (cache) {
            if (useFineModeNav.current || cache.useExpandedLoci) {
              if (cache[dataIdx.current]) {
                cacheKeysWithData[trackToDrawKey] = "";
              }
            } else {
              let hasAllRegionData = true;
              for (let idx of idxArr) {
                if (!cache[idx] || cache[idx].dataCache === null) {
                  hasAllRegionData = false;
                  break;
                }
              }
              if (hasAllRegionData) {
                cacheKeysWithData[trackToDrawKey] = "";
              }
            }
          }
        }
        for (let id in cacheKeysWithData) {
          cacheKeysWithData[`${id}`] = false;
        }
        if (completedFetchedRegion.current.key !== dataIdx.current) {
          completedFetchedRegion.current.key = dataIdx.current;
          completedFetchedRegion.current.done = {};
        }
        completedFetchedRegion.current.done = {
          ...completedFetchedRegion.current.done,
          ...cacheKeysWithData,
        };

        curDrawData["trackToDrawId"] = combineTrackToDrawId;
        curDrawData["curDataIdx"] = curDrawData.trackDataIdx;
        setNewDrawData({ ...curDrawData });
      }
    });
  };

  //MARK: onmessGenAl;

  const createGenomeAlignOnMessage = async (event: MessageEvent) => {
    const regionDrawIdx = event.data.navData.trackDataIdx;

    const curTrackState = {
      ...globalTrackState.current.trackStates[regionDrawIdx].trackState,
      primaryGenName: genomeConfig.genome.getName(),
      ...event.data.navData,
    };

    Promise.all(
      Object.values(event.data.fetchResults).map((item: any, _index) => {
        createCache({
          trackState: curTrackState,
          result: item.records,
          id: item.id,
          trackType: item.trackModel.type,
          metadata: item.metadata,
          trackModel: item.trackModel,
          curFetchNav: item.name === "bam" ? item.curFetchNav : "",
          missingIdx: curTrackState.missingIdx,
          queryGenome: item.query,
        });
      })
    )
      .then(() => {
        isfetchGenomeAlignWorkerBusy.current = false;
        // once we finish with a fetch we need to check if there are any more
        // request in the queue, user might scroll fast and have multipe region data to fetch

        globalTrackState.current.trackStates[
          curTrackState.missingIdx
            ? curTrackState.missingIdx
            : curTrackState.trackDataIdx
        ].trackState["startWindow"] =
          event.data.navData.regionSetStartBp !== 0
            ? curTrackState.genomicFetchCoord[genomeConfig.genome.getName()]
                .primaryVisData.viewWindow.start
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
            genomeConfig.genome.getName()
          ].primaryVisData.visWidth;
        processGenomeAlignQueue();
        if (isInteger(curTrackState.missingIdx)) {
          const trackToDrawId: { [key: string]: any } = {};
          for (const key in trackFetchedDataCache.current) {
            trackToDrawId[key] = "";
          }
          for (let key in event.data.fetchResults) {
            trackToDrawId[key] = "";
          }
          if (curTrackState.fetchAfterGenAlignTracks.length > 0) {
            for (const dataForFetch of curTrackState.fetchAfterGenAlignTracks) {
              dataForFetch["genomicFetchCoord"] =
                curTrackState.genomicFetchCoord;

              dataForFetch["trackToDrawId"] = trackToDrawId;
            }

            enqueueMessage(curTrackState.fetchAfterGenAlignTracks);
          } else {
            setNewDrawData({
              curDataIdx: curTrackState.trackDataIdx,
              isInitial: 0,
              trackToDrawId,
              missingIdx: curTrackState.missingIdx,
            });
          }
        } else {
          enqueueMessage(curTrackState.fetchAfterGenAlignTracks);
        }
      })
      .catch((error) => {
        console.error(
          "An error occurred when trying to fetch genomealign track:",
          error
        );

        curTrackState["genomicFetchCoord"] = null;
        let trackToDrawId = {};
        for (let track of curTrackState.trackModelArr) {
          trackFetchedDataCache.current[`${track.id}`][
            `${curTrackState.missingIdx}`
          ]["dataCache"] = { error: ["error fetching genomealign tracks"] };
          trackToDrawId[`${track.id}`] = "";
        }
        setNewDrawData({
          curDataIdx: curTrackState.trackDataIdx,
          isInitial: 0,
          trackToDrawId,
          missingIdx: curTrackState.missingIdx,
        });
        enqueueMessage(curTrackState.fetchAfterGenAlignTracks);
      });
  };
  // MARK: queueRegion

  function queueRegionToFetch(regionIdx: number) {
    const trackToDrawId: { [key: string]: any } = {};

    let needToFetch = false;
    const idxArr = [regionIdx - 1, regionIdx, regionIdx + 1];
    const curIdx = regionIdx;
    let needToFetchGenAlign = false;

    for (const [key, curTrackCache] of Object.entries(
      trackFetchedDataCache.current
    )) {
      let hasAllRegionData = true;

      for (const idx of idxArr) {
        if (!(idx in curTrackCache)) {
          if (
            curTrackCache.trackType in trackUsingExpandedLoci &&
            idx !== curIdx
          ) {
          } else {
            trackFetchedDataCache.current[key][idx] = {};
          }
        }

        if (idx in curTrackCache) {
          if (
            curTrackCache.trackType in trackUsingExpandedLoci &&
            idx !== curIdx
          ) {
            continue;
          }
          const isGenomeAlignTrack = curTrackCache.trackType === "genomealign";

          const dataCacheKeyMissing = !("dataCache" in curTrackCache[idx]);

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
        trackToDrawId[key] = "";
      }
    }

    if (needToFetch) {
      const dataToFetchArr: Array<any> = [];
      for (const curDataIdx of idxArr) {
        let trackToFetch: Array<TrackModel> = [];
        let trackState;
        for (const key in trackFetchedDataCache.current) {
          const curTrackCache = trackFetchedDataCache.current[key];

          if (
            (curTrackCache.trackType in trackUsingExpandedLoci &&
              curDataIdx !== curIdx) ||
            curTrackCache.trackType === "genomealign"
          ) {
            continue;
          }
          if (
            curDataIdx in curTrackCache &&
            !("dataCache" in curTrackCache[curDataIdx])
          ) {
            let curTrackModel: any = trackManagerState.current.tracks.find(
              (trackModel: any) =>
                trackModel.id === Number(key) || trackModel.id === key
            );

            trackState =
              curDataIdx in globalTrackState.current.trackStates
                ? globalTrackState.current.trackStates[curDataIdx].trackState
                : "";
            if (curTrackModel) {
              trackFetchedDataCache.current[key][curDataIdx]["dataCache"] =
                null;
              trackToFetch.push(curTrackModel);
            }
          }
        }

        if (trackToFetch.length > 0) {
          const genName = genomeConfig.genome.getName();
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
            windowWidth,
            bpRegionSize: bpRegionSize.current,
            trackDataIdx: curIdx,
            missingIdx: curDataIdx,
          });
        }
      }

      if (hasGenomeAlign.current && needToFetchGenAlign) {
        const genomeAlignTracks = trackManagerState.current.tracks.filter(
          (items, _index) => {
            return items.type === "genomealign";
          }
        );

        // MARK: addGenAlign
        const curTrackState =
          globalTrackState.current.trackStates[curIdx].trackState;

        enqueueGenomeAlignMessage({
          trackToFetch: genomeAlignTracks,
          visData:
            globalTrackState.current.trackStates[curIdx].trackState.visData,
          genomicLoci: curTrackState.regionLoci,
          primaryGenName: genomeConfig.genome.getName(),
          trackModelArr: genomeAlignTracks,
          regionExpandLoci: curTrackState.regionExpandLoci,
          useFineModeNav: useFineModeNav.current,
          windowWidth,
          bpRegionSize: bpRegionSize.current,
          fetchAfterGenAlignTracks: dataToFetchArr,
          trackDataIdx: curIdx,
          missingIdx: curIdx,
        });
      } else {
        enqueueMessage(dataToFetchArr);
      }
    }
    if (
      Object.keys(trackToDrawId).length > 0 &&
      !needToFetchGenAlign &&
      !genomeConfig.isInitial
    ) {
      completedFetchedRegion.current.done = { ...trackToDrawId };
      completedFetchedRegion.current.key = dataIdx.current;
      for (let id in completedFetchedRegion.current.done) {
        completedFetchedRegion.current.done[id] = true;
      }
      setNewDrawData({
        curDataIdx: dataIdx.current,
        isInitial: 0,
        trackToDrawId: { ...trackToDrawId },
      });
    }
  }

  // MARK: createCache
  async function createCache(fetchRes: { [key: string]: any }) {
    const tmpTrackState = { ...fetchRes.trackState };
    let result;
    if (fetchRes.trackType in { hic: "", dynamichic: "", bam: "" }) {
      let configOptions;
      if (globalTrackConfig.current[`${fetchRes.id}`]) {
        configOptions = globalTrackConfig.current[fetchRes.id].configOptions;
      } else {
        let foundTrack = tracks.find(
          (trackModel: any) => trackModel.id === fetchRes.id
        );
        const curTrackModel = foundTrack ? foundTrack : fetchRes.trackModel;

        if (curTrackModel && trackOptionMap[`${fetchRes.trackType}`]) {
          configOptions = {
            ...trackOptionMap[`${fetchRes.trackType}`].defaultOptions,
            ...curTrackModel.options,
          };
        }
      }

      let trackState = tmpTrackState;
      let cacheTrackData = trackFetchedDataCache.current[`${fetchRes.id}`];

      const primaryVisData =
        trackState.genomicFetchCoord[genomeConfig.genome.getName()]
          .primaryVisData;
      let visRegion = !cacheTrackData.usePrimaryNav
        ? trackState.genomicFetchCoord[
            trackFetchedDataCache.current[`${fetchRes.id}`].queryGenome
          ].queryRegion
        : primaryVisData.visRegion;
      trackState["visRegion"] = visRegion;

      if (fetchRes.trackType === "hic") {
        result = await fetchInstances.current[
          `${fetchRes.trackModel.id}`
        ].getData(
          objToInstanceAlign(visRegion),
          basePerPixel.current,
          configOptions
        );
      } else if (fetchRes.trackType === "dynamichic") {
        const curStraw = fetchRes.trackModel.tracks.map(
          (_hicTrack: any, index: any) => {
            return fetchInstances.current[
              `${fetchRes.id}` + "subtrack" + `${index}`
            ];
          }
        );
        result = await Promise.all(
          curStraw.map(
            (
              straw: {
                getData: (
                  arg0: DisplayedRegionModel,
                  arg1: number,
                  arg2: any
                ) => any;
              },
              _index: any
            ) => {
              return straw.getData(
                objToInstanceAlign(visRegion),
                basePerPixel.current,
                configOptions
              );
            }
          )
        );
      } else {
        let tmpRawData: Array<Promise<any>> = [];
        fetchRes.curFetchNav.forEach((locuses: any) => {
          tmpRawData.push(
            fetchInstances.current[`${fetchRes.id}`].getData(locuses)
          );
        });

        result = (await Promise.all(tmpRawData)).flat();

        // if (!tmpTrackState.initial) {

        // }
      }
    } else {
      result = fetchRes.result;
    }

    if (isInteger(fetchRes.missingIdx)) {
      const formattedData =
        // fetchRes.trackType in twoDataTypeTracks
        //   ? result
        //   :
        formatDataByType(result, fetchRes.trackType);
      trackFetchedDataCache.current[`${fetchRes.id}`][fetchRes.missingIdx][
        "dataCache"
      ] = formattedData;
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
    highlightSearch: boolean = false
  ) {
    const newLength = endbase - startbase;

    if (newLength < MIN_VIEW_REGION_SIZE) {
      const amountToExpand = 0.5 * (MIN_VIEW_REGION_SIZE - newLength);
      startbase -= amountToExpand;
      endbase += amountToExpand;
    }

    // drag select zoom in or zoom factor options or regionController/highlight jump
    if (
      String(toolTitle) in zoomFactors ||
      String(toolTitle) in
        {
          "3": "",
          "4": "",
          "5": "",
          "12": "",
        } ||
      toolTitle === "isJump"
    ) {
      trackManagerState.current.viewRegion._startBase = startbase;
      trackManagerState.current.viewRegion._endBase = endbase;
      // onNewRegionSelect(startbase, endbase, highlightSearch);
      throttleOnNewRegionSelect.current(startbase, endbase, highlightSearch);
    }
    // adding new highlight region
    else if (toolTitle === 2) {
      let newHightlight = {
        start: startbase,
        end: endbase,
        display: true,
        color: "rgba(0, 123, 255, 0.15)",
        tag: "",
      };
      const tmpHighlight = [...highlights, newHightlight];
      onNewHighlight(tmpHighlight);
    }
  }

  function createHighlight(highlightArr: Array<any>) {
    let resHighlights: Array<any> = [];

    const startBase = genomeConfig.defaultRegion.start;
    const endBase = genomeConfig.defaultRegion.end;
    let pixelPBase = windowWidth / (endBase - startBase);
    for (const curhighlight of highlightArr) {
      let highlightSide =
        curhighlight.start - startBase <= 0 ? "right" : "left";

      let startHighlight = (curhighlight.start - startBase) * pixelPBase;

      let endHighlight = -(curhighlight.end - startBase) * pixelPBase;
      let highlightWidth = Math.abs(startHighlight + endHighlight);

      let curXPos = highlightSide === "right" ? startHighlight : endHighlight;
      // legendWidth is the width of the legend
      let tmpObj = {
        xPos: curXPos,
        width: highlightWidth,
        side: highlightSide,
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
  function getHighlightState(highlightState: any) {
    onNewHighlight(highlightState);
  }
  function toolSelect(toolTitle: string | number) {
    const newSelectedTool: { [key: string]: any } = {};
    newSelectedTool["isSelected"] = false;

    if (toolTitle === 4) {
      onRegionSelected(
        Math.round(bpX.current - bpRegionSize.current),
        Math.round(bpX.current),
        toolTitle
      );
    } else if (toolTitle === 5) {
      onRegionSelected(
        Math.round(bpX.current + bpRegionSize.current),
        Math.round(bpX.current + bpRegionSize.current * 2),
        toolTitle
      );
    } else if (String(toolTitle) in zoomFactors) {
      let useDisplayFunction = new DisplayedRegionModel(
        genomeConfig.navContext,
        bpX.current,
        bpX.current + bpRegionSize.current
      );
      let res = useDisplayFunction.zoom(zoomFactors[`${toolTitle}`].factor);
      onRegionSelected(
        res._startBase as number,
        res._endBase as number,
        toolTitle
      );
    } else {
      if (tool && tool !== 0 && tool !== 12) {
        newSelectedTool.isSelected = true;
      }
    }

    newSelectedTool["title"] = toolTitle;
    isToolSelected.current = newSelectedTool.isSelected;
    return newSelectedTool;
  }
  // MARK: InitState
  // state management functions
  //______________________________________________________________________________________________________________
  //______________________________________________________________________________________________________________
  //______________________________________________________________________________________________________________

  function initTrackFetchCache(initTrackModel: { [key: string]: any }) {
    trackFetchedDataCache.current[`${initTrackModel.id}`]["queryGenome"] =
      "querygenome" in initTrackModel && initTrackModel.querygenome
        ? initTrackModel.querygenome
        : "genome" in initTrackModel.metadata && initTrackModel.metadata.genome
        ? initTrackModel.metadata.genome
        : genomeConfig.genome.getName();

    const queryGenome =
      trackFetchedDataCache.current[`${initTrackModel.id}`]["queryGenome"];
    trackFetchedDataCache.current[`${initTrackModel.id}`]["usePrimaryNav"] =
      queryGenome && queryGenome !== genomeConfig.genome.getName()
        ? false
        : true;

    trackFetchedDataCache.current[`${initTrackModel.id}`]["useExpandedLoci"] =
      initTrackModel.type in trackUsingExpandedLoci ||
      queryGenome !== genomeConfig.genome.getName()
        ? true
        : false;

    trackFetchedDataCache.current[`${initTrackModel.id}`]["trackType"] =
      initTrackModel.type;
    trackFetchedDataCache.current[`${initTrackModel.id}`]["trackModel"] =
      initTrackModel;
  }
  const refreshState = () => {
    // Reset useRef letiables
    completedFetchedRegion.current = {
      key: -0,
      done: {},
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
      genomeName: genomeConfig ? genomeConfig.genome.getName() : "",
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
        genomeConfig.navContext,
        genomeConfig.defaultRegion.start,
        genomeConfig.defaultRegion.end
      ),
      trackLegendWidth: legendWidth,
      tracks:
        tracks && tracks.length >= 0 ? tracks : genomeConfig.defaultTracks,
    };

    configMenuPos.current = {};
    lastDragX.current = 0;
    basePerPixel.current = 0;
    frameID.current = 0;
    lastX.current = 0;
    dragX.current = 0;
    side.current = "right";
    isDragging.current = false;
    rightSectionSize.current = [windowWidth];
    leftSectionSize.current = [];
    setNewDrawData(null);
    let highlightElement = createHighlight(highlights);
    globalTrackState.current = {
      rightIdx: 0,
      leftIdx: 1,
      viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
      trackStates: {},
    };
    trackFetchedDataCache.current = {};
    setHighLightElements([...highlightElement]);
    dataIdx.current = -0;

    setConfigMenu(null);
    setApplyTrackConfigChange({});
  };

  function initializeTracks() {
    // set initial track manager control values and create fetch instance for track that can't use worker like hic.

    leftStartCoord.current = genomeConfig.defaultRegion.start;
    rightStartCoord.current = genomeConfig.defaultRegion.end;

    bpRegionSize.current = rightStartCoord.current - leftStartCoord.current;
    basePerPixel.current = bpRegionSize.current / windowWidth;
    pixelPerBase.current = windowWidth / bpRegionSize.current;

    bpX.current = leftStartCoord.current;
    maxBp.current = rightStartCoord.current;
    minBp.current = leftStartCoord.current;

    const newTrackComponents: Array<any> = [];

    // loop through trackmanager checking to see if the track is already created else if create a new one with default valuies
    for (let i = 0; i < trackManagerState.current.tracks.length; i++) {
      if (trackManagerState.current.tracks[i].type === "genomealign") {
        if (basePerPixel.current < 10) {
          useFineModeNav.current = true;
        }
      }
      if (trackManagerState.current.tracks[i].type === "hic") {
        if (
          !fetchInstances.current[`${trackManagerState.current.tracks[i].id}`]
        ) {
          fetchInstances.current[`${trackManagerState.current.tracks[i].id}`] =
            new HicSource(trackManagerState.current.tracks[i].url);
        }
      } else if (trackManagerState.current.tracks[i].type === "dynamichic") {
        trackManagerState.current.tracks[i].tracks?.map(
          (_item: any, index: string | number) => {
            fetchInstances.current[
              `${trackManagerState.current.tracks[i].id}` +
                "subtrack" +
                `${index}`
            ] = new HicSource(
              trackManagerState.current.tracks[i].tracks![index].url
            );
          }
        );
      } else if (
        trackManagerState.current.tracks[i].type in
        { matplot: "", dynamic: "", dynamicbed: "", dynamiclongrange: "" }
      ) {
        trackManagerState.current.tracks[i].tracks?.map(
          (trackModel: TrackModel, index: any) => {
            trackModel.id =
              `${trackManagerState.current.tracks[i].id}` +
              "subtrack" +
              `${index}`;
          }
        );
      } else if (trackManagerState.current.tracks[i].type === "bam") {
        fetchInstances.current[`${trackManagerState.current.tracks[i].id}`] =
          new BamSource(trackManagerState.current.tracks[i].url);
      }

      const newPosRef = createRef();
      const newLegendRef = createRef();

      trackManagerState.current.tracks[i]["legendWidth"] = legendWidth;

      newTrackComponents.push({
        trackIdx: i,
        id: trackManagerState.current.tracks[i].id,
        component: TrackFactory,
        posRef: newPosRef,
        legendRef: newLegendRef,
        trackModel: trackManagerState.current.tracks[i],
        hasAllRegionData: false,
      });
    }

    setTrackComponents(newTrackComponents);

    newTrackComponents.map((item, _index) => {
      trackFetchedDataCache.current[`${item.trackModel.id}`] = {};
      trackFetchedDataCache.current[`${item.trackModel.id}`]["cacheDataIdx"] = {
        leftIdx: 1,
        rightIdx: 0,
      };
      initTrackFetchCache(item.trackModel);
    });
    addTermToMetaSets(trackManagerState.current.tracks);
    fetchGenomeData(1, "right", new OpenInterval(windowWidth, windowWidth * 2));

    queueRegionToFetch(0);
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
        if (genomeConfig.isInitial) {
          setSelectedTool((prevState) => {
            if (tool && tool in { 0: "", 1: "", 2: "", 3: "" }) {
              const newSelectedTool = toolSelect(tool);
              return newSelectedTool;
            } else {
              return {
                isSelected: false,
                title: 0,
              };
            }
          });
          // When a track refreshes or a new genome is initialize, we
          // select the region that was selected before the refresh after the track is
          // created
          const isSelected: Array<any> = [];
          tracks.map((item) => {
            if (item.isSelected) {
              isSelected.push(item.id);
            }
          });

          for (const key in selectedTracks.current) {
            if (!(key in isSelected)) {
              for (const component of trackComponents) {
                if (component.id === key) {
                  // component.legendRef.current.style.backgroundColor = "white";
                  delete selectedTracks.current[key];
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

          genomeConfig.isInitial = false;
        }
      }
    }
  }

  function sentScreenshotData(trackDataObj: { trackId: any }) {
    screenshotDataObj.current[`${trackDataObj.trackId}`] = trackDataObj;
    if (
      Object.keys(screenshotDataObj.current).length === trackComponents.length
    ) {
      const curTracks = trackManagerState.current.tracks.filter(
        (trackModel) => trackModel.type !== "g3d"
      );

      const convertedITrackModel = curTracks.map((item) =>
        convertTrackModelToITrackModel(item)
      );

      const curStartBp = bpX.current;
      const curEndBp = bpX.current + bpRegionSize.current;
      const highlightPixelPos: Array<any> = [];

      for (let i = 0; i < highlightElements.length; i++) {
        const highlight = highlightElements[i];

        if (
          (highlight.start >= curStartBp && highlight.start <= curEndBp) ||
          (highlight.end >= curStartBp && highlight.end <= curEndBp) ||
          (highlight.start < curStartBp && highlight.end > curEndBp)
        ) {
          const highlightStart =
            highlight.start < curStartBp ? curStartBp : highlight.start;

          const highlightEnd =
            highlight.end > curEndBp ? curEndBp : highlight.end;

          const windowStart =
            (highlightStart - curStartBp) * pixelPerBase.current;
          const windowEnd = (highlightEnd - curStartBp) * pixelPerBase.current;
          highlightPixelPos.push({
            start: windowStart,
            end: windowEnd,
            color: highlight.color,
          });
          // The highlight is within the range
        } else {
          continue;
        }
      }
      let curViewWindow =
        viewWindowConfigData.current &&
        viewWindowConfigData.current.dataIdx === dataIdx.current
          ? viewWindowConfigData.current.viewWindow
          : hasGenomeAlign.current
          ? globalTrackState.current.trackStates[dataIdx.current].trackState
              .genomicFetchCoord[genomeConfig.genome.getName()].primaryVisData
              .viewWindow
          : draw.viewWindow;

      setScreenshotData({
        tracks: convertedITrackModel,
        trackData: screenshotDataObj.current,
        highlights: highlightPixelPos,
        viewWindow: curViewWindow,
        windowWidth,
        // primaryView: Object.entries(screenshotDataObj.current)[0].fetchData
        //   .trackState.visData,
      });
      screenshotDataObj.current = {};
    }
  }

  // MARK: METATERMS
  function addTermToMetaSets(tracks: Array<any>) {
    const allKeys = tracks.map((track) => Object.keys(track.metadata));
    const metaKeys = _.union(...allKeys);
    const toBeAdded = metaKeys.filter((key) => !metaSets.terms.includes(key));

    const newSuggestedMetaSets = new Set([
      ...metaSets.suggestedMetaSets,
      ...toBeAdded,
    ]);

    setMetaSets({ ...metaSets, suggestedMetaSets: newSuggestedMetaSets });
  }
  function onNewTerms(tracks: Array<any>) {
    const newSuggestedMetaSets = new Set(
      [...metaSets.suggestedMetaSets].filter((term) => !tracks.includes(term))
    );

    const newTerms = Array.from(new Set([...metaSets.terms, ...tracks]));

    setMetaSets({
      ...metaSets,
      terms: newTerms,
      suggestedMetaSets: newSuggestedMetaSets,
    });
  }

  function onRemoveTerm(termsToRemove: string[]) {
    // Remove the terms from the terms array
    const newTerms = metaSets.terms.filter((t) => !termsToRemove.includes(t));

    // Add the removed terms back to suggestedMetaSets
    const newSuggestedMetaSets = new Set(metaSets.suggestedMetaSets);
    termsToRemove.forEach((term) => newSuggestedMetaSets.add(term));

    // Update the metaSets state with the new terms and suggestedMetaSets
    const updatedMetaSets = {
      ...metaSets,
      terms: newTerms,
      suggestedMetaSets: newSuggestedMetaSets,
    };

    // Call the setMetaSets function to update the state
    setMetaSets(updatedMetaSets);
  }
  async function onColorBoxClick(metaDataKey, value) {
    await onTrackUnSelect();
    await onConfigMenuClose();
    const stringValue = value;
    const newSelectedTracks: { [key: string]: any } = {};
    const newTrackModelArr: Array<any> = [];
    for (let key in trackManagerState.current.tracks) {
      const track = trackManagerState.current.tracks[key];
      if (!track.metadata) {
        continue;
      }
      const metaStringValue = Array.isArray(track.metadata[`${metaDataKey}`])
        ? track.metadata[`${metaDataKey}`][
            track.metadata[`${metaDataKey}`].length - 1
          ]
        : track.metadata[`${metaDataKey}`];
      if (track.metadata[`${metaDataKey}`] && metaStringValue === stringValue) {
        newSelectedTracks[`${track.id}`] = "";
        newTrackModelArr.push(new TrackModel({ ...track, isSelected: true }));
      } else {
        newTrackModelArr.push(new TrackModel({ ...track, isSelected: false }));
      }
    }
    onTracksChange(newTrackModelArr);
    selectedTracks.current = newSelectedTracks;
  }

  // MARK: USEEFFECTS
  // USEEFFECTS
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  useEffect(() => {
    // terminate the worker and listener when TrackManager  is unmounted

    const parentElement = block.current;
    if (parentElement) {
      parentElement.addEventListener("mouseenter", handleMouseEnter);
      parentElement.addEventListener("mouseleave", handleMouseLeave);
    }
    return () => {
      // if (infiniteScrollWorker.current) {
      //   infiniteScrollWorker.current!.terminate();
      // }

      if (parentElement) {
        parentElement.removeEventListener("mouseenter", handleMouseEnter);
        parentElement.removeEventListener("mouseleave", handleMouseLeave);
      }

      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMouseUp);

      console.log("trackmanager terminate");
    };
  }, []);

  useEffect(() => {
    // add Listenser again because javacript dom only have the old trackComponents value
    // it gets the trackComponents at creation so when trackComponent updates we need to
    // add the listener so it can get the most updated trackCom
    // this also include other state changes values such windowWidth
    cancelAnimationFrame(frameID.current);
    trackComponents.forEach((component, _i) => {
      frameID.current = requestAnimationFrame(() => {
        component.posRef.current!.style.transform = `translate3d(${dragX.current}px, 0px, 0)`;
      });
    });

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);

    // Add click event listener to the track container
    const trackContainer = block.current;
    if (trackContainer) {
      trackContainer.addEventListener("click", handleClick);
      trackContainer.addEventListener("contextmenu", handleGenomeClick);

      // Add touch event listeners
      trackContainer.addEventListener("touchstart", handleDOMTouchStart, {
        passive: false,
      });
      trackContainer.addEventListener("touchmove", handleDOMTouchMove, {
        passive: false,
      });
      trackContainer.addEventListener("touchend", handleDOMTouchEnd);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMouseUp);

      // Remove click event listeners
      if (trackContainer) {
        trackContainer.removeEventListener("click", handleClick);
        trackContainer.removeEventListener("contextmenu", handleGenomeClick);

        // Remove touch event listeners
        trackContainer.removeEventListener("touchstart", handleDOMTouchStart);
        trackContainer.removeEventListener("touchmove", handleDOMTouchMove);
        trackContainer.removeEventListener("touchend", handleDOMTouchEnd);
      }
    };
  }, [trackComponents, windowWidth]);

  useEffect(() => {
    if (!genomeConfig.isInitial) {
      setSelectedTool((prevState) => {
        if (tool === null || tool === 0) {
          const newSelectedTool = toolSelect(prevState.title);

          return newSelectedTool;
        } else if (tool) {
          const newSelectedTool = toolSelect(tool);
          return newSelectedTool;
        }
      });
    }
  }, [tool]);

  // MARK: [GenConfig]
  useEffect(() => {
    // on GenomeRoot first creation we add the default state to StateArr in genomeroot

    if (genomeConfig.isInitial) {
      prevWindowWidth.current = windowWidth;

      trackManagerState.current.tracks.map(
        (items: { type: string }, _index: any) => {
          if (items.type === "genomealign") {
            hasGenomeAlign.current = true;
          }
        }
      );
      // created the workers needed already in GenomeRoot, now
      // we create a way to recieve the return data as message from the workers here
      if (infiniteScrollWorkers.current) {
        infiniteScrollWorkers.current.worker?.forEach((w) => {
          if (!w.hasOnMessage) {
            w.fetchWorker.onmessage = createInfiniteOnMessage;
            w.hasOnMessage = true;
          }
        });
        infiniteScrollWorkers.current.instance?.forEach((w) => {
          if (!w.hasOnMessage) {
            w.fetchWorker.onmessage = createInfiniteOnMessage;
            w.hasOnMessage = true;
          }
        });
      }
      if (
        hasGenomeAlign.current &&
        fetchGenomeAlignWorker.current &&
        !fetchGenomeAlignWorker.current.hasOnMessage
      ) {
        fetchGenomeAlignWorker.current.fetchWorker.onmessage =
          createGenomeAlignOnMessage;
        fetchGenomeAlignWorker.current.hasOnMessage = true;
      }
      initializeTracks();
      preload.current = true;
    } else if (genomeConfig.sizeChange) {
      trackSizeChange();
    } else {
      preload.current = true;
      refreshState();
      initializeTracks();
    }
  }, [genomeConfig]);
  function getDeviceType(): "mobile" | "tablet" | "desktop" {
    const userAgent = navigator.userAgent;
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const screenWidth = window.innerWidth;

    // Check for mobile
    if (
      /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent
      )
    ) {
      return "mobile";
    }

    // Check for tablet
    if (
      /ipad|tablet|playbook|silk/i.test(userAgent) ||
      (isTouchDevice && screenWidth >= 768 && screenWidth <= 1024)
    ) {
      return "tablet";
    }

    // Check by screen size and touch capability
    if (isTouchDevice && screenWidth < 768) {
      return "mobile";
    }

    return "desktop";
  }
  // MARK: trackSizeCha
  function deleteCache() {
    for (const key in trackFetchedDataCache.current) {
      const trackCache = trackFetchedDataCache.current[key];

      if (trackCache.trackType === "genomealign") {
        for (const dataKey in trackCache) {
          if (isInteger(dataKey)) {
            delete trackFetchedDataCache.current[key][dataKey].dataCache;
          }
        }
      } else {
        for (const cacheDataIdx in trackCache) {
          if (isInteger(cacheDataIdx)) {
            if ("xvalues" in trackFetchedDataCache.current[key][cacheDataIdx]) {
              delete trackFetchedDataCache.current[key][cacheDataIdx].xvalues;
            }
          }
        }
      }
    }

    if (basePerPixel.current < 10) {
      useFineModeNav.current = true;
    } else {
      useFineModeNav.current = false;
    }
  }
  function trackSizeChange() {
    const trackToDrawId: { [key: string]: any } = {};
    for (const cacheKey in trackFetchedDataCache.current) {
      trackToDrawId[cacheKey] = "";
    }
    const prevStateWindowWidth = prevWindowWidth.current;

    const curWindowWidth =
      selectedRegionSet &&
      bpRegionSize.current === genomeConfig.navContext._totalBases
        ? windowWidth / 3
        : windowWidth;
    prevWindowWidth.current = windowWidth;

    for (let id in globalTrackState.current.trackStates) {
      const curTrackState = _.cloneDeep(
        globalTrackState.current.trackStates[id].trackState
      );

      const prevXDist =
        globalTrackState.current.trackStates[id].trackState.xDist;

      const newXDist = (prevXDist / prevStateWindowWidth) * curWindowWidth;
      curTrackState.startWindow =
        selectedRegionSet &&
        bpRegionSize.current === genomeConfig.navContext._totalBases
          ? 0
          : curWindowWidth;
      curTrackState["visWidth"] = curWindowWidth * 3;
      curTrackState.xDist = newXDist;

      if (curTrackState["visData"]) {
        curTrackState.visData.visWidth = curWindowWidth * 3;
        curTrackState.visData.viewWindow =
          selectedRegionSet &&
          bpRegionSize.current === genomeConfig.navContext._totalBases
            ? new OpenInterval(0, curWindowWidth)
            : new OpenInterval(curWindowWidth, curWindowWidth * 2);
      }
      if (
        "genomicFetchCoord" in
        globalTrackState.current.trackStates[id].trackState
      ) {
        curTrackState.genomicFetchCoord[
          `${curTrackState.primaryGenName}`
        ].primaryVisData.visWidth = curWindowWidth * 3;

        curTrackState.genomicFetchCoord[
          `${curTrackState.primaryGenName}`
        ].primaryVisData.viewWindow = {
          start: windowWidth,
          end: windowWidth * 2,
        };
      }
      globalTrackState.current.trackStates[id].trackState = curTrackState;
    }

    basePerPixel.current = bpRegionSize.current / windowWidth;
    pixelPerBase.current = windowWidth / bpRegionSize.current;

    dragX.current =
      (leftStartCoord.current - genomeConfig.defaultRegion.start) *
      pixelPerBase.current;
    for (let i = 0; i < rightSectionSize.current.length; i++) {
      rightSectionSize.current[i] = windowWidth;
    }
    for (let i = 0; i < leftSectionSize.current.length; i++) {
      leftSectionSize.current[i] = windowWidth;
    }

    if (hasGenomeAlign.current) {
      deleteCache();

      if (basePerPixel.current < 10) {
        useFineModeNav.current = true;
      } else {
        useFineModeNav.current = false;
      }
      const tmpArr = [...trackComponents];
      // setTrackComponents(tmpArr);

      queueRegionToFetch(dataIdx.current);
    } else {
      for (const key in trackFetchedDataCache.current) {
        const curTrack = trackFetchedDataCache.current[key];

        for (const cacheDataIdx in curTrack) {
          if (isInteger(cacheDataIdx)) {
            if ("xvalues" in trackFetchedDataCache.current[key][cacheDataIdx]) {
              delete trackFetchedDataCache.current[key][cacheDataIdx].xvalues;
            }
          }
        }
      }
      const tmpArr = [...trackComponents];

      const newViewWindow =
        side.current === "right"
          ? new OpenInterval(
              -((dragX.current % windowWidth) + -windowWidth),
              -((dragX.current % windowWidth) + -windowWidth) + windowWidth
            )
          : new OpenInterval(
              windowWidth * 3 - ((dragX.current % windowWidth) + windowWidth),
              windowWidth * 3 - (dragX.current % windowWidth)
            );

      globalTrackState.current.viewWindow = newViewWindow;
      setTrackComponents(tmpArr);

      setNewDrawData({
        curDataIdx: dataIdx.current,
        isInitial: 0,
        trackToDrawId,
      });
    }
    let highlightElement = createHighlight(highlights);
    setHighLightElements([...highlightElement]);
  }
  // MARK: viewWindowConfig

  function getWindowViewConfig(viewWindow, dataIdx) {
    if (viewWindow && dataIdx !== undefined && dataIdx !== null) {
      const trackDataObj: { [key: string]: any } = {};
      const trackToDrawId: { [key: string]: any } = {};
      let primaryVisData;

      for (let key in trackFetchedDataCache.current) {
        const cacheTrackData = trackFetchedDataCache.current[key];
        let curTrackModel;
        let configOptions;
        if (!trackOptionMap[`${cacheTrackData.trackType}`]) {
          continue;
        }
        if (cacheTrackData.trackType in { hic: "", longrange: "" }) {
          trackToDrawId[key] = "";
          continue;
        }
        if (key in globalTrackConfig.current) {
          configOptions = globalTrackConfig.current[key].configOptions;
        } else {
          curTrackModel = tracks.find(
            (trackModel: any) => trackModel.id === key
          );

          if (curTrackModel) {
            configOptions = {
              ...trackOptionMap[`${cacheTrackData.trackType}`].defaultOptions,
              ...curTrackModel.options,
            };
          }
        }
        if (
          !(cacheTrackData.trackType in numericalTracks) &&
          configOptions.displayMode !== "density"
        ) {
          continue;
        }

        let combinedData: any = [];
        let noData = false;
        if (!("xvalues" in cacheTrackData[dataIdx])) {
          let currIdx = dataIdx + 1;

          for (let i = 0; i < 3; i++) {
            if (
              !cacheTrackData[currIdx] ||
              !cacheTrackData[currIdx].dataCache ||
              "error" in cacheTrackData[currIdx].dataCache
            ) {
              noData = true;
              break;
            } else {
              combinedData.push(cacheTrackData[currIdx]);
            }
            currIdx--;
          }

          if (!noData) {
            if (
              cacheTrackData.trackType in
              { matplot: "", dynamic: "", dynamicbed: "" }
            ) {
              combinedData = getDeDupeArrMatPlot(combinedData, false);
            } else {
              combinedData = combinedData
                .map((item) => {
                  if (item && item["dataCache"]) {
                    return item.dataCache;
                  } else {
                    noData = true;
                  }
                })
                .flat(1);
            }
          }
        }

        if (!noData) {
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
                  trackFetchedDataCache.current[key].queryGenome
                ].queryRegion
              : primaryVisData.visRegion;

            if (typeof visRegion === "object") {
              visRegion = objToInstanceAlign(visRegion);
            }
            if (cacheTrackData.trackType === "vcf") {
              const currentViewLength =
                (visRegion.getWidth() * viewWindow.getLength()) /
                primaryVisData.visWidth;

              if (currentViewLength > 100000) {
                trackDataObj[key] = {
                  data: combinedData,
                  visRegion: visRegion,
                  visWidth: primaryVisData.visWidth
                    ? primaryVisData.visWidth
                    : windowWidth * 3,
                  configOptions,
                };
              }
            } else {
              trackDataObj[key] = {
                data: combinedData,
                visRegion: visRegion,
                visWidth: primaryVisData.visWidth
                  ? primaryVisData.visWidth
                  : windowWidth * 3,
                configOptions,
              };
            }
          }
        }
        if (!noData) {
          trackToDrawId[key] = "";
        }
      }

      const groupScale = groupManager.getGroupScale(
        tracks,
        trackDataObj,
        primaryVisData && primaryVisData.visWidth
          ? primaryVisData.visWidth
          : windowWidth * 3,
        viewWindow,
        dataIdx,
        trackFetchedDataCache
      );
      globalTrackState.current.trackStates[dataIdx].trackState["groupScale"] =
        groupScale;

      return trackToDrawId;
    }
  }

  // MARK: [dataIdx,tra]

  useEffect(() => {
    if (highlights) {
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
    if (
      !genomeConfig.isInitial &&
      tracks &&
      !tracks.every((item) => item.waitToUpdate)
    ) {
      const filteredTracks = tracks.filter(
        (trackModel) => trackModel.type !== "g3d"
      );
      const tracksInView = [...trackComponents.map((item) => item.trackModel)];
      if (!arraysHaveSameTrackModels(filteredTracks, tracksInView)) {
        const newGenomealignTracks = filteredTracks.filter(
          (item) => item.type === "genomealign"
        );
        const genomealignTracksInView = tracksInView.filter(
          (item) => item.type === "genomealign"
        );
        if (
          !arraysHaveSameTrackModels(
            newGenomealignTracks,
            genomealignTracksInView
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
                    `${genomeConfig.genome.getName()}`
                  ]["primaryVisData"] = _.cloneDeep(
                    globalTrackState.current.trackStates[key].trackState.visData
                  );
                  const newGenomicFetchCoord = {
                    [genomeConfig.genome.getName()]: _.cloneDeep(
                      trackState.genomicFetchCoord[
                        `${genomeConfig.genome.getName()}`
                      ]
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
        for (const key in trackFetchedDataCache.current) {
          if (!(key in newTrackId)) {
            delete trackFetchedDataCache.current[key];
          }
        }

        const newTrackComponents: Array<any> = [];
        const newG3dComponents: Array<any> = [];
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
          // if not in view this means that this iAs the new track that was added.
          if (!foundComp) {
            if (curTrackModel.type === "g3d") {
              newG3dComponents.push({
                id: curTrackModel.id,
                component: ThreedmolContainer,

                trackModel: curTrackModel,
              });
              continue;
            }
            newAddedTrackModel.push(curTrackModel);
            if (curTrackModel.type === "genomealign") {
              checkHasGenAlign = true;
              if (basePerPixel.current < 10) {
                useFineModeNav.current = true;
              }
              hasGenomeAlign.current = true;
              if (
                hasGenomeAlign.current &&
                fetchGenomeAlignWorker.current &&
                !fetchGenomeAlignWorker.current.hasOnMessage
              ) {
                fetchGenomeAlignWorker.current.fetchWorker.onmessage =
                  createGenomeAlignOnMessage;
                fetchGenomeAlignWorker.current.hasOnMessage = true;
              }
            }
            // for tracks like hic and bam where we create an  instance obj
            // that we reuse to fetch data
            else if (curTrackModel.type === "hic") {
              if (!fetchInstances.current[`${curTrackModel.id}`]) {
                fetchInstances.current[`${curTrackModel.id}`] = new HicSource(
                  curTrackModel.url
                );
              }
            } else if (curTrackModel.type === "dynamichic") {
              curTrackModel.tracks?.map((_item, index) => {
                fetchInstances.current[
                  `${curTrackModel.id}` + "subtrack" + `${index}`
                ] = new HicSource(curTrackModel.tracks![index].url);
              });
            } else if (
              curTrackModel.type in
              { matplot: "", dynamic: "", dynamicbed: "", dynamiclongrange: "" }
            ) {
              curTrackModel.tracks?.map((trackModel, index) => {
                trackModel.id = `${curTrackModel.id}` + "subtrack" + `${index}`;
              });
            } else if (curTrackModel.type === "bam") {
              fetchInstances.current[`${curTrackModel.id}`] = new BamSource(
                curTrackModel.url
              );
            }

            //create initial state for the new track, give it all the prevregion trackstate, and trigger fetch by updating trackcomponents
            needToFetchAddTrack.current = true;
            const newPosRef = createRef();
            const newLegendRef = createRef();

            curTrackModel["legendWidth"] = legendWidth;

            newTrackComponents.push({
              trackIdx: i,
              id: curTrackModel.id,
              component: TrackFactory,
              posRef: newPosRef,
              legendRef: newLegendRef,
              trackModel: curTrackModel,
            });

            trackFetchedDataCache.current[`${curTrackModel.id}`] = _.cloneDeep(
              globalTrackState.current.trackStates
            );

            trackFetchedDataCache.current[`${curTrackModel.id}`][
              "cacheDataIdx"
            ] = {
              rightIdx:
                curTrackModel.type in trackUsingExpandedLoci
                  ? globalTrackState.current.rightIdx + 1
                  : globalTrackState.current.rightIdx,
              leftIdx:
                curTrackModel.type in trackUsingExpandedLoci
                  ? globalTrackState.current.leftIdx - 1
                  : globalTrackState.current.leftIdx,
            };

            initTrackFetchCache(curTrackModel);
          }
        }

        if (!checkHasGenAlign) {
          useFineModeNav.current = false;
          hasGenomeAlign.current = false;
        }

        trackManagerState.current.tracks = filteredTracks;
        addTermToMetaSets(newAddedTrackModel);
        setTrackComponents(newTrackComponents);
        queueRegionToFetch(dataIdx.current);
      } else {
        const newTrackComponents: Array<any> = [];

        let needToToUpdate = false;

        for (let i = 0; i < filteredTracks.length; i++) {
          const curTrackModel = filteredTracks[i];
          if (curTrackModel.id !== trackComponents[i].trackModel.id) {
            needToToUpdate = true;
          }
          // find tracks already in view
          for (let j = 0; j < trackComponents.length; j++) {
            const trackComponent = trackComponents[j];
            if (trackComponent.trackModel.id === curTrackModel.id) {
              if (
                trackComponent.trackModel.isSelected !==
                  curTrackModel.isSelected ||
                i !== j
              ) {
                trackComponent.trackModel.isSelected = curTrackModel.isSelected;
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
      }
      addTermToMetaSets(filteredTracks);
    }

    // Set up worker message handlers when tracks change (new workers might be added)
    // if (infiniteScrollWorkers.current) {
    //   infiniteScrollWorkers.current.worker?.forEach((w) => {
    //     if (!w.hasOnMessage) {
    //       w.fetchWorker.onmessage = createInfiniteOnMessage;
    //       w.hasOnMessage = true;
    //     }
    //   });
    //   infiniteScrollWorkers.current.instance?.forEach((w) => {
    //     if (!w.hasOnMessage) {
    //       w.fetchWorker.onmessage = createInfiniteOnMessage;
    //       w.hasOnMessage = true;
    //     }
    //   });
    // }
  }, [tracks]);

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
        const curTrackToDrawId = getWindowViewConfig(
          viewWindowConfigData.current.viewWindow,
          viewWindowConfigData.current.dataIdx
        );

        setViewWindowConfigChange({
          dataIdx: dataIdx.current,
          viewWindow: viewWindowConfigData.current.viewWindow,
          groupScale:
            globalTrackState.current.trackStates[dataIdx.current].trackState[
              "groupScale"
            ],
          trackToDrawId: curTrackToDrawId,
        });
      }
    }
  }, [viewWindowConfigData.current]);
  // create a useRef object, that keep track of the current dataidx most current view
  // if data Idx from new fetch is diff then, go back to empty object.
  // each track that gets finish get put into the useref
  // setDrawData of the current tracks id that has data ready so {'id': true, 'id2:false}:,
  // check in trackfactory if the track is already drawn  bhy checking the object if its null, nulll means when
  // another track updates and the current track is already drawn we ignore it .
  useEffect(() => {
    if (
      newDrawData &&
      completedFetchedRegion.current.key === dataIdx.current &&
      Object.keys(completedFetchedRegion.current.done).length > 0
    ) {
      let curViewWindow;
      const genomeName = genomeConfig.genome.getName();
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

        const start = tmpStart - windowWidth + startViewWindow.start;
        const end = start + windowWidth;
        curViewWindow = new OpenInterval(start, end);
      } else if (
        selectedRegionSet &&
        bpRegionSize.current === genomeConfig.navContext._totalBases
      ) {
        curViewWindow = new OpenInterval(0, windowWidth);
      } else {
        curViewWindow = globalTrackState.current.viewWindow;
      }

      getWindowViewConfig(curViewWindow, newDrawData.curDataIdx);

      for (let id in newDrawData.trackToDrawId) {
        newDrawData.trackToDrawId[id] = true;
      }
      for (let id in completedFetchedRegion.current.done) {
        if (!completedFetchedRegion.current.done[id]) {
          newDrawData.trackToDrawId[id] = true;
        }
      }
      completedFetchedRegion.current.done = {
        ...completedFetchedRegion.current.done,
        ...newDrawData.trackToDrawId,
      };

      newDrawData.trackToDrawId = newDrawData.trackToDrawId;
      setDraw({ ...newDrawData, viewWindow: curViewWindow });
      processQueue();
    }
  }, [newDrawData]);

  useEffect(() => {
    if (!block.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { height } = entry.contentRect;
        const scrollHeight = entry.target.scrollHeight;
        const newHeight = Math.max(height, scrollHeight);

        // Call the optional callback if provided
        if (onHeightChange) {
          onHeightChange(newHeight);
        }
      }
    });

    resizeObserver.observe(block.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [onHeightChange]);
  return (
    <div
      style={{
        backgroundColor: "var(--bg-color)",
        paddingLeft: "20px",
        marginBottom: "50px",
      }}
    >
      {windowWidth > 0 && userViewRegion && showGenomeNav && (
        <GenomeNavigator
          selectedRegion={userViewRegion}
          genomeConfig={genomeConfig}
          windowWidth={windowWidth + 120}
          onRegionSelected={onRegionSelected}
        />
      )}

      <OutsideClickDetector onOutsideClick={onTrackUnSelect}>
        <div
          className="flex flex-row items-center justify-center"
          style={{
            backgroundColor: "var(--bg-color)",
            width: `${windowWidth + 120}px`,
            marginTop: "2px",
            marginBottom: "2px",
            gap: "2px",
          }}
        >
          <HighlightMenu
            highlights={highlightElements}
            viewRegion={userViewRegion}
            showHighlightMenuModal={true}
            onNewRegion={onRegionSelected}
            onSetHighlights={getHighlightState}
            selectedTool={selectedTool}
          />
          <div
            style={{
              width: "62%",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            {userViewRegion && (
              <TrackRegionController
                selectedRegion={userViewRegion}
                onRegionSelected={onRegionSelected}
                contentColorSetup={{ background: "#F8FAFC", color: "#222" }}
                genomeConfig={genomeConfig}
                trackManagerState={trackManagerState}
                genomeArr={[]}
                genomeIdx={0}
                addGlobalState={undefined}
              />
            )}
            <p
              className="ml-4"
              style={{
                backgroundColor: "var(--bg-color)",
                color: "var(--font-color)",
              }}
            >
              Viewing a{" "}
              {niceBpCount(trackManagerState.current.viewRegion.getWidth())}{" "}
              region in {Math.round(windowWidth)}px, 1 pixel spans{" "}
              {niceBpCount(basePerPixel.current, true)}
            </p>
          </div>
          <div style={{ width: "38%", display: "flex" }}>
            <MetadataHeader
              terms={metaSets.terms}
              onNewTerms={onNewTerms}
              suggestedMetaSets={metaSets.suggestedMetaSets}
              onRemoveTerm={onRemoveTerm}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            outline: "1px solid #9AA6B2",
            width: `${windowWidth + 120}px`,
            overflowX: "hidden",
            overflowY: "hidden",
          }}
        >
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            ref={block}
            style={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
              cursor: (() => {
                switch (tool) {
                  case Tool.Drag:
                    return "pointer";
                  case Tool.Reorder:
                    return "ns-resize";
                  case Tool.Highlight:
                    return "ew-resize";
                  case Tool.Zoom:
                    return "zoom-in";
                  default:
                    return "crosshair";
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

                width: `${windowWidth + 120}px`,
              }}
            >
              <SortableList
                items={trackComponents}
                onChange={handleReorder}
                renderItem={(item) => (
                  <SortableList.Item
                    id={item.id}
                    onMouseDown={(event) => handleShiftSelect(event, item.id)}
                    onContextMenu={(event) => handleRightClick(event, item)}
                    selectedTool={selectedTool}
                  >
                    <div
                      key={item.id}
                      style={{
                        width: `${windowWidth + 120}px`,
                        position: "relative",
                      }}
                    >
                      {/* when selected we want to display an animated border, to do this we have a empty, noninteractable component above our 
                  track component, if we dont do this, the border will try to align with the track which has a difererent width from the view causing error.
                   */}
                      {item.trackModel.isSelected ? (
                        <div className="Track-border-container Track-selected-border"></div>
                      ) : (
                        <div className="Track-border-container"></div>
                      )}
                      <item.component
                        id={item.trackModel.id}
                        trackModel={item.trackModel}
                        posRef={item.posRef}
                        bpRegionSize={bpRegionSize.current}
                        useFineModeNav={useFineModeNav.current}
                        basePerPixel={basePerPixel.current}
                        side={side.current}
                        windowWidth={windowWidth}
                        genomeConfig={genomeConfig}
                        dataIdx={dataIdx.current}
                        trackManagerRef={block}
                        setShow3dGene={setShow3dGene}
                        isThereG3dTrack={isThereG3dTrack}
                        updateGlobalTrackConfig={updateGlobalTrackConfig}
                        applyTrackConfigChange={applyTrackConfigChange}
                        dragX={dragX.current}
                        signalTrackLoadComplete={signalTrackLoadComplete}
                        sentScreenshotData={sentScreenshotData}
                        newDrawData={draw}
                        trackFetchedDataCache={trackFetchedDataCache}
                        globalTrackState={globalTrackState}
                        isScreenShotOpen={isScreenShotOpen}
                        highlightElements={highlightElements}
                        viewWindowConfigData={viewWindowConfigData}
                        viewWindowConfigChange={viewWindowConfigChange}
                        metaSets={metaSets}
                        onColorBoxClick={onColorBoxClick}
                        userViewRegion={userViewRegion}
                        messageData={messageData}
                        Toolbar={Toolbar}
                      />
                    </div>
                  </SortableList.Item>
                )}
              />

              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  width: `${windowWidth}px`,
                  zIndex: 10,
                }}
              >
                {selectedTool &&
                selectedTool.isSelected &&
                selectedTool.title !== 1 ? (
                  <SelectableGenomeArea
                    selectableRegion={userViewRegion}
                    dragLimits={
                      new OpenInterval(legendWidth, windowWidth + 120)
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
                        width: `${windowWidth + 120}px`,
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
          <div
            style={{
              position: "fixed",
              zIndex: 1000,
              flexDirection: "column",
              whiteSpace: "nowrap",
              overflow: "visible",
            }}
          >
            <ConfigMenuComponent key={configMenu.key} menuData={configMenu} />
          </div>
        ) : (
          ""
        )}
      </OutsideClickDetector>
    </div>
  );
});
export default memo(TrackManager);
