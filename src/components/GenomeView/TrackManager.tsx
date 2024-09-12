import { memo, useEffect, useRef, useState } from "react";

const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;
import RefGeneTrack from "./RefGeneTrack";
import BedTrack from "./BedTrack";
import BedDensityTrack from "./BedDensityTrack";
import BigWigTrack from "./BigWigTrack";
import DynseqTrack from "./DynseqTrack";
import MethylcTrack from "./MethylcTrack";
import HiCTrack from "./HiCTrack";
import GenomeAlign from "./GenomeAlign/GenomeAlign";
import CircularProgress from "@mui/material/CircularProgress";
import { ViewExpansion } from "../../models/RegionExpander";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import OpenInterval from "../../models/OpenInterval";

import { v4 as uuidv4 } from "uuid";
import Worker from "web-worker";
import { TrackProps } from "../../models/trackModels/trackProps";
import { FeatureSegment } from "../../models/FeatureSegment";
import ChromosomeInterval from "../../models/ChromosomeInterval";
import { drag } from "d3";

const genomeAlignWorker = new Worker(
  new URL("./GenomeAlign/genomeAlignWorker.ts", import.meta.url),
  {
    type: "module",
  }
);

const componentMap: { [key: string]: React.FC<TrackProps> } = {
  refGene: RefGeneTrack,
  gencodeV39: RefGeneTrack,
  bed: BedTrack,
  bedDensity: BedDensityTrack,
  bigWig: BigWigTrack,
  dynseq: DynseqTrack,
  methylc: MethylcTrack,
  hic: HiCTrack,
  genomealign: GenomeAlign,
};

interface TrackManagerProps {
  genomeIdx: number;
  addTrack: (track: any) => void;
  startBp: (bp: string) => void;
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
  const trackManagerId = useRef("");
  const leftStartCoord = useRef(0);
  const rightStartCoord = useRef(0);
  const bpRegionSize = useRef(0);
  const block = useRef<HTMLInputElement>(null);
  const curVisData = useRef<{ [key: string]: any }>({
    visWidth: windowWidth * 3,
    visRegion: new DisplayedRegionModel(
      genomeArr[genomeIdx].navContext,
      0 - bpRegionSize.current,
      0 + bpRegionSize.current * 2
    ),
    viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
    viewWindowRegion: new DisplayedRegionModel(
      genomeArr[genomeIdx].navContext,
      0,
      0 + bpRegionSize.current
    ),
  });
  const viewRegion = useRef<ChromosomeInterval[]>();
  const bpX = useRef(0);
  const maxBp = useRef(0);
  const minBp = useRef(0);

  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const basePerPixel = useRef(0);
  const frameID = useRef(0);
  const lastX = useRef(0);
  const dragX = useRef(0);
  const isLoading = useRef(true);
  const lastDragX = useRef(0);
  const side = useRef("right");
  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
  const [initialStart, setInitialStart] = useState(true);
  const isDragging = useRef(false);
  const rightSectionSize = useRef<Array<any>>([windowWidth]);
  const leftSectionSize = useRef<Array<any>>([windowWidth]);
  const [trackComponents, setTrackComponents] = useState<Array<any>>([]);
  const [hicOption, setHicOption] = useState(1);
  const [trackData, setTrackData] = useState<{ [key: string]: any }>({});
  const [trackData2, setTrackData2] = useState<{ [key: string]: any }>({});
  const [dataIdx, setDataIdx] = useState(0);
  const [configMenu, setConfigMenu] = useState<any>();
  const [configMenuVisible, setConfigMenuVisible] = useState(false);
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
    frameID.current = requestAnimationFrame(() => {
      block.current!.style.transform = `translate3d(${dragX.current}px, 0px, 0)`;
    });
  }
  const handleClick = () => {
    addTrack({
      region: viewRegion.current,
      trackName: "bigWig",
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
      dragX.current > 0 ? (curX = -1) : (curX = 0);
    } else if (dragX.current! > 1) {
      curX = Math.ceil(dragX.current! / windowWidth);
    } else {
      curX = Math.floor(dragX.current! / windowWidth);
    }

    setDataIdx(curX);
    const curBp =
      leftStartCoord.current + -dragX.current * basePerPixel.current;
    //view genomic coord_________________________________________________
    let genomeFeatureSegment: Array<FeatureSegment> = genomeArr[
      genomeIdx
    ].navContext.getFeaturesInInterval(curBp, curBp + bpRegionSize.current);

    let genomeCoordLocus = genomeFeatureSegment.map((item, index) =>
      item.getLocus()
    );
    //view genomic coord_________________________________________________

    let expandedGenomeFeatureSegment: Array<FeatureSegment> = genomeArr[
      genomeIdx
    ].navContext.getFeaturesInInterval(
      curBp - bpRegionSize.current,
      curBp + bpRegionSize.current * 2
    );

    let expandedGenomeCoordLocus = expandedGenomeFeatureSegment.map(
      (item, index) => item.getLocus()
    );

    viewRegion.current = genomeCoordLocus;
    startBp(viewRegion.current.toString());
    bpX.current = curBp;
    //DONT MOVE THIS PART OR THERE WILL BE FLICKERS BECAUSE IT WILL NOT UPDATEA FAST ENOUGH
    if (dragX.current > 0 && side.current === "right") {
      side.current = "left";
    } else if (dragX.current <= 0 && side.current === "left") {
      side.current = "right";
    }
    if (hicOption === 1 && dragX.current <= 0 && !isLoading.current) {
      // isLoading.current = true;
      fetchGenomeData(2, "right", genomeCoordLocus, expandedGenomeCoordLocus);
    } else if (hicOption === 1 && dragX.current > 0 && !isLoading.current) {
      // isLoading.current = true;
      fetchGenomeData(2, "left", genomeCoordLocus, expandedGenomeCoordLocus);
    }

    if (
      -dragX.current >= sumArray(rightSectionSize.current) &&
      dragX.current < 0
    ) {
      isLoading.current = true;

      rightSectionSize.current.push(windowWidth);
      console.log("trigger right");
      fetchGenomeData(0, "right", genomeCoordLocus, expandedGenomeCoordLocus);
    } else if (
      dragX.current >= sumArray(leftSectionSize.current) &&
      dragX.current > 0
    ) {
      isLoading.current = true;
      console.log("trigger left");
      leftSectionSize.current.push(windowWidth);

      fetchGenomeData(0, "left", genomeCoordLocus, expandedGenomeCoordLocus);
    }
  }

  async function fetchGenomeData(
    initial: number = 0,
    trackSide,
    genomeCoordLocus: Array<ChromosomeInterval>,
    expandedGenomeCoordLocus?: Array<ChromosomeInterval>
  ) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.
    // if (initial === 2 || initial === 1) {
    //   let tmpData2 = {};
    //   let sentData = false;

    //   genomeArr[genomeIdx].defaultTracks.map((item, index) => {
    //     if (!sentData) {
    //       sentData = true;
    //       worker.current!.postMessage({
    //         trackModelArr: genomeArr[genomeIdx].defaultTracks.filter(
    //           (items, index) => {
    //             return items.name === "genomealign" || items.name === "hic";
    //           }
    //         ),

    //         loci:
    //           basePerPixel.current < 10
    //             ? expandedGenomeCoordLocus
    //             : genomeCoordLocus,
    //         expandedLoci: expandedGenomeCoordLocus,
    //         trackSide,
    //         location: `${bpX.current}:${bpX.current + bpRegionSize.current}`,
    //         xDist: dragX.current,
    //         initial,
    //         basePerPixel: basePerPixel.current,
    //         regionLength:
    //           bpX.current +
    //           bpRegionSize.current * 2 -
    //           (bpX.current - bpRegionSize.current),
    //         bpX: bpX.current,
    //       });
    //     }
    //   });
    //   worker.current!.onmessage = (event) => {
    //     event.data.fetchResults.map((item, index) => {
    //       tmpData2[item.id] = {
    //         fetchData: item.result,
    //         trackType: item.name,
    //       };

    //       if (item.name === "genomealign") {
    //         let newVisData: ViewExpansion = {
    //           visWidth: windowWidth * 3,
    //           visRegion: new DisplayedRegionModel(
    //             genomeArr[genomeIdx].navContext,
    //             event.data.bpX - bpRegionSize.current,
    //             event.data.bpX + bpRegionSize.current * 2
    //           ),
    //           viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
    //           viewWindowRegion: new DisplayedRegionModel(
    //             genomeArr[genomeIdx].navContext,
    //             event.data.bpX,
    //             event.data.bpX + bpRegionSize.current
    //           ),
    //         };
    //         console.log(item.result);
    //         let newWorkerData = {
    //           genomeName: item.genomeName,
    //           viewMode: " ",
    //           querygenomeName: item.querygenomeName,
    //           result: item.result,
    //           loci: expandedGenomeCoordLocus,
    //           xDist: event.data.xDist,
    //           visData: newVisData,
    //           defaultTracks: genomeArr![genomeIdx!].defaultTracks.filter(
    //             (track) => track.id === item.id
    //           ),
    //           trackSide: event.data.side,

    //           id: item.id,
    //           location: event.data.location,
    //         };

    //         genomeAlignWorker.postMessage(newWorkerData);

    //         genomeAlignWorker.onmessage = (event) => {
    //           tmpData2 = { ...tmpData2, ...event.data };
    //           console.log(tmpData2);
    //           setTrackData2({ ...tmpData2 });
    //         };

    //         //-------------------------------------------------------------------------------------------------------------------------------------------------------
    //       }
    //     });
    //   };
    // }
    console.log(genomeArr![genomeIdx!]);
    if (initial === 0 || initial === 1) {
      let curRegionCoord;
      let tempObj = {};
      let sectionGenomicLocus: Array<ChromosomeInterval> = [];

      let initialGenomicLoci: Array<any> = [];
      let initialNavLoci: Array<any> = [];
      if (initial === 1) {
        initialNavLoci.push({
          start: minBp.current - bpRegionSize.current,
          end: minBp.current,
        });
        initialNavLoci.push({
          start: maxBp.current - bpRegionSize.current,
          end: maxBp.current,
        });
        initialNavLoci.push({
          start: maxBp.current,
          end: maxBp.current + bpRegionSize.current,
        });
        let genomeFeatureSegment: Array<FeatureSegment> = genomeArr[
          genomeIdx
        ].navContext.getFeaturesInInterval(
          minBp.current - bpRegionSize.current,
          minBp.current
        );

        initialGenomicLoci.push(
          genomeFeatureSegment.map((item, index) => item.getLocus())
        );

        let genomeFeatureSegment2: Array<FeatureSegment> = genomeArr[
          genomeIdx
        ].navContext.getFeaturesInInterval(
          maxBp.current - bpRegionSize.current,
          maxBp.current
        );

        initialGenomicLoci.push(
          genomeFeatureSegment2.map((item, index) => item.getLocus())
        );

        let genomeFeatureSegment3: Array<FeatureSegment> = genomeArr[
          genomeIdx
        ].navContext.getFeaturesInInterval(
          maxBp.current,
          maxBp.current + bpRegionSize.current
        );

        initialGenomicLoci.push(
          genomeFeatureSegment3.map((item, index) => item.getLocus())
        );
      }

      //_________________
      if (trackSide === "right") {
        curRegionCoord = new DisplayedRegionModel(
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

        sectionGenomicLocus = genomeFeatureSegment.map((item, index) =>
          item.getLocus()
        );

        //_____________________________________________________________________________
        const navStart = genomeArr[
          genomeIdx
        ].navContext.convertBaseToFeatureCoordinate(maxBp.current);
        tempObj["location"] = `${
          navStart.relativeStart - bpRegionSize.current
        }:${navStart.relativeStart}`;
        //___________________________________________________________________________________'

        maxBp.current = maxBp.current + bpRegionSize.current;
      } else {
        curRegionCoord = new DisplayedRegionModel(
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

        sectionGenomicLocus = genomeFeatureSegment.map((item, index) =>
          item.getLocus()
        );

        //_____________________________________________________________________________

        const navStart = genomeArr[
          genomeIdx
        ].navContext.convertBaseToFeatureCoordinate(minBp.current);

        tempObj["location"] = `${navStart.relativeStart}:${
          navStart.relativeStart + bpRegionSize.current
        }`;
        //_____________________________________________________________________________
        minBp.current = minBp.current - bpRegionSize.current;
      }
      if (initial === 1) {
        minBp.current = minBp.current - bpRegionSize.current;
        maxBp.current = maxBp.current + bpRegionSize.current;
      }

      let sentData = false;
      try {
        let newVisData: ViewExpansion = {
          visWidth: windowWidth * 3,
          visRegion: new DisplayedRegionModel(
            genomeArr[genomeIdx].navContext,
            bpX.current - bpRegionSize.current,
            bpX.current + bpRegionSize.current * 2
          ),
          viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
          viewWindowRegion: new DisplayedRegionModel(
            genomeArr[genomeIdx].navContext,
            bpX.current,
            bpX.current + bpRegionSize.current
          ),
        };

        genomeArr[genomeIdx].defaultTracks.map((item, index) => {
          if (!sentData) {
            sentData = true;
            infiniteScrollWorker.current!.postMessage({
              primaryGenName: genomeArr[genomeIdx].genome.getName(),
              trackModelArr: genomeArr[genomeIdx].defaultTracks,
              visData: newVisData,
              loci: sectionGenomicLocus,
              expandedLoci: expandedGenomeCoordLocus,
              initialGenomicLoci,
              initialNavLoci,
              trackSide,
              location: tempObj["location"],
              curRegionCoord,
              xDist: dragX.current,
              initial,
            });

            if (initial === 1) {
              //this is why things get missalign if we make a worker in a state, its delayed so it doesn't subtract the initially
              minBp.current = minBp.current - bpRegionSize.current;
            }
          }
        });
      } catch {}
      infiniteScrollWorker.current!.onmessage = (event) => {
        event.data.fetchResults.map(
          (item, index) => (tempObj[item.id] = item.result)
        );

        tempObj["regionNavCoord"] = new DisplayedRegionModel(
          genomeArr[genomeIdx].navContext,
          event.data.curRegionCoord._startBase,
          event.data.curRegionCoord._endBase
        );
        tempObj["initial"] = event.data.initial;
        tempObj["side"] = event.data.side;
        tempObj["location"] = event.data.location;
        tempObj["xDist"] = event.data.xDist;
        tempObj["trackState"] = {
          initial: event.data.initial,
          side: event.data.side,
          xDist: event.data.xDist,
          regionNavCoord: new DisplayedRegionModel(
            genomeArr[genomeIdx].navContext,
            event.data.curRegionCoord._startBase,
            event.data.curRegionCoord._endBase
          ),
        };
        setTrackData({ ...tempObj });
        isLoading.current = false;
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
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleMouseUp);

    // terminate the work when the component is unmounted
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMouseUp);
      worker.current!.terminate();
      infiniteScrollWorker.current!.terminate();
      console.log("trackmanager terminate");
    };
  }, []);

  useEffect(() => {
    if (!initialStart) {
      // go through genome defaultTrack to see what track components we need and give each component
      // a unique id so it remember data and allows us to manipulate the position in the trackComponent arr
      let genome = genomeArr[genomeIdx];

      let newTrackComponents: Array<any> = [];
      for (let i = 0; i < genome.defaultTracks.length; i++) {
        if (!genome.defaultTracks[i]["id"]) {
          const uniqueKey = uuidv4();
          genome.defaultTracks[i]["id"] = uniqueKey;
          newTrackComponents.push({
            id: uniqueKey,
            component:
              genome.defaultTracks[i].name in componentMap
                ? componentMap[genome.defaultTracks[i].name]
                : componentMap[genome.defaultTracks[i].filetype],
            trackModel: genome.defaultTracks[i],
          });
        } else {
          newTrackComponents.push({
            id: genome.defaultTracks[i]["id"],
            component:
              genome.defaultTracks[i].name in componentMap
                ? componentMap[genome.defaultTracks[i].name]
                : componentMap[genome.defaultTracks[i].filetype],
            trackModel: genome.defaultTracks[i],
          });
        }
      }

      let expandedGenomeFeatureSegment: Array<FeatureSegment> = genomeArr[
        genomeIdx
      ].navContext.getFeaturesInInterval(
        bpX.current - bpRegionSize.current,
        bpX.current + bpRegionSize.current * 2
      );

      let expandedGenomeCoordLocus = expandedGenomeFeatureSegment.map(
        (item, index) => item.getLocus()
      );
      setTrackComponents([...newTrackComponents]);
      fetchGenomeData(
        1,
        "right",
        viewRegion.current!,
        expandedGenomeCoordLocus
      );
    }
  }, [initialStart]);
  useEffect(() => {
    if (trackManagerId.current === "") {
      // on initial and when our genome data changes we set the default values here

      let genome = genomeArr[genomeIdx];
      console.log(genome);
      leftStartCoord.current = genome.defaultRegion.start;
      rightStartCoord.current = genome.defaultRegion.end;

      bpRegionSize.current = rightStartCoord.current - leftStartCoord.current;
      basePerPixel.current = bpRegionSize.current / windowWidth;
      let genomeFeatureSegment: Array<FeatureSegment> =
        genome.navContext.getFeaturesInInterval(
          leftStartCoord.current,
          rightStartCoord.current
        );

      let genomeLocus = genomeFeatureSegment.map((item, index) =>
        item.getLocus()
      );

      viewRegion.current = genomeLocus;
      bpX.current = leftStartCoord.current;
      maxBp.current = genome.defaultRegion.end;
      minBp.current = genome.defaultRegion.start;

      // create the worker and trigger state change before we can actually use them takes one re render to acutally
      // start working.Thats why we need the initialStart state.
      if (initialStart) {
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
        setInitialStart(false);
      }
      trackManagerId.current = genome.id;
    }
  }, [genomeArr]);

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

        <div> {viewRegion.current?.toString()}</div>

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

        <div
          style={{
            display: "flex",
            //makes components align right or right when we switch sides
            justifyContent: side.current == "right" ? "start" : "end",

            flexDirection: "row",
            // full windowwidth will make canvas only loop 0-windowidth
            // the last value will have no data.
            // so we have to subtract from the size of the canvas
            width: `${windowWidth - 1}px`,
            backgroundColor: "gainsboro",
            height: "2000px",
            overflowX: "hidden",
            overflowY: "visible",
          }}
        >
          <div
            data-theme={"light"}
            ref={block}
            onMouseDown={handleMouseDown}
            style={{
              display: "flex",
              flexDirection: "column",
              //makes components align right or right when we switch sides
              alignItems: side.current == "right" ? "start" : "end",
              WebkitBackfaceVisibility: "hidden",
              WebkitPerspective: "1000px", // Note: Add 'px' to the value
              backfaceVisibility: "hidden",
              perspective: "1000px", // Note: Add 'px' to the value
            }}
          >
            {trackComponents.map((item, index) => {
              let Component = item.component;
              return (
                <Component
                  //infinitescroll type track data
                  key={item.id}
                  id={item.id}
                  trackModel={item.trackModel}
                  bpRegionSize={bpRegionSize.current}
                  trackComponents={trackComponents}
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
                  // movement type track data
                  trackData2={trackData2}
                  trackIdx={index}
                  visData={curVisData.current}
                />
              );
            })}
          </div>
        </div>
      </div>
      {configMenuVisible ? configMenu : ""}
    </>
  );
});
export default memo(TrackManager);
