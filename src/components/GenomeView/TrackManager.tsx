import { createRef, memo, useEffect, useRef, useState } from "react";
const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;
const fullWindowWidth = window.outerWidth;
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
import useResizeObserver from "./Resize";
import { v4 as uuidv4 } from "uuid";
import Worker from "web-worker";
import { TrackProps } from "../../models/trackModels/trackProps";
import { FeatureSegment } from "../../models/FeatureSegment";
import ChromosomeInterval from "../../models/ChromosomeInterval";
import Feature from "../../models/Feature";
import NavigationContext from "../../models/NavigationContext";
import { HicSource } from "./getRemoteData/hicSource";
import HiCTrack from "./HiCTrack";
import CategoricalTrack from "./CategoricalTrack";
import LongrangeTrack from "./LongrangeTrack";
import BigInteractTrack from "./BigInteractTrack";
import RepeatMaskerTrack from "./RepeatMaskerTrack";
import RefBedTrack from "./RefBedTrack";
import ThreedmolContainer from "../3dmol/ThreedmolContainer";
import TrackModel from "../../models/TrackModel";
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
  windowWidth: number;
  genomeArr: Array<any>;
}
const TrackManager: React.FC<TrackManagerProps> = memo(function TrackManager({
  genomeIdx,
  addTrack,
  startBp,
  windowWidth,
  genomeArr,
}) {
  //useRef to store data between states without re render the component
  const worker = useRef<Worker>();
  const infiniteScrollWorker = useRef<Worker>();
  const useFineModeNav = useRef(false);
  const trackManagerId = useRef("");
  const leftStartCoord = useRef(0);
  const rightStartCoord = useRef(0);
  const bpRegionSize = useRef(0);
  const block = useRef<HTMLInputElement>(null);
  const g3dRect = useRef<HTMLInputElement>(null);
  const bpX = useRef(0);
  const maxBp = useRef(0);
  const minBp = useRef(0);
  const prevSize = useRef<any>(0);
  const activeTrackModels = useRef<Array<TrackModel>>([]);
  const hicStrawObj = useRef<{ [key: string]: any }>({});
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const basePerPixel = useRef(0);
  const frameID = useRef(0);
  const lastX = useRef(0);
  const dragX = useRef(0);
  const isLoading = useRef(true);
  const lastDragX = useRef(0);
  const isThereG3dTrack = useRef(false);
  const side = useRef("right");
  const isDragging = useRef(false);
  const rightSectionSize = useRef<Array<any>>([windowWidth]);
  const leftSectionSize = useRef<Array<any>>([]);
  const boxSizeChange = useRef<boolean>(false);
  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
  const [trackBoxPosition, setTrackBoxPosition] = useState<Array<any> | null>(
    null
  );
  const [initialStart, setInitialStart] = useState("workerNotReady");
  const [windowRegion, setWindowRegion] = useState<DisplayedRegionModel>();
  const [show3dGene, setShow3dGene] = useState();
  const [trackComponents, setTrackComponents] = useState<Array<any>>([]);
  const [g3dtrackComponents, setG3dTrackComponents] = useState<Array<any>>([]);

  const [trackData, setTrackData] = useState<{ [key: string]: any }>({});
  const [dataIdx, setDataIdx] = useState(0);
  const [configMenu, setConfigMenu] = useState<any>();
  const [configMenuVisible, setConfigMenuVisible] = useState(false);
  const [curRegion, setCurRegion] = useState<ChromosomeInterval[]>();
  function sumArray(numbers) {
    let total = 0;
    for (let i = 0; i < numbers.length; i++) {
      total += numbers[i];
    }
    return total;
  }

  function handleMove(e) {
    if (!isDragging.current || isLoading.current) {
      return;
    }
    console.log(trackComponents);
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
  const handleClick = () => {
    addTrack({
      region: curRegion,
      trackType: "bigWig",
      genome: genomeArr[genomeIdx],
    });
  };
  function handleMouseDown(e: { pageX: number; preventDefault: () => void }) {
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
    let curX;

    const dragIdx = dragX.current / windowWidth;

    if (dragIdx > -1 && dragIdx < 1) {
      curX = Math.round(dragX.current! / windowWidth);
    } else if (dragX.current! > 1) {
      curX = Math.floor(dragX.current! / windowWidth);
    } else {
      curX = Math.ceil(dragX.current! / windowWidth);
    }

    setDataIdx(curX);
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
    setWindowRegion(
      new DisplayedRegionModel(
        genomeArr[genomeIdx].navContext,
        curBp,
        curBp + bpRegionSize.current
      )
    );
    bpX.current = curBp;
    //DONT MOVE THIS PART OR THERE WILL BE FLICKERS BECAUSE IT WILL NOT UPDATEA FAST ENOUGH
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
  function getLegendPosition() {
    const rects: Array<any> = [];
    const children = block.current!.children;
    console.log(children, trackComponents);
    Array.from(children).map((child) => {
      const rect = child.getBoundingClientRect();
      rects.push({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        pageY: rect.top + window.scrollY,
      });
    });

    setTrackBoxPosition([...rects]);
  }
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

        //________________________________________________________________________________________________________________

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
        setWindowRegion(curFetchRegionNav);
        //________________________________________________________________________________________________________________
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
          //_____________________________________________________________________________

          //___________________________________________________________________________________'

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

          //_____________________________________________________________________________

          //_____________________________________________________________________________
          minBp.current = minBp.current - bpRegionSize.current;
        }
      }

      let sentData = false;
      try {
        activeTrackModels.current.map((item, index) => {
          if (!sentData) {
            sentData = true;
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
          }
        });
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
  function handleDelete(id: number) {
    genomeArr[genomeIdx].defaultTracks = genomeArr[
      genomeIdx
    ].defaultTracks.filter((items, index) => {
      return index !== id;
    });

    setTrackComponents((prevTracks) => {
      return prevTracks.filter((items, index) => {
        return index !== id;
      });
    });
    boxSizeChange.current = true;
    setConfigMenuVisible(false);
  }
  function getConfigMenu(htmlElement: any) {
    setConfigMenuVisible(true);
    setConfigMenu(htmlElement);
  }
  function onCloseConfigMenu() {
    setConfigMenuVisible(false);
  }

  useEffect(() => {
    // terminate the work when the component is unmounted
    return () => {
      worker.current!.terminate();
      infiniteScrollWorker.current!.terminate();
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMouseUp);
      console.log("trackmanager terminate");
    };
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [trackComponents]);
  useEffect(() => {
    if (boxSizeChange.current) {
      getLegendPosition();
    }
    boxSizeChange.current = false;
  }, [trackComponents]);

  useEffect(() => {
    if (initialStart === "workerReady") {
      // go through genome defaultTrack to see what track components we need and give each component
      // a unique id so it remember data and allows us to manipulate the position in the trackComponent arr
      let genome = genomeArr[genomeIdx];

      let newTrackComponents: Array<any> = [];

      for (let i = 0; i < genome.defaultTracks.length; i++) {
        if (genome.defaultTracks[i].type !== "g3d") {
          const newPosRef = createRef();
          const newLegendRef = createRef();
          const uniqueKey = uuidv4();
          genome.defaultTracks[i]["id"] = uniqueKey;
          newTrackComponents.push({
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
        } else {
          isThereG3dTrack.current = true;
          let newG3dComponent: Array<any> = [];
          const uniqueKeyG3d = uuidv4();
          genome.defaultTracks[i]["id"] = uniqueKeyG3d;
          newG3dComponent.push({
            id: uniqueKeyG3d,
            component: ThreedmolContainer,

            trackModel: genome.defaultTracks[i],
          });
          setG3dTrackComponents([...newG3dComponent]);
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
        worker.current = new Worker(
          new URL("./getRemoteData/fetchDataWorker.ts", import.meta.url),
          {
            type: "module",
          }
        );
        infiniteScrollWorker.current = new Worker(
          new URL("./getRemoteData/fetchDataWorker.ts", import.meta.url),
          {
            type: "module",
          }
        );
        setInitialStart("workerReady");
      }
      trackManagerId.current = genome.id;
    }
  }, [genomeArr]);
  const containerStyles = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr", // Two equal columns
    gap: "10px", // Gap between grid items
    position: "relative", // Important for overlay
  };

  const boxStyles = {
    backgroundColor: "#0057e3",
    padding: "10px",
    borderRadius: "5px",
  };

  const overlayStyles = {
    backgroundColor: "#009938",
    padding: "10px",
    borderRadius: "5px",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1, // Ensure it's on top
  };
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          whiteSpace: "nowrap",

          alignItems: "center",
          margin: "auto",
        }}
      >
        <button onClick={handleClick}>add bed</button>

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
        <div style={{ display: "flex" }}>
          <div
            onMouseDown={handleMouseDown}
            style={{
              display: "flex",
              //makes components align right or right when we switch sides
              justifyContent: side.current == "right" ? "start" : "end",
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
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              {trackComponents.map((item, index) => {
                let Component = item.component;

                return (
                  <div
                    style={{
                      display: "grid",
                    }}
                  >
                    <div
                      key={item.id}
                      data-theme={"light"}
                      ref={trackComponents[index].posRef}
                      style={{
                        display: "flex",

                        WebkitBackfaceVisibility: "hidden",
                        WebkitPerspective: "1000px",
                        backfaceVisibility: "hidden",
                        perspective: "1000px",
                        gridArea: "1/1",
                      }}
                    >
                      <Component
                        key={item.id}
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
                        trackBoxPosition={trackBoxPosition}
                        getLegendPosition={getLegendPosition}
                        legendRef={item.legendRef}
                      />
                    </div>
                    <div
                      style={{
                        position: "relative",
                        gridArea: "1/1",
                      }}
                      ref={item.legendRef}
                    ></div>
                  </div>
                );
              })}
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
      </div>
      {configMenuVisible ? configMenu : ""}
    </>
  );
});
export default memo(TrackManager);
