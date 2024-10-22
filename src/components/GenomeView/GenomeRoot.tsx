/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import TrackManager from "./TrackManager";
import Drag from "./commonComponents/chr-order/ChrOrder";
import { chrType } from "../../localdata/genomename";
import { SelectDemo } from "./tesShadcn";
import { v4 as uuidv4 } from "uuid";
import useResizeObserver from "./commonComponents/Resize";

import { getGenomeConfig } from "../../models/genomes/allGenomes";
import OpenInterval from "../../models/OpenInterval";

export const AWS_API = "https://lambda.epigenomegateway.org/v2";

function GenomeHub(props: any) {
  const curNavRegion = useRef<{ [key: string]: any }>({ start: 0, end: 0 });
  const [items, setItems] = useState(chrType);
  const [isInitial, setIsInitial] = useState<boolean>(true);
  const [genomeList, setGenomeList] = useState<Array<any>>([]);
  const [ref, size] = useResizeObserver();

  // for hic track when being added, create an instance of straw to be sent to the track so it can be used to query
  function addTrack(curGen: any) {
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
  }
  function startBp(region: string, startNav: number, endNav: number) {
    curNavRegion.current.start = startNav;
    curNavRegion.current.end = endNav;
    let newList = { ...genomeList[0] };
    newList.defaultRegion = region;
    const serializedArray = JSON.stringify(newList);
    sessionStorage.setItem("myArray", serializedArray);
  }
  function changeChrOrder(chrArr: any) {
    let newList = { ...genomeList[0] };
    newList.chrOrder = chrArr;
    setItems([...chrArr]);
    setGenomeList([...newList]);

    const serializedArray = JSON.stringify(chrArr);

    sessionStorage.setItem("chrOrder", serializedArray);
  }
  function getSelectedGenome(windowWidth: number) {
    if (props.selectedGenome.length > 0) {
      let tempGeneArr: Array<any> = props.selectedGenome.map(
        (genome, index) => {
          genome["genomeID"] = uuidv4();
          genome["windowWidth"] = windowWidth;
          // need to account for when chr changes order so we can change the nav coord order and change featureStart so everything is still in order
          // (genome["chrOrder"] = items);

          return genome;
        }
      );
      const serializedArray = JSON.stringify(props.selectedGenome);
      sessionStorage.setItem("myArray", serializedArray);

      setGenomeList(tempGeneArr);
    }
  }
  // function makeNavContext(name) {
  //   const features = ChromosomeData[name].map((chr) => {
  //     const name = chr.getName();
  //     return new Feature(
  //       name,
  //       new ChromosomeInterval(name, 0, chr.getLength())
  //     );
  //   });
  //   return new NavigationContext("HG38", features);
  // }
  // this useEffect trigger twice, once at initial render, and when it resize from 0 to the user window screens, so we need to account for two changing of states
  // changing genomeList state twice will mess up the data sent to trackManager.
  // having an intial render [] will cause setGenomeList to be sent twice messing up the data because they happen at the same time because the Id get changed immdeiately
  // causing extra data to be sentz
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
      style={{
        paddingLeft: "1%",
        paddingRight: "1%",
      }}
    >
      <div ref={ref as React.RefObject<HTMLDivElement>}>
        {/* <div style={{ display: "flex" }}>
        <Drag items={items} changeChrOrder={changeChrOrder} />
      </div> */}
        <SelectDemo />
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
    </div>
  );
}

export default GenomeHub;
