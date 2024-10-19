import { useEffect, useRef, useState } from "react";
import TrackManager from "./TrackManager";
import { chrType } from "../../localdata/genomename";
import useResizeObserver from "./commonComponents/Resize";
import { v4 as uuidv4 } from "uuid";
import { getGenomeConfig } from "../../models/genomes/allGenomes";
import OpenInterval from "../../models/OpenInterval";

export const AWS_API = "https://lambda.epigenomegateway.org/v2";

function GenomeHub(props: any) {
  const curNavRegion = useRef<{ [key: string]: any }>({ start: 0, end: 0 });
  const [items, setItems] = useState(chrType);
  const [genomeList, setGenomeList] = useState<Array<any>>([]);
  const [ref, size] = useResizeObserver();
  const [isInitial, setIsInitial] = useState<boolean>(true);
  const addTrack = (curGen: any) => {
    curGen.genome.defaultRegion = curGen.region;
    curGen.genome.defaultTracks = [
      ...curGen.genome.defaultTracks,
      {
        name: "bigWig",
        genome: "hg19",
        url: "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig",
      },
    ];
    let newList = curGen.genome;

    const serializedArray = JSON.stringify(newList);

    sessionStorage.setItem("myArray", serializedArray);

    setGenomeList(new Array<any>(newList));
  };

  const startBp = (region: string, startNav: number, endNav: number) => {
    curNavRegion.current.start = startNav;
    curNavRegion.current.end = endNav;
    let newList = { ...genomeList[0] };
    newList.defaultRegion = region;
    const serializedArray = JSON.stringify(newList);
    sessionStorage.setItem("myArray", serializedArray);
  };

  const changeChrOrder = (chrArr: any) => {
    let newList = { ...genomeList[0] };
    newList.chrOrder = chrArr;
    setItems([...chrArr]);
    setGenomeList([...newList]);

    const serializedArray = JSON.stringify(chrArr);
    sessionStorage.setItem("chrOrder", serializedArray);
  };

  const getSelectedGenome = (windowWidth: number) => {
    if (props.selectedGenome.length > 0) {
      let tempGeneArr = props.selectedGenome.map((genome, index) => ({
        ...genome,
        genomeID: uuidv4(),
        windowWidth: windowWidth,
      }));
      const serializedArray = JSON.stringify(props.selectedGenome);
      sessionStorage.setItem("myArray", serializedArray);

      setGenomeList(tempGeneArr);
    }
  };
  useEffect(() => {
    if (props.name || genomeList.length > 0) {
      let curGenome = getGenomeConfig(props.name);
      curGenome["genomeID"] = uuidv4();
      curGenome["windowWidth"] = size.width;
      setGenomeList([curGenome]);

      curNavRegion.current.start = curGenome.defaultRegion.start;
      curNavRegion.current.end = curGenome.defaultRegion.end;
      setIsInitial(false);
    } else {
      let curGenome = getGenomeConfig("hg38");
      curGenome["genomeID"] = uuidv4();
      curGenome["windowWidth"] = size.width;
      setGenomeList([curGenome]);

      curNavRegion.current.start = curGenome.defaultRegion.start;
      curNavRegion.current.end = curGenome.defaultRegion.end;
      setIsInitial(false);
    }
  }, []);
  useEffect(() => {
    if (!isInitial) {
      let curGenome = getGenomeConfig("hg38");
      curGenome["genomeID"] = uuidv4();
      curGenome["windowWidth"] = size.width;
      if (curNavRegion.current.start === 0) {
        setGenomeList([curGenome]);

        curNavRegion.current.start = curGenome.defaultRegion.start;
        curNavRegion.current.end = curGenome.defaultRegion.end;
      } else {
        curGenome["defaultRegion"] = new OpenInterval(
          Math.round(curNavRegion.current.start),
          Math.round(curNavRegion.current.end)
        );

        setGenomeList([curGenome]);
      }
    }
  }, [isInitial, size.width]);

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{
        paddingLeft: "1%",
        paddingRight: "2%",
      }}
    >
      {genomeList.map((item, index) => (
        <TrackManager
          key={item.genomeID}
          genomeIdx={index}
          addTrack={addTrack}
          startBp={startBp}
          genomeArr={genomeList}
          windowWidth={size.width}
        />
      ))}
    </div>
  );
}

export default GenomeHub;
