import { useEffect, useRef, useState } from "react";
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

// use class to create an instance of hic fetch and sent it to track manager in genome root

let defaultHic = {
  color: "#B8008A",
  color2: "#006385",
  backgroundColor: "var(--bg-color)",
  displayMode: "heatmap",
  scoreScale: "auto",
  scoreMax: 10,
  scalePercentile: 95,
  scoreMin: 0,
  height: 500,
  lineWidth: 2,
  greedyTooltip: false,
  fetchViewWindowOnly: false,
  bothAnchorsInView: false,
  isThereG3dTrack: false,
  clampHeight: false,
  binSize: 0,
  normalization: "NONE",
  label: "",
};

interface TrackProps {
  bpRegionSize?: number;
  bpToPx?: number;
  trackData?: { [key: string]: any }; // Replace with the actual type
  side?: string;
  trackWidth: number;
  trackSize: any;
  trackIdx: number;
}

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
    const result = await GetTabixData(
      regionData.url,
      regionData.chr,
      regionData.start,
      regionData.end
    );
    if (result.length > 0) {
      return result[0];
    } else {
      return result;
    }
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

function TrackManager(props) {
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
  const frameID = useRef(0);
  const lastX = useRef(0);
  const dragX = useRef(0);

  const windowWidth = useRef(props.windowWidth);
  const genome = props.currGenome;

  const [region, coord] = genome.defaultRegion.split(":");
  const [leftStartStr, rightStartStr] = coord.split("-");
  const leftStartCoord = Number(leftStartStr);
  const rightStartCoord = Number(rightStartStr);
  const bpRegionSize = rightStartCoord - leftStartCoord;
  const bpToPx = bpRegionSize / windowWidth.current;
  let allChrData = genome.chromosomes;
  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const block = useRef<HTMLInputElement>(null);
  const curVisData = useRef(genome.visData);
  // These states are used to update the tracks with new fetched data
  // new track sections are added as the user moves left (lower regions) and right (higher region)
  // New data are fetched only if the user drags to the either ends of the track
  const [isDragging, setDragging] = useState(false);
  const [rightSectionSize, setRightSectionSize] = useState<Array<any>>([]);
  let chrData: Array<any> = [];
  let chrLength: Array<any> = [];
  for (const chromosome of genome.chrOrder) {
    if (allChrData[chromosome] !== undefined) {
      chrData.push(chromosome);
      chrLength.push(allChrData[chromosome]);
    }
  }

  const initialChrIdx = chrData.indexOf(region);
  const viewRegion = useRef(genome.defaultRegion);
  const chrIndexRight = useRef(initialChrIdx);
  const chrIndexLeft = useRef(initialChrIdx);
  const [leftSectionSize, setLeftSectionSize] = useState<Array<any>>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [hicOption, setHicOption] = useState(1);

  const [trackData, setTrackData] = useState<{ [key: string]: any }>({});
  const [trackData2, setTrackData2] = useState<{ [key: string]: any }>({});
  const side = useRef("right");
  const bpX = useRef(leftStartCoord);
  const maxBp = useRef(rightStartCoord);
  const minBp = useRef(leftStartCoord);
  let trackComponent: Array<any> = [];
  for (let i = 0; i < genome.defaultTracks.length - 1; i++) {
    trackComponent.push(componentMap[genome.defaultTracks[i].name]);
  }
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
    const tmpDragX = dragX.current - deltaX;

    if (
      (isLoading &&
        deltaX > 0 &&
        side.current === "right" &&
        -tmpDragX > (rightSectionSize.length - 1) * windowWidth.current) ||
      (isLoading &&
        deltaX < 0 &&
        side.current === "left" &&
        tmpDragX > (leftSectionSize.length - 1) * windowWidth.current)
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
    props.addTrack({
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

    // This is to track viewRegion everytime a user moves.
    // We have similar logic in the fetch for getting data but it does not have the current view bp region.
    // so we need to have both.
    let curIdx = initialChrIdx;

    let curStartBp = leftStartCoord + -dragX.current * bpToPx;
    const curBp = leftStartCoord + -dragX.current * bpToPx;
    if (side.current === "right" && curBp >= chrLength[curIdx]) {
      while (curStartBp > chrLength[curIdx]) {
        curStartBp -= chrLength[curIdx];
        curIdx += 1;
      }
    } else if (side.current === "left" && curBp < 0) {
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
    props.startBp(curRegion);
    bpX.current = curBp;

    if (hicOption === 1 && dragX.current <= 0) {
      fetchGenomeData(2, "right");
    } else {
      fetchGenomeData(2, "left");
    }

    if (
      // windowWidth needs to be changed to match the speed of the dragx else it has a differenace translate
      // for example if we set speed to 0.5 then need to mutiply windowith by 2
      -dragX.current >= sumArray(rightSectionSize) &&
      dragX.current < 0
    ) {
      setIsLoading(true);
      console.log("trigger right");
      setRightSectionSize((prevStrandInterval) => {
        const t = [...prevStrandInterval];
        t.push(windowWidth.current);
        return t;
      });

      fetchGenomeData(0, "right");
    } else if (
      //need to add windowwith when moving left is because when the size of track is 2x it misalign the track because its already halfway
      //so we need to add to keep the position correct.
      dragX.current >= sumArray(leftSectionSize) &&
      dragX.current > 0
    ) {
      setIsLoading(true);
      console.log("trigger left");
      setLeftSectionSize((prevStrandInterval) => {
        const t = [...prevStrandInterval];
        t.push(windowWidth.current);
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
  async function fetchGenomeData(initial: number = 0, trackSide) {
    let navContextCoord = HG38.navContext.parse(
      `${region}` +
        ":" +
        `${Math.floor(Number(bpX.current))}` +
        "-" +
        `${Math.ceil(Number(bpX.current + bpRegionSize))}`
    );

    let newVisData: ViewExpansion = {
      visWidth: windowWidth.current * 3,
      visRegion: new DisplayedRegionModel(
        HG38.navContext,
        navContextCoord.start - (navContextCoord.end - navContextCoord.start),
        navContextCoord.end + (navContextCoord.end - navContextCoord.start)
      ),
      viewWindow: new OpenInterval(
        windowWidth.current,
        windowWidth.current * 2
      ),
      viewWindowRegion: new DisplayedRegionModel(
        HG38.navContext,
        navContextCoord.start,
        navContextCoord.end
      ),
    };
    curVisData.current = newVisData;
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.
    if (initial === 2 || initial === 1) {
      let hicResult = await trackFetchFunction.hic({
        straw: genome.defaultTracks[4].straw,

        option: defaultHic,

        start: Number(bpX.current),
        end: Number(bpX.current + bpRegionSize),
      });
      let genomealignResult = await trackFetchFunction.genomealign({
        url: genome.defaultTracks[5].url,
        chr: region,
        start: Number(bpX.current) - bpRegionSize,
        end: Number(bpX.current + bpRegionSize) + bpRegionSize,
      });

      let tmpData2 = {};

      tmpData2["genomealignResult"] = {
        fetchData: genomealignResult[0],
        trackType: genome.defaultTracks[5].name,
      };

      tmpData2["hicResult"] = hicResult;
      tmpData2["location"] = `${bpX.current}:${bpX.current + bpRegionSize}`;
      tmpData2["xDist"] = dragX.current;
      if (genome.defaultTracks[5].name === "genomealign") {
        tmpData2["genomeName"] = genome.defaultTracks[5].genome;
        tmpData2["queryGenomeName"] =
          genome.defaultTracks[5].trackModel.querygenome;
      }
      if (trackSide === "right") {
        tmpData2["side"] = "right";
      } else {
        tmpData2["side"] = "left";
      }

      setTrackData2({ ...tmpData2 });
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
              if (trackName === "refGene") {
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
              } else if (trackName === "hic") {
                // let result = await trackFetchFunction.hic({
                //   straw: genome.defaultTracks[5].straw,
                //   option: defaultHic,
                //   start: Number(sectionStart),
                //   end: Number(sectionEnd),
                // });
                // return {
                //   trackData: result,
                //   trackName: trackName,
                // };
              } else if (trackName === "genomealign") {
                // let result = await trackFetchFunction[trackName]({
                //   url: item.url,
                //   chr: curChrName,
                //   start: Number(sectionStart),
                //   end: Number(sectionEnd),
                // });
                // for (const record of result[0]) {
                //   let data = JSON5.parse("{" + record[3] + "}");
                //   data.genomealign.targetseq = null;
                //   data.genomealign.queryseq = null;
                //   console.log(data);
                //   record[3] = data;
                // }
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

            if (trackName === "refGene" || trackName === "bed") {
              tempObj[trackName] = tempObj[trackName].concat(
                fetchRespond[j].trackData
              );
            } else {
              tempObj[trackName] = tempObj[trackName].concat(
                fetchRespond[j].trackData[0]
              );
            }
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

      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (dragX.current > 0 && side.current === "right") {
      side.current = "left";
    } else if (dragX.current <= 0 && side.current === "left") {
      side.current = "right";
    }
  }, [trackData, trackData2]);

  useEffect(() => {
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    console.log(windowWidth.current);
    function getData() {
      fetchGenomeData(1, "right");
    }

    getData();
    setIsLoading(false);
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
      {isLoading ? (
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
          justifyContent: side.current == "right" ? "start" : "end",

          flexDirection: "row",

          // div width has to match a single track width or the alignment will be off
          // in order to smoothly tranverse need to fetch info offscreen maybe?????
          // 1. try add more blocks so the fetch is offscreen
          width: `${windowWidth.current}px`,
          backgroundColor: "gainsboro",
        }}
      >
        <div
          ref={block}
          onMouseDown={handleMouseDown}
          style={{
            display: "flex",
            flexDirection: "column",
            //makes element align right
            alignItems: side.current == "right" ? "start" : "end",
          }}
        >
          {trackComponent.map((Component, index) => (
            <Component
              key={index}
              bpRegionSize={bpRegionSize}
              bpToPx={bpToPx}
              trackData={trackData}
              side={side.current}
              windowWidth={windowWidth.current}
              totalSize={
                side.current === "right"
                  ? sumArray(rightSectionSize) + windowWidth.current
                  : sumArray(leftSectionSize) + windowWidth.current
              }
              dragXDist={dragX.current}
              trackData2={trackData2}
              featureArray={genome.featureArray}
              genomeName={genome.name}
              chrIndex={
                side.current === "right"
                  ? chrIndexRight.current
                  : chrIndexLeft.current
              }
            />
          ))}
          <GenomeAlign
            trackIdx={4}
            visData={curVisData.current}
            bpRegionSize={bpRegionSize}
            bpToPx={bpToPx}
            trackData={trackData}
            side={side.current}
            windowWidth={windowWidth.current}
            totalSize={
              side.current === "right"
                ? sumArray(rightSectionSize) + windowWidth.current
                : sumArray(leftSectionSize) + windowWidth.current
            }
            dragXDist={dragX.current}
            trackData2={trackData2}
            featureArray={genome.featureArray}
            genomeName={genome.name}
            chrIndex={
              side.current === "right"
                ? chrIndexRight.current
                : chrIndexLeft.current
            }
          />
        </div>
      </div>
    </div>
  );
}

export default TrackManager;
