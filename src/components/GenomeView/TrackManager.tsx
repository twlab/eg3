import { createRef, memo, useEffect, useRef, useState } from "react";
const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;

import RefGeneTrack from "./RefGeneTrack";
import BedTrack from "./BedTrack";
import BigBedTrack from "./BigBedTrack";
import BigWigTrack from "./BigWigTrack";
import DynseqTrack from "./DynseqTrack";
import MethylcTrack from "./MethylcTrack";
import GenomeAlign from "./GenomeAlign";
import MatplotTrack from "./MatplotTrack";
import CircularProgress from "@mui/material/CircularProgress";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import OpenInterval from "../../models/OpenInterval";
import { v4 as uuidv4 } from "uuid";
import Worker from "web-worker";
import { TrackProps } from "../../models/trackModels/trackProps";
import { FeatureSegment } from "../../models/FeatureSegment";
import ChromosomeInterval from "../../models/ChromosomeInterval";
import Feature from "../../models/Feature";
import NavigationContext from "../../models/NavigationContext";
import { HicSource } from "../../getRemoteData/hicSource";
import HiCTrack from "./HiCTrack";
import CategoricalTrack from "./CategoricalTrack";
import LongrangeTrack from "./LongrangeTrack";
import BigInteractTrack from "./BigInteractTrack";
import RepeatMaskerTrack from "./RepeatMaskerTrack";
import RefBedTrack from "./RefBedTrack";
import ThreedmolContainer from "../3dmol/ThreedmolContainer";
import TrackModel from "../../models/TrackModel";
import RulerTrack from "./RulerTrack";
import FiberTrack from "./FiberTrack";
import { SelectableGenomeArea } from "./genomeNavigator/SelectableGenomeArea";
import React from "react";
import OutsideClickDetector from "./commonComponents/OutsideClickDetector";
import { getTrackConfig } from "../../trackConfigs/config-menu-models.tsx/getTrackConfig";
import {
  createNewTrackState,
  TrackState,
} from "./CommonTrackStateChangeFunctions.tsx/createNewTrackState";

function sumArray(numbers) {
  let total = 0;
  for (let i = 0; i < numbers.length; i++) {
    total += numbers[i];
  }
  return total;
}
import {
  child,
  get,
  getDatabase,
  onValue,
  ref,
  set,
  update,
} from "firebase/database";
import _, { create } from "lodash";
import ConfigMenuComponent from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";
import SubToolButtons from "./ToolsComponents/SubToolButtons";
import HighlightMenu from "./ToolsComponents/HighlightMenu";

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
const componentMap: { [key: string]: React.FC<TrackProps> } = {
  geneannotation: RefGeneTrack,
  bed: BedTrack,
  bigwig: BigWigTrack,
  dynseq: DynseqTrack,
  methylc: MethylcTrack,
  hic: HiCTrack,
  genomealign: GenomeAlign,
  cool: HiCTrack,
  categorical: CategoricalTrack,
  longrange: LongrangeTrack,
  biginteract: BigInteractTrack,
  repeatmasker: RepeatMaskerTrack,
  bigbed: BigBedTrack,
  refbed: RefBedTrack,
  matplot: MatplotTrack,
  ruler: RulerTrack,
  modbed: FiberTrack,
};
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
  genomeIdx: number;
  recreateTrackmanager: (trackOptions: {}) => void;
  windowWidth: number;
  genomeArr: Array<any>;
  undoRedo: any;
  addGlobalState: (trackState: any) => void;
}
const TrackManager: React.FC<TrackManagerProps> = memo(function TrackManager({
  genomeIdx,
  recreateTrackmanager,
  windowWidth,
  genomeArr,
  undoRedo,
  addGlobalState,
}) {
  //useRef to store data between states without re render the component

  const infiniteScrollWorker = useRef<Worker>();
  const useFineModeNav = useRef(false);

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

  const hicStrawObj = useRef<{ [key: string]: any }>({});
  const isMouseInsideRef = useRef(false);
  const globalTrackConfig = useRef<{ [key: string]: any }>({});
  const trackManagerState = useRef<TrackState>({
    bundleId: "",
    customTracksPool: [],
    darkTheme: false,
    genomeName: genomeArr[genomeIdx].genome.getName(),
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
    viewRegion: new DisplayedRegionModel(genomeArr[genomeIdx].navContext, 0, 1),
    trackLegendWidth: 120,
    tracks: genomeArr[genomeIdx].defaultTracks,
  });
  const database = getDatabase();
  const configMenuPos = useRef<{ [key: string]: any }>({});

  const lastDragX = useRef(0);
  const isThereG3dTrack = useRef(false);

  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const basePerPixel = useRef(0);
  const frameID = useRef(0);
  const lastX = useRef(0);
  const dragX = useRef(0);
  const isLoading = useRef(true);
  const isToolSelected = useRef(false);
  const side = useRef("right");
  const isDragging = useRef(false);
  const rightSectionSize = useRef<Array<any>>([windowWidth]);
  const leftSectionSize = useRef<Array<any>>([]);

  // These states are used to update the tracks with new fetch(data);
  const containerRef = useRef(null);
  const initialConfig = useRef(true);
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track

  const [initialStart, setInitialStart] = useState("workerNotReady");

  const [show3dGene, setShow3dGene] = useState();
  const [trackComponents, setTrackComponents] = useState<Array<any>>([]);
  const [g3dtrackComponents, setG3dTrackComponents] = useState<Array<any>>([]);
  const [selectedTool, setSelectedTool] = useState<{ [key: string]: any }>({
    isSelected: false,
    title: "none",
  });
  const [trackData, setTrackData] = useState<{ [key: string]: any }>({});
  const [dataIdx, setDataIdx] = useState(0);
  const [highlight, setHighlight] = useState<Array<any>>([]);
  const [configMenu, setConfigMenu] = useState<{ [key: string]: any }>({
    configMenus: "",
  });

  const curTestId = useRef(0);

  const [applyTrackConfigChange, setApplyTrackConfigChange] = useState<{
    [key: string]: any;
  }>({});

  // MOUSE EVENTS FUNCTION HANDLER, HOW THE TRACK WILL CHANGE BASED ON WHAT THE USER DOES: DRAGGING, MOUSESCROLL, CLICK
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      let newSelectedTool = {};
      newSelectedTool["tool"] = "none";
      newSelectedTool["isSelected"] = false;
      setSelectedTool(newSelectedTool);
    }
  };

  function addFavoriteColorToUser(id, dataObj) {
    update(ref(database), {
      [id]: { data: "json" + dataObj },
    });
  }
  function getSession(sessionId: any) {
    const dbRef = ref(database);
    get(child(dbRef, `${sessionId}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          console.log(snapshot.val());
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }
  function handleScroll() {
    // dont need to account for scroll because parenttop will always give the extact location of where the  event is
    // so we just need the viewport position to get the right location
    if (isMouseInsideRef.current) {
      const parentRect = block.current!.getBoundingClientRect();
      if (horizontalLineRef.current) {
        horizontalLineRef.current.style.top = `${
          mousePositionRef.current.y - parentRect.top
        }px`;
      }
      if (verticalLineRef.current) {
        verticalLineRef.current.style.left = `${
          mousePositionRef.current.x - parentRect.left
        }px`;
      }
    }
  }
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

    if (!isDragging.current || isLoading.current || isToolSelected.current) {
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

    setDataIdx(Math.ceil(dragX.current! / windowWidth));
    const curBp =
      leftStartCoord.current + -dragX.current * basePerPixel.current;

    trackManagerState.current.viewRegion._startBase = curBp;
    trackManagerState.current.viewRegion._endBase =
      curBp + bpRegionSize.current;

    let newStateObj = createNewTrackState(trackManagerState.current, {
      viewRegion: trackManagerState.current.viewRegion.clone(),
    });

    addGlobalState(newStateObj);

    bpX.current = curBp;
    //DONT MOVE THIS PART OR THERE WILL BE FLICKERS BECAUSE when using ref,
    //the new ref data will only be passed to childnre component
    // after the state changes, we put this here so it changes with other
    // useState variable that changes so we save some computation instead of using
    // another useState
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
      fetchGenomeData(0, "right");
    } else if (
      dragX.current >= sumArray(leftSectionSize.current) &&
      dragX.current > 0
    ) {
      isLoading.current = true;
      console.log("trigger left");
      leftSectionSize.current.push(windowWidth);
      fetchGenomeData(0, "left");
    }
  }

  // FUNCTIONS HANDLER FOR WHEN CONFIG FOR TRACKS CHANGES OR WHEN USER IS SELECTING MULITPLE TRACKS
  // the trackmanager will handle the config menu when mutiple  tracks are selected otherwise each
  // track will create their own configmenu.
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________

  function setTrackState(state: any) {
    if (!state) {
      return;
    }
    console.log(state);
    trackManagerState.current = createNewTrackState(state, {});

    let highlightElement = createHighlight(state.highlights);
    setHighlight(highlightElement);

    let tmpSelected = {};
    let tmpConfigOptions = {};
    trackManagerState.current.tracks.map((trackModel) => {
      globalTrackConfig.current[
        `${trackModel.id}`
      ].legendRef.current.style.backgroundColor = "white";
      if (trackModel.isSelected) {
        tmpSelected[`${trackModel.id}`] =
          globalTrackConfig.current[`${trackModel.id}`];
        globalTrackConfig.current[
          `${trackModel.id}`
        ].legendRef.current.style.backgroundColor = "lightblue";
      }
      tmpConfigOptions[`${trackModel.id}`] = trackModel.options;
    });
    tmpConfigOptions["type"] = "undoredo";

    setApplyTrackConfigChange(tmpConfigOptions);
  }

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
        const menuItems = trackConfig.getMenuComponents(basePerPixel.current);

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

    addGlobalState(newStateObj);
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
      const menuItems = trackConfig.getMenuComponents(basePerPixel.current);
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

      addGlobalState(newStateObj);

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

      addGlobalState(newStateObj);
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

      addGlobalState(newStateObj);

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

    addGlobalState(newStateObj);

    setTrackComponents((prevTracks) => {
      return prevTracks.filter((item, index) => {
        if (id.includes(String(item.trackModel.id))) {
          delete selectedTracks.current[`${item.trackModel.id}`];
        }
        return !id.includes(String(item.trackModel.id));
      });
    });
  }

  // FUNCTION TO FETCH DATA AND CHANGE STATE TO INDICATE THERE ARE NEW DATA AFTER GETTING NAV COORD TELLING THE each TRACK
  // COMPONENTS TO UPDATE AND DRAW WITH THE NEW DATA
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  async function fetchGenomeData(initial: number = 0, trackSide) {
    if (initial === 0 || initial === 1) {
      let curFetchRegionNav;
      let tempObj = {};
      let genomicLoci: Array<ChromosomeInterval> = [];

      let initNavLoci: Array<any> = [];
      let newVisData;
      let expandedGenomeCoordLocus;
      if (initial === 1) {
        console.log(maxBp.current);
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

        curFetchRegionNav = new DisplayedRegionModel(
          genomeArr[genomeIdx].navContext,
          minBp.current,
          maxBp.current
        );

        newVisData = {
          visWidth: windowWidth * 3,
          visRegion: new DisplayedRegionModel(
            genomeArr[genomeIdx].navContext,
            minBp.current - bpRegionSize.current,
            maxBp.current + bpRegionSize.current
          ),
          viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
          viewWindowRegion: curFetchRegionNav,
        };

        let expandedGenomeFeatureSegment: Array<FeatureSegment> = genomeArr[
          genomeIdx
        ].navContext.getFeaturesInInterval(
          minBp.current - bpRegionSize.current,
          maxBp.current + bpRegionSize.current
        );

        expandedGenomeCoordLocus = expandedGenomeFeatureSegment.map(
          (item, index) => item.getLocus()
        );
        minBp.current = minBp.current - bpRegionSize.current;
        maxBp.current = maxBp.current + bpRegionSize.current * 2;
      } else {
        console.log(maxBp.current);
        if (trackSide === "right") {
          curFetchRegionNav = new DisplayedRegionModel(
            genomeArr[genomeIdx].navContext,
            maxBp.current - bpRegionSize.current,
            maxBp.current
          );
          let genomeFeatureSegment: Array<FeatureSegment> = genomeArr[
            genomeIdx
          ].navContext.getFeaturesInInterval(
            maxBp.current - bpRegionSize.current,
            maxBp.current
          );

          genomicLoci = genomeFeatureSegment.map((item, index) =>
            item.getLocus()
          );
          console.log(genomicLoci);
          newVisData = {
            visWidth: windowWidth * 3,
            visRegion: new DisplayedRegionModel(
              genomeArr[genomeIdx].navContext,
              maxBp.current - bpRegionSize.current * 3,
              maxBp.current
            ),
            viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
            viewWindowRegion: curFetchRegionNav,
          };

          let expandedGenomeFeatureSegment: Array<FeatureSegment> = genomeArr[
            genomeIdx
          ].navContext.getFeaturesInInterval(
            maxBp.current - bpRegionSize.current * 3,
            maxBp.current
          );

          expandedGenomeCoordLocus = expandedGenomeFeatureSegment.map(
            (item, index) => item.getLocus()
          );
          console.log(expandedGenomeCoordLocus);
          maxBp.current = maxBp.current + bpRegionSize.current;
        } else {
          curFetchRegionNav = new DisplayedRegionModel(
            genomeArr[genomeIdx].navContext,
            minBp.current,
            minBp.current + bpRegionSize.current
          );
          let genomeFeatureSegment: Array<FeatureSegment> = genomeArr[
            genomeIdx
          ].navContext.getFeaturesInInterval(
            minBp.current,
            minBp.current + bpRegionSize.current
          );

          genomicLoci = genomeFeatureSegment.map((item, index) =>
            item.getLocus()
          );
          console.log(genomicLoci);
          newVisData = {
            visWidth: windowWidth * 3,
            visRegion: new DisplayedRegionModel(
              genomeArr[genomeIdx].navContext,
              minBp.current,
              minBp.current + bpRegionSize.current * 3
            ),
            viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
            viewWindowRegion: curFetchRegionNav,
          };

          let expandedGenomeFeatureSegment: Array<FeatureSegment> = genomeArr[
            genomeIdx
          ].navContext.getFeaturesInInterval(
            minBp.current,
            minBp.current + bpRegionSize.current * 3
          );

          expandedGenomeCoordLocus = expandedGenomeFeatureSegment.map(
            (item, index) => item.getLocus()
          );

          minBp.current = minBp.current - bpRegionSize.current;
        }
      }
      console.log(genomicLoci);
      try {
        infiniteScrollWorker.current!.postMessage({
          primaryGenName: genomeArr[genomeIdx].genome.getName(),
          trackModelArr: trackManagerState.current.tracks,
          visData: newVisData,
          genomicLoci: genomicLoci,
          expandedGenLoci: expandedGenomeCoordLocus,
          useFineModeNav: useFineModeNav.current,
          windowWidth,
          initGenomicLoci: bpNavToGenNav(initNavLoci, genomeArr[genomeIdx]),
          initNavLoci,

          trackSide,
          curFetchRegionNav: curFetchRegionNav,
          xDist: dragX.current,
          initial,
          bpRegionSize: bpRegionSize.current,
        });

        if (initial === 1) {
          //this is why things get missalign if we make a worker in a state, its delayed so it doesn't subtract the initially
          minBp.current = minBp.current - bpRegionSize.current;
        }
      } catch {}
      infiniteScrollWorker.current!.onmessage = (event) => {
        event.data.fetchResults.map((item, index) => {
          tempObj[item.id] = {
            result: item.result,
            metadata: item.metadata,
          };
          if (item.name === "hic") {
            tempObj[item.id]["straw"] = hicStrawObj.current[`${item.id}`];
          }
        });

        tempObj["initial"] = event.data.initial;
        tempObj["side"] = event.data.side;
        tempObj["location"] = event.data.location;
        tempObj["xDist"] = event.data.xDist;
        tempObj["trackState"] = {
          primaryGenName: genomeArr[genomeIdx].genome.getName(),
          initial: event.data.initial,
          side: event.data.side,
          xDist: event.data.xDist,
          genomicFetchCoord: event.data.genomicFetchCoord,
          useFineModeNav: event.data.useFineModeNav,
          regionNavCoord: new DisplayedRegionModel(
            genomeArr[genomeIdx].navContext,
            event.data.curFetchRegionNav._startBase,
            event.data.curFetchRegionNav._endBase
          ),
        };
        console.log(
          tempObj,
          event.data.genomicLoci,
          event.data.expandGenomicLoci,
          "fetched data for all tracks with their id"
        );
        isLoading.current = false;
        setTrackData({ ...tempObj });
      };
    }
  }

  // SELECTABLE DRAG AREA TO GET DATA FOR TOOL FUNCTIONS
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  function onToolClicked(tool: any) {
    if (tool.title === "redo" || tool.title === "undo") {
      setTrackState(undoRedo(tool.title));
    } else {
      setSelectedTool((prevState) => {
        if (prevState.title === tool.title) {
          let newSelectedTool = {};
          newSelectedTool["title"] = "none";
          newSelectedTool["isSelected"] = false;
          return newSelectedTool;
        } else {
          let newSelectedTool = {};
          newSelectedTool["title"] = tool.title;
          newSelectedTool["isSelected"] = true;

          return newSelectedTool;
        }
      });
    }
  }

  function onRegionSelected(startbase: number, endbase: number) {
    if (
      selectedTool.title ===
      `Zoom-in tool
(Alt+M)`
    ) {
      trackManagerState.current.viewRegion._startBase = startbase;
      trackManagerState.current.viewRegion._endBase = endbase;
      let newStateObj = createNewTrackState(trackManagerState.current, {
        viewRegion: trackManagerState.current.viewRegion.clone(),
      });
      addGlobalState(newStateObj);
      let newDefaultTracksArr: Array<TrackModel> = [];
      for (let key in globalTrackConfig.current) {
        let curTrackOptions = globalTrackConfig.current[`${key}`];
        curTrackOptions["trackModel"].options = curTrackOptions.configOptions;
        newDefaultTracksArr.push(curTrackOptions["trackModel"]);
      }
      genomeArr[genomeIdx].defaultTracks = newDefaultTracksArr;
      genomeArr[genomeIdx].defaultRegion = new OpenInterval(startbase, endbase);

      recreateTrackmanager({
        selectedTool: selectedTool,
        genomeConfig: genomeArr[genomeIdx],
        scrollY: window.scrollY,
      });
    } else if (
      selectedTool.title ===
      `Highlight tool
(Alt+N)`
    ) {
      let newHightlight = {
        start: startbase,
        end: endbase,
        display: true,
        color: "rgba(0, 123, 255, 0.15)",
        tag: "",
      };

      let newStateObj = createNewTrackState(trackManagerState.current, {
        highlights: [newHightlight],
      });

      addGlobalState(newStateObj);
      trackManagerState.current.highlights = [
        ...trackManagerState.current.highlights,
        newHightlight,
      ];
      let highlightElement = createHighlight([newHightlight]);

      setHighlight([...highlight, ...highlightElement]);
    }
  }

  function createHighlight(highlightArr: Array<any>) {
    let resHighlights: Array<any> = [];
    for (const curhighlight of highlightArr) {
      let highlightSide =
        curhighlight.start - leftStartCoord.current <= 0 ? "right" : "left";
      let startHighlight =
        (curhighlight.start - leftStartCoord.current) * pixelPerBase.current;

      let endHighlight =
        -(curhighlight.end - leftStartCoord.current) * pixelPerBase.current;
      let highlightWidth = Math.abs(startHighlight + endHighlight);

      let curXPos = highlightSide === "right" ? startHighlight : endHighlight;
      // 120 is the width of the legend
      let tmpObj = {
        xPos: curXPos,
        width: highlightWidth,
        side: highlightSide,
        startbase: curhighlight.start,
        endbase: curhighlight.end,
        color: curhighlight.color,
        display: curhighlight.display,
        tag: curhighlight.tag,
      };
      resHighlights.push(tmpObj);
    }
    return resHighlights;
  }
  function getHighlightState(highlightState: any) {
    trackManagerState.current.highlights = highlightState;

    let newStateObj = createNewTrackState(trackManagerState.current, {});
    addGlobalState(newStateObj);

    let highlightElements = createHighlight(highlightState);
    setHighlight([...highlightElements]);
  }

  function highlightJump(startbase: any, endbase: any) {
    trackManagerState.current.viewRegion._startBase = startbase;
    trackManagerState.current.viewRegion._endBase = endbase;
    let newStateObj = createNewTrackState(trackManagerState.current, {
      viewRegion: trackManagerState.current.viewRegion.clone(),
    });
    addGlobalState(newStateObj);
    let newDefaultTracksArr: Array<TrackModel> = [];
    for (let key in globalTrackConfig.current) {
      let curTrackOptions = globalTrackConfig.current[`${key}`];
      curTrackOptions["trackModel"].options = curTrackOptions.configOptions;
      newDefaultTracksArr.push(curTrackOptions["trackModel"]);
    }
    genomeArr[genomeIdx].defaultTracks = newDefaultTracksArr;
    genomeArr[genomeIdx].defaultRegion = new OpenInterval(startbase, endbase);

    recreateTrackmanager({
      selectedTool: selectedTool,
      genomeConfig: genomeArr[genomeIdx],
      scrollY: window.scrollY,
    });
  }
  // USEEFFECTS
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  useEffect(() => {
    // terminate the worker and listener when TrackManager  is unmounted
    window.addEventListener("scroll", handleScroll);

    const parentElement = block.current;
    if (parentElement) {
      parentElement.addEventListener("mouseenter", handleMouseEnter);
      parentElement.addEventListener("mouseleave", handleMouseLeave);
    }
    return () => {
      if (infiniteScrollWorker.current) {
        infiniteScrollWorker.current!.terminate();
      }
      if (parentElement) {
        parentElement.removeEventListener("mouseenter", handleMouseEnter);
        parentElement.removeEventListener("mouseleave", handleMouseLeave);
      }

      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("scroll", handleScroll);
      console.log("trackmanager terminate");
    };
  }, []);
  const handleButtonClick = () => {
    addFavoriteColorToUser(uuidv4(), curTestId.current);
    curTestId.current++;
  };

  useEffect(() => {
    isToolSelected.current = selectedTool.isSelected ? true : false;
  }, [selectedTool]);
  useEffect(() => {
    // add Listenser again because javacript dom only have the old trackComponents value
    // it gets the trackComponents at creation so when trackComponent updates we need to
    // add the listener so it can get the most updated trackCom

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [trackComponents]);

  useEffect(() => {
    if (initialStart === "workerReady") {
      // go through genome defaultTrack to see what track components we need and give each component
      // a unique id so it remember data and allows us to manipulate the position in the trackComponent arr

      let newTrackComponents: Array<any> = [];
      let trackIdx = 0;
      let track3dIdx = 0;

      for (let i = 0; i < trackManagerState.current.tracks.length; i++) {
        if (trackManagerState.current.tracks[i].type !== "g3d") {
          const newPosRef = createRef();
          const newLegendRef = createRef();
          const uniqueKey = uuidv4();

          newTrackComponents.push({
            trackIdx: trackIdx,
            id: uniqueKey,
            component: componentMap[trackManagerState.current.tracks[i].type],
            posRef: newPosRef,
            legendRef: newLegendRef,
            trackModel: trackManagerState.current.tracks[i],
          });

          if (
            trackManagerState.current.tracks[i].type === "genomealign" &&
            basePerPixel.current < 10
          ) {
            useFineModeNav.current = true;
          }

          if (trackManagerState.current.tracks[i].type === "hic") {
            hicStrawObj.current[`${trackManagerState.current.tracks[i].id}`] =
              new HicSource(trackManagerState.current.tracks[i].url);
          }
          trackIdx++;
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

      setTrackComponents((prevTrackComponents) => {
        // Modify prevTrackComponents here
        return [...prevTrackComponents, ...newTrackComponents];
      });

      fetchGenomeData(1, "right");
    }
  }, [initialStart]);

  useEffect(() => {
    if (trackManagerId.current === "") {
      let genome = genomeArr[genomeIdx];

      leftStartCoord.current = genome.defaultRegion.start;
      rightStartCoord.current = genome.defaultRegion.end;
      bpRegionSize.current = rightStartCoord.current - leftStartCoord.current;
      basePerPixel.current = bpRegionSize.current / windowWidth;
      pixelPerBase.current = windowWidth / bpRegionSize.current;

      bpX.current = leftStartCoord.current;
      maxBp.current = genome.defaultRegion.end;
      minBp.current = genome.defaultRegion.start;

      // on GenomeRoot first creation we add the default state to StateArr in genomeroot
      // on recreation of trackManager we do not need to set the defaultState because it is saved in genomeroot so we skip to else
      // and do not add to the StateArr.
      if (genome.isInitial) {
        trackManagerState.current.viewRegion._startBase =
          genome.defaultRegion.start;
        trackManagerState.current.viewRegion._endBase =
          genome.defaultRegion.end;
        trackManagerState.current.bundleId = genome.bundleId;
        let newStateObj = createNewTrackState(trackManagerState.current, {
          viewRegion: trackManagerState.current.viewRegion.clone(),
        });

        addGlobalState(newStateObj);
      } else {
        trackManagerState.current = createNewTrackState(
          genomeArr[genomeIdx].curState,
          {}
        );

        let highlightElement = createHighlight(
          trackManagerState.current.highlights
        );
        setHighlight([...highlight, ...highlightElement]);
      }

      // create the worker and trigger state change before we can actually use them takes one re render to acutally
      // start working.Thats why we need the initialStart state.
      if (initialStart === "workerNotReady") {
        infiniteScrollWorker.current = new Worker(
          new URL("../../getRemoteData/fetchDataWorker.ts", import.meta.url),
          {
            type: "module",
          }
        );
        setInitialStart("workerReady");
      }
      trackManagerId.current = genome.id;
    }
  }, [genomeArr]);

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
        <div>
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
        </div>

        <div>1pixel to {basePerPixel.current}bp</div>
        {/* <button onClick={handleButtonClick}>Add Favorite Color to User</button> */}
        <OutsideClickDetector onOutsideClick={onTrackUnSelect}>
          <HighlightMenu
            highlights={trackManagerState.current.highlights}
            viewRegion={trackManagerState.current.viewRegion}
            showHighlightMenuModal={true}
            onNewRegion={highlightJump}
            onSetHighlights={getHighlightState}
          />
          <SubToolButtons onToolClicked={onToolClicked} />
          <div style={{ display: "flex", position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "flex",
                //makes components align right or right when we switch sides

                border: "1px solid Tomato",
                flexDirection: "row",
                // full windowwidth will make canvas only loop 0-windowidth
                // the last value will have no data.
                // so we have to subtract from the size of the canvas
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
                }}
              >
                <div ref={horizontalLineRef} className="horizontal-line" />
                <div ref={verticalLineRef} className="vertical-line" />

                {trackComponents.map((item, index) => {
                  let Component = item.component;

                  return (
                    <div
                      onMouseDown={(event) => handleShiftSelect(event, item)}
                      onContextMenu={(event) => handleRightClick(event, item)}
                      key={item.id}
                      style={{
                        display: "flex",
                        WebkitBackfaceVisibility: "hidden",
                        WebkitPerspective: `${windowWidth + 120}px`,
                        backfaceVisibility: "hidden",
                        perspective: `${windowWidth + 120}px`,
                        backgroundColor: "#F2F2F2",
                        width: `${windowWidth + 120}px`,
                        outline: "1px solid Dodgerblue",
                      }}
                    >
                      <div
                        style={{
                          zIndex: 10, // Ensure the legend is on top
                          width: "120px",
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
                          trackData={trackData}
                          side={side.current}
                          windowWidth={windowWidth}
                          genomeArr={genomeArr}
                          genomeIdx={genomeIdx}
                          dataIdx={dataIdx}
                          trackIdx={index}
                          trackManagerRef={block}
                          setShow3dGene={setShow3dGene}
                          isThereG3dTrack={isThereG3dTrack.current}
                          legendRef={item.legendRef}
                          updateGlobalTrackConfig={updateGlobalTrackConfig}
                          applyTrackConfigChange={applyTrackConfigChange}
                        />

                        {highlight.length > 0
                          ? highlight.map((item, index) => {
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
                    width: `${windowWidth + 120}px`,
                    zIndex: 10,
                  }}
                >
                  {selectedTool.isSelected ? (
                    <SelectableGenomeArea
                      selectableRegion={trackManagerState.current.viewRegion}
                      dragLimits={new OpenInterval(120, windowWidth + 120)}
                      onRegionSelected={onRegionSelected}
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
                    tracks={genomeArr[genomeIdx].defaultTracks}
                    g3dtrack={item.trackModel}
                    viewRegion={windowRegion}
                    width={rectInfo.width}
                    height={rectInfo.height}
                    x={rectInfo.x}
                    y={rectInfo.y}  
                    genomeConfig={genomeArr[genomeIdx]}
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
