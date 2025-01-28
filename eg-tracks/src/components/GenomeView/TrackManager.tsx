import { createRef, memo, useEffect, useRef, useState } from "react";
const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;

import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import OpenInterval from "../../models/OpenInterval";
import { v4 as uuidv4 } from "uuid";

import { TrackProps } from "../../models/trackModels/trackProps";
import { FeatureSegment } from "../../models/FeatureSegment";
import ChromosomeInterval from "../../models/ChromosomeInterval";
import Feature from "../../models/Feature";
import NavigationContext from "../../models/NavigationContext";
import { HicSource } from "../../getRemoteData/hicSource";
import { trackOptionMap } from "./TrackComponents/defaultOptionsMap";
import ThreedmolContainer from "./TrackComponents/3dmol/ThreedmolContainer";
import TrackModel from "../../models/TrackModel";
import { TYPE_NAME_TO_CONFIG } from "../../trackConfigs/config-menu-models.tsx/getTrackConfig";
import _, { isNumber } from "lodash";
import ConfigMenuComponent from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";
import SubToolButtons from "./ToolComponents/SubToolButtons";
import HighlightMenu from "./ToolComponents/HighlightMenu";
import History from "./ToolComponents/History";
import TrackFactory from "./TrackComponents/TrackFactory";

import BamSource from "../../getRemoteData/BamSource";

import { SelectableGenomeArea } from "./genomeNavigator/SelectableGenomeArea";
import React from "react";
import OutsideClickDetector from "./TrackComponents/commonComponents/OutsideClickDetector";

import { getTrackConfig } from "../../trackConfigs/config-menu-models.tsx/getTrackConfig";
import {
  createNewTrackState,
  TrackState,
} from "./TrackComponents/CommonTrackStateChangeFunctions.tsx/createNewTrackState";
import TrackRegionController from "./genomeNavigator/TrackRegionController";
import ZoomControls from "./ToolComponents/ZoomControls";
import {
  cacheFetchedData,
  trackUsingExpandedLoci,
} from "./TrackComponents/CommonTrackStateChangeFunctions.tsx/cacheFetchedData";
import { trackGlobalState } from "./TrackComponents/CommonTrackStateChangeFunctions.tsx/trackGlobalState";

function sumArray(numbers) {
  let total = 0;
  for (let i = 0; i < numbers.length; i++) {
    total += numbers[i];
  }
  return total;
}
const MIN_VIEW_REGION_SIZE = 5;
export function objToInstanceAlign(alignment) {
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

export function bpNavToGenNav(bpNavArr, genome) {
  let genRes: Array<any> = [];
  for (let bpNav of bpNavArr) {
    let genomeFeatureSegment: Array<FeatureSegment> =
      genome.navContext.getFeaturesInInterval(
        "start" in bpNav ? bpNav.start : bpNav._startBase,
        "end" in bpNav ? bpNav.end : bpNav._endBase
      );

    genRes.push(genomeFeatureSegment.map((item, index) => item.getLocus()));
  }

  return genRes;
}

interface TrackManagerProps {
  windowWidth: number;
  legendWidth: number;
  selectedRegion?: any;
  genomeConfig: any;
  highlights: Array<any>;
  tracks: Array<TrackModel>;
  onNewRegion: (startbase: number, endbase: number) => void;
  onNewHighlight: (highlightState: Array<any>) => void;
  onTrackSelected: (trackSelected: TrackModel[]) => void;
  onTrackDeleted: (currenTracks: TrackModel[]) => void;
}
const TrackManager: React.FC<TrackManagerProps> = memo(function TrackManager({
  windowWidth,

  legendWidth,
  genomeConfig,
  selectedRegion,
  highlights,
  tracks,
  onNewRegion,
  onNewHighlight,
  onTrackSelected,
  onTrackDeleted,
}) {
  //useRef to store data between states without re render the component

  const infiniteScrollWorker = useRef<Worker>();
  const fetchGenomeAlignWorker = useRef<Worker>();
  const useFineModeNav = useRef(false);

  const useCacheData = useRef(false);
  const trackManagerId = useRef("");
  const leftStartCoord = useRef(0);
  const rightStartCoord = useRef(0);
  const bpRegionSize = useRef(0);
  const pixelPerBase = useRef(0);
  const block = useRef<HTMLInputElement>(null);
  const g3dRect = useRef<HTMLInputElement>(null);
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
      global: {}, // Populate based on your need
      layout: {}, // Populate based on your need
      borders: [],
    },
    metadataTerms: [],
    regionSetView: null,
    regionSets: [],
    viewRegion: new DisplayedRegionModel(genomeConfig.navContext, 0, 1),
    trackLegendWidth: legendWidth,
    tracks: genomeConfig.defaultTracks,
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
  const test = useRef<Array<any>>([]);
  const preloadedTracks = useRef<{ [key: string]: any }>({});
  const screenshotDataObj = useRef<{ [key: string]: any }>({});
  const preload = useRef<boolean>(false);
  // These states are used to update the tracks with new fetch(data);
  const containerRef = useRef(null);
  const initialConfig = useRef(true);
  const globalTrackState = useRef({ rightIdx: 0, leftIdx: 1, trackState: {} });
  const initialPreloadTrackFetch = useRef<Array<any>>([]);
  const startingBpArr = useRef<Array<any>>([]);
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

  const [dataIdx, setDataIdx] = useState(0);
  const [highlightElements, setHighLightElements] = useState<Array<any>>([]);
  const [configMenu, setConfigMenu] = useState<{ [key: string]: any }>({
    configMenus: "",
  });

  const [applyTrackConfigChange, setApplyTrackConfigChange] = useState<{
    [key: string]: any;
  }>({});

  // MOUSE EVENTS FUNCTION HANDLER, HOW THE TRACK WILL CHANGE BASED ON WHAT THE USER DOES: DRAGGING, MOUSESCROLL, CLICK
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  const messageQueue = useRef<any>([]);
  const isWorkerBusy = useRef(false);
  const genomeAlignMessageQueue = useRef<any>([]);
  const isfetchGenomeAlignWorkerBusy = useRef(false);
  const enqueueMessage = (message) => {
    messageQueue.current.push(message);
    processQueue();
  };
  const enqueueGenomeAlignMessage = (message) => {
    genomeAlignMessageQueue.current.push(message);
    processGenomeAlignQueue();
  };
  // when a new track is added, for any track currently in the manager
  // on message for the new track fetch data, added track will pass the current dataidx
  // to the components thru enqueuemessage, since we dont't need to fetch for track track already in manager
  // we just pass the dataidx
  // and creates the new initial data, if dataidx is -7 those track will get
  // -6 -7 -8
  // if multiple track are added in succession
  // first: it would pass the current dataidx to the tracks already in the manager and
  // create new initial so -6 -7 -8  =>  -1 0 1
  // second: every added track after will now just start with dataidx 0 and it would be
  // correct for the data already in the component because its alter in the first track add.
  const processQueue = () => {
    if (isWorkerBusy.current || messageQueue.current.length === 0) {
      return;
    }
    isWorkerBusy.current = true;
    const message = messageQueue.current.shift();
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
    const message = genomeAlignMessageQueue.current.shift();
    fetchGenomeAlignWorker.current!.postMessage(message);
  };

  // MARK: MOUSE
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      let newSelectedTool = {};
      newSelectedTool["tool"] = "none";
      newSelectedTool["isSelected"] = false;
      setSelectedTool(newSelectedTool);
    }
  };

  function handleMouseEnter() {
    isMouseInsideRef.current = true;
  }

  function handleMouseLeave() {
    isMouseInsideRef.current = false;
  }
  function handleMove(e) {
    if (isMouseInsideRef.current) {
      const parentRect = block.current!.getBoundingClientRect();
      const x = e.clientX - parentRect.left;
      const y = e.clientY - parentRect.top;
      mousePositionRef.current = { x: e.clientX, y: e.clientY };

      horizontalLineRef.current.style.top = `${y}px`;
      verticalLineRef.current.style.left = `${x}px`;
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

    trackComponents.forEach((component, i) => {
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

    trackManagerState.current.viewRegion._startBase = curBp;
    trackManagerState.current.viewRegion._endBase =
      curBp + bpRegionSize.current;
    onNewRegion(curBp, curBp + bpRegionSize.current);
    //addGlobalState(newStateObj);

    bpX.current = curBp;
    //DONT MOVE THIS PART OR THERE WILL BE FLICKERS BECAUSE when using ref,
    //the new ref data will only be passed to childnre component
    // after the state changes, we put this here so it changes with other
    // useState variable that changes so we save some computation instead of using
    // another useState

    setDataIdx(Math.ceil(dragX.current! / windowWidth));
    if (dragX.current > 0 && side.current === "right") {
      side.current = "left";
    } else if (dragX.current <= 0 && side.current === "left") {
      side.current = "right";
    }

    if (
      -dragX.current >= sumArray(rightSectionSize.current) &&
      dragX.current < 0
    ) {
      isLoading.current = true;
      rightSectionSize.current.push(windowWidth);
      console.log("trigger right");

      fetchGenomeData(0, "right", Math.ceil(dragX.current! / windowWidth));
    } else if (
      dragX.current >= sumArray(leftSectionSize.current) &&
      dragX.current > 0
    ) {
      isLoading.current = true;
      console.log("trigger left");
      leftSectionSize.current.push(windowWidth);
      fetchGenomeData(0, "left", Math.ceil(dragX.current! / windowWidth));
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
    if (
      Object.keys(globalTrackConfig.current).length ===
        trackManagerState.current.tracks.length &&
      initialConfig.current
    ) {
      trackManagerState.current.tracks.map((trackModel) => {
        if (trackModel.isSelected) {
          selectedTracks.current[`${trackModel.id}`] =
            globalTrackConfig.current[`${trackModel.id}`];

          globalTrackConfig.current[
            `${trackModel.id}`
          ].legendRef.current.style.backgroundColor = "lightblue";
        }
      });

      initialConfig.current = false;
    }
  }

  function onConfigChange(key, value) {
    if (key === "displayMode") {
      let menuComponents: Array<any> = [];
      let optionsObjects: Array<any> = [];

      for (const config in selectedTracks.current) {
        let curConfig = selectedTracks.current[config];
        curConfig.configOptions.displayMode = value;
        curConfig.trackModel.options = curConfig.configOptions;
        curConfig.configOptions["trackId"] = config;
        const trackConfig = getTrackConfig(curConfig.trackModel);
        const menuItems = trackConfig.getMenuComponents();

        menuComponents.push(menuItems);
        optionsObjects.push(curConfig.configOptions);
      }

      const commonMenuComponents: Array<any> = _.intersection(
        ...menuComponents
      );
      let newUnique = uuidv4();
      let configMenuData = {
        key: newUnique,
        trackIdx: selectedTracks.current.length,
        handleDelete,

        pageX: configMenuPos.current.left,
        pageY: configMenuPos.current.top,
        onConfigMenuClose: onConfigMenuClose,
        selectLen: selectedTracks.current.length,
        configOptions: optionsObjects,
        items: commonMenuComponents,
        onConfigChange,
        blockRef: block,
      };

      setConfigMenu({ configMenus: configMenuData });
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
    let newStateObj = createNewTrackState(trackManagerState.current, {});

    //addGlobalState(newStateObj);
    let newSelected = {};
    for (const selected in selectedTracks.current) {
      newSelected[`${selected}`] = { [key]: value };
    }
    setApplyTrackConfigChange(newSelected);
  }

  function renderTrackSpecificConfigMenu(x, y) {
    let menuComponents: Array<any> = [];
    let optionsObjects: Array<any> = [];
    for (const config in selectedTracks.current) {
      let curConfig = selectedTracks.current[config];
      const trackConfig = getTrackConfig(curConfig.trackModel);
      const menuItems = trackConfig.getMenuComponents();
      curConfig.configOptions["trackId"] = config;
      menuComponents.push(menuItems);
      optionsObjects.push(curConfig.configOptions);
    }

    const commonMenuComponents: Array<any> = _.intersection(...menuComponents);
    let newUnique = uuidv4();
    let configMenuData = {
      key: newUnique,
      trackIdx: selectedTracks.current.length,
      handleDelete,
      pageX: x,
      pageY: y,
      onConfigMenuClose: onConfigMenuClose,
      selectLen: selectedTracks.current.length,
      configOptions: optionsObjects,
      items: commonMenuComponents,
      onConfigChange,
      blockRef: block,
    };

    configMenuPos.current = { left: x, top: y };

    setConfigMenu({ configMenus: configMenuData });
  }
  function handleShiftSelect(e: any, trackDetails: { [key: string]: any }) {
    if (e.shiftKey) {
      if (!selectedTracks.current[`${trackDetails.trackModel.id}`]) {
        selectedTracks.current[`${trackDetails.trackModel.id}`] =
          globalTrackConfig.current[`${trackDetails.trackModel.id}`];
        trackDetails.legendRef.current.style.backgroundColor = "lightblue";

        trackManagerState.current.tracks.map((trackModel) => {
          if (trackModel.id === trackDetails.trackModel.id) {
            trackModel.isSelected = true;
          }
        });
      } else if (trackDetails.trackModel.id in selectedTracks.current) {
        trackDetails.legendRef.current.style.backgroundColor = "white";
        delete selectedTracks.current[`${trackDetails.trackModel.id}`];
        trackManagerState.current.tracks.map((trackModel) => {
          if (trackModel.id === trackDetails.trackModel.id) {
            trackModel.isSelected = false;
          }
        });
      }

      let newStateObj = createNewTrackState(trackManagerState.current, {});

      //addGlobalState(newStateObj);

      if (
        configMenu.configMenus !== "" &&
        Object.keys(selectedTracks.current).length > 0
      ) {
        renderTrackSpecificConfigMenu(e.pageX, e.pageY);
      } else {
        let tmpObh = { configMenus: "" };
        setConfigMenu(tmpObh);
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
      let newStateObj = createNewTrackState(trackManagerState.current, {});

      //addGlobalState(newStateObj);
      trackDetails.legendRef.current.style.backgroundColor = "lightblue";

      selectedTracks.current[`${trackDetails.trackModel.id}`] =
        globalTrackConfig.current[`${trackDetails.trackModel.id}`];

      renderTrackSpecificConfigMenu(e.pageX, e.pageY);
    }
  }
  function onConfigMenuClose() {
    setConfigMenu({ configMenus: "" });
  }
  function onTrackUnSelect() {
    if (Object.keys(selectedTracks.current).length !== 0) {
      for (const key in selectedTracks.current) {
        selectedTracks.current[key].legendRef.current.style.backgroundColor =
          "white";
      }
      trackManagerState.current.tracks.map((trackModel) => {
        trackModel.isSelected = false;
      });
      let newStateObj = createNewTrackState(trackManagerState.current, {});

      //addGlobalState(newStateObj);

      selectedTracks.current = {};
      setConfigMenu({ configMenus: "" });
    }
  }

  function handleDelete(id: Array<any>) {
    trackManagerState.current.tracks = trackManagerState.current.tracks.filter(
      (item, index) => {
        return !id.includes(String(item.id));
      }
    );
    let newStateObj = createNewTrackState(trackManagerState.current, {});

    //addGlobalState(newStateObj);

    setTrackComponents((prevTracks) => {
      return prevTracks.filter((item, index) => {
        if (id.includes(String(item.trackModel.id))) {
          delete selectedTracks.current[`${item.trackModel.id}`];
        }
        return !id.includes(String(item.trackModel.id));
      });
    });
  }
  // MARK: FETCHGEN
  // FUNCTION TO FETCH DATA AND CHANGE STATE TO INDICATE THERE ARE NEW DATA AFTER GETTING NAV COORD TELLING THE each TRACK
  // COMPONENTS TO UPDATE AND DRAW WITH THE NEW DATA
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  async function fetchGenomeData(initial: number = 0, trackSide, dataIdx) {
    // console.log(window.performance);

    let tempObj = {};
    let curFetchRegionNav;

    let genomicLoci: Array<ChromosomeInterval> = [];

    let initNavLoci: Array<any> = [];
    var initExpandLoci: Array<any> = [];
    let newVisData;
    let expandedGenomeCoordLocus;
    var regionLoci: Array<any>;
    if (initial === 1) {
      const initialNavObj = {};
      const initVisData: Array<any> = [
        {
          visWidth: windowWidth * 3,
          visRegion: new DisplayedRegionModel(
            genomeConfig.navContext,
            minBp.current - bpRegionSize.current * 2,
            maxBp.current
          ),
          viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
          viewWindowRegion: new DisplayedRegionModel(
            genomeConfig.navContext,
            minBp.current - bpRegionSize.current,
            minBp.current
          ),
        },

        {
          visWidth: windowWidth * 3,
          visRegion: new DisplayedRegionModel(
            genomeConfig.navContext,
            minBp.current,
            maxBp.current + bpRegionSize.current * 2
          ),
          viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
          viewWindowRegion: new DisplayedRegionModel(
            genomeConfig.navContext,
            maxBp.current,
            maxBp.current + bpRegionSize.current
          ),
        },
      ];
      initExpandLoci = [
        { start: minBp.current - bpRegionSize.current * 2, end: maxBp.current },
        {
          start: minBp.current - bpRegionSize.current,
          end: maxBp.current + bpRegionSize.current,
        },
        { start: minBp.current, end: maxBp.current + bpRegionSize.current * 2 },
      ];
      initNavLoci.push({
        start: minBp.current - bpRegionSize.current,
        end: minBp.current,
      });
      initNavLoci.push({
        start: maxBp.current - bpRegionSize.current,
        end: maxBp.current,
      });
      initNavLoci.push({
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
        visWidth: windowWidth * 3,
        visRegion: new DisplayedRegionModel(
          genomeConfig.navContext,
          minBp.current - bpRegionSize.current,
          maxBp.current + bpRegionSize.current
        ),
        viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
        viewWindowRegion: curFetchRegionNav,
      };

      let expandedGenomeFeatureSegment: Array<FeatureSegment> =
        genomeConfig.navContext.getFeaturesInInterval(
          minBp.current - bpRegionSize.current,
          maxBp.current + bpRegionSize.current
        );

      expandedGenomeCoordLocus = expandedGenomeFeatureSegment.map(
        (item, index) => item.getLocus()
      );
      minBp.current = minBp.current - bpRegionSize.current * 2;
      maxBp.current = maxBp.current + bpRegionSize.current * 2;
      regionLoci = bpNavToGenNav(initNavLoci, genomeConfig);
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

        genomicLoci = genomeFeatureSegment.map((item, index) =>
          item.getLocus()
        );
        let regionGenomeFeatureSegment: Array<FeatureSegment> =
          genomeConfig.navContext.getFeaturesInInterval(
            maxBp.current - bpRegionSize.current * 2,
            maxBp.current - bpRegionSize.current
          );
        var regionNav = new DisplayedRegionModel(
          genomeConfig.navContext,
          maxBp.current - bpRegionSize.current * 2,
          maxBp.current - bpRegionSize.current
        );
        regionLoci = regionGenomeFeatureSegment.map((item, index) =>
          item.getLocus()
        );
        newVisData = {
          visWidth: windowWidth * 3,
          visRegion: new DisplayedRegionModel(
            genomeConfig.navContext,
            maxBp.current - bpRegionSize.current * 3,
            maxBp.current
          ),
          viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
          viewWindowRegion: regionNav,
        };

        let expandedGenomeFeatureSegment: Array<FeatureSegment> =
          genomeConfig.navContext.getFeaturesInInterval(
            maxBp.current - bpRegionSize.current * 3,
            maxBp.current
          );

        expandedGenomeCoordLocus = expandedGenomeFeatureSegment.map(
          (item, index) => item.getLocus()
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

        genomicLoci = genomeFeatureSegment.map((item, index) =>
          item.getLocus()
        );
        let regionGenomeFeatureSegment: Array<FeatureSegment> =
          genomeConfig.navContext.getFeaturesInInterval(
            minBp.current + bpRegionSize.current,
            minBp.current + bpRegionSize.current * 2
          );
        var regionNav = new DisplayedRegionModel(
          genomeConfig.navContext,
          minBp.current + bpRegionSize.current,
          minBp.current + bpRegionSize.current * 2
        );
        regionLoci = regionGenomeFeatureSegment.map((item, index) =>
          item.getLocus()
        );
        newVisData = {
          visWidth: windowWidth * 3,
          visRegion: new DisplayedRegionModel(
            genomeConfig.navContext,
            minBp.current,
            minBp.current + bpRegionSize.current * 3
          ),
          viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
          viewWindowRegion: regionNav,
        };

        let expandedGenomeFeatureSegment: Array<FeatureSegment> =
          genomeConfig.navContext.getFeaturesInInterval(
            minBp.current,
            minBp.current + bpRegionSize.current * 3
          );

        expandedGenomeCoordLocus = expandedGenomeFeatureSegment.map(
          (item, index) => item.getLocus()
        );
        startingBpArr.current.unshift(minBp.current);
        minBp.current = minBp.current - bpRegionSize.current;
      }
    }
    // MARK: FetchWorker

    try {
      // add to fetch queue when user reaches a new region without data.
      if (hasGenomeAlign.current) {
        const genomeAlignTracks = trackManagerState.current.tracks.filter(
          (items, index) => {
            return items.type === "genomealign";
          }
        );
        // MARK: genAlign
        enqueueGenomeAlignMessage({
          cacheData: [],
          trackToFetch: genomeAlignTracks,
          visData: newVisData,
          genomicLoci,
          initGenomicLoci: bpNavToGenNav(initNavLoci, genomeConfig),
          primaryGenName: genomeConfig.genome.getName(),
          trackModelArr: trackManagerState.current.tracks,
          expandedGenLoci: expandedGenomeCoordLocus,
          useFineModeNav: useFineModeNav.current,
          windowWidth,
          initExpandLoci: bpNavToGenNav(initExpandLoci, genomeConfig),
          regionLoci,
          trackSide: trackSide,
          dataSide: trackSide,
          xDist: dragX.current,
          initial,
          bpRegionSize: bpRegionSize.current,
          trackDataIdx: initial === 1 ? 0 : dataIdx,
          missingIdx: null,
        });

        fetchGenomeAlignWorker.current!.onmessage = (event) => {
          const curTrackState = {
            ...event.data.navData,
          };

          Promise.all(
            Object.values(event.data.fetchResults).map((item: any, index) => {
              console.log(event.data.fetchResults);
              createCache({
                trackState: curTrackState,
                result:
                  item.trackModel.type in TYPE_NAME_TO_CONFIG
                    ? item.result
                    : [{ error: "ASDASDASDASDASD" }],

                id: item.id,
                trackType: item.trackModel.type,
                metadata: item.metadata,
                trackModel: item.trackModel,
                curFetchNav: item.name === "bam" ? item.curFetchNav : "",
                dataSide: event.data.dataSide,
                missingIdx: event.data.missingIdx,
              });

              trackFetchedDataCache.current[item.id][
                curTrackState.trackDataIdx
              ]["records"] = item.records;
            })
          )
            .then(() => {
              isfetchGenomeAlignWorkerBusy.current = false;

              // once we finish with a fetch we need to check if there are any more
              // request in the queue, user might scroll fast and have multipe region data to fetch
              processGenomeAlignQueue();
              console.log(curTrackState, event.data, "GENOMEALIGNFETCH");
              enqueueMessage(curTrackState);
            })
            .catch((error) => {
              console.error("An error occurred:", error);
            });
        };
      }
      // MARK: NormalTrack
      else {
        enqueueMessage({
          primaryGenName: genomeConfig.genome.getName(),
          trackModelArr: trackManagerState.current.tracks,
          visData: newVisData,
          genomicLoci,
          expandedGenLoci: expandedGenomeCoordLocus,
          useFineModeNav: useFineModeNav.current,
          windowWidth,
          initGenomicLoci: bpNavToGenNav(initNavLoci, genomeConfig),
          initExpandLoci: bpNavToGenNav(initExpandLoci, genomeConfig),
          regionLoci,
          trackSide: trackSide,
          dataSide: trackSide,
          xDist: dragX.current,
          initial,
          bpRegionSize: bpRegionSize.current,
          trackDataIdx: initial === 1 ? 0 : dataIdx,

          missingIdx: null,
        });
      }
    } catch {}

    infiniteScrollWorker.current!.onmessage = (event) => {
      const trackToDrawId = {};
      // var bpInt = getIntervals(
      //   event.data.visData._startBase + bpRegionSize.current,
      //   event.data.visData._endBase - bpRegionSize.current
      // );
      console.log(event.data, "nongenomealignfetch");
      const curTrackState = {
        primaryGenName: genomeConfig.genome.getName(),
        initial: event.data.initial,
        side: event.data.side,
        xDist: event.data.xDist,
        genomicFetchCoord: event.data.genomicFetchCoord,
        regionLoci: event.data.regionLoci,
        visData: event.data.visData,
      };

      if (!isNumber(event.data.missingIdx)) {
        trackGlobalState({
          trackState: curTrackState,
          globalTrackState: globalTrackState,
          navContext: genomeConfig.navContext,
          bpRegionSize: bpRegionSize.current,
        });
      }

      Promise.all(
        event.data.fetchResults.map((item, index) => {
          if (item.id !== "test") {
            trackToDrawId[`${item.id}`] = "";

            createCache({
              trackState: curTrackState,
              result:
                item.name in TYPE_NAME_TO_CONFIG
                  ? item.result
                  : [{ error: "ASDASDASDASDASD" }],
              id: item.id,
              trackType: item.name,
              metadata: item.metadata,
              trackModel: item.trackModel,
              curFetchNav: item.name === "bam" ? item.curFetchNav : "",
              dataSide: event.data.dataSide,
              missingIdx: event.data.missingIdx,
            });
          } else {
            console.log(item);
          }
        })
      )
        .then(() => {
          setNewDrawData({
            curDataIdx: event.data.trackDataIdx,
            isInitial: event.data.initial,
            trackToDrawId: { ...trackToDrawId, ...event.data.trackToDrawId },
          });

          console.log(
            trackFetchedDataCache.current,
            globalTrackState.current,
            event.data.trackDataIdx,
            event.data.missingIdx,
            "newFetchedData",
            {
              curDataIdx: event.data.trackDataIdx,
              isInitial: event.data.initial,
              trackToDrawId,
            }
          );
          isWorkerBusy.current = false;
          isLoading.current = false;
          // once we finish with a fetch we need to check if there are any more
          // request in the queue, user might scroll fast and have multipe region data to fetch
          processQueue();
        })
        .catch((error) => {
          console.error("An error occurred:", error);
        });
    };
  }

  async function createCache(fetchRes: { [key: string]: any }) {
    var tmpTrackState = { ...fetchRes.trackState };

    if (tmpTrackState.initial) {
      trackFetchedDataCache.current[`${fetchRes.id}`]["usePrimaryNav"] =
        "genome" in fetchRes.metadata &&
        fetchRes.metadata.genome !== fetchRes.trackState.primaryGenName
          ? false
          : true;

      trackFetchedDataCache.current[`${fetchRes.id}`]["useExpandedLoci"] =
        fetchRes.trackType in trackUsingExpandedLoci ||
        ("genome" in fetchRes.metadata &&
          fetchRes.metadata.genome !== fetchRes.trackState.primaryGenName)
          ? true
          : false;
    }
    var result;
    if (fetchRes.trackType in { hic: "", dynamichic: "", bam: "" }) {
      var configOptions;
      if (fetchRes.id in globalTrackConfig.current) {
        configOptions = globalTrackConfig.current[fetchRes.id];
      } else {
        const curTrackModel = genomeConfig.defaultTracks.find(
          (trackModel: any) => trackModel.id === fetchRes.id
        );

        configOptions = {
          ...trackOptionMap[`${fetchRes.type}`],
          ...curTrackModel.options,
        };
      }

      const primaryVisData =
        tmpTrackState.genomicFetchCoord[tmpTrackState.primaryGenName]
          .primaryVisData;

      let visRegion =
        "genome" in fetchRes.metadata
          ? tmpTrackState.genomicFetchCoord[fetchRes.metadata.genome]
              .queryRegion
          : primaryVisData.visRegion;

      if (fetchRes.trackType === "hic") {
        result = await fetchInstances.current[`${fetchRes.id}`].getData(
          objToInstanceAlign(visRegion),
          basePerPixel.current,
          configOptions
        );
      } else if (fetchRes.trackType === "dynamichic") {
        const curStraw = fetchRes.trackModel.tracks.map((hicTrack, index) => {
          return fetchInstances.current[
            `${fetchRes.id}` + "subtrack" + `${index}`
          ];
        });
        result = await Promise.all(
          curStraw.map((straw, index) => {
            return straw.getData(
              objToInstanceAlign(visRegion),
              basePerPixel.current,
              configOptions
            );
          })
        );
      } else {
        let tmpRawData: Array<Promise<any>> = [];
        fetchRes.curFetchNav.forEach((locuses) => {
          tmpRawData.push(
            fetchInstances.current[`${fetchRes.id}`].getData(locuses)
          );
        });
        result = await Promise.all(tmpRawData);
        if (!tmpTrackState.initial) {
          result = result.flat();
        }
      }
    } else {
      result = fetchRes.result;
    }

    if (isNumber(fetchRes.missingIdx)) {
      if (!("visRegion" in tmpTrackState)) {
        const visRegion =
          tmpTrackState.genomicFetchCoord[genomeConfig.genome.getName()]
            .primaryVisData.visRegion;
        if (!visRegion) console.log(visRegion, fetchRes);
        trackFetchedDataCache.current[`${fetchRes.id}`][
          fetchRes.missingIdx
        ].trackState["visRegion"] = visRegion;
      }

      trackFetchedDataCache.current[`${fetchRes.id}`][fetchRes.missingIdx][
        "dataCache"
      ] = fetchRes.trackType === "genomealign" ? result[0] : result;
    } else {
      cacheFetchedData({
        usePrimaryNav: trackFetchedDataCache.current[fetchRes.id].usePrimaryNav,
        id: fetchRes.id,
        trackData: result,
        trackState: tmpTrackState,
        trackFetchedDataCache: trackFetchedDataCache,
        metadata: fetchRes.metadata,
        trackType: fetchRes.trackType,
        navContext: genomeConfig.navContext,
        bpRegionSize: bpRegionSize.current,
      });
    }
  }

  // MARK: TOOL
  // handle SELECTABLE DRAG AREA TO GET DATA FOR TOOL FUNCTIONS and other tools functions
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  function onToolClicked(tool: any) {
    if (tool.title === "Pan left (Alt+Z)") {
      onRegionSelected(
        Math.round(bpX.current - bpRegionSize.current),
        Math.round(bpX.current - bpRegionSize.current * 2),
        tool.title
      );
    } else if (tool.title === "Pan right (Alt+X)") {
      onRegionSelected(
        Math.round(bpX.current + bpRegionSize.current),
        Math.round(bpX.current + bpRegionSize.current * 2),
        tool.title
      );
    } else if (
      tool.title in
      {
        "Zoom in 5-fold": "",
        "Zoom in 1-fold (Alt+I)": "",
        "Zoom in 1/3-fold": "",
        "Zoom out 1/3-fold": "",
        "Zoom out 1-fold (Alt+O)": "",
        "Zoom out 5-fold": "",
      }
    ) {
      let useDisplayFunction = new DisplayedRegionModel(
        genomeConfig.navContext,
        bpX.current,
        bpX.current + bpRegionSize.current
      );
      let res = useDisplayFunction.zoom(tool.factor);
      onRegionSelected(
        res._startBase as number,
        res._endBase as number,
        tool.title
      );
    } else {
      setSelectedTool((prevState) => {
        if (prevState.title === tool.title) {
          let newSelectedTool = {};
          newSelectedTool["title"] = "none";
          newSelectedTool["isSelected"] = false;
          isToolSelected.current = false;
          return newSelectedTool;
        } else {
          let newSelectedTool = {};
          newSelectedTool["title"] = tool.title;
          newSelectedTool["isSelected"] = true;
          isToolSelected.current = true;
          return newSelectedTool;
        }
      });
    }
  }

  function onRegionSelected(
    startbase: number,
    endbase: number,
    toolTitle: string = ""
  ) {
    const newLength = endbase - startbase;
    if (newLength < MIN_VIEW_REGION_SIZE) {
      const amountToExpand = 0.5 * (MIN_VIEW_REGION_SIZE - newLength);
      startbase -= amountToExpand;
      endbase += amountToExpand;
    }
    if (
      selectedTool.title === `Zoom-in tool (Alt+M)` ||
      toolTitle in
        {
          "Zoom in 5-fold": "",
          "Zoom in 1-fold (Alt+I)": "",
          "Zoom in 1/3-fold": "",
          "Zoom out 1/3-fold": "",
          "Zoom out 1-fold (Alt+O)": "",
          "Zoom out 5-fold": "",
          "Pan right (Alt+X)": "",
          "Pan left (Alt+Z)": "",
        }
    ) {
      trackManagerState.current.viewRegion._startBase = startbase;
      trackManagerState.current.viewRegion._endBase = endbase;
      let newStateObj = createNewTrackState(trackManagerState.current, {
        viewRegion: trackManagerState.current.viewRegion.clone(),
      });
      //addGlobalState(newStateObj);
      let newDefaultTracksArr: Array<TrackModel> = [];
      for (let key in globalTrackConfig.current) {
        let curTrackOptions = globalTrackConfig.current[`${key}`];
        curTrackOptions["trackModel"].options = curTrackOptions.configOptions;
        newDefaultTracksArr.push(curTrackOptions["trackModel"]);
      }
      genomeConfig.defaultTracks = newDefaultTracksArr;
      genomeConfig.defaultRegion = new OpenInterval(startbase, endbase);
      // recreateTrackmanager({
      //   selectedTool: selectedTool,
      //   genomeConfig: genomeConfig,
      //   scrollY: window.scrollY,
      // });
    } else if (selectedTool.title === `Highlight tool (Alt+N)`) {
      let newHightlight = {
        start: startbase,
        end: endbase,
        display: true,
        color: "rgba(0, 123, 255, 0.15)",
        tag: "",
      };

      onNewHighlight([newHightlight]);
    }
  }

  function createHighlight(highlightArr: Array<any>) {
    let resHighlights: Array<any> = [];
    let pixelPBase =
      windowWidth /
      (genomeConfig.defaultRegion.end - genomeConfig.defaultRegion.start);
    for (const curhighlight of highlightArr) {
      let highlightSide =
        curhighlight.start - genomeConfig.defaultRegion.start <= 0
          ? "right"
          : "left";

      let startHighlight =
        (curhighlight.start - genomeConfig.defaultRegion.start) * pixelPBase;

      let endHighlight =
        -(curhighlight.end - genomeConfig.defaultRegion.start) * pixelPBase;
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

  function highlightJump(startbase: any, endbase: any) {
    trackManagerState.current.viewRegion._startBase = startbase;
    trackManagerState.current.viewRegion._endBase = endbase;
    let newStateObj = createNewTrackState(trackManagerState.current, {
      viewRegion: trackManagerState.current.viewRegion.clone(),
    });
    //addGlobalState(newStateObj);
    let newDefaultTracksArr: Array<TrackModel> = [];
    for (let key in globalTrackConfig.current) {
      let curTrackOptions = globalTrackConfig.current[`${key}`];
      curTrackOptions["trackModel"].options = curTrackOptions.configOptions;
      newDefaultTracksArr.push(curTrackOptions["trackModel"]);
    }
    genomeConfig.defaultTracks = newDefaultTracksArr;
    genomeConfig.defaultRegion = new OpenInterval(startbase, endbase);

    // recreateTrackmanager({
    //   selectedTool: selectedTool,
    //   genomeConfig: genomeConfig,
    //   scrollY: window.scrollY,
    // });
  }

  // MARK: InitState
  // state management functions
  //______________________________________________________________________________________________________________
  //______________________________________________________________________________________________________________
  //______________________________________________________________________________________________________________
  const refreshState = () => {
    // Reset useRef variables

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

    fetchInstances.current = {};
    isMouseInsideRef.current = false;
    globalTrackConfig.current = {};
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
        genomeConfig ? genomeConfig.navContext : null,
        0,
        1
      ),
      trackLegendWidth: legendWidth,
      tracks: tracks.length > 0 ? tracks : genomeConfig.defaultTracks,
    };
    initialConfig.current = true;
    configMenuPos.current = {};
    lastDragX.current = 0;
    isThereG3dTrack.current = false;
    basePerPixel.current = 0;
    frameID.current = 0;
    lastX.current = 0;
    dragX.current = 0;

    isLoading.current = true;
    isToolSelected.current = false;
    side.current = "right";
    isDragging.current = false;
    rightSectionSize.current = [windowWidth];
    leftSectionSize.current = [];

    setShow3dGene(undefined);
    // setTrackComponents([]);
    setG3dTrackComponents([]);
    setNewDrawData({});
    setSelectedTool({ isSelected: false, title: "none" });

    let highlightElement = createHighlight(highlights);
    globalTrackState.current = { rightIdx: 0, leftIdx: 1, trackState: {} };
    trackFetchedDataCache.current = {};
    setHighLightElements([...highlightElement]);

    setDataIdx(0);

    setConfigMenu({ configMenus: "" });
    setApplyTrackConfigChange({});
  };

  function initializeTracks() {
    // set initial track manager control values and create fetch instance for track that can't use worker like hic.

    const tmpQueryGenObj: { [key: string]: any } = {};
    tmpQueryGenObj[`${genomeConfig.genome.getName()}`] = "";
    const annotationTracks = genomeConfig.annotationTracks || {};
    const comparisonTracks = annotationTracks["Genome Comparison"] || [];

    trackManagerState.current.tracks.map((items, index) => {
      if (items.type === "genomealign") {
        let queryGenomeName;

        if (items.querygenome) {
          queryGenomeName = items.querygenome;
          tmpQueryGenObj[`${items.querygenome}`] = "";
        } else if (items.metadata && items.metadata.genome) {
          queryGenomeName = items.metadata.genome;
          tmpQueryGenObj[`${items.metadata.genome}`] = "";
          items.querygenome = queryGenomeName;
        }
        if (queryGenomeName) {
          const theTrack =
            comparisonTracks.find(
              (track: any) => track.querygenome === queryGenomeName
            ) || {};

          items.url = theTrack.url;
        }
      }
    });

    if (preload.current && genomeConfig.sizeChange) {
      for (let i = 1; i < startingBpArr.current.length; i++) {
        if (startingBpArr.current[i] > genomeConfig.defaultRegion.start) {
          leftStartCoord.current = startingBpArr.current[i - 1];
          rightStartCoord.current = startingBpArr.current[i];

          break;
        }
      }
    } else {
      leftStartCoord.current = genomeConfig.defaultRegion.start;
      rightStartCoord.current = genomeConfig.defaultRegion.end;
    }

    bpRegionSize.current = rightStartCoord.current - leftStartCoord.current;

    basePerPixel.current = bpRegionSize.current / windowWidth;
    pixelPerBase.current = windowWidth / bpRegionSize.current;
    if (preload.current && genomeConfig.sizeChange) {
      dragX.current =
        (leftStartCoord.current - genomeConfig.defaultRegion.start) *
        pixelPerBase.current;
    }

    bpX.current = leftStartCoord.current;
    maxBp.current = rightStartCoord.current;
    minBp.current = leftStartCoord.current;
    let newTrackComponents: Array<any> = [];
    let trackIdx = 0;
    let track3dIdx = 0;
    initialPreloadTrackFetch.current = [];
    // loop through trackmanager checking to see if the track is already created else if create a new one with default valuies
    for (let i = 0; i < trackManagerState.current.tracks.length; i++) {
      const curTrackModel = trackManagerState.current.tracks[i];
      let foundInvalidTrack = false;
      if (
        (curTrackModel.metadata.genome &&
          !(curTrackModel.metadata.genome in tmpQueryGenObj)) ||
        !(curTrackModel.type in TYPE_NAME_TO_CONFIG)
      ) {
        foundInvalidTrack = true;
      }
      if (trackManagerState.current.tracks[i].type === "genomealign") {
        if (basePerPixel.current < 10) {
          useFineModeNav.current = true;
        }
      }
      if (trackManagerState.current.tracks[i].type === "hic") {
        fetchInstances.current[`${trackManagerState.current.tracks[i].id}`] =
          new HicSource(trackManagerState.current.tracks[i].url);
      } else if (trackManagerState.current.tracks[i].type === "dynamichic") {
        trackManagerState.current.tracks[i].tracks?.map((item, index) => {
          fetchInstances.current[
            `${trackManagerState.current.tracks[i].id}` +
              "subtrack" +
              `${index}`
          ] = new HicSource(
            trackManagerState.current.tracks[i].tracks![index].url
          );
        });
      } else if (
        trackManagerState.current.tracks[i].type in
        { matplot: "", dynamic: "", dynamicbed: "", dynamiclongrange: "" }
      ) {
        trackManagerState.current.tracks[i].tracks?.map((trackModel, index) => {
          trackModel.id =
            `${trackManagerState.current.tracks[i].id}` +
            "subtrack" +
            `${index}`;
        });
      } else if (trackManagerState.current.tracks[i].type === "bam") {
        fetchInstances.current[`${trackManagerState.current.tracks[i].id}`] =
          new BamSource(trackManagerState.current.tracks[i].url);
      }

      if (preload.current) {
        let foundComp = false;
        for (let trackComponent of trackComponents) {
          if (
            trackComponent.trackModel.id ===
              trackManagerState.current.tracks[i].id &&
            trackComponent.hasData &&
            trackManagerState.current.tracks[i].type !== "bam"
          ) {
            trackComponent.trackModel.options =
              trackManagerState.current.tracks[i].options;
            trackComponent.trackIdx = i;

            newTrackComponents.push(trackComponent);
            foundComp = true;
          }
        }
        if (!foundComp) {
          const newPosRef = createRef();
          const newLegendRef = createRef();
          const uniqueKey = uuidv4();
          trackManagerState.current.tracks[i]["legendWidth"] = legendWidth;

          newTrackComponents.push({
            trackIdx: i,
            id: uniqueKey,
            component: TrackFactory,
            posRef: newPosRef,
            legendRef: newLegendRef,
            trackModel: trackManagerState.current.tracks[i],
            hasData: false,
          });

          if (!foundInvalidTrack) {
            initialPreloadTrackFetch.current.push(
              trackManagerState.current.tracks[i]
            );
          }
        }
        continue;
      }

      // in case of initial creation of trackmanager then we create new track components
      else {
        if (trackManagerState.current.tracks[i].type !== "g3d") {
          const newPosRef = createRef();
          const newLegendRef = createRef();
          const uniqueKey = uuidv4();
          trackManagerState.current.tracks[i]["legendWidth"] = legendWidth;

          newTrackComponents.push({
            trackIdx: i,
            id: uniqueKey,
            component: TrackFactory,
            posRef: newPosRef,
            legendRef: newLegendRef,
            trackModel: trackManagerState.current.tracks[i],
            hasData: false,
          });
        } else {
          isThereG3dTrack.current = true;
          let newG3dComponent: Array<any> = [];
          const uniqueKeyG3d = uuidv4();
          trackManagerState.current.tracks[i]["id"] = uniqueKeyG3d;
          newG3dComponent.push({
            trackIdx: track3dIdx,
            id: uniqueKeyG3d,
            component: ThreedmolContainer,

            trackModel: trackManagerState.current.tracks[i],
          });
          setG3dTrackComponents([...newG3dComponent]);
          track3dIdx++;
        }
      }
    }

    if (!preload.current) {
      setTrackComponents(() => {
        return [...newTrackComponents];
      });
    } else {
      let newStateOptions = {};
      for (let trackModel of trackManagerState.current.tracks) {
        newStateOptions[`${trackModel.id}`] = trackModel.options;
      }
      for (let i = newTrackComponents.length - 1; i >= 0; i--) {
        if (!(newTrackComponents[i].trackModel.id in newStateOptions)) {
          newTrackComponents.splice(i, 1);
        }
      }

      setTrackComponents(newTrackComponents);
    }
    newTrackComponents.map((item, index) => {
      trackFetchedDataCache.current[`${item.trackModel.id}`] = {};
      trackFetchedDataCache.current[`${item.trackModel.id}`]["cacheDataIdx"] = {
        leftIdx: 1,
        rightIdx: 0,
      };
    });
    fetchGenomeData(1, "right", dataIdx);
  }

  function checkTrackPreload(trackId) {
    if (preload.current || genomeConfig.isInitial) {
      preloadedTracks.current[`${trackId}`] = "";
      if (
        Object.keys(preloadedTracks.current).length === trackComponents.length
      ) {
        preloadedTracks.current = {};

        trackComponents.map((component, i) => {
          frameID.current = requestAnimationFrame(() => {
            component.posRef.current!.style.transform = `translate3d(${dragX.current}px, 0px, 0)`;
          });
        });
        preload.current = false;
        if (genomeConfig.isInitial) {
          genomeConfig.isInitial = false;
        }
      }
    }
  }
  function sentScreenshotData(trackDataObj) {
    screenshotDataObj.current[`${trackDataObj.trackId}`] = trackDataObj;
    if (
      Object.keys(screenshotDataObj.current).length === trackComponents.length
    ) {
      // setScreenshotData({
      //   tracks: trackManagerState.current.tracks,
      //   componentData: screenshotDataObj.current,
      //   highlights: highlightElements,
      // });
      screenshotDataObj.current = {};
    }
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

      console.log("trackmanager terminate");
    };
  }, []);

  useEffect(() => {
    // add Listenser again because javacript dom only have the old trackComponents value
    // it gets the trackComponents at creation so when trackComponent updates we need to
    // add the listener so it can get the most updated trackCom
    // this also include other state changes values such windowWidth
    trackComponents.forEach((component, i) => {
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
    if (initialStart === "workerReady") {
      initializeTracks();
    }
  }, [initialStart]);
  // MARK: [GenConfig]
  useEffect(() => {
    if (windowWidth > 0) {
      // on GenomeRoot first creation we add the default state to StateArr in genomeroot
      // on recreation of trackManager we do not need to set the defaultState because it is saved in genomeroot so we skip to else
      // and do not add to the StateArr.

      if (genomeConfig.isInitial) {
        console.log(windowWidth, "oldWindow");
        trackManagerState.current.viewRegion._startBase =
          genomeConfig.defaultRegion.start;
        trackManagerState.current.viewRegion._endBase =
          genomeConfig.defaultRegion.end;
        trackManagerState.current.bundleId = genomeConfig.bundleId;

        genomeConfig.defaultTracks.map((items, index) => {
          if (items.type === "genomealign") {
            hasGenomeAlign.current = true;
          }
        });

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
          fetchGenomeAlignWorker.current = new Worker(
            new URL(
              "../../getRemoteData/fetchGenomeAlignWorker.ts",
              import.meta.url
            ),
            {
              type: "module",
            }
          );

          setInitialStart("workerReady");
        }
      } else if (genomeConfig.sizeChange) {
        preload.current = true;
        // refreshState();

        trackSizeChange();

        // initialConfig.current = true;

        // initializeTracks();
      } else {
        preload.current = true;
        genomeConfig.defaultTracks = trackManagerState.current.tracks;
        refreshState();

        initialConfig.current = true;

        initializeTracks();
      }
    }
  }, [genomeConfig]);
  function isNumberKey(key: string | symbol | number): boolean {
    // Convert the key to a number
    const numKey = Number(key);
    // Check if the converted key is a finite number and if it matches the original key when coerced back to string
    return (
      typeof key === "number" || (!isNaN(numKey) && numKey.toString() === key)
    );
  }
  // MARK: trackSizeCha
  function trackSizeChange() {
    var prevWindowWidth;
    const trackToDrawId = {};
    for (const cacheKey in trackFetchedDataCache.current) {
      const cache = trackFetchedDataCache.current[cacheKey];
      trackToDrawId[cacheKey] = "";
      for (var id in cache) {
        if (isNumberKey(id)) {
          var curTrackState = { ...cache[id].trackState };
          var prevXDist = curTrackState.xDist;
          var prevWindowWidth = curTrackState.startWindow;
          // console.log(curTrackState);
          // console.log(prevWindowWidth);
          var newXDist = (prevXDist / prevWindowWidth) * windowWidth;
          curTrackState.startWindow = windowWidth;
          curTrackState.visWidth = curTrackState.startWindow * 3;
          curTrackState.xDist = newXDist;
          if ("genomicFetchCoord" in curTrackState) {
            curTrackState.genomicFetchCoord[
              `${curTrackState.primaryGenName}`
            ].primaryVisData.visWidth = curTrackState.visWidth;
            curTrackState.genomicFetchCoord[
              `${curTrackState.primaryGenName}`
            ].primaryVisData.viewWindow = {
              start: windowWidth,
              end: windowWidth * 2,
            };
          }
          trackFetchedDataCache.current[cacheKey][id].trackState =
            curTrackState;
        }
      }
    }
    for (var id in globalTrackState.current.trackState) {
      var curTrackState = {
        ...globalTrackState.current.trackState[id].trackState,
      };
      var prevXDist = curTrackState.xDist;
      var prevWindowWidth = curTrackState.startWindow;
      // console.log(curTrackState);
      // console.log(prevWindowWidth);
      var newXDist = (prevXDist / prevWindowWidth) * windowWidth;
      curTrackState.startWindow = windowWidth;
      curTrackState.visWidth = curTrackState.startWindow * 3;
      curTrackState.xDist = newXDist;
      if ("genomicFetchCoord" in curTrackState) {
        curTrackState.genomicFetchCoord[
          `${curTrackState.primaryGenName}`
        ].primaryVisData.visWidth = curTrackState.visWidth;
        curTrackState.genomicFetchCoord[
          `${curTrackState.primaryGenName}`
        ].primaryVisData.viewWindow = {
          start: windowWidth,
          end: windowWidth * 2,
        };
      }
      globalTrackState.current.trackState[id].trackState = curTrackState;
    }
    basePerPixel.current = bpRegionSize.current / windowWidth;
    pixelPerBase.current = windowWidth / bpRegionSize.current;

    dragX.current =
      (leftStartCoord.current - genomeConfig.defaultRegion.start) *
      pixelPerBase.current;
    for (var i = 0; i < rightSectionSize.current.length; i++) {
      rightSectionSize.current[i] = windowWidth;
    }
    for (var i = 0; i < leftSectionSize.current.length; i++) {
      leftSectionSize.current[i] = windowWidth;
    }
    // trackComponents.forEach((component, i) => {
    //   frameID.current = requestAnimationFrame(() => {
    //     component.posRef.current!.style.transform = `translate3d(${dragX.current}px, 0px, 0)`;
    //   });
    // });
    setNewDrawData({
      curDataIdx: dataIdx,
      isInitial: 0,
      trackToDrawId,
    });
  }
  // MARK: [dataIdx]

  useEffect(() => {
    if (dataIdx === -6) {
      const curDataIdxObj = {
        [Number(dataIdx) + 1]: "",
        [dataIdx]: "",
        [Number(dataIdx) - 1]: "",
      };

      for (const key in trackFetchedDataCache.current) {
        const curTrack = trackFetchedDataCache.current[key];

        for (const dataIdx in curTrack) {
          if (isNumberKey(dataIdx) && !(dataIdx in curDataIdxObj)) {
            delete curTrack[dataIdx].dataCache;
          }
        }
      }
      console.log(trackFetchedDataCache.current, dataIdx, "delete");
    }
    if (useCacheData.current || needToFetchAddTrack.current) {
      const trackToDrawId = {};

      var needToFetch = false;
      const idxArr = [dataIdx - 1, dataIdx, dataIdx + 1];

      for (const key in trackFetchedDataCache.current) {
        const curTrackCache = trackFetchedDataCache.current[key];
        var hasData = true;
        for (const idx of idxArr) {
          if (idx in curTrackCache && !("dataCache" in curTrackCache[idx])) {
            hasData = false;
            needToFetch = true;
          }
        }
        if (hasData) {
          trackToDrawId[key] = "";
        }
      }
      if (needToFetch) {
        for (const curDataIdx of idxArr) {
          var trackToFetch: Array<TrackModel> = [];
          var trackState;
          for (const key in trackFetchedDataCache.current) {
            const curTrackCache = trackFetchedDataCache.current[key];
            if (
              curDataIdx in curTrackCache &&
              !("dataCache" in curTrackCache[curDataIdx]) &&
              curDataIdx !== curTrackCache.cacheDataIdx.leftIdx &&
              curDataIdx !== curTrackCache.cacheDataIdx.rightIdx
            ) {
              console.log(curDataIdx);
              var curTrackModel: any = trackManagerState.current.tracks.find(
                (trackModel: any) => trackModel.id === Number(key)
              );
              trackState = curTrackCache[curDataIdx].trackState;
              trackToFetch.push(curTrackModel);
            }
          }

          if (trackToFetch.length > 0) {
            console.log(
              dataIdx,
              curDataIdx,
              trackFetchedDataCache.current,
              trackState,
              trackToFetch,
              "needtofetchPRev"
            );
            const genName = genomeConfig.genome.getName();
            enqueueMessage({
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
              expandedGenLoci: trackState.genomicFetchCoord
                ? trackState.genomicFetchCoord[`${genName}`].expandGenomicLoci
                : "",
              useFineModeNav: useFineModeNav.current,
              windowWidth,
              initGenomicLoci: [],
              trackSide: trackState.side,

              xDist: trackState.xDist,
              initial: 0,
              bpRegionSize: bpRegionSize.current,
              trackDataIdx: dataIdx,

              missingIdx: curDataIdx,
            });
          }
        }
      }

      if (Object.keys(trackToDrawId).length > 0) {
        setNewDrawData({
          curDataIdx: dataIdx,
          isInitial: 0,
          trackToDrawId,
        });
      }
    } else if (dataIdx !== 0) useCacheData.current = true;
  }, [dataIdx, trackComponents]);
  useEffect(() => {
    if (highlights.length > 0) {
      let highlightElement = createHighlight(highlights);

      setHighLightElements([...highlightElement]);
    }
  }, [highlights]);
  // MARK: [tracks]
  //TO DO ADD FUNCTIONALITY TO ADD BAM TRACK
  useEffect(() => {
    if (!genomeConfig.isInitial) {
      const newTrackId = {};
      for (const trackModel of tracks) {
        newTrackId[`${trackModel.id}`] = {};
      }
      for (const key in trackFetchedDataCache.current) {
        if (!(key in newTrackId)) {
          delete trackFetchedDataCache.current[key];
        }
      }
      const newTrackComponents: Array<any> = [];
      for (var i = 0; i < tracks.length; i++) {
        const curTrackModel = tracks[i];
        let foundComp = false;

        for (let trackComponent of trackComponents) {
          if (trackComponent.trackModel.id === curTrackModel.id) {
            newTrackComponents.push(trackComponent);
            foundComp = true;
          }
        }
        if (!foundComp) {
          needToFetchAddTrack.current = true;
          const newPosRef = createRef();
          const newLegendRef = createRef();
          const uniqueKey = uuidv4();
          curTrackModel["legendWidth"] = legendWidth;

          newTrackComponents.push({
            trackIdx: i,
            id: uniqueKey,
            component: TrackFactory,
            posRef: newPosRef,
            legendRef: newLegendRef,
            trackModel: curTrackModel,
          });
          trackFetchedDataCache.current[`${curTrackModel.id}`] = _.cloneDeep(
            globalTrackState.current.trackState
          );

          trackFetchedDataCache.current[`${curTrackModel.id}`][
            "usePrimaryNav"
          ] =
            "genome" in curTrackModel.metadata &&
            curTrackModel.metadata.genome !== genomeConfig.genome.getName()
              ? false
              : true;

          trackFetchedDataCache.current[`${curTrackModel.id}`]["cacheDataIdx"] =
            {
              rightIdx: globalTrackState.current.rightIdx,
              leftIdx: globalTrackState.current.leftIdx,
            };
          trackFetchedDataCache.current[`${curTrackModel.id}`][
            "useExpandedLoci"
          ] =
            curTrackModel.type in trackUsingExpandedLoci ||
            ("genome" in curTrackModel.metadata &&
              curTrackModel.metadata.genome !== genomeConfig.genome.getName())
              ? true
              : false;
        }
      }
      trackManagerState.current.tracks = tracks;
      setTrackComponents(newTrackComponents);

      // preload.current = true;

      // genomeConfig.defaultRegion = new OpenInterval(
      //   selectedRegion._startBase,
      //   selectedRegion._endBase
      // );
      // refreshState();
      // initialConfig.current = true;
      // trackManagerState.current.tracks = tracks;
      // trackManagerState.current.viewRegion = selectedRegion;

      // initializeTracks();
    }
  }, [tracks]);
  return (
    <>
      <div
        ref={containerRef}
        style={{
          display: "flex",
          flexDirection: "column",
          whiteSpace: "nowrap",
        }}
      >
        {/* <div>
          {" "}
          {Math.round(bpX.current) +
            "-" +
            Math.round(bpX.current + bpRegionSize.current)}
        </div>
        <div>Pixel distance from starting point : {dragX.current}px</div>
        <div style={{ display: "flex" }}>
          {" "}
          {selectedTool.isSelected ? (
            <CircularProgress
              variant="indeterminate"
              disableShrink
              sx={{
                color: (theme) =>
                  theme.palette.mode === "light" ? "pink" : "#308fe8",
                animationDuration: "550ms",

                left: 0,
              }}
              size={20}
              thickness={4}
            />
          ) : (
            ""
          )}
          {isLoading.current ? (
            <CircularProgress
              variant="indeterminate"
              disableShrink
              sx={{
                color: (theme) =>
                  theme.palette.mode === "light" ? "#1a90ff" : "#308fe8",
                animationDuration: "550ms",

                left: 0,
              }}
              size={20}
              thickness={4}
            />
          ) : (
            <div style={{ height: 20 }}>DATA READY LETS GO</div>
          )}
        </div> */}

        {/* <div>1pixel to {basePerPixel.current}bp</div> */}
        {/* <button onClick={handleButtonClick}>Add Favorite Color to User</button> */}
        <OutsideClickDetector onOutsideClick={onTrackUnSelect}>
          <div className="flex flex-row py-10 items-center">
            <HighlightMenu
              highlights={highlightElements}
              viewRegion={trackManagerState.current.viewRegion}
              showHighlightMenuModal={true}
              onNewRegion={highlightJump}
              onSetHighlights={getHighlightState}
            />
            {/* <History
              state={{
                past: stateArr.slice(0, presentStateIdx + 1),
                future: stateArr.slice(presentStateIdx + 1),
              }}
              jumpToPast={jumpToState}
              jumpToFuture={jumpToState}
              clearHistory={jumpToState}
            /> */}
            <SubToolButtons onToolClicked={onToolClicked} />
            <ZoomControls onToolClicked={onToolClicked} />
            {selectedRegion && (
              <TrackRegionController
                selectedRegion={selectedRegion}
                onRegionSelected={(start: number, end: number) =>
                  onRegionSelected(start, end, "Zoom in 5-fold")
                }
                contentColorSetup={{ background: "#F8FAFC", color: "#222" }}
                genomeConfig={genomeConfig}
                trackManagerState={trackManagerState}
                genomeArr={[]}
                genomeIdx={0}
                addGlobalState={undefined}
              />
            )}
            <p className="text-sm font-mono pl-2">
              1px: {basePerPixel.current.toFixed(2)}bp
            </p>
          </div>
          <div style={{ display: "flex", position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "flex",
                //makes components align right or right when we switch sides

                border: "2px solid #BCCCDC",
                flexDirection: "row",
                // full windowwidth will make canvas only loop 0-windowidth
                // the last value will have no data.
                // so we have to subtract from the size of the canvas
                width: `${windowWidth + legendWidth}px`,
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
                }}
              >
                <div ref={horizontalLineRef} className="horizontal-line" />
                <div ref={verticalLineRef} className="vertical-line" />

                {trackComponents.map((item, index) => {
                  let Component = item.component;

                  // if (
                  //   Object.keys(trackData).length > 0 &&
                  //   "result" in trackData[`${item.trackModel.id}`]
                  // ) {
                  //   item.hasData = true;
                  // }
                  return (
                    <div
                      onMouseDown={(event) => handleShiftSelect(event, item)}
                      onContextMenu={(event) => handleRightClick(event, item)}
                      key={item.id}
                      style={{
                        display: "flex",
                        WebkitBackfaceVisibility: "hidden",
                        WebkitPerspective: `${windowWidth + legendWidth}px`,
                        backfaceVisibility: "hidden",
                        perspective: `${windowWidth + legendWidth}px`,
                        backgroundColor: "#F2F2F2",
                        width: `${windowWidth + legendWidth}px`,
                        outline: "1px solid Dodgerblue",
                      }}
                    >
                      <div
                        style={{
                          zIndex: 10, // Ensure the legend is on top
                          width: legendWidth,
                          backgroundColor: "white",
                          position: "relative", // Ensure zIndex works with relative positioning
                        }}
                        ref={item.legendRef}
                      ></div>
                      <div
                        ref={trackComponents[index].posRef}
                        style={{
                          zIndex: 1, // Set a lower zIndex for the main track components
                          display: "flex",
                        }}
                      >
                        <Component
                          id={item.trackModel.id}
                          trackModel={item.trackModel}
                          bpRegionSize={bpRegionSize.current}
                          useFineModeNav={useFineModeNav.current}
                          basePerPixel={basePerPixel.current}
                          side={side.current}
                          windowWidth={windowWidth}
                          genomeConfig={genomeConfig}
                          dataIdx={dataIdx}
                          trackIdx={index}
                          trackManagerRef={block}
                          setShow3dGene={setShow3dGene}
                          isThereG3dTrack={isThereG3dTrack.current}
                          legendRef={item.legendRef}
                          updateGlobalTrackConfig={updateGlobalTrackConfig}
                          applyTrackConfigChange={applyTrackConfigChange}
                          dragX={dragX.current}
                          checkTrackPreload={checkTrackPreload}
                          sentScreenshotData={sentScreenshotData}
                          newDrawData={newDrawData}
                          trackFetchedDataCache={trackFetchedDataCache}

                          // viewWindow={trackManagerState.current.viewRegion}
                        />

                        {highlightElements.length > 0
                          ? highlightElements.map((item, index) => {
                              if (item.display) {
                                return (
                                  <div
                                    key={index}
                                    style={{
                                      display: "flex",
                                      height: "100%",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        position: "relative",
                                        height: "100%",
                                      }}
                                    >
                                      <div
                                        key={index}
                                        style={{
                                          position: "absolute",
                                          backgroundColor: item.color,

                                          top: "0",
                                          height: "100%",
                                          left:
                                            item.side === "right"
                                              ? `${item.xPos}px`
                                              : "",
                                          right:
                                            item.side === "left"
                                              ? `${item.xPos}px`
                                              : "",
                                          width: item.width,
                                          pointerEvents: "none", // This makes the highlighted area non-interactive
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              }
                            })
                          : ""}
                      </div>
                    </div>
                  );
                })}

                <div
                  style={{
                    display: "flex",
                    position: "absolute",
                    width: `${windowWidth + legendWidth}px`,
                    zIndex: 10,
                  }}
                >
                  {selectedTool.isSelected ? (
                    <SelectableGenomeArea
                      selectableRegion={trackManagerState.current.viewRegion}
                      dragLimits={
                        new OpenInterval(legendWidth, windowWidth + legendWidth)
                      }
                      onRegionSelected={onRegionSelected}
                    >
                      <div
                        style={{
                          height: block.current
                            ? block.current?.getBoundingClientRect().height
                            : 0,
                          zIndex: 3,
                          width: `${windowWidth + legendWidth}px`,
                        }}
                      ></div>
                    </SelectableGenomeArea>
                  ) : (
                    ""
                  )}
                </div>
              </div>
            </div>

            {/* 
          <div
            ref={g3dRect}
            style={{
              display: "flex",
              width: `${fullWindowWidth / 2}px`,
              backgroundColor: "blue",
            }}
          >
            {g3dtrackComponents.map((item, index) => {
              const rectInfo = g3dRect.current!.getBoundingClientRect();

              let Component = item.component;
              if (windowRegion) {
                return (
                  <Component
                    //infinitescroll type track data
                    key={item.id}
                    tracks={genomeConfig.defaultTracks}
                    g3dtrack={item.trackModel}
                    viewRegion={windowRegion}
                    width={rectInfo.width}
                    height={rectInfo.height}
                    x={rectInfo.x}
                    y={rectInfo.y}  
                    genomeConfig={genomeConfig}
                    geneFor3d={show3dGene}
                  />
                );
              } else {
                return "";
              }
            })}
          </div> */}
          </div>
        </OutsideClickDetector>
      </div>
      {configMenu.configMenus !== "" ? (
        <ConfigMenuComponent
          key={configMenu.configMenus.key}
          menuData={configMenu.configMenus}
        />
      ) : (
        ""
      )}
    </>
  );
});
export default memo(TrackManager);
