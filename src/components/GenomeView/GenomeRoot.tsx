/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import TrackManager from "./TrackManager";
import Drag from "./commonComponents/chr-order/ChrOrder";
import { chrType } from "../../localdata/genomename";
import { ChromosomeData } from "../../localdata/chromosomedata";
import { AnnotationTrackData } from "../../localdata/annotationtrackdata";
import { PublicHubAllData } from "../../localdata/publichub";
import { TwoBitUrlData } from "../../localdata/twobiturl";

import NavigationContext from "../../models/NavigationContext";
import ChromosomeInterval from "../../models/ChromosomeInterval";
import Feature from "../../models/Feature";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import OpenInterval from "../../models/OpenInterval";
import HG38 from "../../models/genomes/hg38/hg38";
import { v4 as uuidv4 } from "uuid";
import useResizeObserver from "./Resize";
interface ViewExpansion {
  /**
   * Total width, in pixels, of the expanded view
   */
  visWidth: number;

  /**
   * Expanded region
   */
  visRegion: DisplayedRegionModel;

  /**
   * The X range of pixels that would display the unexpanded region
   */
  viewWindow: OpenInterval;

  /**
   * Unexpanded region; the region displayed in the viewWindow
   */
  viewWindowRegion: DisplayedRegionModel;
}
export const AWS_API = "https://lambda.epigenomegateway.org/v2";

/**
 * The GenomeHub root component. This is where track component are gathered and organized
 * for the genomes that the user selected
 */

//TO-DO: HAVE a class that has all the fetch/setstrand for data types.
// i.e class trackmethods
// sent track type json to the the track manager to decide what track to display
// using track type sent use the indicator to use the right methods from json fetch and setstrand.
//

function GenomeHub(props: any) {
  const initialRender = useRef(true);
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
  function getSelectedGenome() {
    if (props.selectedGenome != undefined) {
      let newList = props.selectedGenome[0];
      newList["id"] = uuidv4();
      (newList.defaultTracks = [
        {
          type: "geneAnnotation",
          name: "refGene",
          genome: "hg38",
        },
        // {
        //   name: "bed",
        //   genome: "hg19",
        //   url: "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
        // },

        {
          name: "bigWig",
          genome: "hg19",
          url: "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig",
        },

        {
          name: "dynseq",
          genome: "hg19",
          url: "https://target.wustl.edu/dli/tmp/deeplift.example.bw",
        },
        {
          name: "methylc",
          genome: "hg19",
          url: "https://vizhub.wustl.edu/public/hg19/methylc2/h1.liftedtohg19.gz",
        },
        {
          name: "hic",
          url: "https://epgg-test.wustl.edu/dli/long-range-test/test.hic",
          genome: "hg19",
        },
        {
          name: "hic",
          url: "https://epgg-test.wustl.edu/dli/long-range-test/test.hic",
          genome: "hg19",
        },
        {
          name: "genomealign",
          genome: "hg38",
          url: "https://vizhub.wustl.edu/public/hg38/weaver/hg38_mm10_axt.gz",
          trackModel: {
            name: "hg38tomm10",
            label: "Query mouse mm10 to hg38 blastz",
            querygenome: "mm10",
            filetype: "genomealign",
            url: "https://vizhub.wustl.edu/public/hg38/weaver/hg38_mm10_axt.gz",
          },
        },
      ]),
        (newList.chrOrder = items);
      const serializedArray = JSON.stringify(newList);
      sessionStorage.setItem("myArray", serializedArray);
      for (let i = 0; i < props.selectedGenome.length; i++) {
        setGenomeList(new Array<any>(newList));
      }
    }
  }
  function makeNavContext(name) {
    const features = ChromosomeData[name].map((chr) => {
      const name = chr.getName();
      return new Feature(
        name,
        new ChromosomeInterval(name, 0, chr.getLength())
      );
    });
    return new NavigationContext("HG38", features);
  }
  useEffect(() => {
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
    if (props.selectedGenome.length !== 0) {
      getSelectedGenome();
    } else {
      if (!initialRender.current) {
        let chrObj = {};
        for (const chromosome of ChromosomeData["HG38"]) {
          chrObj[chromosome.getName()] = chromosome.getLength();
        }
        // let straw = new HicStraw({
        //   url: "https://epgg-test.wustl.edu/dli/long-range-test/test.hic",
        // });
        // let metadata = straw.getMetaData();
        // let normOptions = straw.getNormalizationOptions();
        let featureArray = makeNavContext("HG38");

        let testGen: any = {
          name: "hg38",
          species: "human",
          id: uuidv4(),
          windowWidth: size.width,
          visData: "",
          // testing mutiple chr 'chr7:150924404-152924404'

          //chr7:27053397-27373765
          // chr7:10000-20000
          //testing finemode  27213325-27213837
          //chr7:159159564-chr8:224090
          featureArray,
          defaultRegion: "chr7:27053397-27373765",
          chrOrder: items,
          chromosomes: chrObj,
          size: false,
          defaultTracks: [
            {
              type: "geneAnnotation",
              name: "refGene",
              genome: "hg38",
            },
            // {
            //   name: "bed",
            //   genome: "hg19",
            //   url: "https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz",
            // },

            {
              name: "bigWig",
              genome: "hg19",
              url: "https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig",
            },

            {
              name: "dynseq",
              genome: "hg19",
              url: "https://target.wustl.edu/dli/tmp/deeplift.example.bw",
            },
            {
              name: "methylc",
              genome: "hg19",
              url: "https://vizhub.wustl.edu/public/hg19/methylc2/h1.liftedtohg19.gz",
            },
            {
              name: "hic",
              url: "https://epgg-test.wustl.edu/dli/long-range-test/test.hic",
              genome: "hg19",
            },
            {
              name: "hic",
              url: "https://epgg-test.wustl.edu/dli/long-range-test/test.hic",
              genome: "hg19",
            },
            {
              name: "genomealign",
              genome: "hg38",
              url: "https://vizhub.wustl.edu/public/hg38/weaver/hg38_mm10_axt.gz",
              trackModel: {
                name: "hg38tomm10",
                label: "Query mouse mm10 to hg38 blastz",
                querygenome: "mm10",
                filetype: "genomealign",
                url: "https://vizhub.wustl.edu/public/hg38/weaver/hg38_mm10_axt.gz",
              },
            },
          ],
          annotationTrackData: AnnotationTrackData["HG19"],
          publicHubData: PublicHubAllData["HG19"]["publicHubData"],
          publicHubList: PublicHubAllData["HG19"]["publicHubList"],
          twoBitURL: TwoBitUrlData["HG19"],
        };

        {
          let tempGenomeArr = new Array<any>(testGen);

          setGenomeList([...tempGenomeArr]);
        }
      } else {
        initialRender.current = false;
      }
      // }
    }
  }, [size]);

  return (
    <>
      {/* <div style={{ display: "flex" }}>
        <Drag items={items} changeChrOrder={changeChrOrder} />
      </div> */}
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        style={{
          border: "1px solid black",
          paddingLeft: "20px",
          paddingRight: "20px",
        }}
      >
        <p>Width: {size.width}px</p>
        <p>Height: {size.height}px</p>
      </div>
      {genomeList.map((item, index) => (
        <TrackManager
          key={item.id}
          genomeIdx={index}
          addTrack={addTrack}
          startBp={startBp}
          genomeArr={genomeList}
          windowWidth={item.windowWidth}
        />
      ))}
    </>
  );
}

export default GenomeHub;

//  else {
//         let chrObj = {};
//         for (const chromosome of ChromosomeData["HG38"]) {
//           chrObj[chromosome.getName()] = chromosome.getLength();
//         }
//         let testGen: any = {
//           name: "hg38",
//           species: "human",
//           defaultRegion: "chr7:27053397-27373765",

//           chromosomes: chrObj,
//           defaultTracks: [
//             {
//               type: "geneAnnotation",
//               name: "refGene",
//               genome: "hg38",
//             },
//             {
//               name: "bed",
//               genome: "hg38",
//             },
//             {
//               name: "bedDensity",

//               genome: "hg38",
//             },
//           ],
//           annotationTrackData: AnnotationTrackData["HG38"],
//           publicHubData: PublicHubAllData["HG38"]["publicHubData"],
//           publicHubList: PublicHubAllData["HG38"]["publicHubList"],
//           twoBitURL: TwoBitUrlData["HG38"],
//         };
//         setGenomeList(testGen);

//         // }
//       }
