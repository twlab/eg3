import { createRef, memo, useEffect, useRef, useState } from "react";
const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import OpenInterval from "../../models/OpenInterval";
import { v4 as uuidv4 } from "uuid";
import { FeatureSegment } from "../../models/FeatureSegment";
import ChromosomeInterval from "../../models/ChromosomeInterval";
import Feature from "../../models/Feature";
import NavigationContext from "../../models/NavigationContext";
import { HicSource } from "../../getRemoteData/hicSource";
import { trackOptionMap } from "./TrackComponents/defaultOptionsMap";
import ThreedmolContainer from "./TrackComponents/3dmol/ThreedmolContainer";
import TrackModel from "@eg/core/src/eg-lib/models/TrackModel";
import { TYPE_NAME_TO_CONFIG } from "../../trackConfigs/config-menu-models.tsx/getTrackConfig";
import _ from "lodash";
import ConfigMenuComponent from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";
import HighlightMenu from "./ToolComponents/HighlightMenu";
import TrackFactory from "./TrackComponents/TrackFactory";
import BamSource from "../../getRemoteData/BamSource";
import { SelectableGenomeArea } from "./genomeNavigator/SelectableGenomeArea";
import React from "react";
import OutsideClickDetector from "./TrackComponents/commonComponents/OutsideClickDetector";
import { getTrackConfig } from "../../trackConfigs/config-menu-models.tsx/getTrackConfig";
import {
  TrackState,
} from "./TrackComponents/CommonTrackStateChangeFunctions.tsx/createNewTrackState";
import TrackRegionController from "./genomeNavigator/TrackRegionController";
import {

  trackUsingExpandedLoci,
} from "./TrackComponents/CommonTrackStateChangeFunctions.tsx/cacheFetchedData";
import { trackGlobalState } from "./TrackComponents/CommonTrackStateChangeFunctions.tsx/trackGlobalState";
import { GenomeConfig } from "@eg/core/src/eg-lib/models/genomes/GenomeConfig";


const zoomFactors: { [key: string]: { [key: string]: any } } = {
  "6": { factor: 4 / 3, text: "⅓×", title: "Zoom out 1/3-fold" },
  "7": { factor: 2, text: "1×", title: "Zoom out 1-fold (Alt+O)" },
  "8": { factor: 5, text: "5×", title: "Zoom out 5-fold" },
  "9": { factor: 2 / 3, text: "⅓×", title: "Zoom in 1/3-fold" },
  "10": { factor: 0.5, text: "1×", title: "Zoom in 1-fold (Alt+I)" },
  "11": { factor: 0.2, text: "5×", title: "Zoom in 5-fold" },
}

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

export function bpNavToGenNav(bpNavArr: Array<any>, genome: GenomeConfig) {
  let genRes: Array<any> = [];
  for (let bpNav of bpNavArr) {
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
  selectedRegion?: any;
  genomeConfig: any;
  highlights: Array<any>;
  tracks: Array<TrackModel>;
  onNewRegion: (startbase: number, endbase: number) => void;
  onNewHighlight: (highlightState: Array<any>) => void;
  onTrackSelected: (trackSelected: TrackModel[]) => void;
  onTrackDeleted: (currenTracks: TrackModel[]) => void;
  onNewRegionSelect: (startbase: number, endbase: number) => void;
  tool: any;
  isGenomeViewLoaded: boolean
  onLoadComplete: any
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
  onNewRegionSelect,
  onTrackDeleted,
  tool,
  isGenomeViewLoaded,
  onLoadComplete
}) {
  //useRef to store data between states without re render the component
  const infiniteScrollWorker = useRef<Worker | null>(null);
  const fetchGenomeAlignWorker = useRef<Worker | null>(null);
  const useFineModeNav = useRef(false);
  const prevWindowWidth = useRef<number>(0);
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
  const preloadedTracks = useRef<{ [key: string]: any }>({});
  const screenshotDataObj = useRef<{ [key: string]: any }>({});
  const preload = useRef<boolean>(false);
  // These states are used to update the tracks with new fetch(data);
  const containerRef = useRef(null);
  const globalTrackState = useRef<{ [key: string]: any }>({
    rightIdx: 0,
    leftIdx: 1,
    trackStates: {},
  });
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
  const [configMenu, setConfigMenu] = useState<{ [key: string]: any } | null>(null);

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
  const enqueueMessage = (message: { [key: string]: any }) => {
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
  const handleKeyDown = (event: { key: string; }) => {
    if (event.key === "Escape") {
      let newSelectedTool: { [key: string]: any } = {};
      newSelectedTool["tool"] = "none";
      newSelectedTool["isSelected"] = false;
      setSelectedTool(newSelectedTool);
      onTrackUnSelect()
      onConfigMenuClose()
    }
  };

  function handleMouseEnter() {
    isMouseInsideRef.current = true;
  }

  function handleMouseLeave() {
    isMouseInsideRef.current = false;
  }
  function handleMove(e: { clientX: number; clientY: number; pageX: number; }) {
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

    trackManagerState.current.viewRegion._startBase = curBp;
    trackManagerState.current.viewRegion._endBase =
      curBp + bpRegionSize.current;
    onNewRegion(curBp, curBp + bpRegionSize.current);

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
  }

  function onConfigChange(key: string, value: string | number) {
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
      selectLen: Object.keys(selectedTracks.current).length,
      configOptions: optionsObjects,
      items: commonMenuComponents,
      onConfigChange,
      blockRef: block
    };

    configMenuPos.current = { left: x, top: y };

    setConfigMenu(configMenuData);
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
      onTrackSelected([...trackManagerState.current.tracks]);

      if (
        configMenu &&
        Object.keys(selectedTracks.current).length > 0
      ) {
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
      trackDetails.legendRef.current.style.backgroundColor = "lightblue";

      selectedTracks.current[`${trackDetails.trackModel.id}`] =
        globalTrackConfig.current[`${trackDetails.trackModel.id}`];
      onTrackSelected([...trackManagerState.current.tracks]);
      renderTrackSpecificConfigMenu(e.pageX, e.pageY);
    }
  }

  function onConfigMenuClose() {
    console.log("HUH2 why")
    setConfigMenu(null);
  }

  function onTrackUnSelect() {
    console.log(configMenu)

    if (Object.keys(selectedTracks.current).length !== 0) {
      for (const key in selectedTracks.current) {
        selectedTracks.current[key].legendRef.current.style.backgroundColor =
          "white";
      }

      trackManagerState.current.tracks.map((trackModel) => {
        trackModel.isSelected = false;
      });

      // let newStateObj = createNewTrackState(trackManagerState.current, {});
      //addGlobalState(newStateObj);

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

    setTrackComponents((prevTracks) => {
      return prevTracks.filter((item, _index) => {
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
  async function fetchGenomeData(initial: number = 0, trackSide: string, dataIdx: number) {
    let curFetchRegionNav;
    let genomicLoci: Array<ChromosomeInterval> = [];
    let initBpLoci: Array<any> = [];
    var initExpandBpLoci: Array<any> = [];
    let newVisData;
    let regionExpandLoci;
    var regionLoci: Array<any>;

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
        var regionNav = new DisplayedRegionModel(
          genomeConfig.navContext,
          maxBp.current - bpRegionSize.current * 2,
          maxBp.current - bpRegionSize.current
        );
        regionLoci = regionGenomeFeatureSegment.map((item, _index) =>
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
        var regionNav = new DisplayedRegionModel(
          genomeConfig.navContext,
          minBp.current + bpRegionSize.current,
          minBp.current + bpRegionSize.current * 2
        );
        regionLoci = regionGenomeFeatureSegment.map((item, _index) =>
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
            visWidth: windowWidth * 3,

            viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
          };
        })
        : "",
    };

    trackGlobalState({
      trackState: newTrackState,
      globalTrackState: globalTrackState,
    });
    // sent the navigation to fetch the data from server
    try {
      queueRegionToFetch(initial ? 0 : dataIdx);
    } catch { }
  }
  // MARK: onmessInfin
  function createInfiniteOnMessage() {
    infiniteScrollWorker.current!.onmessage = (event) => {
      const trackToDrawId: { [key: string]: any } = {};
      const regionDrawIdx = event.data.trackDataIdx;
      // var bpInt = getIntervals(
      //   event.data.visData._startBase + bpRegionSize.current,
      //   event.data.visData._endBase - bpRegionSize.current
      // );
      console.log(event.data, "normal track fetchdata");

      const curTrackState = {
        ...globalTrackState.current.trackStates[regionDrawIdx].trackState,
        primaryGenName: genomeConfig.genome.getName(),
      };

      // if (!isInteger(event.data.missingIdx)) {
      //   trackGlobalState({
      //     trackState: curTrackState,
      //     globalTrackState: globalTrackState,
      //     navContext: genomeConfig.navContext,
      //     bpRegionSize: bpRegionSize.current,
      //   });
      // }

      Promise.all(
        event.data.fetchResults.map(async (item: { id: any; name: string; result: any; metadata: any; trackModel: any; curFetchNav: any; }, _index: any) => {
          trackToDrawId[`${item.id}`] = "";
          // need to await the function finishes for bam and hic that uses fetch instances

          await createCache({
            trackState: curTrackState,
            result:
              item.result,

            id: item.id,
            trackType: item.name,
            metadata: item.metadata,
            trackModel: item.trackModel,
            curFetchNav: item.name === "bam" ? item.curFetchNav : "",

            missingIdx: event.data.missingIdx,
          });
        })
      )
        .then(() => {
          // const curDataIdxObj = {
          //   [regionDrawIdx + 1]: "",
          //   [regionDrawIdx]: "",
          //   [regionDrawIdx - 1]: "",
          // };

          let newTmpDrawId = { ...trackToDrawId, ...event.data.trackToDrawId };

          setNewDrawData({
            curDataIdx: event.data.trackDataIdx,
            isInitial: event.data.initial,
            trackToDrawId: newTmpDrawId,
          });

          const browserMemorySize: { [key: string]: any } = window.performance
          console.log(
            browserMemorySize["memory"].usedJSHeapSize,
            browserMemorySize["memory"].jsHeapSizeLimit,
            "CURRENT MERMOPT"
          );

          if (
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
            console.log("cache deleted")
          }

          console.log(
            event.data.trackDataIdx,
            trackFetchedDataCache.current,
            { ...trackToDrawId, ...event.data.trackToDrawId },
            globalTrackState.current,
            event.data.trackToDrawId,
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
            for (const dataForFetch of curTrackState.fetchAfterGenAlignTracks) {
              dataForFetch["trackToDrawId"] = trackToDrawId;
              enqueueMessage(dataForFetch);
            }
          } else {
            enqueueMessage(curTrackState);
          }
        })
        .catch((error) => {
          console.error("An error occurred:", error);
        });
    };
  }
  // MARK: queueRegion

  function queueRegionToFetch(regionIdx: number) {
    const trackToDrawId: { [key: string]: any } = {};

    var needToFetch = false;
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
        var trackToFetch: Array<TrackModel> = [];
        let trackState;
        for (const key in trackFetchedDataCache.current) {
          const curTrackCache = trackFetchedDataCache.current[key];

          if (
            curTrackCache.trackType in trackUsingExpandedLoci &&
            curDataIdx !== curIdx
          ) {
            continue;
          }
          if (
            curDataIdx in curTrackCache &&
            !("dataCache" in curTrackCache[curDataIdx])
          ) {
            var curTrackModel: any = trackManagerState.current.tracks.find(
              (trackModel: any) => trackModel.id === Number(key)
            );

            trackState =
              curDataIdx in globalTrackState.current.trackStates
                ? globalTrackState.current.trackStates[curDataIdx].trackState
                : "";

            trackToFetch.push(curTrackModel);
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
          visData: curTrackState.visData
            ? curTrackState.visData
            : globalTrackState.current.trackStates[curIdx].trackState.visData,
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
        for (const dataToFetch of dataToFetchArr) {
          enqueueMessage(dataToFetch);
        }
      }
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
        const curTrackModel = genomeConfig.defaultTracks.find(
          (trackModel: any) => trackModel.id === fetchRes.id
        );

        configOptions = {
          ...trackOptionMap[`${fetchRes.type}`],
          ...curTrackModel.options,
        };
      }

      let trackState = tmpTrackState
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
      }

      else if (fetchRes.trackType === "dynamichic") {
        const curStraw = fetchRes.trackModel.tracks.map((_hicTrack: any, index: any) => {
          return fetchInstances.current[
            `${fetchRes.id}` + "subtrack" + `${index}`
          ];
        });
        result = await Promise.all(
          curStraw.map((straw: { getData: (arg0: DisplayedRegionModel, arg1: number, arg2: any) => any; }, _index: any) => {
            return straw.getData(
              objToInstanceAlign(visRegion),
              basePerPixel.current,
              configOptions
            );
          })
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

      trackFetchedDataCache.current[`${fetchRes.id}`][fetchRes.missingIdx][
        "dataCache"
      ] = result;
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
    toolTitle: number | string,
  ) {
    const newLength = endbase - startbase;

    if (newLength < MIN_VIEW_REGION_SIZE) {
      const amountToExpand = 0.5 * (MIN_VIEW_REGION_SIZE - newLength);
      startbase -= amountToExpand;
      endbase += amountToExpand;
    }

    // drag select zoom in or zoom factor options or regionController/highlight jump 
    if (
      String(toolTitle) in
      zoomFactors || String(toolTitle) in {
        "3": "",
        "4": "",
        "5": "",
      } || toolTitle === "isJump"
    ) {
      console.log("SADDS")
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
        genomeConfig.navContext,
        genomeConfig.defaultRegion.start,
        genomeConfig.defaultRegion.end
      ),
      trackLegendWidth: legendWidth,
      tracks: tracks.length > 0 ? tracks : genomeConfig.defaultTracks,
    };

    configMenuPos.current = {};
    lastDragX.current = 0;
    isThereG3dTrack.current = false;
    basePerPixel.current = 0;
    frameID.current = 0;
    lastX.current = 0;
    dragX.current = 0;

    isLoading.current = true;
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
    const tmpQueryGenObj: { [key: string]: any } = {};
    tmpQueryGenObj[`${genomeConfig.genome.getName()}`] = "";
    const annotationTracks = genomeConfig.annotationTracks || {};
    const comparisonTracks = annotationTracks["Genome Comparison"] || [];

    trackManagerState.current.tracks.map((items, _index) => {
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
        trackManagerState.current.tracks[i].tracks?.map((_item, index) => {
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
            trackComponent.hasAllRegionData &&
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
      let newStateOptions: { [key: string]: any } = {};
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

    newTrackComponents.map((item, _index) => {
      trackFetchedDataCache.current[`${item.trackModel.id}`] = {};
      trackFetchedDataCache.current[`${item.trackModel.id}`]["cacheDataIdx"] = {
        leftIdx: 1,
        rightIdx: 0,
      };
      initTrackFetchCache(item.trackModel);
    });
    fetchGenomeData(1, "right", dataIdx);
  }
  // MARK: preloadFunc
  function checkTrackPreload(trackId: any) {
    if (preload.current || genomeConfig.isInitial) {
      preloadedTracks.current[`${trackId}`] = "";
      if (
        Object.keys(preloadedTracks.current).length === trackComponents.length
      ) {
        preloadedTracks.current = {};

        trackComponents.map((component, _i) => {
          frameID.current = requestAnimationFrame(() => {
            component.posRef.current!.style.transform = `translate3d(${dragX.current}px, 0px, 0)`;
          });
        });
        preload.current = false;
        if (genomeConfig.isInitial) {

          setSelectedTool((prevState) => {
            if (tool === null || tool === 0) {

              const newSelectedTool = toolSelect(prevState.title)

              return newSelectedTool;

            }
            else if (tool) {
              const newSelectedTool = toolSelect(tool)
              return newSelectedTool;
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
                  component.legendRef.current.style.backgroundColor = "white";
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
                  component.legendRef.current.style.backgroundColor =
                    "lightblue";
                  selectedTracks.current[key!] =
                    globalTrackConfig.current[key!];
                }
              }
            }
          }

          genomeConfig.isInitial = false;

        }
        onLoadComplete()
      }
    }
  }

  function sentScreenshotData(trackDataObj: { trackId: any; }) {
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

  function toolSelect(toolTitle: string | number) {
    const newSelectedTool: { [key: string]: any } = {};
    newSelectedTool["isSelected"] = false


    if (toolTitle === 4) {
      onRegionSelected(
        Math.round(bpX.current - bpRegionSize.current),
        Math.round(bpX.current),
        toolTitle

      );
    }

    else if (toolTitle === 5) {

      onRegionSelected(
        Math.round(bpX.current + bpRegionSize.current),
        Math.round(bpX.current + bpRegionSize.current * 2),
        toolTitle
      );
    }

    else if (
      String(toolTitle) in
      zoomFactors
    ) {
      let useDisplayFunction = new DisplayedRegionModel(
        genomeConfig.navContext,
        bpX.current,
        bpX.current + bpRegionSize.current
      );
      let res = useDisplayFunction.zoom(zoomFactors[`${toolTitle}`].factor);
      onRegionSelected(
        res._startBase as number,
        res._endBase as number, toolTitle
      );
    }
    else {
      if (tool && tool !== 0) { newSelectedTool.isSelected = true }

    }
    newSelectedTool['title'] = toolTitle
    isToolSelected.current = newSelectedTool.isSelected
    return newSelectedTool

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

          const newSelectedTool = toolSelect(prevState.title)

          return newSelectedTool;

        }
        else if (tool) {
          const newSelectedTool = toolSelect(tool)
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
    if (windowWidth > 0) {
      // on GenomeRoot first creation we add the default state to StateArr in genomeroot
      // on recreation of trackManager we do not need to set the defaultState because it is saved in genomeroot so we skip to else
      // and do not add to the StateArr.

      if (genomeConfig.isInitial) {
        console.log(windowWidth, "oldWindow");
        prevWindowWidth.current = windowWidth;

        trackManagerState.current.bundleId = genomeConfig.bundleId;

        genomeConfig.defaultTracks.map((items: { type: string; }, _index: any) => {
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
      } else if (genomeConfig.sizeChange) {
        preload.current = true;
        // refreshState();
        trackSizeChange();
        // initialConfig.current = true;
        console.log(trackManagerState.current, genomeConfig, "sizeChangeCheck")
        // initializeTracks();
      } else {
        preload.current = true;
        genomeConfig.defaultTracks = trackManagerState.current.tracks;
        refreshState();
        initializeTracks();
        console.log(trackManagerState.current, genomeConfig, "viewRegioncheck")
      }
    }
  }, [genomeConfig]);

  // MARK: trackSizeCha
  function trackSizeChange() {
    const trackToDrawId: { [key: string]: any } = {};
    for (const cacheKey in trackFetchedDataCache.current) {
      const cache = trackFetchedDataCache.current[cacheKey];
      trackToDrawId[cacheKey] = "";
      for (var id in cache) {
        if (isInteger(id)) {
          var curTrackState = { ...cache[id].trackState };
          var prevXDist = curTrackState.xDist;

          // console.log(curTrackState);
          // console.log(prevWindowWidth);
          var newXDist = (prevXDist / prevWindowWidth.current) * windowWidth;
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
    for (var id in globalTrackState.current.trackStates) {
      var curTrackState = {
        ...globalTrackState.current.trackStates[id].trackState,
      };
      var prevXDist = curTrackState.xDist;

      // console.log(curTrackState);
      // console.log(prevWindowWidth);
      var newXDist = (prevXDist / prevWindowWidth.current) * windowWidth;
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
      globalTrackState.current.trackStates[id].trackState = curTrackState;
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

    // if there genomealign we delete its data to recalculate visData

    if (hasGenomeAlign.current) {
      for (const key in trackFetchedDataCache.current) {
        const trackCache = trackFetchedDataCache.current[key];

        for (const dataKey in trackCache) {
          if (isInteger(dataKey)) {
            const regionData = trackCache[dataKey];

            if (trackCache.trackType !== "genomealign") {
              if (
                "trackState" in regionData &&
                "genomicFetchCoord" in regionData.trackState
              ) {
                delete trackFetchedDataCache.current[key][dataKey].trackState
                  .genomicFetchCoord;
              }
            } else {
              delete trackFetchedDataCache.current[key][dataKey].trackState
                .genomicFetchCoord;
              delete trackFetchedDataCache.current[key][dataKey].dataCache;
            }
          }
        }
      }
      const tmpArr = [...trackComponents];
      setTrackComponents(tmpArr);
    } else {
      setNewDrawData({
        curDataIdx: dataIdx,
        isInitial: 0,
        trackToDrawId,
      });
    }

    prevWindowWidth.current = windowWidth;
  }
  // MARK: [dataIdx,tra]

  useEffect(() => {
    if (useCacheData.current || needToFetchAddTrack.current) {
      const trackToDrawId: { [key: string]: any } = {};
      const idxArr = [dataIdx - 1, dataIdx, dataIdx + 1];
      const curIdx = dataIdx;
      let needToFetchGenAlign = false;
      for (const [key, curTrackCache] of Object.entries(
        trackFetchedDataCache.current
      )) {
        let hasAllRegionData = true;

        for (const idx of idxArr) {
          if (idx in curTrackCache) {
            if (
              curTrackCache.trackType in trackUsingExpandedLoci &&
              idx !== curIdx
            ) {
              continue;
            }
            const isGenomeAlignTrack =
              curTrackCache.trackType === "genomealign";
            const dataCacheKeyMissing = !("dataCache" in curTrackCache[idx]);

            if (curIdx === idx && isGenomeAlignTrack && dataCacheKeyMissing) {
              needToFetchGenAlign = true;
              hasAllRegionData = false;
            } else if (dataCacheKeyMissing) {
              hasAllRegionData = false;
            }
          }
        }

        if (hasAllRegionData) {
          trackToDrawId[key] = "";
        }
      }
      queueRegionToFetch(curIdx);
      if (Object.keys(trackToDrawId).length > 0 && !needToFetchGenAlign) {
        setNewDrawData({
          curDataIdx: dataIdx,
          isInitial: 0,
          trackToDrawId,
        });
      }
    } else if (dataIdx !== 0) useCacheData.current = true;
  }, [dataIdx, trackComponents]);

  useEffect(() => {
    let highlightElement = createHighlight(highlights);

    setHighLightElements([...highlightElement]);
  }, [highlights]);
  // MARK: [tracks]
  //TO DO ADD FUNCTIONALITY TO ADD BAM TRACK
  function isInteger(str: string): boolean {
    const num = Number(str);

    return str !== null && !isNaN(num) && Number.isInteger(num);
  }
  function arraysHaveSameTrackModels(
    array1: Array<TrackModel>,
    array2: Array<TrackModel>
  ): boolean {
    if (array1.length !== array2.length) {
      return false;
    }

    const sortedArray1 = array1.sort((a, b) => (a.id > b.id ? 1 : -1));
    const sortedArray2 = array2.sort((a, b) => (a.id > b.id ? 1 : -1));
    for (let i = 0; i < sortedArray1.length; i++) {
      if (sortedArray1[i].id !== sortedArray2[i].id) {
        return false;
      }
    }

    return true;
  }

  useEffect(() => {
    if (!genomeConfig.isInitial) {
      if (
        !arraysHaveSameTrackModels(tracks, trackManagerState.current.tracks)
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
        let checkHasGenAlign = false;
        for (var i = 0; i < tracks.length; i++) {
          const curTrackModel = tracks[i];
          let foundComp = false;

          // find tracks already in view
          for (let trackComponent of trackComponents) {
            if (trackComponent.trackModel.id === curTrackModel.id) {
              newTrackComponents.push(trackComponent);
              foundComp = true;
            }
          }
          // if not in view this means that this is the new track that was added.
          if (!foundComp) {
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
              for (const key in trackFetchedDataCache.current) {
                const trackCache = trackFetchedDataCache.current[key];

                for (const dataKey in trackCache) {
                  if (isInteger(dataKey)) {
                    const regionData = trackCache[dataKey];

                    if (trackCache.trackType !== "genomealign") {
                      if (
                        "trackState" in regionData &&
                        "genomicFetchCoord" in regionData.trackState
                      ) {
                        delete trackFetchedDataCache.current[key][dataKey]
                          .trackState.genomicFetchCoord;
                      }
                    } else {
                      delete trackFetchedDataCache.current[key][dataKey]
                        .trackState.genomicFetchCoord;
                      delete trackFetchedDataCache.current[key][dataKey]
                        .dataCache;
                    }
                  }
                }
              }

              for (const key in globalTrackState.current.trackStates) {
                const regionTrackState =
                  globalTrackState.current.trackStates[`${key}`].trackState;

                if ("genomicFetchCoord" in regionTrackState) {
                  delete globalTrackState.current.trackStates[`${key}`]
                    .trackState.genomicFetchCoord;
                }
              }
            }
            // for tracks like hic and bam where we create an  instance obj
            // that we reuse to fetch data
            else if (curTrackModel.type === "hic") {
              fetchInstances.current[`${curTrackModel.id}`] =
                new HicSource(curTrackModel.url);
            }
            else if (curTrackModel.type === "dynamichic") {
              curTrackModel.tracks?.map((_item, index) => {
                fetchInstances.current[
                  `${curTrackModel.id}` +
                  "subtrack" +
                  `${index}`
                ] = new HicSource(
                  curTrackModel.tracks![index].url
                );
              });
            }
            else if (
              curTrackModel.type in
              { matplot: "", dynamic: "", dynamicbed: "", dynamiclongrange: "" }
            ) {
              curTrackModel.tracks?.map((trackModel, index) => {
                trackModel.id =
                  `${curTrackModel.id}` +
                  "subtrack" +
                  `${index}`;
              });
            }
            else if (curTrackModel.type === "bam") {
              fetchInstances.current[`${curTrackModel.id}`] =
                new BamSource(curTrackModel.url);
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

        setTrackComponents(newTrackComponents);
      }
    }
  }, [tracks]);
  return (<>
    {/* <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        whiteSpace: "nowrap",
      }}
    > */}
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
      {isGenomeViewLoaded && <div className="flex flex-row py-10 items-center">
        <HighlightMenu
          highlights={highlightElements}
          viewRegion={trackManagerState.current.viewRegion}
          showHighlightMenuModal={true}
          onNewRegion={onRegionSelected}
          onSetHighlights={getHighlightState}
          selectedTool={selectedTool}
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

        {selectedRegion && (
          <TrackRegionController
            selectedRegion={selectedRegion}
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
        <p className="text-sm font-mono pl-2">
          1px: {basePerPixel.current.toFixed(2)}bp
        </p>
      </div>}

      <div style={{ display: "flex", position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            //makes components align right or right when we switch sides

            border: isGenomeViewLoaded ? "2px solid #BCCCDC" : "",
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
              //   item.hasAllRegionData = true;
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
                      zIndex: 10,
                      width: legendWidth,
                      backgroundColor: "white",
                      position: "relative",
                    }}
                    ref={item.legendRef}
                  ></div>
                  <div
                    ref={trackComponents[index].posRef}
                    style={{
                      zIndex: 1,
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
                      globalTrackState={globalTrackState}
                      isGenomeViewLoaded={isGenomeViewLoaded}
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
              {selectedTool && selectedTool.isSelected ? (
                <SelectableGenomeArea
                  selectableRegion={trackManagerState.current.viewRegion}
                  dragLimits={
                    new OpenInterval(legendWidth, windowWidth + legendWidth)
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

      {configMenu ? (
        <div

          style={{
            position: "fixed", // position the menu absolutely

            zIndex: 1000, // ensure it appears on top of other elements
            flexDirection: "column",
            whiteSpace: "nowrap",
            overflow: "visible" // ensure the menu can overflow the parent

          }}
        >
          <ConfigMenuComponent
            key={configMenu.key}
            menuData={configMenu}
          />
        </div>
      ) : (
        ""
      )}

    </OutsideClickDetector>
    {/* </div> */}

  </>

  );
});
export default memo(TrackManager);
