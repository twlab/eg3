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
import CircularProgress from "@mui/material/CircularProgress";

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
const windowWidth = window.innerWidth;

interface MyComponentProps {
  bpRegionSize?: number;
  bpToPx?: number;
  trackData?: { [key: string]: any }; // Replace with the actual type
  side?: string;
  trackWidth: number;
  trackSize: any;
}

const componentMap: { [key: string]: React.FC<MyComponentProps> } = {
  refGene: RefGeneTrack,
  bed: BedTrack,
  bedDensity: BedDensityTrack,
  bigWig: BigWigTrack,
  dynseq: DynseqTrack,
  methylc: MethylcTrack,
  hic: HiCTrack,

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
};

function TrackManager(props) {
  //To-Do: MOVED THIS PART TO GENOMEROOT SO THAT THESE DAta are INILIZED ONLY ONCE.
  //TO-DO: 2: Create an interface that has all specific functions for each track. I.E. the unique function to fetch data. When a new track is added
  // use interface key to get certain track function based on information the user clicked on.
  // We want to sent a defaultTrack List of component of trackcomponent already from genomerooot and use it in trackmanager instead of
  // creating the component in trackmanager/
  //LOOP through defaultTrack in fetchGenome and use interface with each specifics fetch function function based on the track name.
  // for ... track:
  //if(genome.defaultTrack[i] = ref)
  // else if (bigWig)
  // else if (hic)
  //getHic(genome.defaultTrack.staw,....)

  //fix old algo on hic, need to sent it new chr when mutli chr view
  // fix data being [ [ ]] after fetching
  const genome = props.currGenome;

  const [region, coord] = genome.defaultRegion.split(":");
  const [leftStartStr, rightStartStr] = coord.split("-");
  const leftStartCoord = Number(leftStartStr);
  const rightStartCoord = Number(rightStartStr);
  const bpRegionSize = rightStartCoord - leftStartCoord;
  const bpToPx = bpRegionSize / windowWidth;
  let allChrData = genome.chromosomes;
  //useRef to store data between states without re render the component
  //this is made for dragging so everytime the track moves it does not rerender the screen but keeps the coordinates
  const block = useRef<HTMLInputElement>(null);
  const frameID = useRef(0);
  const lastX = useRef(0);
  const dragX = useRef(0);

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
  const [side, setSide] = useState("right");
  const [isLoading, setIsLoading] = useState(true);
  const [hicOption, setHicOption] = useState(1);
  const [isLoading2, setIsLoading2] = useState(true);
  const [trackData, setTrackData] = useState<{ [key: string]: any }>({});
  const [trackData2, setTrackData2] = useState<{ [key: string]: any }>({});

  const bpX = useRef(leftStartCoord);
  const maxBp = useRef(rightStartCoord);
  const minBp = useRef(leftStartCoord);
  let trackComponent: Array<any> = [];
  for (let i = 0; i < genome.defaultTracks.length; i++) {
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
      ((isLoading || isLoading2) &&
        deltaX > 0 &&
        side === "right" &&
        -tmpDragX > (rightSectionSize.length - 1) * windowWidth) ||
      (isLoading &&
        deltaX < 0 &&
        side === "left" &&
        tmpDragX > (leftSectionSize.length - 1) * windowWidth)
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
    props.startBp(curRegion);
    bpX.current = curBp;

    if (dragX.current > 0 && side === "right") {
      setSide("left");
    } else if (dragX.current <= 0 && side === "left") {
      setSide("right");
    }
    if (hicOption === 1) {
      setIsLoading2(true);

      fetchGenomeData(2);
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
        t.push(windowWidth);
        return t;
      });

      fetchGenomeData();
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
        t.push(windowWidth);
        return t;
      });

      fetchGenomeData2();
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
    }

    return tmpRegion;
  }
  async function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.
    if (initial === 2 || initial === 1) {
      let hicResult = await trackFetchFunction.hic({
        straw: genome.defaultTracks[5].straw,

        option: defaultHic,

        start: Number(bpX.current),
        end: Number(bpX.current + bpRegionSize),
      });

      let tmpData2 = {};
      tmpData2["hicResult"] = [...hicResult];
      tmpData2["location"] = `${bpX.current}:${bpX.current + bpRegionSize}`;
      console.log(tmpData2);
      setTrackData2({ ...tmpData2 });
      setIsLoading2(false);
    }

    if (initial === 0 || initial === 1) {
      let tempObj = {};
      let tmpRegion = checkMultiChrRight(tempObj);

      let tmpMethylc: Array<any> = [];
      let tmpRefGene: Array<any> = [];
      let tmpBed: Array<any> = [];
      let tmpBigWig: Array<any> = [];
      let tmpDynseq: Array<any> = [];
      let tmpHic: Array<any> = [];

      for (let i = 0; i < tmpRegion.length; i++) {
        let sectionRegion = tmpRegion[i];

        const [curChrName, bpCoord] = sectionRegion.split(":");
        const [totalBp, sectionBp] = bpCoord.split("|");

        const [startRegion, endRegion] = totalBp.split("-");
        const [sectionStart, sectionEnd] = sectionBp.split("-");

        try {
          const [
            refGeneRespond,
            bedRespond,
            bigWigRespond,
            dynSeqRespond,
            methylcRespond,
            hicRespond,
          ] = await Promise.all(
            genome.defaultTracks.map((item) => {
              const trackName = item.name;
              if (trackName === "refGene") {
                return trackFetchFunction[trackName]({
                  name: genome.name,
                  chr: curChrName,
                  start: sectionStart,
                  end: sectionEnd,
                });
              } else if (trackName === "hic") {
                return trackFetchFunction.hic({
                  straw: genome.defaultTracks[5].straw,

                  option: defaultHic,
                  start: Number(sectionStart),
                  end: Number(sectionEnd),
                });
              } else {
                return trackFetchFunction[trackName]({
                  url: item.url,
                  chr: curChrName,
                  start: Number(sectionStart),
                  end: Number(sectionEnd),
                });
              }
            })
          );
          console.log(bigWigRespond, methylcRespond);
          // maybe move this part into the track component and let the coord get added as
          // we compute the result into converted value to display
          // just sent the value we need to add for the part.
          if (i !== 0) {
            for (let i = 0; i < refGeneRespond.length; i++) {
              refGeneRespond[i].txStart += Number(startRegion);
              refGeneRespond[i].txEnd += Number(startRegion);
            }
            for (let i = 0; i < bedRespond.length; i++) {
              bedRespond[i].start += Number(startRegion);
              bedRespond[i].end += Number(startRegion);
            }
            for (let i = 0; i < bigWigRespond[0].length; i++) {
              bigWigRespond[0][i].start += Number(startRegion);
              bigWigRespond[0][i].end += Number(startRegion);
            }
            for (let i = 0; i < dynSeqRespond[0].length; i++) {
              dynSeqRespond[0][i].start += Number(startRegion);
              dynSeqRespond[0][i].end += Number(startRegion);
            }

            for (let i = 0; i < methylcRespond[0].length; i++) {
              methylcRespond[0][i].start += Number(startRegion);
              methylcRespond[0][i].end += Number(startRegion);
            }
          }
          // we use 0 index because those fetch data come in Array<Array> so change this later to make it
          // better
          tmpMethylc = [...tmpMethylc, ...methylcRespond[0]];
          tmpDynseq = [...tmpDynseq, ...dynSeqRespond[0]];
          tmpRefGene = [...tmpRefGene, ...refGeneRespond];
          tmpBed = [...tmpBed, ...bedRespond];
          tmpBigWig = [...tmpBigWig, ...bigWigRespond[0]];
          tmpHic = [...tmpHic, ...hicRespond];
        } catch {}
      }

      tempObj["refGeneResult"] = tmpRefGene;
      tempObj["bedResult"] = tmpBed;
      tempObj["bigWigResult"] = tmpBigWig;
      tempObj["dynseqResult"] = tmpDynseq;
      tempObj["methylcResult"] = tmpMethylc;
      tempObj["hicResult"] = tmpHic;
      tempObj["side"] = "right";
      console.log(tempObj, "right");
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

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  async function fetchGenomeData2() {
    ///////-__________________________________________________________________________________________________________________________

    let tempObj = {};

    let tmpRegion = checkMultiChrLeft(tempObj);

    let tmpBigWig: Array<any> = [];

    let tmpMethylc: Array<any> = [];
    let tmpDynseq: Array<any> = [];
    let tmpResult: Array<any> = [];
    let tmpBed: Array<any> = [];
    let tmpHic: Array<any> = [];
    for (let i = 0; i < tmpRegion.length; i++) {
      let sectionRegion = tmpRegion[i];
      const [curChrName, bpCoord] = sectionRegion.split(":");
      const [totalBp, sectionBp] = bpCoord.split("|");

      const [startRegion, endRegion] = totalBp.split("-");
      const [sectionStart, sectionEnd] = sectionBp.split("-");

      try {
        const [
          userRespond,
          bedRespond,
          bigWigRespond,
          dynSeqRespond,
          methylcRespond,
          hicRespond,
        ] = await Promise.all(
          genome.defaultTracks.map((item) => {
            const trackName = item.name;
            if (trackName === "refGene") {
              return trackFetchFunction[trackName]({
                name: genome.name,
                chr: curChrName,
                start: sectionStart,
                end: sectionEnd,
              });
            } else if (trackName === "hic") {
              return trackFetchFunction.hic({
                straw: genome.defaultTracks[5].straw,

                option: defaultHic,
                start: Number(sectionStart),
                end: Number(sectionEnd),
              });
            } else {
              return trackFetchFunction[trackName]({
                url: item.url,
                chr: curChrName,
                start: Number(sectionStart),
                end: Number(sectionEnd),
              });
            }
          })
        );

        if (i !== 0) {
          for (let i = 0; i < userRespond.length; i++) {
            userRespond[i].txStart = -(
              Number(startRegion) +
              (Number(sectionEnd) - Number(userRespond[i].txStart))
            );
            userRespond[i].txEnd = -(
              Number(startRegion) +
              (Number(sectionEnd) - Number(userRespond[i].txEnd))
            );
          }
          for (let i = 0; i < bedRespond.length; i++) {
            bedRespond[i].start =
              Number(startRegion) +
              (Number(sectionEnd) - Number(bedRespond[i].start));
            bedRespond[i].end = -(
              Number(startRegion) +
              (Number(sectionEnd) - Number(bedRespond[i].end))
            );
          }
          for (let i = 0; i < bigWigRespond.length; i++) {
            bigWigRespond[i].start =
              Number(startRegion) +
              (Number(sectionEnd) - Number(bigWigRespond[i].start));
            bigWigRespond[i].end = -(
              Number(startRegion) +
              (Number(sectionEnd) - Number(bigWigRespond[i].end))
            );
          }

          for (let i = 0; i < dynSeqRespond.length; i++) {
            dynSeqRespond[i].start =
              Number(startRegion) +
              (Number(sectionEnd) - Number(dynSeqRespond[i].start));
            dynSeqRespond[i].end = -(
              Number(startRegion) +
              (Number(sectionEnd) - Number(dynSeqRespond[i].end))
            );
          }
        }

        tmpMethylc = [...tmpMethylc, ...methylcRespond];
        tmpResult = [...tmpResult, ...userRespond];
        tmpDynseq = [...tmpDynseq, ...dynSeqRespond];
        tmpBed = [...tmpBed, ...bedRespond];
        tmpBigWig = [...tmpBigWig, ...bigWigRespond];
        tmpHic = [...tmpHic, ...hicRespond];
      } catch {}
    }

    const bedResult = tmpBed;
    const result = tmpResult;
    const bigWigResult = tmpBigWig;
    const dynSeqResult = tmpDynseq;

    if (tempObj["location"] === undefined) {
      // if location is undefined that means view does not contain multiple chromosome
      tempObj["location"] = `${minBp.current}:${minBp.current + bpRegionSize}`;
      minBp.current = minBp.current - bpRegionSize;
    }
    tempObj["refGeneResult"] = result;
    tempObj["bedResult"] = bedResult;
    tempObj["bigWigResult"] = bigWigResult;
    tempObj["dynseqResult"] = dynSeqResult;
    tempObj["methylcResult"] = tmpMethylc;
    tempObj["hicResult"] = tmpHic;
    tempObj["side"] = "left";

    ///////-__________________________________________________________________________________________________________________________

    setTrackData({ ...tempObj });

    setIsLoading(false);
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
    console.log(windowWidth);
    function getData() {
      fetchGenomeData(1);
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
      {isLoading || isLoading2 ? (
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
          {trackComponent.map((Component, index) => (
            <Component
              key={index}
              bpRegionSize={bpRegionSize}
              bpToPx={bpToPx}
              trackData={trackData}
              side={side}
              windowWidth={windowWidth}
              totalSize={
                side === "right"
                  ? sumArray(rightSectionSize) + windowWidth
                  : sumArray(leftSectionSize) + windowWidth
              }
              dragXDist={dragX.current}
              trackData2={trackData2}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TrackManager;
