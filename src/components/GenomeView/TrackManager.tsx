import {
  createRef,
  CSSProperties,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";
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
import GenomeNavigator from "./genomeNavigator/GenomeNavigator";
import { SelectableGenomeArea } from "./genomeNavigator/SelectableGenomeArea";
import React from "react";
import OutsideClickDetector from "./commonComponents/OutsideClickDetector";
import { getTrackConfig } from "../../trackConfigs/config-menu-models.tsx/getTrackConfig";
import _ from "lodash";
import trackConfigMenu from "../../trackConfigs/config-menu-components.tsx/TrackConfigMenu";

import SubToolButtons from "./ToolsComponents/SubToolButtons";
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
  addTrack: (track: any) => void;
  startBp: (bp: string, startNav: number, endNav: number) => void;
  recreateTrackmanager: (trackOptions: {}) => void;
  windowWidth: number;
  genomeArr: Array<any>;
}
const TrackManager: React.FC<TrackManagerProps> = memo(function TrackManager({
  genomeIdx,
  addTrack,
  startBp,
  recreateTrackmanager,
  windowWidth,
  genomeArr,
}) {
  //useRef to store data between states without re render the component

  const infiniteScrollWorker = useRef<Worker>();
  const useFineModeNav = useRef(false);
  const ToolChange = useRef(false);
  const trackManagerId = useRef("");
  const leftStartCoord = useRef(0);
  const rightStartCoord = useRef(0);
  const bpRegionSize = useRef(0);
  const block = useRef<HTMLInputElement>(null);
  const g3dRect = useRef<HTMLInputElement>(null);
  const bpX = useRef(0);
  const maxBp = useRef(0);
  const minBp = useRef(0);
  const selectedTracks = useRef<{ [key: string]: any }>({});
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const horizontalLineRef = useRef<any>(0);
  const verticalLineRef = useRef<any>(0);
  const activeTrackModels = useRef<Array<TrackModel>>([]);
  const hicStrawObj = useRef<{ [key: string]: any }>({});
  const isMouseInsideRef = useRef(false);
  const currTracksConfig = useRef<{ [key: string]: any }>({});
  const configOptions = useRef({ displayMode: "" });
  const configMenuPos = useRef<{ [key: string]: any }>({});
  const saveState = useRef<{ [key: string]: any }>({ selectedTool: "" });
  const lastDragX = useRef(0);
  const isThereG3dTrack = useRef(false);
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const basePerPixel = useRef(0);
  const frameID = useRef(0);
  const lastX = useRef(0);
  const dragX = useRef(0);
  const isLoading = useRef(true);
  const side = useRef("right");
  const isDragging = useRef(false);
  const rightSectionSize = useRef<Array<any>>([windowWidth]);
  const leftSectionSize = useRef<Array<any>>([]);

  // These states are used to update the tracks with new fetch(data);
  const containerRef = useRef(null);
  const scrollPosition = useRef(0);
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track

  const [initialStart, setInitialStart] = useState("workerNotReady");
  const [selectedTool, setSelectedTool] = useState("none");
  const [show3dGene, setShow3dGene] = useState();
  const [trackComponents, setTrackComponents] = useState<Array<any>>([]);
  const [g3dtrackComponents, setG3dTrackComponents] = useState<Array<any>>([]);
  const [region, setRegion] = useState<{ [key: string]: any }>({});
  const [trackData, setTrackData] = useState<{ [key: string]: any }>({});
  const [dataIdx, setDataIdx] = useState(0);
  const [highlight, setHighlight] = useState<Array<any>>([]);
  const [configMenu, setConfigMenu] = useState<{ [key: string]: any }>({
    configMenus: "",
  });

  const [curRegion, setCurRegion] = useState<ChromosomeInterval[]>();
  const [selectConfigChange, setSelectConfigChange] = useState<{
    [key: string]: any;
  }>({});
  function sumArray(numbers) {
    let total = 0;
    for (let i = 0; i < numbers.length; i++) {
      total += numbers[i];
    }
    return total;
  }

  const horizontalLineStyle: CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "2px",

    zIndex: 3,
    pointerEvents: "none",

    borderTop: "1px dotted grey",
  };
  const verticalLineStyle: CSSProperties = {
    position: "absolute",
    height: "100%",
    width: "2px",
    top: 0,
    borderLeft: "1px dotted grey",
    zIndex: 3,
    pointerEvents: "none",
  };
  // MOUSE EVENTS FUNCTION HANDLER, HOW THE TRACK WILL CHANGE BASED ON WHAT THE USER DOES: DRAGGING, MOUSESCROLL, CLICK
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setSelectedTool("none");
      isLoading.current = false;
    }
  };

  function handleScroll(e) {
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

  function handleMove(e) {
    if (isMouseInsideRef.current) {
      const parentRect = block.current!.getBoundingClientRect();
      const x = e.clientX - parentRect.left;
      const y = e.clientY - parentRect.top;
      mousePositionRef.current = { x: e.clientX, y: e.clientY };

      horizontalLineRef.current.style.top = `${y}px`;
      verticalLineRef.current.style.left = `${x}px`;
    }
    if (!isDragging.current || isLoading.current) {
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

    highlight.forEach((item, i) => {
      frameID.current = requestAnimationFrame(() => {
        item.highlightRef.current!.style.transform = `translate3d(${dragX.current}px, 0px, 0)`;
      });
    });
  }
  const handleClick = () => {
    addTrack({
      region: curRegion,
      trackType: "bigWig",
      genome: genomeArr[genomeIdx],
    });
  };
  function handleMouseDown(e: any) {
    isDragging.current = true;
    lastX.current = e.pageX;

    e.preventDefault();
  }
  function onToolClicked(tool: any) {
    setSelectedTool((prevState) => {
      if (prevState === "none") {
        isLoading.current = true;
        return tool.title;
      } else {
        isLoading.current = false;
        return "none";
      }
    });
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
    let genomeFeatureSegment: Array<FeatureSegment> = genomeArr[
      genomeIdx
    ].navContext.getFeaturesInInterval(curBp, curBp + bpRegionSize.current);

    let genomeCoordLocus = genomeFeatureSegment.map((item, index) =>
      item.getLocus()
    );

    startBp(genomeCoordLocus.toString(), curBp, curBp + bpRegionSize.current);
    setCurRegion(genomeCoordLocus);
    let tmpObj = {};
    tmpObj["viewWindow"] = new DisplayedRegionModel(
      genomeArr[genomeIdx].navContext,
      curBp,
      curBp + bpRegionSize.current
    );
    tmpObj["viewRegion"] = new DisplayedRegionModel(
      genomeArr[genomeIdx].navContext,
      curBp - bpRegionSize.current,
      curBp + bpRegionSize.current * 2
    );
    setRegion(tmpObj);
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

  function handleMouseEnter() {
    isMouseInsideRef.current = true;
  }

  function handleMouseLeave() {
    isMouseInsideRef.current = false;
  }
  // FUNCTIONS HANDLER FOR WHEN CONFIG FOR TRACKS CHANGES OR WHEN USER IS SELECTING MULITPLE TRACKS
  // the trackmanager will handle the config menu when mutiple  tracks are selected otherwise each
  // track will create their own configmenu.
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  function onTrackConfigChange(config: any) {
    currTracksConfig.current[`${config.id}`] = { ...config };
  }
  function genomeNavigatorRegionSelect(startBase, endBase) {
    console.log("GenomeNavigatorSelectBase", startBase, endBase);
  }
  function onConfigChange(key, value) {
    if (key === "displayMode") {
      let menuComponents: Array<any> = [];
      let optionsObjects: Array<any> = [];

      for (const config in selectedTracks.current) {
        let curConfig = selectedTracks.current[config];
        curConfig.configOptions.displayMode = value;
        curConfig.trackModel.options = curConfig.configOptions;
        const trackConfig = getTrackConfig(curConfig.trackModel);
        const menuItems = trackConfig.getMenuComponents(basePerPixel.current);

        menuComponents.push(menuItems);
        optionsObjects.push(curConfig.configOptions);
      }

      const commonMenuComponents: Array<any> = _.intersection(
        ...menuComponents
      );

      let menu = trackConfigMenu["multi"]({
        trackIdx: selectedTracks.current.length,
        handleDelete,
        id: "multiSelect",
        pageX: configMenuPos.current.left,
        pageY: configMenuPos.current.top,
        onCloseConfigMenu: () => "",
        selectLen: selectedTracks.current.length,
        configOptions: optionsObjects,
        items: commonMenuComponents,
        onConfigChange,
        blockRef: block,
      });

      getConfigMenu(menu, "multi");
    } else {
      configOptions.current[`${key}`] = value;

      for (const config in selectedTracks.current) {
        let curConfig = selectedTracks.current[config];
        curConfig.configOptions[`${key}`] = value;
        curConfig.trackModel.options = curConfig.configOptions;
      }
    }

    setSelectConfigChange({ changedOption: { [key]: value }, selectedTracks });
  }

  function renderTrackSpecificItems(x, y) {
    let menuComponents: Array<any> = [];
    let optionsObjects: Array<any> = [];
    for (const config in selectedTracks.current) {
      let curConfig = selectedTracks.current[config];
      const trackConfig = getTrackConfig(curConfig.trackModel);
      const menuItems = trackConfig.getMenuComponents(basePerPixel.current);

      menuComponents.push(menuItems);
      optionsObjects.push(curConfig.configOptions);
    }

    const commonMenuComponents: Array<any> = _.intersection(...menuComponents);

    let menu = trackConfigMenu["multi"]({
      trackIdx: selectedTracks.current.length,
      handleDelete,
      id: "multiSelect",
      pageX: x,
      pageY: y,
      onCloseConfigMenu: () => "",
      selectLen: selectedTracks.current.length,
      configOptions: optionsObjects,
      items: commonMenuComponents,
      onConfigChange,
      blockRef: block,
    });

    configMenuPos.current = { left: x, top: y };

    getConfigMenu(menu, "multiSelect");
  }
  function handleShiftSelect(e: any, trackDetails: { [key: string]: any }) {
    if (e.shiftKey) {
      if (!selectedTracks.current[`${trackDetails.id}`]) {
        selectedTracks.current[`${trackDetails.id}`] =
          currTracksConfig.current[`${trackDetails.id}`];
        trackDetails.legendRef.current.style.backgroundColor = "lightblue";
      } else if (trackDetails.id in selectedTracks.current) {
        trackDetails.legendRef.current.style.backgroundColor = "white";
        delete selectedTracks.current[`${trackDetails.id}`];
      }

      if (
        configMenu.configMenus !== "" &&
        Object.keys(selectedTracks.current).length > 0
      ) {
        renderTrackSpecificItems(e.pageX, e.pageY);
      } else {
        let tmpObh = { configMenus: "" };
        setConfigMenu(tmpObh);
      }
    }
  }
  function handleMultiRightClick(e: any, trackId: any) {
    e.preventDefault();

    if (Object.keys(selectedTracks.current).length === 0) {
      return;
    }
    if (trackId in selectedTracks.current) {
      renderTrackSpecificItems(e.pageX, e.pageY);
    } else {
      onCloseMultiConfigMenu();
    }
  }

  function getConfigMenu(htmlElement: any, selectType: string) {
    if (
      selectType === "singleSelect" &&
      Object.keys(selectedTracks.current).length !== 0
    ) {
      return;
    }

    let tmpObh = { configMenus: htmlElement };
    setConfigMenu(tmpObh);
  }

  function onCloseMultiConfigMenu() {
    if (Object.keys(selectedTracks.current).length !== 0) {
      for (const key in selectedTracks.current) {
        selectedTracks.current[key].legendRef.current.style.backgroundColor =
          "white";
      }

      selectedTracks.current = {};
      setConfigMenu({ configMenus: "" });
    }
  }

  function onCloseConfigMenu() {
    selectedTracks.current = {};
    setConfigMenu({ configMenus: "" });
  }
  function handleDelete(id: number) {
    activeTrackModels.current = activeTrackModels.current.filter(
      (items, index) => {
        return index !== id;
      }
    );

    setTrackComponents((prevTracks) => {
      return prevTracks.filter((items, index) => {
        return index !== id;
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
        let tmpObj = {};
        tmpObj["viewWindow"] = curFetchRegionNav;
        tmpObj["viewRegion"] = newVisData.visRegion;
        setRegion(tmpObj);
      } else {
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

      try {
        infiniteScrollWorker.current!.postMessage({
          primaryGenName: genomeArr[genomeIdx].genome.getName(),
          trackModelArr: activeTrackModels.current,
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

  // TOOL FUNCTIONS
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  function onRegionSelected(startbase: number, endbase: number, xSpan) {
    console.log(xSpan);
    // let newDefaultTracksArr: Array<TrackModel> = [];
    // for (let key in currTracksConfig.current) {
    //   let curTrackOptions = currTracksConfig.current[`${key}`];
    //   curTrackOptions["trackModel"].options = curTrackOptions.configOptions;
    //   newDefaultTracksArr.push(curTrackOptions["trackModel"]);
    // }
    // genomeArr[genomeIdx].defaultTracks = newDefaultTracksArr;
    // genomeArr[genomeIdx].defaultRegion = new OpenInterval(startbase, endbase);
    // recreateTrackmanager({
    //   selectedTool: selectedTool,
    //   genomeConfig: genomeArr[genomeIdx],
    //   scrollY: window.scrollY,
    // });
    let length = xSpan.end - xSpan.start;
    let curXPos = -dragX.current + xSpan.start;
    let newRef: any = createRef();

    setHighlight([
      ...highlight,
      { highlightRef: newRef, xPos: curXPos, length },
    ]);
  }

  // USEEFFECTS
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  //_________________________________________________________________________________________________________________________________
  useEffect(() => {
    // terminate the worker and listener when TrackManager  is unmounted
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("keydown", handleKeyDown);
    const parentElement = block.current;
    if (parentElement) {
      parentElement.addEventListener("mousemove", handleMove);
      parentElement.addEventListener("mouseenter", handleMouseEnter);
      parentElement.addEventListener("mouseleave", handleMouseLeave);
      window.addEventListener("scroll", handleScroll);
    }
    return () => {
      infiniteScrollWorker.current!.terminate();
      if (parentElement) {
        parentElement.removeEventListener("mousemove", handleMove);
        parentElement.removeEventListener("mouseenter", handleMouseEnter);
        parentElement.removeEventListener("mouseleave", handleMouseLeave);
      }
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("scroll", handleScroll);
      console.log("trackmanager terminate");
    };
  }, []);

  useEffect(() => {
    // add Listenser again because javacript dom only have the old trackComponents value
    // it gets the trackComponents at creation so when trackComponent updates we need to
    // add the listener so it can get the most updated trackComponent
    highlight.forEach((item, i) => {
      frameID.current = requestAnimationFrame(() => {
        item.highlightRef.current!.style.transform = `translate3d(${dragX.current}px, 0px, 0)`;
      });
    });
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [trackComponents, highlight]);

  useEffect(() => {
    if (initialStart === "workerReady") {
      // go through genome defaultTrack to see what track components we need and give each component
      // a unique id so it remember data and allows us to manipulate the position in the trackComponent arr
      let genome = genomeArr[genomeIdx];

      let newTrackComponents: Array<any> = [];
      let trackIdx = 0;
      let track3dIdx = 0;
      for (let i = 0; i < genome.defaultTracks.length; i++) {
        if (genome.defaultTracks[i].type !== "g3d") {
          const newPosRef = createRef();
          const newLegendRef = createRef();
          const uniqueKey = uuidv4();
          genome.defaultTracks[i]["id"] = uniqueKey;
          newTrackComponents.push({
            trackIdx: trackIdx,
            id: uniqueKey,
            component: componentMap[genome.defaultTracks[i].type],
            posRef: newPosRef,
            legendRef: newLegendRef,
            trackModel: genome.defaultTracks[i],
          });

          if (
            genome.defaultTracks[i].type === "genomealign" &&
            basePerPixel.current < 10
          ) {
            useFineModeNav.current = true;
          }

          if (genome.defaultTracks[i].type === "hic") {
            hicStrawObj.current[`${uniqueKey}`] = new HicSource(
              genome.defaultTracks[i].url
            );
          }
          trackIdx++;
        } else {
          isThereG3dTrack.current = true;
          let newG3dComponent: Array<any> = [];
          const uniqueKeyG3d = uuidv4();
          genome.defaultTracks[i]["id"] = uniqueKeyG3d;
          newG3dComponent.push({
            trackIdx: track3dIdx,
            id: uniqueKeyG3d,
            component: ThreedmolContainer,

            trackModel: genome.defaultTracks[i],
          });
          setG3dTrackComponents([...newG3dComponent]);
          track3dIdx++;
        }
      }
      activeTrackModels.current = genomeArr[genomeIdx].defaultTracks.filter(
        (items, index) => {
          return items.type !== "g3d";
        }
      );

      setTrackComponents((prevTrackComponents) => {
        // Modify prevTrackComponents here
        return [...prevTrackComponents, ...newTrackComponents];
      });
      fetchGenomeData(1, "right");
    }
  }, [initialStart]);
  useEffect(() => {
    if (trackManagerId.current === "") {
      // on initial and when our genome data changes we set the default values here
      console.log(windowWidth);
      let genome = genomeArr[genomeIdx];

      leftStartCoord.current = genome.defaultRegion.start;
      rightStartCoord.current = genome.defaultRegion.end;

      bpRegionSize.current = rightStartCoord.current - leftStartCoord.current;

      basePerPixel.current = bpRegionSize.current / windowWidth;

      bpX.current = leftStartCoord.current;
      maxBp.current = genome.defaultRegion.end;
      minBp.current = genome.defaultRegion.start;

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
        <button onClick={handleClick}>add bed</button>
        {Object.keys(region).length > 0 ? (
          <GenomeNavigator
            selectedRegion={region.viewWindow}
            genomeConfig={genomeArr[genomeIdx]}
            windowWidth={windowWidth}
            onRegionSelected={genomeNavigatorRegionSelect}
          />
        ) : (
          ""
        )}

        <div> - {curRegion?.toString()}</div>
        <div> {bpX.current + "-" + (bpX.current + bpRegionSize.current)}</div>
        <div>Pixel distance from starting point : {dragX.current}px</div>
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

        <div>1pixel to {basePerPixel.current}bp</div>

        <SubToolButtons onToolClicked={onToolClicked} />
        <OutsideClickDetector onOutsideClick={onCloseMultiConfigMenu}>
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
                width: `${windowWidth - 1}px`,
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
                }}
              >
                <div ref={horizontalLineRef} style={horizontalLineStyle} />
                <div ref={verticalLineRef} style={verticalLineStyle} />
                {highlight.length > 0 ? (
                  <div
                    data-theme={"light"}
                    style={{
                      position: "absolute",
                      display: "flex",
                      WebkitBackfaceVisibility: "hidden",
                      WebkitPerspective: `${windowWidth}px`,
                      backfaceVisibility: "hidden",
                      perspective: `${windowWidth}px`,
                      zIndex: 15, // Ensure it's on top of other elements
                    }}
                  >
                    {highlight.map((item, index) => {
                      console.log(item);
                      return (
                        <div
                          key={index}
                          ref={item.highlightRef}
                          style={{
                            display: "flex",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              position: "relative",
                              height: "500px",
                            }}
                          >
                            <div
                              key={index}
                              style={{
                                position: "absolute",
                                backgroundColor: "yellow",
                                top: "0",
                                height: "200px",
                                left:
                                  side.current === "right"
                                    ? `${item.xPos}px`
                                    : "",
                                right:
                                  side.current === "left"
                                    ? `${item.xPos}px`
                                    : "",
                                width: item.length,
                                pointerEvents: "none", // This makes the highlighted area non-interactive
                              }}
                            ></div>
                          </div>{" "}
                        </div>
                      );
                    })}{" "}
                  </div>
                ) : (
                  ""
                )}
                {trackComponents.map((item, index) => {
                  let Component = item.component;

                  return (
                    <div
                      onMouseDown={(event) => handleShiftSelect(event, item)}
                      onContextMenu={(event) =>
                        handleMultiRightClick(event, item.id)
                      }
                      data-theme={"light"}
                      key={item.id}
                      style={{
                        display: "flex",
                        WebkitBackfaceVisibility: "hidden",
                        WebkitPerspective: `${windowWidth}px`,
                        backfaceVisibility: "hidden",
                        perspective: `${windowWidth}px`,
                        backgroundColor: "#F2F2F2",
                        width: `${windowWidth}px`,
                        zIndex: 1,
                        outline: "1px solid Dodgerblue",
                      }}
                    >
                      <div
                        style={{
                          zIndex: 3,

                          width: "120px",
                          backgroundColor: "white",
                        }}
                        ref={item.legendRef}
                      ></div>
                      <div
                        ref={trackComponents[index].posRef}
                        style={{
                          display: "flex",
                        }}
                      >
                        <Component
                          id={item.id}
                          trackModel={item.trackModel}
                          bpRegionSize={bpRegionSize.current}
                          useFineModeNav={useFineModeNav.current}
                          bpToPx={basePerPixel.current}
                          trackData={trackData}
                          side={side.current}
                          windowWidth={windowWidth}
                          dragXDist={dragX.current}
                          handleDelete={handleDelete}
                          genomeArr={genomeArr}
                          genomeIdx={genomeIdx}
                          dataIdx={dataIdx}
                          getConfigMenu={getConfigMenu}
                          onCloseConfigMenu={onCloseConfigMenu}
                          trackIdx={index}
                          trackManagerRef={block}
                          setShow3dGene={setShow3dGene}
                          isThereG3dTrack={isThereG3dTrack.current}
                          legendRef={item.legendRef}
                          onTrackConfigChange={onTrackConfigChange}
                          selectConfigChange={selectConfigChange}
                        />
                      </div>
                    </div>
                  );
                })}

                <div
                  style={{
                    display: "flex",
                    position: "absolute",
                    width: `${windowWidth - 1}px`,
                    zIndex: 10,
                  }}
                >
                  {selectedTool !== "none" ? (
                    <SelectableGenomeArea
                      selectableRegion={region.viewWindow}
                      dragLimits={new OpenInterval(120, windowWidth)}
                      onRegionSelected={onRegionSelected}
                    >
                      <div
                        style={{
                          height: block.current
                            ? block.current?.getBoundingClientRect().height
                            : 0,
                          zIndex: 3,
                          width: `${windowWidth}px`,
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
      {configMenu.configMenus ? configMenu.configMenus : ""}
    </>
  );
});
export default memo(TrackManager);
