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
import { size } from "lodash";

// use class to create an instance of hic fetch and sent it to track manager in genome root
const componentMap: { [key: string]: React.FC<TrackProps> } = {
  refGene: RefGeneTrack,
  bed: BedTrack,
  bedDensity: BedDensityTrack,
  bigWig: BigWigTrack,
  dynseq: DynseqTrack,
  methylc: MethylcTrack,
  hic: HiCTrack,
  genomealign: GenomeAlign,

  // Add more components as needed
};

//add logic to change diferernt fetch for difererrnt file types
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
  const region = useRef("");

  const worker = useRef<Worker>();
  const infiniteScrollWorker = useRef<Worker>();
  const trackManagerId = useRef("");
  const leftStartCoord = useRef(0);
  const rightStartCoord = useRef(0);
  const bpRegionSize = useRef(0);
  const block = useRef<HTMLInputElement>(null);
  const curVisData = useRef<{ [key: string]: any }>({});
  const viewRegion = useRef<ChromosomeInterval[]>();
  // const chrIndexRight = useRef(0);
  // const chrIndexLeft = useRef(0);
  // const initialChrIdx = useRef(0);
  const bpX = useRef(0);
  const maxBp = useRef(0);
  const minBp = useRef(0);

  // const chrData = useRef<Array<any>>([]);
  // const chrLength = useRef<Array<any>>([]);

  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const basePerPixel = useRef(0);
  const frameID = useRef(0);
  const lastX = useRef(0);
  const dragX = useRef(0);
  const isLoading = useRef(true);
  const lastDragX = useRef(0);
  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
  const [initialStart, setInitialStart] = useState(true);
  const [isDragging, setDragging] = useState(false);
  const [rightSectionSize, setRightSectionSize] = useState<Array<any>>([]);
  const [leftSectionSize, setLeftSectionSize] = useState<Array<any>>([]);
  const [trackComponents, setTrackComponents] = useState<Array<any>>([]);
  const [hicOption, setHicOption] = useState(1);
  const [trackData, setTrackData] = useState<{ [key: string]: any }>({});
  const [trackData2, setTrackData2] = useState<{ [key: string]: any }>({});
  const [side, setSide] = useState("right");

  function sumArray(numbers) {
    let total = 0;
    for (let i = 0; i < numbers.length; i++) {
      total += numbers[i];
    }
    return total;
  }

  function handleMove(e) {
    if (!isDragging) {
      return;
    }

    const deltaX = lastX.current - e.pageX;

    if (
      // (isLoading &&
      //   deltaX > 0 &&
      //   side === "right" &&
      //   -tmpDragX > (rightSectionSize.length - 1) * windowWidth) ||
      // (isLoading &&
      //   deltaX < 0 &&
      //   side === "left" &&
      //   tmpDragX > (leftSectionSize.length - 1) * windowWidth)
      isLoading.current
    ) {
      return;
    }
    lastX.current = e.pageX;

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
    setDragging(true);
    lastX.current = e.pageX;

    e.preventDefault();
  }
  function handleMouseUp() {
    setDragging(false);
    if (isLoading.current || lastDragX.current === dragX.current) {
      return;
    }
    lastDragX.current = dragX.current;
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
    console.log(expandedGenomeCoordLocus, expandedGenomeFeatureSegment);
    viewRegion.current = genomeCoordLocus;
    startBp(viewRegion.current.toString());
    bpX.current = curBp;
    //DONT MOVE THIS PART OR THERE WILL BE FLICKERS BECAUSE IT WILL NOT UPDATEA FAST ENOUGH
    if (dragX.current > 0 && side === "right") {
      setSide("left");
    } else if (dragX.current <= 0 && side === "left") {
      setSide("right");
    }
    if (hicOption === 1 && dragX.current <= 0) {
      // isLoading.current = true;
      fetchGenomeData(2, "right", genomeCoordLocus, expandedGenomeCoordLocus);
    } else {
      // isLoading.current = true;
      fetchGenomeData(2, "left", genomeCoordLocus, expandedGenomeCoordLocus);
    }

    if (
      // windowWidth needs to be changed to match the speed of the dragx else it has a differenace translate
      // for example if we set speed to 0.5 then need to mutiply windowith by 2
      -dragX.current >= sumArray(rightSectionSize) &&
      dragX.current < 0
    ) {
      isLoading.current = true;
      console.log("trigger right");
      setRightSectionSize((prevStrandInterval) => {
        const t = [...prevStrandInterval];
        t.push(windowWidth);
        return t;
      });

      fetchGenomeData(0, "right", genomeCoordLocus);
    } else if (
      //need to add windowwith when moving left is because when the size of track is 2x it misalign the track because its already halfway
      //so we need to add to keep the position correct.
      dragX.current >= sumArray(leftSectionSize) &&
      dragX.current > 0
    ) {
      isLoading.current = true;
      console.log("trigger left");
      setLeftSectionSize((prevStrandInterval) => {
        const t = [...prevStrandInterval];
        t.push(windowWidth);
        return t;
      });

      fetchGenomeData(0, "left", genomeCoordLocus);
    }
  }

  //______________________________________________________
  //TO-DO IMPORTANT: fix return mutiple arrays after fetching data.
  // should sent around of mutiple chr regions, but all the chr region gene datas should return in one array.
  // step 1 first, find the mutiple coord regions and add them to array. Need to convert from nav Coord to genomic coord, each index value will the coord of each
  // chr region adn their genomic interval
  //step 2 in the worker sent the region array to the fetch functions,
  // step 3 map and fetch each region from the array, returns flatten which means all the interval will be all in one array

  async function fetchGenomeData(
    initial: number = 0,
    trackSide,
    genomeCoordLocus: Array<ChromosomeInterval>,
    expandedGenomeCoordLocus?: Array<ChromosomeInterval>
  ) {
    console.log(bpX.current, genomeCoordLocus, expandedGenomeCoordLocus);

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
    curVisData.current = newVisData;
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.
    if (initial === 2 || initial === 1) {
      let tmpData2 = {};
      let sentData = false;

      genomeArr[genomeIdx].defaultTracks.map((item, index) => {
        if (!sentData) {
          sentData = true;
          worker.current!.postMessage({
            trackArray: genomeArr[genomeIdx].defaultTracks.filter(
              (items, index) => {
                return items.name === "genomealign" || items.name === "hic";
              }
            ),
            // TO DO?????????????need to sent loci as a array of all chr regions, after converting it from navcoord
            loci: genomeCoordLocus,
            expandedLoci: expandedGenomeCoordLocus,
            trackSide,
            location: `${bpX.current}:${bpX.current + bpRegionSize.current}`,
            xDist: dragX.current,
            initial,
            basePerPixel: basePerPixel.current,
            regionLength: curVisData.current.visRegion.getWidth(),
          });
          if (initial === 1) {
            worker.current!.onmessage = (event) => {
              event.data.fetchResults.map((item, index) => {
                tmpData2[item.nameResult] = {
                  fetchData: item.result,
                  trackType: item.name,
                };

                if (item.nameResult === "genomealignResult") {
                  tmpData2["genomeName"] = item.genomeName;
                  tmpData2["queryGenomeName"] = item.querygenomeName;
                }
              });
              tmpData2["location"] = event.data.location;
              tmpData2["xDist"] = event.data.xDist;
              tmpData2["side"] = event.data.side;

              setTrackData2({ ...tmpData2 });
            };
          }
        }
      });
    }

    if (initial === 0 || initial === 1) {
      let curRegionCoord;
      let tempObj = {};
      let sectionGenomicLocus: Array<ChromosomeInterval> = [];
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
        console.log(sectionGenomicLocus, "left");

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

      let sentData = false;
      try {
        genomeArr[genomeIdx].defaultTracks.map((item, index) => {
          if (!sentData) {
            sentData = true;
            infiniteScrollWorker.current!.postMessage({
              trackArray: genomeArr[genomeIdx].defaultTracks.filter(
                (items, index) => {
                  return items.name !== "genomealign" && items.name !== "hic";
                }
              ),

              loci: sectionGenomicLocus,
              trackSide,
              location: tempObj["location"],
              curRegionCoord,
              xDist: dragX.current,
              initial,
            });

            if (initial === 1) {
              infiniteScrollWorker.current!.onmessage = (event) => {
                event.data.fetchResults.map(
                  (item, index) => (tempObj[item.name] = item.result)
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

                setTrackData({ ...tempObj });
                isLoading.current = false;
              };
              //this is why things get missalign if we make a worker in a state, its delayed so it doesn't subtract the initially
              minBp.current = minBp.current - bpRegionSize.current;
            }
          }
        });
      } catch {}
    }

    console.log(maxBp.current, minBp.current);
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
  }

  useEffect(() => {
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    // terminate the work when the component is unmounted
    return () => {
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
            component: componentMap[genome.defaultTracks[i].name],
            trackModel: genome.defaultTracks[i],
          });
        } else {
          newTrackComponents.push({
            id: genome.defaultTracks[i]["id"],
            component: componentMap[genome.defaultTracks[i].name],
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
      console.log(genomeArr);
      // on initial and when our genome data changes we set the default values here

      let genome = genomeArr[genomeIdx];

      // [region.current, coord.current] = genome.defaultRegion.split(":");

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
      console.log(genomeLocus);

      //-------------------------------------------------------------------------------------------------------------------
      // let allChrData = genome.chromosomes;

      // for (const chromosome of genome.chrOrder) {
      //   if (allChrData[chromosome] !== undefined) {
      //     chrData.current.push(chromosome);
      //     chrLength.current.push(allChrData[chromosome]);
      //   }
      // }
      // console.log(genome.chrOrder, chrData.current, chrLength.current);
      // initialChrIdx.current = chrData.current.indexOf(region.current);

      // chrIndexRight.current = initialChrIdx.current;
      // chrIndexLeft.current = initialChrIdx.current;
      //-------------------------------------------------------------------------------------------------------------------

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
          //not using flex allows us to keep the position of the track
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
            justifyContent: side == "right" ? "start" : "end",

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
              alignItems: side == "right" ? "start" : "end",
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
                  side={side}
                  windowWidth={windowWidth}
                  dragXDist={dragX.current}
                  handleDelete={handleDelete}
                  genomeArr={genomeArr}
                  genomeIdx={genomeIdx}
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
    </>
  );
});
export default memo(TrackManager);
