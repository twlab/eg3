import { memo, useEffect, useRef, useState } from "react";
import GetTabixData from "./getRemoteData/tabixSource";
import GetBigData from "./getRemoteData/bigSource";
import GetHicData from "./getRemoteData/hicSource";
const AWS_API = "https://lambda.epigenomegateway.org/v2";
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
import { handleData } from "./WorkerFactory";
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
const trackFetchFunction: { [key: string]: any } = {
  refGene: async function refGeneFetch(regionData: any) {
    const genRefResponse = await fetch(
      `${AWS_API}/${regionData.name}/genes/refGene/queryRegion?chr=${regionData.chr}&start=${regionData.start}&end=${regionData.end}`,
      { method: "GET" }
    );

    return genRefResponse.json();
  },
  bed: async function bedFetch(regionData: any) {
    return GetTabixData(
      regionData.url,
      regionData.chr,
      regionData.start,
      regionData.end
    );
  },

  bigWig: function bigWigFetch(regionData: any) {
    return GetBigData(
      regionData.url,
      regionData.chr,
      regionData.start,
      regionData.end
    );
  },

  dynseq: function dynseqFetch(regionData: any) {
    return GetBigData(
      regionData.url,
      regionData.chr,
      regionData.start,
      regionData.end
    );
  },
  methylc: function methylcFetch(regionData: any) {
    return GetTabixData(
      regionData.url,
      regionData.chr,
      regionData.start,
      regionData.end
    );
  },
  hic: function hicFetch(regionData: any) {
    return GetHicData(
      regionData.straw,
      regionData.option,
      regionData.start,
      regionData.end
    );
  },
  genomealign: function genomeAlignFetch(regionData: any) {
    return GetTabixData(
      regionData.url,
      regionData.chr,
      regionData.start,
      regionData.end
    );
  },
};
interface TrackManagerProps {
  genome: { [key: string]: any };
  addTrack: (track: any) => void;
  startBp: (bp: string) => void;
  windowWidth: number;
}
const TrackManager: React.FC<TrackManagerProps> = memo(function TrackManager({
  genome,
  addTrack,
  startBp,
  windowWidth,
}) {
  //To-Do: MOVED THIS PART TO GENOMEROOT SO THAT THESE DAta are INILIZED ONLY ONCE.
  // DONE !!!!!!!!!! TO-DO: 2: Create an interface that has all specific functions for each track. I.E. the unique function to fetch data. When a new track is added
  // use interface key to get certain track function based on information the user clicked on.
  // We want to sent a defaultTrack List of component of trackcomponent already from genomerooot and use it in trackmanager instead of
  // creating the component in trackmanager/
  // DONE !!!!!!!!!!LOOP through defaultTrack in fetchGenome and use interface with each specifics fetch function function based on the track name.
  // for ... track:
  //if(genome.defaultTrack[i] = ref)
  // else if (bigWig)
  // else if (hic)
  //getHic(genome.defaultTrack.staw,....
  // DONE !!!!!!!!!! fix data being [ [ ]] after fetching

  //   //made working for left..... need to fix old algo on hic, need to sent it new chr when mutli chr view

  const [region, coord] = genome.defaultRegion.split(":");
  const [leftStartStr, rightStartStr] = coord.split("-");
  const leftStartCoord = Number(leftStartStr);
  const rightStartCoord = Number(rightStartStr);
  const bpRegionSize = rightStartCoord - leftStartCoord;
  const bpToPx = bpRegionSize / windowWidth;
  let allChrData = genome.chromosomes;
  let chrData: Array<any> = [];
  let chrLength: Array<any> = [];
  for (const chromosome of genome.chrOrder) {
    if (allChrData[chromosome] !== undefined) {
      chrData.push(chromosome);
      chrLength.push(allChrData[chromosome]);
    }
  }

  const initialChrIdx = chrData.indexOf(region);

  const frameID = useRef(0);
  const lastX = useRef(0);
  const dragX = useRef(0);
  const isLoading = useRef(true);
  const block = useRef<HTMLInputElement>(null);
  const curVisData = useRef(genome.visData);
  const viewRegion = useRef(genome.defaultRegion);
  const chrIndexRight = useRef(initialChrIdx);
  const chrIndexLeft = useRef(initialChrIdx);
  const bpX = useRef(leftStartCoord);
  const maxBp = useRef(rightStartCoord);
  const minBp = useRef(leftStartCoord);

  const [isDragging, setDragging] = useState(false);
  const [rightSectionSize, setRightSectionSize] = useState<Array<any>>([]);
  const [leftSectionSize, setLeftSectionSize] = useState<Array<any>>([]);
  const [trackComponents, setTrackComponents] = useState<Array<any>>([]);
  const [hicOption, setHicOption] = useState(1);
  const [trackData, setTrackData] = useState<{ [key: string]: any }>({});
  const [trackData2, setTrackData2] = useState<{ [key: string]: any }>({});
  const [side, setSide] = useState("right");

  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates

  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track

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
      trackName: "bed",
      genome: genome,
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
    let curIdx = initialChrIdx;

    let curStartBp = leftStartCoord + -dragX.current * bpToPx;
    const curBp = leftStartCoord + -dragX.current * bpToPx;
    if (side === "right" && curBp >= chrLength[curIdx]) {
      while (curStartBp > chrLength[curIdx]) {
        curStartBp -= chrLength[curIdx];
        curIdx += 1;
      }
    } else if (side === "left" && curBp < 0) {
      curIdx--;
      while (curStartBp < -chrLength[curIdx]) {
        curStartBp += chrLength[curIdx];
        curIdx -= 1;
      }
      curStartBp = chrLength[curIdx] + curStartBp;
    }

    let curRegion =
      chrData[curIdx] +
      ":" +
      String(curStartBp) +
      "-" +
      String(curStartBp + bpRegionSize);
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
    if (maxBp.current > chrLength[chrIndexRight.current]) {
      let totalEndBp = Number(chrLength[chrIndexRight.current]);
      let startBp = maxBp.current - bpRegionSize;
      let tmpChrIdx = chrIndexRight.current;

      tmpRegion.push(
        `${chrData[chrIndexRight.current]}` +
          ":" +
          `${startBp}` +
          "-" +
          `${chrLength[chrIndexRight.current]}` +
          "|" +
          `${startBp}` +
          "-" +
          `${chrLength[chrIndexRight.current]}`
      );
      tmpChrIdx += 1;
      let chrEnd = 0;

      while (maxBp.current > totalEndBp) {
        let chrStart = 0;

        if (chrLength[tmpChrIdx] + totalEndBp < maxBp.current) {
          // here we check if maxBp overflows into the next chr region. we do not set any value
          // this is to determine if maxBp stop in the curr region or continues to overflow into the next chr..
          chrEnd = chrLength[tmpChrIdx];
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

          `${chrData[tmpChrIdx]}` +
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
      tempObj["location"] = `${maxBp.current - bpRegionSize}:${maxBp.current}`;
      //maxBp.current will now be based on the new chromosome region
      maxBp.current = chrEnd + bpRegionSize;
    } else {
      tmpRegion.push(
        `${chrData[chrIndexRight.current]}` +
          ":" +
          `${maxBp.current - bpRegionSize}` +
          "-" +
          `${maxBp.current}` +
          "|" +
          +`${maxBp.current - bpRegionSize}` +
          "-" +
          `${maxBp.current}`
      );
      // if location is undefined that means view does not contain multiple chromosome
      tempObj["location"] = `${maxBp.current - bpRegionSize}:${maxBp.current}`;
      maxBp.current = maxBp.current + bpRegionSize;
    }

    return tmpRegion;
  }

  function checkMultiChrLeft(tempObj: any) {
    let tmpRegion: Array<any> = [];
    if (minBp.current < 0) {
      let totalEndBp = 0;
      let endBp = minBp.current + bpRegionSize;
      let tmpChrIdx = chrIndexLeft.current - 1;
      tmpRegion.push(
        `${chrData[chrIndexLeft.current]}` +
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
        if (minBp.current < totalEndBp - chrLength[tmpChrIdx]) {
          chrEnd = chrLength[tmpChrIdx];
        } else {
          chrEnd = -(totalEndBp - chrLength[tmpChrIdx]) - -minBp.current;
        }
        tmpRegion.push(
          `${chrData[tmpChrIdx]}` +
            ":" +
            `${-totalEndBp}` +
            "-" +
            `${
              (chrEnd === chrLength[tmpChrIdx]
                ? chrLength[tmpChrIdx]
                : chrLength[tmpChrIdx] - chrEnd) + -totalEndBp
            }` +
            "|" +
            `${chrLength[tmpChrIdx] - (chrLength[tmpChrIdx] - chrEnd)}` +
            "-" +
            `${chrLength[tmpChrIdx]}`
        );
        totalEndBp -= chrLength[tmpChrIdx];

        tmpChrIdx -= 1;
      }

      chrIndexLeft.current = tmpChrIdx + 1;
      tempObj["location"] = `${minBp.current}:${minBp.current + bpRegionSize}`;
      minBp.current = chrEnd - bpRegionSize;
    } else {
      tmpRegion.push(
        `${chrData[chrIndexLeft.current]}` +
          ":" +
          `${minBp.current}` +
          "-" +
          `${minBp.current + bpRegionSize}` +
          "|" +
          +`${minBp.current}` +
          "-" +
          `${minBp.current + bpRegionSize}`
      );
      tempObj["location"] = `${minBp.current}:${minBp.current + bpRegionSize}`;
      minBp.current = minBp.current - bpRegionSize;
    }

    return tmpRegion;
  }
  //______________________________________________________
  //TO-DO IMPORTANT: fix return mutiple arrays after fetching data.
  // should sent around of mutiple chr regions, but all the chr region gene datas should return in one array.
  async function fetchGenomeData(initial: number = 0, trackSide) {
    let navContextCoord = HG38.navContext.parse(
      `${region}` +
        ":" +
        `${Math.floor(Number(bpX.current))}` +
        "-" +
        `${Math.floor(Number(bpX.current + bpRegionSize))}`
    );
    console.log(
      navContextCoord,
      `${region}` +
        ":" +
        `${Math.floor(Number(bpX.current))}` +
        "-" +
        `${Math.ceil(Number(bpX.current + bpRegionSize))}`,
      curVisData.current
    );
    console.log(
      Math.ceil(Number(bpX.current + bpRegionSize)) -
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

      await Promise.all(
        genome.defaultTracks.map(async (item, index) => {
          const trackName = item.name;
          if (trackName === "genomealign" || trackName === "hic") {
            worker.postMessage({
              trackArray: genome.defaultTracks,
              loci: {
                chr: region,
                start:
                  bpToPx! <= 10
                    ? Number(bpX.current) - bpRegionSize
                    : Number(bpX.current),
                end:
                  bpToPx! <= 10
                    ? Number(bpX.current + bpRegionSize) + bpRegionSize
                    : bpX.current + bpRegionSize,
              },
            });

            worker.addEventListener("message", (event) => {
              event.data.map((item, index) => {
                tmpData2[item.name] = {
                  fetchData: item.result,
                  trackType: genome.defaultTracks[index].name,
                };

                if (item.name === "genomeAlignResult") {
                  tmpData2["genomeName"] =
                    genome.defaultTracks[
                      genome.defaultTracks.length - 1
                    ].genome;
                  tmpData2["queryGenomeName"] =
                    genome.defaultTracks[
                      genome.defaultTracks.length - 1
                    ].genome;
                }
              });

              tmpData2["location"] = `${bpX.current}:${
                bpX.current + bpRegionSize
              }`;
              tmpData2["xDist"] = dragX.current;
              if (trackSide === "right") {
                tmpData2["side"] = "right";
              } else {
                tmpData2["side"] = "left";
              }

              setTrackData2({ ...tmpData2 });
            });
          }
        })
      );
    }

    if (initial === 0 || initial === 1) {
      let tempObj = {};
      let tmpRegion: Array<any> = [];
      if (trackSide === "right") {
        tempObj["side"] = "right";
        tmpRegion = checkMultiChrRight(tempObj);
      } else {
        tempObj["side"] = "left";
        tmpRegion = checkMultiChrLeft(tempObj);
      }

      for (let i = 0; i < tmpRegion.length; i++) {
        let sectionRegion = tmpRegion[i];

        const [curChrName, bpCoord] = sectionRegion.split(":");
        const [totalBp, sectionBp] = bpCoord.split("|");

        const [startRegion, endRegion] = totalBp.split("-");
        const [sectionStart, sectionEnd] = sectionBp.split("-");

        try {
          let fetchRespond = await Promise.all(
            genome.defaultTracks.map(async (item) => {
              const trackName = item.name;
              if (trackName === "hic" || trackName === "genomealign") {
                return;
              } else if (trackName === "refGene") {
                let result = await trackFetchFunction[trackName]({
                  name: genome.name,
                  chr: curChrName,
                  start: sectionStart,
                  end: sectionEnd,
                });
                return {
                  trackData: result,
                  trackName: trackName,
                };
              } else {
                let result = await trackFetchFunction[trackName]({
                  url: item.url,
                  chr: curChrName,
                  start: Number(sectionStart),
                  end: Number(sectionEnd),
                });
                return {
                  trackData: result,
                  trackName: trackName,
                };
              }
            })
          );

          for (let j = 0; j < fetchRespond.length; j++) {
            let trackName = fetchRespond[j].trackName;
            if (tempObj[trackName] === undefined) {
              tempObj[trackName] = new Array<any>();
            }
            if (i !== 0) {
              if (trackName === "refGene") {
                for (let z = 0; z < fetchRespond[j].trackData.length; z++) {
                  if (trackSide === "right") {
                    fetchRespond[j].trackData[z].txStart += Number(startRegion);
                    fetchRespond[j].trackData[z].txEnd += Number(startRegion);
                  } else {
                    fetchRespond[j].trackData[z].txStart = -(
                      Number(startRegion) +
                      (Number(sectionEnd) -
                        Number(fetchRespond[j].trackData[z].txStart))
                    );
                    fetchRespond[j].trackData[z].txEnd = -(
                      Number(startRegion) +
                      (Number(sectionEnd) -
                        Number(fetchRespond[j].trackData[z].txEnd))
                    );
                  }
                }
              } else if (trackName === "bed") {
                for (let z = 0; z < fetchRespond[j].trackData.length; z++) {
                  if (trackSide === "right") {
                    fetchRespond[j].trackData[z].start += Number(startRegion);
                    fetchRespond[j].trackData[z].end += Number(startRegion);
                  } else {
                    fetchRespond[j].trackData[z].start = -(
                      Number(startRegion) +
                      (Number(sectionEnd) -
                        Number(fetchRespond[j].trackData[z].start))
                    );
                    fetchRespond[j].trackData[z].end = -(
                      Number(startRegion) +
                      (Number(sectionEnd) -
                        Number(fetchRespond[j].trackData[z].end))
                    );
                  }
                }
              } else {
                for (let z = 0; z < fetchRespond[j].trackData[0].length; z++) {
                  if (trackSide === "right") {
                    fetchRespond[j].trackData[0][z].start +=
                      Number(startRegion);
                    fetchRespond[j].trackData[0][z].end += Number(startRegion);
                  } else {
                    fetchRespond[j].trackData[z].start = -(
                      Number(startRegion) +
                      (Number(sectionEnd) -
                        Number(fetchRespond[j].trackData[z].start))
                    );
                    fetchRespond[j].trackData[0][z].end = -(
                      Number(startRegion) +
                      (Number(sectionEnd) -
                        Number(fetchRespond[j].trackData[0][z].end))
                    );
                  }
                }
              }
            }

            tempObj[trackName] = tempObj[trackName].concat(
              fetchRespond[j].trackData
            );
          }

          // we use 0 index because those fetch data come in Array<Array> so change this later to make it
          // better
        } catch {}
      }

      if (initial === 0) {
        tempObj["initial"] = 0;
      } else {
        tempObj["initial"] = 1;

        minBp.current = minBp.current - bpRegionSize;
      }

      setTrackData({ ...tempObj });
      isLoading.current = false;
    }
  }
  function handleDelete(id: number) {
    genome.defaultTracks = genome.defaultTracks.filter((items, index) => {
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
    let newTrackComponents: Array<any> = [];
    for (let i = 0; i < genome.defaultTracks.length; i++) {
      const uniqueKey = uuidv4();
      genome.defaultTracks[i]["id"] = uniqueKey;
      newTrackComponents.push({
        id: uniqueKey,
        component: componentMap[genome.defaultTracks[i].name],
      });
    }
    console.log(genome.defaultTracks);
    setTrackComponents([...newTrackComponents]);
    fetchGenomeData(1, "right");
  }, []);

  return (
    <div
      style={{
        flexDirection: "row",
        whiteSpace: "nowrap",
        //not using flex allows us to keep the position of the track
        width: "100%",

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
          size={10}
          thickness={4}
        />
      ) : (
        <div>DATA READY LETS GO</div>
      )}

      <div>1pixel to {bpToPx}bp</div>

      <div
        style={{
          display: "flex",
          //makes element align right
          justifyContent: side == "right" ? "start" : "end",

          flexDirection: "row",

          // div width has to match a single track width or the alignment will be off
          // in order to smoothly tranverse need to fetch info offscreen maybe?????
          // 1. try add more blocks so the fetch is offscreen
          width: `${windowWidth}px`,
          backgroundColor: "gainsboro",

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
            //makes element align right
            alignItems: side == "right" ? "start" : "end",
          }}
        >
          {trackComponents.map((item, index) => {
            let Component = item.component;
            return (
              <Component
                key={item.id}
                bpRegionSize={bpRegionSize}
                trackComponents={trackComponents}
                bpToPx={bpToPx}
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
  );
});
export default memo(TrackManager);
