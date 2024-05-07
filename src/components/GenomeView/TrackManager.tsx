import { useEffect, useRef, useState } from "react";
import GetBedData from "./getRemoteData/tabixSource";
import GetBigData from "./getRemoteData/bigSource";
const AWS_API = "https://lambda.epigenomegateway.org/v2";
const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame;
import GenRefTrack from "./GenRefTrack";
import BedTrack from "./BedTrack";
import BedDensityTrack from "./BedDensityTrack";
import BigWigTrack from "./BigWigTrack";
import CircularProgress from "@mui/material/CircularProgress";
import { scaleLinear } from "d3-scale";
const windowWidth = window.innerWidth;

interface MyComponentProps {
  bpRegionSize?: number;
  bpToPx?: number;
  trackData?: { [key: string]: any }; // Replace with the actual type
  side?: string;
  trackWidth: number;
}

const componentMap: { [key: string]: React.FC<MyComponentProps> } = {
  refGene: GenRefTrack,
  bed: BedTrack,
  bedDensity: BedDensityTrack,
  bigWig: BigWigTrack,
  // Add more components as needed
};

function TrackManager(props) {
  //To-Do: MOVED THIS PART TO GENOMEROOT SO THAT THESE DAta are INILIZED ONLY ONCE.

  const genome = props.currGenome;

  const [region, coord] = genome.defaultRegion.split(":");
  const [leftStartStr, rightStartStr] = coord.split("-");
  const leftStartCoord = Number(leftStartStr);
  const rightStartCoord = Number(rightStartStr);
  const bpRegionSize = (rightStartCoord - leftStartCoord) * 2;
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
  const [rightSectionSize, setRightSectionSize] = useState<Array<any>>([""]);
  let chrData: Array<any> = [];
  let chrLength: Array<any> = [];
  for (const chromosome of genome.chrOrder) {
    if (allChrData[chromosome] !== undefined) {
      chrData.push(chromosome);
      chrLength.push(allChrData[chromosome]);
    }
  }
  const initialChrIdx = chrData.indexOf(region);
  const [chrIndexRight, setChrIndexRight] = useState(initialChrIdx);
  const [chrIndexLeft, setchrIndexLeft] = useState(initialChrIdx);
  const [leftSectionSize, setLeftSectionSize] = useState<Array<any>>([""]);
  const [side, setSide] = useState("right");
  const [isLoading, setIsLoading] = useState(true);
  const [genomeTrackR, setGenomeTrackR] = useState<{ [key: string]: any }>({});
  const [bpX, setBpX] = useState(0);

  const [maxBp, setMaxBp] = useState(
    rightStartCoord + (rightStartCoord - leftStartCoord)
  );
  const [minBp, setMinBp] = useState(leftStartCoord);
  let trackComponent: Array<any> = [];
  for (let i = 0; i < genome.defaultTracks.length; i++) {
    trackComponent.push(componentMap[genome.defaultTracks[i].name]);
  }

  function handleMove(e) {
    if (!isDragging) {
      return;
    }

    const deltaX = lastX.current - e.pageX;
    if (
      (isLoading && deltaX > 0 && side === "right") ||
      (isLoading && deltaX < 0 && side === "left")
    ) {
      return;
    }

    lastX.current = e.pageX;

    dragX.current -= deltaX;

    //can change speed of scroll by mutipling dragX.current by 0.5 when setting the track position
    cancelAnimationFrame(frameID.current);
    frameID.current = requestAnimationFrame(() => {
      block.current!.style.transform = `translate3d(${dragX.current}px, 0px, 0)`;
    });
  }
  const handleClick = () => {
    let curRegion =
      chrData[chrIndexRight] +
      ":" +
      String(bpX) +
      "-" +
      String(bpX + bpRegionSize / 2);
    props.addTrack({
      region: curRegion,
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
    let curIdx = side === "right" ? initialChrIdx : initialChrIdx - 1;
    let totalLength =
      side === "right" ? chrLength[curIdx] : chrLength[curIdx - 1];
    let curStartBp = leftStartCoord + -dragX.current * bpToPx;
    const curBp = leftStartCoord + -dragX.current * bpToPx;
    if (side === "right" && curBp > totalLength) {
      while (leftStartCoord + -dragX.current * bpToPx > totalLength) {
        curStartBp -= chrLength[curIdx];
        curIdx += 1;
        totalLength += chrLength[curIdx];
      }
    } else if (side === "left" && curBp < 0) {
      while (leftStartCoord + -dragX.current * bpToPx < totalLength) {
        curStartBp += chrLength[curIdx];
        curIdx -= 1;
        totalLength += -chrLength[curIdx];
      }
    }
    console.log(
      chrData[side === "left" ? curIdx + 1 : curIdx] +
        ":" +
        String(curStartBp) +
        "-" +
        String(curStartBp + bpRegionSize / 2)
    );
    let curRegion =
      chrData[side === "left" ? curIdx + 1 : curIdx] +
      ":" +
      String(curStartBp) +
      "-" +
      String(curStartBp + bpRegionSize / 2);

    props.startBp(curRegion);
    setBpX(curBp);

    if (dragX.current > 0 && side === "right") {
      setSide("left");
    } else if (dragX.current <= 0 && side === "left") {
      setSide("right");
    }

    if (
      -dragX.current / windowWidth >= rightSectionSize.length - 2 &&
      dragX.current < 0
    ) {
      setIsLoading(true);
      setRightSectionSize((prevStrandInterval) => {
        const t = [...prevStrandInterval];
        t.push("");
        return t;
      });

      fetchGenomeData();
    } else if (
      //need to add windowwith when moving left is because when the size of track is 2x it misalign the track because its already halfway
      //so we need to add to keep the position correct.
      dragX.current / windowWidth >= leftSectionSize.length - 2 &&
      dragX.current > 0
    ) {
      setIsLoading(true);
      console.log("trigger left");
      setLeftSectionSize((prevStrandInterval) => {
        const t = [...prevStrandInterval];
        t.push("");
        return t;
      });
      fetchGenomeData2();
    }
  }

  async function fetchGenomeData(initial: number = 0) {
    // TO - IF STRAND OVERFLOW THEN NEED TO SET TO MAX WIDTH OR 0 to NOT AFFECT THE LOGIC.
    let tmpRegion: Array<any> = [];
    if (maxBp > chrLength[chrIndexRight]) {
      let totalEndBp = Number(chrLength[chrIndexRight]);
      let startBp = maxBp - bpRegionSize;
      let tmpChrIdx = chrIndexRight;

      tmpRegion.push(
        `${chrData[chrIndexRight]}` +
          ":" +
          `${startBp}` +
          "-" +
          `${chrLength[chrIndexRight]}` +
          "|" +
          `${startBp}` +
          "-" +
          `${chrLength[chrIndexRight]}`
      );
      tmpChrIdx += 1;
      let chrEnd = 0;

      while (maxBp > totalEndBp) {
        let chrStart = 0;

        if (chrLength[tmpChrIdx] + totalEndBp < maxBp) {
          chrEnd = chrLength[tmpChrIdx];
        } else {
          chrEnd = maxBp - totalEndBp;
        }

        tmpRegion.push(
          `${chrData[tmpChrIdx]}` +
            ":" +
            `${chrStart + totalEndBp}` +
            "-" +
            `${totalEndBp + chrEnd}` +
            "|" +
            `${0}` +
            "-" +
            `${chrEnd}`
        );
        totalEndBp += chrEnd;

        tmpChrIdx += 1;
      }

      setChrIndexRight(tmpChrIdx - 1);
      setMaxBp(chrEnd + bpRegionSize);
    } else {
      tmpRegion.push(
        `${chrData[chrIndexRight]}` +
          ":" +
          `${maxBp - bpRegionSize}` +
          "-" +
          `${maxBp}` +
          "|" +
          +`${maxBp - bpRegionSize}` +
          "-" +
          `${maxBp}`
      );
    }

    let tempObj = {};
    let userRespond;
    let bedRespond;
    let bigWigRespond;
    let tmpResult: Array<any> = [];
    let tmpBed: Array<any> = [];
    let tmpBigWig: Array<any> = [];

    for (let i = 0; i < tmpRegion.length; i++) {
      let sectionRegion = tmpRegion[i];
      const [curChrName, bpCoord] = sectionRegion.split(":");
      const [totalBp, sectionBp] = bpCoord.split("|");

      const [startRegion, endRegion] = totalBp.split("-");
      const [sectionStart, sectionEnd] = sectionBp.split("-");

      try {
        userRespond = await fetch(
          `${AWS_API}/${genome.name}/genes/refGene/queryRegion?chr=${curChrName}&start=${sectionStart}&end=${sectionEnd}`,
          { method: "GET" }
        );
        bedRespond = await GetBedData(
          "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
          curChrName,
          Number(sectionStart),
          Number(sectionEnd)
        );
        bigWigRespond = await GetBigData(
          "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig",
          curChrName,
          Number(sectionStart),
          Number(sectionEnd)
        );

        // change future chr tracks txstart and txend and pass to the track component so new coord onlu need to udpate once
        let gotResult = await userRespond.json();

        if (i !== 0) {
          for (let i = 0; i < gotResult.length; i++) {
            gotResult[i].txStart += Number(startRegion);
            gotResult[i].txEnd += Number(startRegion);
          }
          for (let i = 0; i < bedRespond.length; i++) {
            bedRespond[i].start += Number(startRegion);
            bedRespond[i].end += Number(startRegion);
          }
          for (let i = 0; i < bigWigRespond.length; i++) {
            bigWigRespond[i].start += Number(startRegion);
            bigWigRespond[i].end += Number(startRegion);
          }
        }

        tmpResult = [...tmpResult, ...gotResult];
        tmpBed = [...tmpBed, ...bedRespond];
        tmpBigWig = [...tmpBigWig, ...bigWigRespond];
      } catch {}
    }

    const bedResult = tmpBed;
    const result = tmpResult;
    const bigWigResult = tmpBigWig;

    tempObj["location"] = `${maxBp - bpRegionSize}:${maxBp}`;
    tempObj["result"] = result;
    tempObj["bedResult"] = bedResult;
    tempObj["bigWigResult"] = bigWigResult;
    tempObj["side"] = "right";
    if (initial) {
      tempObj["initial"] = 1;
      setGenomeTrackR({ ...tempObj });
      setMinBp(minBp - bpRegionSize);
    } else {
      tempObj["initial"] = 0;
      setGenomeTrackR({ ...tempObj });
    }
    if (maxBp <= chrLength[chrIndexRight]) {
      setMaxBp(maxBp + bpRegionSize);
    }
    setIsLoading(false);
  }

  //________________________________________________________________________________________________________________________________________________________
  //________________________________________________________________________________________________________________________________________________________

  async function fetchGenomeData2() {
    ///////-__________________________________________________________________________________________________________________________
    let tmpRegion: Array<any> = [];
    let tempObj = {};
    let bigWigRespond;

    let tmpBigWig: Array<any> = [];
    if (minBp < 0) {
      let totalEndBp = 0;
      let endBp = minBp + bpRegionSize;
      let tmpChrIdx = chrIndexLeft - 1;
      tmpRegion.push(
        `${chrData[chrIndexLeft]}` +
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

      while (minBp < totalEndBp) {
        if (minBp < totalEndBp - chrLength[tmpChrIdx]) {
          chrEnd = chrLength[tmpChrIdx];
        } else {
          chrEnd = -(totalEndBp - chrLength[tmpChrIdx]) - -minBp;
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

      setchrIndexLeft(tmpChrIdx + 1);

      setMinBp(chrEnd - bpRegionSize);
    } else {
      tmpRegion.push(
        `${chrData[chrIndexLeft]}` +
          ":" +
          `${minBp}` +
          "-" +
          `${minBp + bpRegionSize}` +
          "|" +
          +`${minBp}` +
          "-" +
          `${minBp + bpRegionSize}`
      );
    }

    let userRespond;
    let bedRespond;
    let tmpResult: Array<any> = [];
    let tmpBed: Array<any> = [];
    let tmpEndCoord = maxBp;
    for (let i = 0; i < tmpRegion.length; i++) {
      let sectionRegion = tmpRegion[i];
      const [curChrName, bpCoord] = sectionRegion.split(":");
      const [totalBp, sectionBp] = bpCoord.split("|");

      const [startRegion, endRegion] = totalBp.split("-");
      const [sectionStart, sectionEnd] = sectionBp.split("-");

      try {
        userRespond = await fetch(
          `${AWS_API}/${genome.name}/genes/refGene/queryRegion?chr=${curChrName}&start=${sectionStart}&end=${sectionEnd}`,
          { method: "GET" }
        );
        bedRespond = await GetBedData(
          "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
          curChrName,
          Number(sectionStart),
          Number(sectionEnd)
        );
        bigWigRespond = await GetBigData(
          "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig",
          curChrName,
          Number(sectionStart),
          Number(sectionEnd)
        );

        // change future chr tracks txstart and txend and pass to the track component so new coord onlu need to udpate once
        let gotResult = await userRespond.json();

        if (i !== 0) {
          for (let i = 0; i < gotResult.length; i++) {
            gotResult[i].txStart = -(
              Number(startRegion) +
              (Number(sectionEnd) - Number(gotResult[i].txStart))
            );
            gotResult[i].txEnd = -(
              Number(startRegion) +
              (Number(sectionEnd) - Number(gotResult[i].txEnd))
            );
          }
          for (let i = 0; i < bedRespond.length; i++) {
            bedRespond[i].start =
              Number(startRegion) +
              (Number(sectionEnd) - Number(gotResult[i].start));
            bedRespond[i].end = -(
              Number(startRegion) +
              (Number(sectionEnd) - Number(gotResult[i].end))
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

          tmpEndCoord;
        }

        tmpResult = [...tmpResult, ...gotResult];
        tmpBed = [...tmpBed, ...bedRespond];
        tmpBigWig = [...tmpBigWig, ...bigWigRespond];
      } catch {}
    }

    const bedResult = tmpBed;
    const result = tmpResult;
    const bigWigResult = tmpBigWig;
    tempObj["result"] = result;
    tempObj["bedResult"] = bedResult;
    tempObj["bigWigResult"] = bigWigResult;
    tempObj["side"] = "left";

    tempObj["location"] = `${minBp}:${minBp + bpRegionSize}`;
    ///////-__________________________________________________________________________________________________________________________

    tempObj["side"] = "left";
    setGenomeTrackR({ ...tempObj });
    if (minBp >= 0) {
      setMinBp(minBp - bpRegionSize);
    }
    setIsLoading(false);
  }
  function TrackComp() {
    return trackComponent.map((Component, index) => (
      <Component
        key={index}
        bpRegionSize={bpRegionSize}
        bpToPx={bpToPx}
        trackData={genomeTrackR}
        side={side}
        trackWidth={windowWidth}
      />
    ));
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
    async function getData() {
      await fetchGenomeData(1);
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
        overflow: "hidden",
        margin: "auto",
      }}
    >
      <button onClick={handleClick}>add bed</button>

      <div>{bpX}</div>

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
          size={20}
          thickness={4}
        />
      ) : (
        <div>DATA READY LETS GO</div>
      )}

      <div
        style={{
          flex: "1",
          display: "flex",
          //makes element align right
          justifyContent: dragX.current <= 0 ? "flex-start" : "flex-end",

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
            //makes element align right
            alignItems: dragX.current <= 0 ? "flex-start" : "flex-end",
            flexDirection: "column",
          }}
        >
          {trackComponent.map((Component, index) => (
            <Component
              key={index}
              bpRegionSize={bpRegionSize}
              bpToPx={bpToPx}
              trackData={genomeTrackR}
              side={side}
              trackWidth={windowWidth}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TrackManager;
