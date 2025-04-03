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
import { getDeDupeArrMatPlot, trackUsingExpandedLoci } from "./TrackComponents/CommonTrackStateChangeFunctions.tsx/cacheFetchedData";
import { trackGlobalState } from "./TrackComponents/CommonTrackStateChangeFunctions.tsx/trackGlobalState";
import { GenomeConfig } from "../../models/genomes/GenomeConfig";
import { niceBpCount } from "../../models/util";
import { ITrackModel, Tool } from "../../types";
import { GroupedTrackManager } from "./TrackComponents/GroupedTrackManager";
import { NumericalAggregator } from "./TrackComponents/commonComponents/numerical/NumericalAggregator";
import GenomeNavigator from "./genomeNavigator/GenomeNavigator";

import { SortableList } from "./TrackComponents/commonComponents/chr-order/SortableTrack";
import { formatDataByType, twoDataTypeTracks } from "./TrackComponents/displayModeComponentMap";
const groupManager = new GroupedTrackManager();
const canvasAggregator = new NumericalAggregator();
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

const zoomFactors: { [key: string]: { [key: string]: any } } = {
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
  onTrackSelected: (trackSelected: TrackModel[]) => void;
  onTrackDeleted: (currenTracks: TrackModel[]) => void;
  onNewRegionSelect: (startbase: number, endbase: number) => void;
  tool: any;
  viewRegion?: any;
  showGenomeNav: boolean;
  setScreenshotData: any;
  isScreenShotOpen: boolean;
  selectedRegionSet: any;
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
  onTrackSelected,
  onNewRegionSelect,
  onTrackDeleted,
  tool,
  showGenomeNav,
  setScreenshotData,
  selectedRegionSet,
  isScreenShotOpen,
}) {
  //useRef to store data between states without re render the component
  const infiniteScrollWorker = useRef<Worker | null>(null);
  const fetchGenomeAlignWorker = useRef<Worker | null>(null);
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
  const horizontalLineRef = useRef<any>(0);
  const verticalLineRef = useRef<any>(0);
  const trackFetchedDataCache = useRef<{ [key: string]: any }>({});
  const fetchInstances = useRef<{ [key: string]: any }>({});
  const isMouseInsideRef = useRef(false);
  const globalTrackConfig = useRef<{ [key: string]: any }>({});
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
    tracks: tracks && tracks.length >= 0 ? tracks : genomeConfig.defaultTracks,
  });

  const configMenuPos = useRef<{ [key: string]: any }>({});
  const lastDragX = useRef(0);
  const isThereG3dTrack = useRef(false);

  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const basePerPixel = useRef(0);
  const frameID = useRef(0);
  const lastX = useRef(0);
  const dragX = useRef(0);
  const isLoading = useRef(true);
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
  // These states are used to update the tracks with new fetch(data);
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
    }, 50)
  ).current;
  const startingBpArr = useRef<Array<any>>([]);
  const viewWindowConfigData = useRef<{ viewWindow: OpenInterval, groupScale: any, dataIdx: number } | null>(null);
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
  const [newDrawData, setNewDrawData] = useState<{ [key: string]: any }>({});
  const [initialStart, setInitialStart] = useState("workerNotReady");

  const [show3dGene, setShow3dGene] = useState();
  const [trackComponents, setTrackComponents] = useState<Array<any>>([]);

  const [g3dtrackComponents, setG3dTrackComponents] = useState<Array<any>>([]);
  const [selectedTool, setSelectedTool] = useState<{ [key: string]: any }>({
    isSelected: false,
    title: "none",
  });
  const [draw, setDraw] = useState<{ [key: string]: any }>({});
  const [dataIdx, setDataIdx] = useState(0);
  const [highlightElements, setHighLightElements] = useState<Array<any>>([]);
  const [configMenu, setConfigMenu] = useState<{ [key: string]: any } | null>(
    null
  );
  const [viewWindowConfigChange, setViewWindowConfigChange] = useState<null | { [key: string]: any }>(null);
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
  const enqueueMessage = (message: Array<any>) => {
    messageQueue.current.push(message);
    processQueue();
  };
  const enqueueGenomeAlignMessage = (message: { [key: string]: any }) => {
    genomeAlignMessageQueue.current.push(message);

    processGenomeAlignQueue();
  };

  const processQueue = () => {
    if (isWorkerBusy.current || messageQueue.current.length === 0) {
      return;
    }
    isWorkerBusy.current = true;
    const message = messageQueue.current.pop();
    infiniteScrollWorker.current!.postMessage(message);
  };
  const processGenomeAlignQueue = () => {
    if (
      isfetchGenomeAlignWorkerBusy.current ||
      genomeAlignMessageQueue.current.length === 0
    ) {
      return;
    }
    isfetchGenomeAlignWorkerBusy.current = true;
    const message = genomeAlignMessageQueue.current.pop();

    fetchGenomeAlignWorker.current!.postMessage(message);
  };

  // MARK: mouseAction
  const handleKeyDown = (event: { key: string }) => {
    if (event.key === "Escape") {
      let newSelectedTool: { [key: string]: any } = {};
      newSelectedTool["tool"] = "none";
      newSelectedTool["isSelected"] = false;
      setSelectedTool(newSelectedTool);
      onTrackUnSelect();
      onConfigMenuClose();
    }
  };

  function handleMouseEnter() {
    isMouseInsideRef.current = true;
  }

  function handleMouseLeave() {
    isMouseInsideRef.current = false;
  }
  function handleMove(e: { clientX: number; clientY: number; pageX: number }) {
    if (isMouseInsideRef.current) {
      const parentRect = block.current!.getBoundingClientRect();
      const x = e.clientX - parentRect.left;
      const y = e.clientY - parentRect.top;
      mousePositionRef.current = { x: e.clientX, y: e.clientY };

      updateLinePosition(x, y);
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
    //DONT MOVE THIS PART OR THERE WILL BE FLICKERS BECAUSE when using ref,
    //the new ref data will only be passed to childnre component
    // after the state changes, we put this here so it changes with other
    // useState letiable that changes so we save some computation instead of using
    // another useState
    const curDataIdx = Math.ceil(dragX.current / windowWidth);
    let curViewWindow = side.current === "right"
      ? new OpenInterval(
        -((dragX.current % windowWidth) + -windowWidth),
        -((dragX.current % windowWidth) + -windowWidth) + windowWidth
      )
      : new OpenInterval(
        windowWidth * 3 - ((dragX.current % windowWidth) + windowWidth),
        windowWidth * 3 - ((dragX.current % windowWidth))
      )

    const genomeName = genomeConfig.genome.getName()
    if (useFineModeNav.current && globalTrackState.current.trackStates[curDataIdx].trackState.genomicFetchCoord) {
      let trackState = {
        ...globalTrackState.current.trackStates[curDataIdx].trackState,
      };

      const primaryVisData =
        trackState.genomicFetchCoord[genomeName]
          .primaryVisData;
      const startViewWindow = primaryVisData.viewWindow
      const tmpCur = new OpenInterval(curViewWindow.start, curViewWindow.end)
      console.log(primaryVisData.viewWindow, primaryVisData.viewWindow.end - primaryVisData.viewWindow.start)
      const start = (tmpCur.start - windowWidth) + startViewWindow.start
      const end = start + windowWidth
      curViewWindow = new OpenInterval(start, end)


    }


    setDataIdx((prevState) => {
      if (prevState === curDataIdx) {
        viewWindowConfigData.current = {
          viewWindow: curViewWindow, groupScale: null, dataIdx: curDataIdx
        }
      }
      return curDataIdx
    });

    globalTrackState.current.viewWindow = curViewWindow



    if (dragX.current > 0 && side.current === "right") {
      side.current = "left";
    } else if (dragX.current <= 0 && side.current === "left") {
      side.current = "right";
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

  function onConfigChange(key: string, value: string | number) {
    if (key === "displayMode") {
      let menuComponents: Array<any> = [];
      let optionsObjects: Array<any> = [];
      const selectCount = Object.keys(selectedTracks.current).length;
      let curTrackModel = null;
      for (const config in selectedTracks.current) {
        let curConfig = selectedTracks.current[config];
        curConfig.configOptions.displayMode = value;
        curConfig.trackModel.options = curConfig.configOptions;
        curConfig.configOptions["trackId"] = config;
        const trackConfig = getTrackConfig(curConfig.trackModel);
        const menuItems = trackConfig.getMenuComponents();

        menuComponents.push(menuItems);
        optionsObjects.push(curConfig.configOptions);
        if (selectCount === 1) {
          curTrackModel = curConfig.trackModel;
        }
      }

      const commonMenuComponents: Array<any> = _.intersection(
        ...menuComponents
      );

      let newUnique = crypto.randomUUID();
      let configMenuData = {
        key: newUnique,

        handleDelete,
        pageX: configMenuPos.current.left,
        pageY: configMenuPos.current.top,
        onConfigMenuClose: onConfigMenuClose,
        selectCount: Object.keys(selectedTracks.current).length,
        configOptions: optionsObjects,
        items: commonMenuComponents,
        onConfigChange,
        blockRef: block,
        trackModel: curTrackModel,
      };

      setConfigMenu(configMenuData);
    } else {
      for (const config in selectedTracks.current) {
        let curConfig = selectedTracks.current[config];
        curConfig.configOptions[`${key}`] = value;
        curConfig.trackModel.options = curConfig.configOptions;
      }
    }

    trackManagerState.current.tracks.map((item) => {
      if (item.isSelected) {
        let oldOption = _.cloneDeep(item.options);
        let newVal = _.cloneDeep(value);
        item.options = { ...oldOption, [key]: newVal };
      }
    });
    onTrackSelected([...trackManagerState.current.tracks]);

    let newSelected: { [key: string]: any } = {};
    for (const selected in selectedTracks.current) {
      newSelected[`${selected}`] = { [key]: value };
    }
    setApplyTrackConfigChange(newSelected);
  }

  function renderTrackSpecificConfigMenu(x: number, y: number) {
    let menuComponents: Array<any> = [];
    let optionsObjects: Array<any> = [];
    const selectCount = Object.keys(selectedTracks.current).length;
    let curTrackModel = null;
    for (const config in selectedTracks.current) {
      let curConfig = selectedTracks.current[config];
      const trackConfig = getTrackConfig(curConfig.trackModel);
      const menuItems = trackConfig.getMenuComponents();
      curConfig.configOptions["trackId"] = config;
      menuComponents.push(menuItems);
      optionsObjects.push(curConfig.configOptions);
      if (selectCount === 1) {
        curTrackModel = curConfig.trackModel;
      }
    }
    const commonMenuComponents: Array<any> = _.intersection(...menuComponents);
    let newUnique = crypto.randomUUID();
    let configMenuData = {
      key: newUnique,
      handleDelete,
      pageX: x,
      pageY: y,
      onConfigMenuClose: onConfigMenuClose,
      selectCount: selectCount,
      configOptions: optionsObjects,
      items: commonMenuComponents,
      onConfigChange,
      blockRef: block,
      trackModel: curTrackModel,
    };

    configMenuPos.current = { left: x, top: y };

    setConfigMenu(configMenuData);
  }
  function handleShiftSelect(e: any, trackDetails: { [key: string]: any }) {
    if (e.shiftKey) {
      const trackId = trackDetails.trackModel.id;
      const isSelected = !!selectedTracks.current[trackId]; // Double negative to force a boolean type

      if (!isSelected) {
        selectedTracks.current[trackId] = globalTrackConfig.current[trackId];
      } else {
        selectedTracks.current[trackId] = null;
      }

      const newTracks = trackManagerState.current.tracks.map((trackModel) => {
        if (trackModel.id === trackId) {
          return new TrackModel({
            ...trackModel,
            isSelected: !isSelected,
          });
        }
        return trackModel;
      });

      onTrackSelected(newTracks);

      if (configMenu && Object.keys(selectedTracks.current).length > 0) {
        renderTrackSpecificConfigMenu(e.pageX, e.pageY);
      } else {
        setConfigMenu(null);
      }
    }
  }
  function handleRightClick(e: any, trackDetails: any) {
    e.preventDefault();

    if (trackDetails.trackModel.id in selectedTracks.current) {
      renderTrackSpecificConfigMenu(e.pageX, e.pageY);
    } else {
      onTrackUnSelect();
      trackManagerState.current.tracks.map((trackModel) => {
        if (trackModel.id === trackDetails.trackModel.id) {
          trackModel.isSelected = true;
        }
      });
      // let newStateObj = createNewTrackState(trackManagerState.current, {});

      //addGlobalState(newStateObj);
      // trackDetails.legendRef.current.style.backgroundColor = "lightblue";

      selectedTracks.current[`${trackDetails.trackModel.id}`] =
        globalTrackConfig.current[`${trackDetails.trackModel.id}`];
      onTrackSelected([...trackManagerState.current.tracks]);
      renderTrackSpecificConfigMenu(e.pageX, e.pageY);
    }
  }

  function onConfigMenuClose() {
    setConfigMenu(null);
  }

  function onTrackUnSelect() {
    if (Object.keys(selectedTracks.current).length !== 0) {
      for (const key in selectedTracks.current) {
        // selectedTracks.current[key].legendRef.current.style.backgroundColor =
        //   "white";
      }

      trackManagerState.current.tracks.map((trackModel) => {
        trackModel.isSelected = false;
      });

      // let newStateObj = createNewTrackState(trackManagerState.current, {});
      //addGlobalState(newStateObj);
      onTrackSelected(trackManagerState.current.tracks);
      selectedTracks.current = {};
    }
  }

  function handleDelete(id: Array<any>) {
    trackManagerState.current.tracks = trackManagerState.current.tracks.filter(
      (item, _index) => {
        return !id.includes(String(item.id));
      }
    );

    onTrackDeleted([...trackManagerState.current.tracks]);
    // let newStateObj = createNewTrackState(trackManagerState.current, {});

    //addGlobalState(newStateObj);

    // setTrackComponents((prevTracks) => {
    //   return prevTracks.filter((item, _index) => {
    //     if (id.includes(String(item.trackModel.id))) {
    //       delete selectedTracks.current[`${item.trackModel.id}`];
    //     }
    //     return !id.includes(String(item.trackModel.id));
    //   });
    // });

    // setG3dTrackComponents((prevTracks) => {
    //   return prevTracks.filter((item, _index) => {
    //     return !id.includes(String(item.trackModel.id));
    //   });
    // });
    if (id.length > 0) {
      onConfigMenuClose();
    }
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
      newOrder.push(item.trackModel);
    }
    trackManagerState.current.tracks = _.cloneDeep(newOrder);
    onTrackSelected(trackManagerState.current.tracks);
  }

  async function fetchGenomeData(initial: number = 0, trackSide: string, viewWindow: OpenInterval) {
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
        ? new OpenInterval(trackWindowWidth, trackWindowWidth * 2)
        : new OpenInterval(trackWindowWidth, trackWindowWidth * 2)
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
              initBpLoci[index].endS
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

    // sent the navigation to fetch the data from server
    // try {
    //   queueRegionToFetch(initial ? 0 : dataIdx);
    // } catch {}
  }
  // MARK: onmessInfin
  function createInfiniteOnMessage() {
    infiniteScrollWorker.current!.onmessage = (event) => {
      // Process each object in the array individually
      Promise.all(
        event.data.map(async (dataItem) => {
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
                // Need to await the function finishes for BAM and Hi-C that use fetch instances
                await createCache({
                  trackState: curTrackState,
                  result: item.result,
                  id: item.id,
                  trackType: item.name,
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
                      "records" in
                      trackFetchedDataCache.current[key][cacheDataIdx]
                    ) {
                      delete trackFetchedDataCache.current[key][cacheDataIdx]
                        .records;
                    }
                  }
                }
              }
            }
          }

          // Return necessary data for setNewDrawData
          return {
            trackDataIdx: dataItem.trackDataIdx,
            initial: dataItem.initial,
            trackToDrawId: trackToDrawId,
            missingIdx: dataItem.missingIdx,
          };
        })
      )
        .then((drawData) => {

          setNewDrawData({
            curDataIdx: drawData[0].trackDataIdx,
            isInitial: drawData[0].initial,
            trackToDrawId: drawData[0].trackToDrawId,
            missingIdx: drawData[0].missingIdx,
          });

          isWorkerBusy.current = false;

          // Once we finish with a fetch, check if there are more requests in the queue
          processQueue();
        })
        .catch((error) => {
          console.error("An error occurred trying to fetch data:", error);
        });
    };
  }
  // MARK: onmessGenAl
  function createGenomeAlignOnMessage() {
    fetchGenomeAlignWorker.current!.onmessage = (event) => {
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
          ].trackState.genomicFetchCoord = curTrackState.genomicFetchCoord;

          globalTrackState.current.trackStates[
            curTrackState.missingIdx
              ? curTrackState.missingIdx
              : curTrackState.trackDataIdx
          ].trackState["startWindow"] =
            curTrackState.genomicFetchCoord[
              genomeConfig.genome.getName()
            ].primaryVisData.viewWindow.start;

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
            enqueueMessage(curTrackState);
          }
        })
        .catch((error) => {
          console.error(
            "An error occurred when trying to fetch genomealign track:",
            error
          );
        });
    };
  }
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
              trackFetchedDataCache.current[key]["dataCache"] = null;
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

    if (Object.keys(trackToDrawId).length > 0 && !needToFetchGenAlign) {
      setNewDrawData({
        curDataIdx: dataIdx,
        isInitial: 0,
        trackToDrawId,
      });
    }
  }

  // MARK: createCache
  async function createCache(fetchRes: { [key: string]: any }) {
    const tmpTrackState = { ...fetchRes.trackState };
    let result;
    if (fetchRes.trackType in { hic: "", dynamichic: "", bam: "" }) {
      let configOptions;
      if (fetchRes.id in globalTrackConfig.current) {
        configOptions = globalTrackConfig.current[fetchRes.id];
      } else {
        const curTrackModel = tracks.find(
          (trackModel: any) => trackModel.id === fetchRes.id
        );

        if (curTrackModel) {
          configOptions = {
            ...trackOptionMap[`${fetchRes.type}`],
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
        result = await fetchInstances.current[`${fetchRes.id}`].getData(
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
      // this means that we just fetched data from a region that we already visited
      // - we already have trackState, this includes, regionloci + expandloci
      // - new fetch data will have its visRegion deleled or replaced here
      // - we just need to set a visRegion, visRegion is used to draw components we have to set it for the newly fetched data
      // - we also set the datacache with its trackModel Id and missingIdx datacoord to store.
      // - we don't use cacheFetchedData because we don't want to update the rightIdx / leftIdx cause both have latest info already.
      const formattedData = (fetchRes.trackType in twoDataTypeTracks) ? result : formatDataByType(result, fetchRes.trackType)
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
    toolTitle: number | string = "isJump"
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

      onNewRegionSelect(startbase, endbase);
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
      queryGenome !== genomeConfig.genome.getName() ? false : true;

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

    useFineModeNav.current = false;
    trackManagerId.current = "";
    leftStartCoord.current = 0;
    rightStartCoord.current = 0;
    bpRegionSize.current = 0;
    pixelPerBase.current = 0;
    isWorkerBusy.current = false;
    messageQueue.current = [];
    bpX.current = 0;
    maxBp.current = 0;
    minBp.current = 0;
    selectedTracks.current = {};
    mousePositionRef.current = { x: 0, y: 0 };

    // fetchInstances.current = {};
    // isMouseInsideRef.current = false;
    // globalTrackConfig.current = {};
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
    // isThereG3dTrack.current = false;
    basePerPixel.current = 0;
    frameID.current = 0;
    lastX.current = 0;
    dragX.current = 0;

    // isToolSelected.current = false;
    side.current = "right";
    isDragging.current = false;
    rightSectionSize.current = [windowWidth];
    leftSectionSize.current = [];

    setShow3dGene(undefined);
    // setTrackComponents([]);
    setG3dTrackComponents([]);
    setNewDrawData({});
    // setSelectedTool({ ...tool });

    let highlightElement = createHighlight(highlights);
    globalTrackState.current = { rightIdx: 0, leftIdx: 1, trackStates: {} };
    trackFetchedDataCache.current = {};
    setHighLightElements([...highlightElement]);

    setDataIdx(0);

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
    const newG3dComponents: Array<any> = [];

    // loop through trackmanager checking to see if the track is already created else if create a new one with default valuies
    for (let i = 0; i < trackManagerState.current.tracks.length; i++) {
      if (trackManagerState.current.tracks[i].type === "genomealign") {
        if (basePerPixel.current < 10) {
          useFineModeNav.current = true;
        }
      }
      if (trackManagerState.current.tracks[i].type === "hic") {
        fetchInstances.current[`${trackManagerState.current.tracks[i].id}`] =
          new HicSource(trackManagerState.current.tracks[i].url);
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
          (trackModel: { id: string }, index: any) => {
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

      if (trackManagerState.current.tracks[i].type !== "g3d") {
        newTrackComponents.push({
          trackIdx: i,
          id: trackManagerState.current.tracks[i].id,
          component: TrackFactory,
          posRef: newPosRef,
          legendRef: newLegendRef,
          trackModel: trackManagerState.current.tracks[i],
          hasAllRegionData: false,
        });
      } else {
        isThereG3dTrack.current = true;

        newG3dComponents.push({
          id: trackManagerState.current.tracks[i].id,
          component: ThreedmolContainer,

          trackModel: trackManagerState.current.tracks[i],
        });
      }
    }

    if (newG3dComponents.length > 0) {
      setG3dTrackComponents(newG3dComponents);
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
                  selectedTracks.current[key!] =
                    globalTrackConfig.current[key!];
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

      setScreenshotData({
        tracks: convertedITrackModel,
        trackData: screenshotDataObj.current,
        highlights: highlightElements,
        windowWidth,
      });
      screenshotDataObj.current = {};
    }
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
      if (infiniteScrollWorker.current) {
        infiniteScrollWorker.current!.terminate();
      }
      if (fetchGenomeAlignWorker.current) {
        fetchGenomeAlignWorker.current!.terminate();
      }
      if (parentElement) {
        parentElement.removeEventListener("mouseenter", handleMouseEnter);
        parentElement.removeEventListener("mouseleave", handleMouseLeave);
      }

      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMouseUp);

      // console.log("trackmanager terminate");
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

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMouseUp);
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
  useEffect(() => {
    if (initialStart === "workerReady") {
      initializeTracks();
    }
  }, [initialStart]);
  // MARK: [GenConfig]
  useEffect(() => {
    // on GenomeRoot first creation we add the default state to StateArr in genomeroot
    // on recreation of trackManager we do not need to set the defaultState because it is saved in genomeroot so we skip to else
    // and do not add to the StateArr.

    if (genomeConfig.isInitial) {
      prevWindowWidth.current = windowWidth;

      trackManagerState.current.tracks.map(
        (items: { type: string }, _index: any) => {
          if (items.type === "genomealign") {
            hasGenomeAlign.current = true;
          }
        }
      );

      //addGlobalState(newStateObj);

      // create the worker and trigger state change before we can actually use them takes one re render to acutally
      // start working.Thats why we need the initialStart state.
      if (initialStart === "workerNotReady") {
        infiniteScrollWorker.current = new Worker(
          new URL("../../getRemoteData/fetchDataWorker.ts", import.meta.url),
          {
            type: "module",
          }
        );
        createInfiniteOnMessage();
        if (hasGenomeAlign.current) {
          fetchGenomeAlignWorker.current = new Worker(
            new URL(
              "../../getRemoteData/fetchGenomeAlignWorker.ts",
              import.meta.url
            ),
            {
              type: "module",
            }
          );
          createGenomeAlignOnMessage();
        }

        setInitialStart("workerReady");
      }
      preload.current = true;
    } else if (genomeConfig.sizeChange) {
      // refreshState();
      trackSizeChange();
      // initialConfig.current = true;

      // initializeTracks();
    } else {
      preload.current = true;

      // genomeConfig.defaultTracks = trackManagerState.current.tracks;
      refreshState();
      initializeTracks();
    }
    // onNewRegion(
    //   genomeConfig.defaultRegion.start,
    //   genomeConfig.defaultRegion.end
    // );
  }, [genomeConfig]);

  // MARK: trackSizeCha



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
      for (const key in trackFetchedDataCache.current) {
        const trackCache = trackFetchedDataCache.current[key];

        if (trackCache.trackType === "genomealign") {
          for (const dataKey in trackCache) {
            if (isInteger(dataKey)) {
              delete trackFetchedDataCache.current[key][dataKey].dataCache;
            }
          }
        }
      }

      if (basePerPixel.current < 10) {
        useFineModeNav.current = true;
      } else {
        useFineModeNav.current = false;
      }
      const tmpArr = [...trackComponents];
      setTrackComponents(tmpArr);
      queueRegionToFetch(dataIdx);
    } else {
      const tmpArr = [...trackComponents];
      setTrackComponents(tmpArr);
      setNewDrawData({
        curDataIdx: dataIdx,
        isInitial: 0,
        trackToDrawId,
      });
    }
  }
  // MARK: viewWindowConfig
  function getReDrawViewWindow(
    viewWindow, dataIdx
  ) {
    const trackDataObj: { [key: string]: any } = {};
    const trackToDrawId: { [key: string]: any } = {};
    let groupScale: { [groupId: number]: { scale: TrackModel; min: {}; max: {}; } } | null = null;
    for (let key in trackFetchedDataCache.current) {

      if (trackFetchedDataCache.current[key][dataIdx]["xvalues"]) {
        trackDataObj[key] = trackFetchedDataCache.current[key][dataIdx]["xvalues"]
        trackToDrawId[key] = ""
      }
    }
    if (!_.isEmpty(trackDataObj)) {

      groupScale = groupManager.getGroupScaleWithXvalues(tracks, trackDataObj, viewWindow)
      globalTrackState.current.trackStates[dataIdx].trackState["groupScale"] = groupScale

    }

    setViewWindowConfigChange({ dataIdx, viewWindow, groupScale, trackToDrawId })
  }



  function getWindowViewConfig(
    viewWindow, dataIdx
  ) {
    if (viewWindow) {
      const trackDataObj: { [key: string]: any } = {};
      const trackToDrawId: { [key: string]: any } = {};
      let primaryVisData;
      for (let key in trackFetchedDataCache.current) {
        const cacheTrackData = trackFetchedDataCache.current[key];
        // methylc: "" qbed: "" , dynseq: "",,
        if (!(cacheTrackData.trackType in { "bigwig": "", "bedgraph": "" })) {
          continue
        }
        let combinedData: any = [];

        let currIdx = dataIdx + 1;

        let noData = false;
        for (let i = 0; i < 3; i++) {
          if (!cacheTrackData[currIdx] || !cacheTrackData[currIdx].dataCache || "error" in cacheTrackData[currIdx].dataCache) {
            noData = true
            break;
          }
          else {
            combinedData.push(cacheTrackData[currIdx]);
          }
          currIdx--;
        }

        if (!noData) {
          if (cacheTrackData.trackType in { matplot: "", dynamic: "", dynamicbed: "" }) {
            combinedData = getDeDupeArrMatPlot(combinedData, false);
          } else {
            combinedData = combinedData.map((item) => {
              if (item && "dataCache" in item && item.dataCache) {
                return item.dataCache;
              } else {
                noData = true;
              }
            }).flat(1);
          }
        }

        if (!noData) {

          const trackState = { ...globalTrackState.current.trackStates[dataIdx].trackState };
          let visRegion;


          if (cacheTrackData.trackType !== "genomealign") {
            primaryVisData = trackState.genomicFetchCoord[trackState.primaryGenName].primaryVisData;
            visRegion = !cacheTrackData.usePrimaryNav
              ? trackState.genomicFetchCoord[trackFetchedDataCache.current[key].queryGenome].queryRegion
              : primaryVisData.visRegion;

            if (typeof visRegion === "object") {
              visRegion = objToInstanceAlign(visRegion)
            }

            trackDataObj[key] = { data: combinedData, visRegion: visRegion, visWidth: primaryVisData.visWidth };
          }
        }
        if (!noData) {
          trackToDrawId[key] = "";
        }
      }

      const groupScale = groupManager.getGroupScale(tracks, trackDataObj, viewWindow.start * 3, viewWindow, dataIdx, trackFetchedDataCache);

      globalTrackState.current.trackStates[dataIdx].trackState["groupScale"] = groupScale

    }
  }

  // MARK: [dataIdx,tra]

  useEffect(() => {
    queueRegionToFetch(dataIdx);
  }, [dataIdx]);

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
  function arraysHaveSameTrackModels(
    array1: Array<TrackModel>,
    array2: Array<TrackModel>
  ): boolean {
    // Check if the lengths are different. If they are, return false.
    if (array1.length !== array2.length) {
      return false;
    }

    // Use a map to keep track of the count of each id in the first array.
    const idCounts = new Map();

    for (let item of array1) {
      // Increment the count for each id in the first array.
      idCounts.set(item.id, (idCounts.get(item.id) || 0) + 1);
    }

    for (let item of array2) {
      // Decrement the count for each id in the second array.
      if (!idCounts.has(item.id)) {
        return false;
      }
      const newCount = idCounts.get(item.id) - 1;
      if (newCount === 0) {
        idCounts.delete(item.id);
      } else {
        idCounts.set(item.id, newCount);
      }
    }

    // If idCounts is empty, it means both arrays have the same ids with the same counts.
    return idCounts.size === 0;
  }

  useEffect(() => {
    if (!genomeConfig.isInitial && tracks) {
      if (
        !arraysHaveSameTrackModels(tracks, [
          ...trackComponents.map((item) => item.trackModel),
          ...g3dtrackComponents.map((item) => item.trackModel),
        ])
      ) {
        const newTrackId: { [key: string]: any } = {};
        for (const trackModel of tracks) {
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
        let checkHasGenAlign = false;
        for (let i = 0; i < tracks.length; i++) {
          const curTrackModel = tracks[i];

          let foundComp = false;

          // find tracks already in view
          for (let trackComponent of trackComponents) {
            if (trackComponent.trackModel.id === curTrackModel.id) {
              if (curTrackModel.type === "g3d") {
                newG3dComponents.push(trackComponent);
              } else {
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
            if (curTrackModel.type === "genomealign") {
              checkHasGenAlign = true;
              if (basePerPixel.current < 10) {
                useFineModeNav.current = true;
              }
              hasGenomeAlign.current = true;
              if (hasGenomeAlign.current && !fetchGenomeAlignWorker.current) {
                fetchGenomeAlignWorker.current = new Worker(
                  new URL(
                    "../../getRemoteData/fetchGenomeAlignWorker.ts",
                    import.meta.url
                  ),
                  {
                    type: "module",
                  }
                );
                createGenomeAlignOnMessage();
              }
            }
            // for tracks like hic and bam where we create an  instance obj
            // that we reuse to fetch data
            else if (curTrackModel.type === "hic") {
              fetchInstances.current[`${curTrackModel.id}`] = new HicSource(
                curTrackModel.url
              );
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

        trackManagerState.current.tracks = tracks;

        setG3dTrackComponents(newG3dComponents);
        setTrackComponents(newTrackComponents);
        queueRegionToFetch(dataIdx);
      } else {
        const newTrackComponents: Array<any> = [];
        const newG3dComponents: Array<any> = [];
        let needToToUpdate = false;

        for (let i = 0; i < tracks.length; i++) {
          const curTrackModel = tracks[i];

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
              if (curTrackModel.type === "g3d") {
                newG3dComponents.push(trackComponent);
              } else {
                newTrackComponents.push(trackComponent);
              }
            }
          }
        }
        if (needToToUpdate) {
          setTrackComponents(newTrackComponents);
          setG3dTrackComponents(newG3dComponents);
        }
      }
    }
  }, [tracks]);

  useEffect(() => {
    const toolbarContainer = document.getElementById("toolbar-container");
    if (toolbarContainer) {
      toolbarContainer.style.visibility = configMenu ? "hidden" : "visible";
    }
  }, [configMenu]);
  useEffect(() => {
    if (viewWindowConfigData.current) {
      if (dataIdx === viewWindowConfigData.current.dataIdx) {

        getReDrawViewWindow(viewWindowConfigData.current.viewWindow, viewWindowConfigData.current.dataIdx)

      }
    }
  }, [viewWindowConfigData.current]);
  useEffect(() => {

    if (newDrawData.curDataIdx === dataIdx) {

      let curViewWindow
      const genomeName = genomeConfig.genome.getName()
      if (useFineModeNav.current && globalTrackState.current.trackStates[newDrawData.curDataIdx].trackState.genomicFetchCoord) {
        let trackState = {
          ...globalTrackState.current.trackStates[newDrawData.curDataIdx].trackState,
        };

        const primaryVisData =
          trackState.genomicFetchCoord[genomeName]
            .primaryVisData;
        const startViewWindow = primaryVisData.viewWindow
        const tmpCur = globalTrackState.current.viewWindow
        const start = (tmpCur.start - windowWidth) + startViewWindow.start
        const end = start + windowWidth
        curViewWindow = new OpenInterval(start, end)


      }
      else {
        curViewWindow = globalTrackState.current.viewWindow
      }

      getWindowViewConfig(curViewWindow, newDrawData.curDataIdx);
      setDraw({ ...newDrawData })

    }
  }, [newDrawData]);
  return (
    <div>
      {windowWidth > 0 && userViewRegion && showGenomeNav && (
        <GenomeNavigator
          selectedRegion={userViewRegion}
          genomeConfig={genomeConfig}
          windowWidth={windowWidth + 120}
          onRegionSelected={onRegionSelected}
        />
      )}
      <OutsideClickDetector onOutsideClick={onTrackUnSelect}>
        <div className="flex flex-row py-10 items-center justify-center">
          <HighlightMenu
            highlights={highlightElements}
            viewRegion={userViewRegion}
            showHighlightMenuModal={true}
            onNewRegion={onRegionSelected}
            onSetHighlights={getHighlightState}
            selectedTool={selectedTool}
          />
          {userViewRegion && (
            <TrackRegionController
              selectedRegion={userViewRegion}
              onRegionSelected={(start: number, end: number) =>
                onRegionSelected(start, end, "isJump")
              }
              contentColorSetup={{ background: "#F8FAFC", color: "#222" }}
              genomeConfig={genomeConfig}
              trackManagerState={trackManagerState}
              genomeArr={[]}
              genomeIdx={0}
              addGlobalState={undefined}
            />
          )}
          <p className="ml-4">
            Viewing a{" "}
            {niceBpCount(trackManagerState.current.viewRegion.getWidth())}{" "}
            region in {Math.round(windowWidth)}px, 1 pixel spans{" "}
            {niceBpCount(basePerPixel.current, true)}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            //makes components align right or right when we switch sides

            flexDirection: "row",
            // full windowwidth will make canvas only loop 0-windowidth
            // the last value will have no data.
            // so we have to subtract from the size of the canvas
            border: "2px solid #BCCCDC",
            width: `${windowWidth + 120}px`,
            // width: `${fullWindowWidth / 2}px`,
            // height: "2000px",
            overflowX: "hidden",
            overflowY: "hidden",
          }}
        >
          <div
            onMouseDown={handleMouseDown}
            ref={block}
            style={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
              cursor:
                tool === Tool.Drag
                  ? "pointer"
                  : tool === Tool.Reorder
                    ? "move"
                    : tool === Tool.Highlight
                      ? "ew-resize"
                      : tool === Tool.Zoom
                        ? "zoom-in"
                        : "default",
            }}
          >
            <div ref={horizontalLineRef} className="horizontal-line" />
            <div ref={verticalLineRef} className="vertical-line" />

            <div
              style={{
                display: "flex",
                //makes components align right or right when we switch sides

                flexDirection: "row",
                // full windowwidth will make canvas only loop 0-windowidth
                // the last value will have no data.
                // so we have to subtract from the size of the canvas
                width: `${windowWidth + 120}px`,
                // width: `${fullWindowWidth / 2}px`,
                // height: "2000px",
                // overflowX: "hidden",
                // overflowY: "hidden",
              }}
            >
              <SortableList
                items={trackComponents}
                onChange={handleReorder}
                renderItem={(item) => (
                  <SortableList.Item
                    id={item.id}
                    onMouseDown={(event) => handleShiftSelect(event, item)}
                    onContextMenu={(event) => handleRightClick(event, item)}
                    selectedTool={selectedTool}
                  >
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        backgroundColor: "#F2F2F2",
                        width: `${windowWidth + 120}px`,
                        borderTop: item.trackModel.isSelected
                          ? ""
                          : "1px solid Dodgerblue",
                        borderBottom: item.trackModel.isSelected
                          ? ""
                          : "1px solid Dodgerblue",
                      }}
                      className={
                        item.trackModel.isSelected ? "animatedBorder" : ""
                      }
                    >
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
                        dataIdx={dataIdx}
                        trackManagerRef={block}
                        setShow3dGene={setShow3dGene}
                        isThereG3dTrack={isThereG3dTrack.current}
                        legendRef={item.legendRef}
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
                        viewWindowConfigData={viewWindowConfigData.current}
                        viewWindowConfigChange={viewWindowConfigChange}
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
              overflow: "visible", // ensure the menu can overflow the parent
            }}
          >
            <ConfigMenuComponent key={configMenu.key} menuData={configMenu} />
          </div>
        ) : (
          ""
        )}
      </OutsideClickDetector>

      {g3dtrackComponents.length > 0 ? (
        <div
          style={{
            display: "flex",

            backgroundColor: "white",
            WebkitBackfaceVisibility: "hidden",
            WebkitPerspective: `${windowWidth + 120}px`,
            backfaceVisibility: "hidden",
            perspective: `${windowWidth + 120}px`,
            border: "1px solid #d3d3d3",
            borderRadius: "10px",
            boxShadow: "0 2px 3px 0 rgba(0, 0, 0, 0.2)",
            padding: "5px",
            flexWrap: "wrap",
          }}
        >
          {g3dtrackComponents.map((item, index) => {
            let Component = item.component;
            if (trackManagerState.current.viewRegion) {
              return (
                <div key={item.id} style={{ width: "50%" }}>
                  <Component
                    handleDelete={handleDelete}
                    tracks={tracks}
                    g3dtrack={item.trackModel}
                    viewRegion={trackManagerState.current.viewRegion}
                    width={windowWidth / 2}
                    genomeConfig={genomeConfig}
                    geneFor3d={show3dGene}
                  />
                </div>
              );
            } else {
              return "";
            }
          })}
        </div>
      ) : (
        ""
      )}
    </div>
  );
});
export default memo(TrackManager);
