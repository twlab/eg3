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
import HG38 from "../../models/genomes/hg38/hg38";
import OpenInterval from "../../models/OpenInterval";

import { v4 as uuidv4 } from "uuid";
import Worker from "web-worker";
import { TrackProps } from "../../models/trackModels/trackProps";

const worker = new Worker(
  new URL("./getRemoteData/tabixSourceWorker.ts", import.meta.url),
  {
    type: "module",
  }
);
const infiniteScrollWorker = new Worker(
  new URL("./getRemoteData/tabixSourceWorker.ts", import.meta.url),
  {
    type: "module",
  }
);

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
  const coord = useRef("");
  const leftStartCoord = useRef(0);
  const rightStartCoord = useRef(0);
  const bpRegionSize = useRef(0);
  const block = useRef<HTMLInputElement>(null);
  const curVisData = useRef<{ [key: string]: any }>({});
  const viewRegion = useRef("");
  const chrIndexRight = useRef(0);
  const chrIndexLeft = useRef(0);
  const initialChrIdx = useRef(0);
  const bpX = useRef(0);
  const maxBp = useRef(0);
  const minBp = useRef(0);
  const initialStart = useRef(true);
  const chrData = useRef<Array<any>>([]);
  const chrLength = useRef<Array<any>>([]);

  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const bpToPx = useRef(0);
  const frameID = useRef(0);
  const lastX = useRef(0);
  const dragX = useRef(0);
  const isLoading = useRef(true);

  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
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
    if (isLoading.current) {
      return;
    }
    // This is to track viewRegion everytime a user moves.
    // We have similar logic in the fetch for getting data but it does not have the current view bp region.
    // so we need to have both.
    let curIdx = initialChrIdx.current;
    console.log(curIdx);
    let curStartBp = leftStartCoord.current + -dragX.current * bpToPx.current;
    const curBp = leftStartCoord.current + -dragX.current * bpToPx.current;
    if (side === "right" && curBp >= chrLength.current[curIdx]) {
      while (curStartBp > chrLength.current[curIdx]) {
        curStartBp -= chrLength.current[curIdx];
        curIdx += 1;
      }
    } else if (side === "left" && curBp < 0) {
      curIdx--;
      while (curStartBp < -chrLength.current[curIdx]) {
        curStartBp += chrLength.current[curIdx];
        curIdx -= 1;
      }
      curStartBp = chrLength.current[curIdx] + curStartBp;
    }
    let curRegion =
      chrData.current[curIdx] +
      ":" +
      String(curStartBp) +
      "-" +
      String(curStartBp + bpRegionSize.current);
    console.log(curRegion);
    viewRegion.current = curRegion;
    startBp(curRegion);
    bpX.current = curBp;
    //DONT MOVE THIS PART OR THERE WILL BE FLICKERS BECAUSE IT WILL NOT UPDATEA FAST ENOUGH
    if (dragX.current > 0 && side === "right") {
      setSide("left");
    } else if (dragX.current <= 0 && side === "left") {
      setSide("right");
    }
    if (hicOption === 1 && dragX.current <= 0) {
      // isLoading.current = true;
      fetchGenomeData(2, "right");
    } else {
      // isLoading.current = true;
      fetchGenomeData(2, "left");
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

      fetchGenomeData(0, "right");
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

      fetchGenomeData(0, "left");
    }
  }
  function checkMultiChrRight(tempObj: any) {
    let tmpRegion: Array<any> = [];
    if (maxBp.current > chrLength.current[chrIndexRight.current]) {
      let totalEndBp = Number(chrLength.current[chrIndexRight.current]);
      let startBp = maxBp.current - bpRegionSize.current;
      let tmpChrIdx = chrIndexRight.current;

      tmpRegion.push(
        `${chrData.current[chrIndexRight.current]}` +
          ":" +
          `${startBp}` +
          "-" +
          `${chrLength.current[chrIndexRight.current]}` +
          "|" +
          `${startBp}` +
          "-" +
          `${chrLength.current[chrIndexRight.current]}`
      );
      tmpChrIdx += 1;
      let chrEnd = 0;

      while (maxBp.current > totalEndBp) {
        let chrStart = 0;

        if (chrLength.current[tmpChrIdx] + totalEndBp < maxBp.current) {
          // here we check if maxBp overflows into the next chr region. we do not set any value
          // this is to determine if maxBp stop in the curr region or continues to overflow into the next chr..
          chrEnd = chrLength.current[tmpChrIdx];
        } else {
          // maxBp.current is the end distance the size of the view region measured in bp moved
          // totalEndBp is how many chromosome length maxBp is greater than
          // subtracting the two will give us the starting point in the next chromosome in the next fetch or
          // the size of the next chr length if the end region of maxBp.current is still greater.
          chrEnd = maxBp.current - totalEndBp;
        }

        tmpRegion.push(
          // if maxBp is not greater than the curr chr length then we take the cur chr length
          // the start total bp coord is the totalEndBp which is all the fully chr length that maxBp is greater than
          // the end is the totalEndBp added by chrEnd. chrEnd is the remainder that maxBp overflows into the next chr region because it is not greater than that region length

          `${chrData.current[tmpChrIdx]}` +
            ":" +
            `${chrStart + totalEndBp}` +
            "-" +
            `${totalEndBp + chrEnd}` +
            "|" +
            // if maxBp is greater still than the curr chr length we just add the entire chr length
            `${0}` +
            "-" +
            `${chrEnd}`
        );
        totalEndBp += chrEnd;

        tmpChrIdx += 1;
      }
      chrIndexRight.current = tmpChrIdx - 1;

      // Location is used to property align svg and coordinates. we set the overflow coordinates to the overflow region
      // in order to correctly place all the genes in multiple chromosomes
      // then we set maxBp.current to the next new region we will fetch next time
      tempObj["location"] = `${maxBp.current - bpRegionSize.current}:${
        maxBp.current
      }`;
      //maxBp.current will now be based on the new chromosome region
      maxBp.current = chrEnd + bpRegionSize.current;
    } else {
      tmpRegion.push(
        `${chrData.current[chrIndexRight.current]}` +
          ":" +
          `${maxBp.current - bpRegionSize.current}` +
          "-" +
          `${maxBp.current}` +
          "|" +
          +`${maxBp.current - bpRegionSize.current}` +
          "-" +
          `${maxBp.current}`
      );
      // if location is undefined that means view does not contain multiple chromosome
      tempObj["location"] = `${maxBp.current - bpRegionSize.current}:${
        maxBp.current
      }`;
      maxBp.current = maxBp.current + bpRegionSize.current;
    }

    return tmpRegion;
  }

  function checkMultiChrLeft(tempObj: any) {
    let tmpRegion: Array<any> = [];
    if (minBp.current < 0) {
      let totalEndBp = 0;
      let endBp = minBp.current + bpRegionSize.current;
      let tmpChrIdx = chrIndexLeft.current - 1;
      tmpRegion.push(
        `${chrData.current[chrIndexLeft.current]}` +
          ":" +
          `${0}` +
          "-" +
          `${endBp}` +
          "|" +
          `${0}` +
          "-" +
          `${endBp}`
      );

      let chrEnd = 0;

      while (minBp.current < totalEndBp) {
        if (minBp.current < totalEndBp - chrLength.current[tmpChrIdx]) {
          chrEnd = chrLength.current[tmpChrIdx];
        } else {
          chrEnd =
            -(totalEndBp - chrLength.current[tmpChrIdx]) - -minBp.current;
        }
        tmpRegion.push(
          `${chrData.current[tmpChrIdx]}` +
            ":" +
            `${-totalEndBp}` +
            "-" +
            `${
              (chrEnd === chrLength.current[tmpChrIdx]
                ? chrLength.current[tmpChrIdx]
                : chrLength.current[tmpChrIdx] - chrEnd) + -totalEndBp
            }` +
            "|" +
            `${
              chrLength.current[tmpChrIdx] -
              (chrLength.current[tmpChrIdx] - chrEnd)
            }` +
            "-" +
            `${chrLength.current[tmpChrIdx]}`
        );
        totalEndBp -= chrLength.current[tmpChrIdx];

        tmpChrIdx -= 1;
      }

      chrIndexLeft.current = tmpChrIdx + 1;
      tempObj["location"] = `${minBp.current}:${
        minBp.current + bpRegionSize.current
      }`;
      minBp.current = chrEnd - bpRegionSize.current;
    } else {
      tmpRegion.push(
        `${chrData.current[chrIndexLeft.current]}` +
          ":" +
          `${minBp.current}` +
          "-" +
          `${minBp.current + bpRegionSize.current}` +
          "|" +
          +`${minBp.current}` +
          "-" +
          `${minBp.current + bpRegionSize.current}`
      );
      tempObj["location"] = `${minBp.current}:${
        minBp.current + bpRegionSize.current
      }`;
      minBp.current = minBp.current - bpRegionSize.current;
    }

    return tmpRegion;
  }
  //______________________________________________________
  //TO-DO IMPORTANT: fix return mutiple arrays after fetching data.
  // should sent around of mutiple chr regions, but all the chr region gene datas should return in one array.
  // step 1 first, find the mutiple coord regions and add them to array. Need to convert from nav Coord to genomic coord, each index value will the coord of each
  // chr region adn their genomic interval
  //step 2 in the worker sent the region array to the fetch functions,
  // step 3 map and fetch each region from the array, returns flatten which means all the interval will be all in one array

  async function fetchGenomeData(initial: number = 0, trackSide) {
    console.log(
      region,
      coord,
      leftStartCoord,
      rightStartCoord,
      bpRegionSize,

      bpToPx,

      curVisData,
      viewRegion,
      chrIndexRight,
      chrIndexLeft,
      initialChrIdx,
      bpX,
      maxBp,
      minBp,
      initialStart,

      chrData,
      chrLength
    );

    let navContextCoord = HG38.navContext.parse(
      `${region.current}` +
        ":" +
        `${Math.floor(Number(bpX.current))}` +
        "-" +
        `${Math.floor(Number(bpX.current + bpRegionSize.current))}`
    );
    console.log(
      navContextCoord,
      `${region.current}` +
        ":" +
        `${Math.floor(Number(bpX.current))}` +
        "-" +
        `${Math.ceil(Number(bpX.current + bpRegionSize.current))}`,
      curVisData.current
    );
    console.log(
      Math.ceil(Number(bpX.current + bpRegionSize.current)) -
        Math.floor(Number(bpX.current)),
      navContextCoord.end - navContextCoord.start
    );
    let newVisData: ViewExpansion = {
      visWidth: windowWidth * 3,
      visRegion: new DisplayedRegionModel(
        HG38.navContext,
        navContextCoord.start - (navContextCoord.end - navContextCoord.start),
        navContextCoord.end + (navContextCoord.end - navContextCoord.start)
      ),
      viewWindow: new OpenInterval(windowWidth, windowWidth * 2),
      viewWindowRegion: new DisplayedRegionModel(
        HG38.navContext,
        navContextCoord.start,
        navContextCoord.end
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
          worker.postMessage({
            trackArray: genomeArr[genomeIdx].defaultTracks.filter(
              (items, index) => {
                return items.name === "genomealign" || items.name === "hic";
              }
            ),
            // TO DO?????????????need to sent loci as a array of all chr regions, after converting it from navcoord
            loci: {
              chr: region.current,
              start:
                bpToPx.current <= 10
                  ? Number(bpX.current) - bpRegionSize.current
                  : Number(bpX.current),
              end:
                bpToPx.current <= 10
                  ? Number(bpX.current + bpRegionSize.current) +
                    bpRegionSize.current
                  : bpX.current + bpRegionSize.current,
            },
            trackSide,
            location: `${bpX.current}:${bpX.current + bpRegionSize.current}`,
            xDist: dragX.current,
            initial,
          });
          if (initial === 1) {
            worker.onmessage = (event) => {
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
              console.log(tmpData2);
              setTrackData2({ ...tmpData2 });
            };
          }
        }
      });
    }

    if (initial === 0 || initial === 1) {
      let tempObj = {};

      let tmpRegion: Array<any> = [];
      if (trackSide === "right") {
        tmpRegion = checkMultiChrRight(tempObj);
      } else {
        tmpRegion = checkMultiChrLeft(tempObj);
      }
      console.log(tempObj);
      for (let i = 0; i < tmpRegion.length; i++) {
        let sectionRegion = tmpRegion[i];

        const [curChrName, bpCoord] = sectionRegion.split(":");
        const [totalBp, sectionBp] = bpCoord.split("|");

        const [startRegion, endRegion] = totalBp.split("-");
        const [sectionStart, sectionEnd] = sectionBp.split("-");
        let sentData = false;
        try {
          console.log(genomeArr[genomeIdx].defaultTracks);
          genomeArr[genomeIdx].defaultTracks.map((item, index) => {
            if (!sentData) {
              sentData = true;
              infiniteScrollWorker.postMessage({
                trackArray: genomeArr[genomeIdx].defaultTracks.filter(
                  (items, index) => {
                    return items.name !== "genomealign" && items.name !== "hic";
                  }
                ),

                loci: {
                  chr: curChrName,
                  start: Number(sectionStart),
                  end: Number(sectionEnd),
                },
                trackSide,
                location: tempObj["location"],
                xDist: dragX.current,
                initial,
              });
              if (initial === 1) {
                infiniteScrollWorker.onmessage = (event) => {
                  event.data.fetchResults.map(
                    (item, index) => (tempObj[item.name] = item.result)
                  );

                  tempObj["initial"] = event.data.initial;
                  tempObj["side"] = event.data.side;
                  tempObj["location"] = event.data.location;
                  console.log(minBp.current);
                  console.log(tempObj);
                  setTrackData({ ...tempObj });
                  isLoading.current = false;
                };
                minBp.current = minBp.current - bpRegionSize.current;
              }
            }
          });

          //_______________________________________________________________________________________________________________
          // let fetchRespond = await Promise.all(
          //   genome.defaultTracks.map(async (item) => {
          //     const trackName = item.name;
          //     if (trackName === "hic" || trackName === "genomealign") {
          //       return;
          //     } else if (trackName === "refGene") {
          //       let result = await trackFetchFunction[trackName]({
          //         name: genome.name,
          //         chr: curChrName,
          //         start: sectionStart,
          //         end: sectionEnd,
          //       });
          //       return {
          //         trackData: result,
          //         trackName: trackName,
          //       };
          //     } else {
          //       let result = await trackFetchFunction[trackName]({
          //         url: item.url,
          //         chr: curChrName,
          //         start: Number(sectionStart),
          //         end: Number(sectionEnd),
          //       });
          //       return {
          //         trackData: result,
          //         trackName: trackName,
          //       };
          //     }
          //   })
          // );

          // for (let j = 0; j < fetchRespond.length; j++) {
          //   let trackName = fetchRespond[j].trackName;
          //   if (tempObj[trackName] === undefined) {
          //     tempObj[trackName] = new Array<any>();
          //   }
          //   if (i !== 0) {
          //     if (trackName === "refGene") {
          //       for (let z = 0; z < fetchRespond[j].trackData.length; z++) {
          //         if (trackSide === "right") {
          //           fetchRespond[j].trackData[z].txStart += Number(startRegion);
          //           fetchRespond[j].trackData[z].txEnd += Number(startRegion);
          //         } else {
          //           fetchRespond[j].trackData[z].txStart = -(
          //             Number(startRegion) +
          //             (Number(sectionEnd) -
          //               Number(fetchRespond[j].trackData[z].txStart))
          //           );
          //           fetchRespond[j].trackData[z].txEnd = -(
          //             Number(startRegion) +
          //             (Number(sectionEnd) -
          //               Number(fetchRespond[j].trackData[z].txEnd))
          //           );
          //         }
          //       }
          //     } else if (trackName === "bed") {
          //       for (let z = 0; z < fetchRespond[j].trackData.length; z++) {
          //         if (trackSide === "right") {
          //           fetchRespond[j].trackData[z].start += Number(startRegion);
          //           fetchRespond[j].trackData[z].end += Number(startRegion);
          //         } else {
          //           fetchRespond[j].trackData[z].start = -(
          //             Number(startRegion) +
          //             (Number(sectionEnd) -
          //               Number(fetchRespond[j].trackData[z].start))
          //           );
          //           fetchRespond[j].trackData[z].end = -(
          //             Number(startRegion) +
          //             (Number(sectionEnd) -
          //               Number(fetchRespond[j].trackData[z].end))
          //           );
          //         }
          //       }
          //     } else {
          //       for (let z = 0; z < fetchRespond[j].trackData.length; z++) {
          //         if (trackSide === "right") {
          //           fetchRespond[j].trackData[z].start += Number(startRegion);
          //           fetchRespond[j].trackData[z].end += Number(startRegion);
          //         } else {
          //           fetchRespond[j].trackData[z].start = -(
          //             Number(startRegion) +
          //             (Number(sectionEnd) -
          //               Number(fetchRespond[j].trackData[z].start))
          //           );
          //           fetchRespond[j].trackData[z].end = -(
          //             Number(startRegion) +
          //             (Number(sectionEnd) -
          //               Number(fetchRespond[j].trackData[0][z].end))
          //           );
          //         }
          //       }
          //     }
          //   }

          //   tempObj[trackName] = tempObj[trackName].concat(
          //     fetchRespond[j].trackData
          //   );
          // }

          // we use 0 index because those fetch data come in Array<Array> so change this later to make it
          // better
        } catch {}

        // if (initial === 0) {
        //   tempObj["initial"] = 0;
        // } else {
        //   tempObj["initial"] = 1;

        //   minBp.current = minBp.current - bpRegionSize;
        // }
        // console.log(tempObj, "old");
        // setTrackData({ ...tempObj });
        // isLoading.current = false;
      }
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
    // on initial and when our genome data changes we set the default values here
    console.log("hey", genomeArr);
    let genome = genomeArr[genomeIdx];

    [region.current, coord.current] = genome.defaultRegion.split(":");

    const [leftStartStr, rightStartStr] = coord.current.split("-");

    leftStartCoord.current = Number(leftStartStr);
    rightStartCoord.current = Number(rightStartStr);
    bpRegionSize.current = rightStartCoord.current - leftStartCoord.current;
    bpToPx.current = bpRegionSize.current / windowWidth;

    let allChrData = genome.chromosomes;

    for (const chromosome of genome.chrOrder) {
      if (allChrData[chromosome] !== undefined) {
        chrData.current.push(chromosome);
        chrLength.current.push(allChrData[chromosome]);
      }
    }

    initialChrIdx.current = chrData.current.indexOf(region.current);

    chrIndexRight.current = initialChrIdx.current;
    chrIndexLeft.current = initialChrIdx.current;
    curVisData.current = genome.visData;
    viewRegion.current = genome.defaultRegion;

    bpX.current = leftStartCoord.current;
    maxBp.current = rightStartCoord.current;
    minBp.current = leftStartCoord.current;
    // go through genome defaultTrack to see what track components we need and give each component
    // a unique id so it remember data and allows us to manipulate the position in the trackComponent arr

    let newTrackComponents: Array<any> = [];
    for (let i = 0; i < genome.defaultTracks.length; i++) {
      if (!genome.defaultTracks[i]["id"]) {
        const uniqueKey = uuidv4();
        genome.defaultTracks[i]["id"] = uniqueKey;
        newTrackComponents.push({
          id: uniqueKey,
          component: componentMap[genome.defaultTracks[i].name],
        });
      } else {
        newTrackComponents.push({
          id: genome.defaultTracks[i]["id"],
          component: componentMap[genome.defaultTracks[i].name],
        });
      }
    }
    setTrackComponents([...newTrackComponents]);

    if (initialStart.current) {
      fetchGenomeData(1, "right");
      initialStart.current = false;
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

        <div> {viewRegion.current}</div>
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

        <div>1pixel to {bpToPx.current}bp</div>

        <div
          style={{
            display: "flex",
            //makes components align right or right when we switch sides
            justifyContent: side == "right" ? "start" : "end",

            flexDirection: "row",

            width: `${windowWidth}px`,
            backgroundColor: "gainsboro",
            height: 1000,
            overflowX: "hidden",
            overflowY: "visible",
          }}
        >
          <div
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
                  bpRegionSize={bpRegionSize.current}
                  trackComponents={trackComponents}
                  bpToPx={bpToPx.current}
                  trackData={trackData}
                  side={side}
                  windowWidth={windowWidth}
                  dragXDist={dragX.current}
                  handleDelete={handleDelete}
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
