/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import TrackManager from "./TrackManager";
import Drag from "./commonComponents/chr-order/ChrOrder";
import { chrType } from "../../localdata/genomename";

import { v4 as uuidv4 } from "uuid";
import useResizeObserver from "./Resize";
import HG38 from "../../models/genomes/hg38/hg38";

export const AWS_API = "https://lambda.epigenomegateway.org/v2";

function GenomeHub(props: any) {
  const stateChangeCount = useRef(0);
  const [items, setItems] = useState(chrType);
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
  function startBp(region: string) {
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
  // causing extra data to be sent
  useEffect(() => {
    if (stateChangeCount.current === 0) {
      // first render has windowWidth 0px so we skip
    } else if (stateChangeCount.current === 1) {
      // second state change we set genomeList with the new size width, or if there a session data we can set it here, or if theres no data from homepage or session can set empty track, or link back to homepagea

      // FOR TESTTING________________________________________________________________________________________

      HG38["genomeID"] = uuidv4();
      HG38["windowWidth"] = size.width;
      setGenomeList(new Array<any>(HG38));

      // uncomment this when we are done
      // getSelectedGenome(size.width);
    } else if (stateChangeCount.current > 1) {
      // every state change after 1 will be resizing, need to get navCoord from trackmanager and set it with new genome object and new key to sent

      //______ for test
      // let chrObj = {};
      // for (const chromosome of ChromosomeData["HG38"]) {
      //   chrObj[chromosome.getName()] = chromosome.getLength();
      // }

      // let featureArray = makeNavContext("HG38");

      // let testGen: any = {
      //   name: "hg38",
      //   species: "human",
      //   id: uuidv4(),
      //   windowWidth: size.width,
      //   visData: "",
      //   // testing mutiple chr 'chr7:150924404-152924404'

      //   //chr7:27053397-27373765
      //   // chr7:10000-20000
      //   //testing finemode  27213325-27213837
      //   //chr7:159159564-chr8:224090
      //   featureArray,
      //   defaultRegion: "chr7:27053397-27373765",
      //   chrOrder: items,
      //   chromosomes: chrObj,
      //   size: false,
      //   defaultTracks: [
      //     new TrackModel({
      //       type: "geneAnnotation",
      //       name: "refGene",
      //       genome: "hg38",
      //     }),
      //     // {
      //     //   name: "bed",
      //     //   genome: "hg19",
      //     //   url: "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
      //     // },

      //     {
      //       name: "bigWig",
      //       genome: "hg19",
      //       url: "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig",
      //     },

      //     {
      //       name: "dynseq",
      //       genome: "hg19",
      //       url: "https://target.wustl.edu/dli/tmp/deeplift.example.bw",
      //     },
      //     {
      //       name: "methylc",
      //       genome: "hg19",
      //       url: "https://vizhub.wustl.edu/public/hg19/methylc2/h1.liftedtohg19.gz",
      //     },
      //     {
      //       name: "hic",
      //       url: "https://epgg-test.wustl.edu/dli/long-range-test/test.hic",
      //       genome: "hg19",
      //     },
      //     {
      //       name: "hic",
      //       url: "https://epgg-test.wustl.edu/dli/long-range-test/test.hic",
      //       genome: "hg19",
      //     },
      //     {
      //       name: "genomealign",
      //       genome: "hg38",
      //       url: "https://vizhub.wustl.edu/public/hg38/weaver/hg38_mm10_axt.gz",
      //       trackModel: {
      //         name: "hg38tomm10",
      //         label: "Query mouse mm10 to hg38 blastz",
      //         querygenome: "mm10",
      //         filetype: "genomealign",
      //         url: "https://vizhub.wustl.edu/public/hg38/weaver/hg38_mm10_axt.gz",
      //       },
      //     },
      //   ],
      //   annotationTrackData: AnnotationTrackData["HG19"],
      //   publicHubData: PublicHubAllData["HG19"]["publicHubData"],
      //   publicHubList: PublicHubAllData["HG19"]["publicHubList"],
      //   twoBitURL: TwoBitUrlData["HG19"],
      // };

      //   let tempGenomeArr = new Array<any>(testGen);

      //   setGenomeList([...tempGenomeArr]);

      HG38["genomeID"] = uuidv4();
      HG38["windowWidth"] = size.width;
      setGenomeList(new Array<any>(HG38));
    }

    stateChangeCount.current++;

    // if(props.selectedGenome.length === 0)
    // const storedArray = sessionStorage.getItem("myArray");
    // const chrOrderStorage = sessionStorage.getItem("chrOrder");
    // if (storedArray !== null) {
    //   const parsedArray = JSON.parse(storedArray);
    //   if (chrOrderStorage !== null) {
    //     setItems([...JSON.parse(chrOrderStorage)]);
    //     parsedArray.chrOrder = [...JSON.parse(chrOrderStorage)];
    //   }
    //   setGenomeList(new Array<any>(parsedArray));
    // } else

    //  else else {
    //     initialRender.current = false;
    //   }
    //   // }
    // }
  }, [size]);

  return (
    <div data-theme={"light"}>
      {/* <div style={{ display: "flex" }}>
        <Drag items={items} changeChrOrder={changeChrOrder} />
      </div> */}
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        style={{
          paddingLeft: "75px",
          paddingRight: "75px",
        }}
      >
        <p>Width: {size.width}px</p>
        <p>Height: {size.height}px</p>
      </div>
      {genomeList.map((item, index) => (
        <TrackManager
          key={item.genomeID}
          genomeIdx={index}
          addTrack={addTrack}
          startBp={startBp}
          genomeArr={genomeList}
          windowWidth={item.windowWidth}
        />
      ))}
    </div>
  );
}

export default GenomeHub;
