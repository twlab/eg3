/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import TrackManager from "./TrackManager";
import Drag from "./ChrOrder";
import { chrType } from "../../localdata/genomename";
import { parse } from "path";
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
const windowWidth = window.innerWidth;
function GenomeHub(props: any) {
  const [items, setItems] = useState(chrType);
  const [genomeList, setGenomeList] = useState<Array<any>>(
    props.selectedGenome
  );
  const [TrackManagerView, setTrackManagerView] = useState(<></>);
  function addTrack(curGen: any) {
    curGen.genome.defaultRegion = curGen.region;
    curGen.genome.defaultTracks = [
      ...curGen.genome.defaultTracks,
      { name: "bed" },
    ];
    let newList = [curGen.genome];

    const serializedArray = JSON.stringify(newList);

    sessionStorage.setItem("myArray", serializedArray);
    setGenomeList([...newList]);
    setTrackManagerView(<></>);
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
    setGenomeList([newList]);

    const serializedArray = JSON.stringify(chrArr);

    sessionStorage.setItem("chrOrder", serializedArray);
    setTrackManagerView(<></>);
  }
  function getSelectedGenome() {
    if (props.selectedGenome != undefined) {
      let newList = props.selectedGenome[0];

      newList.defaultTracks = [
        {
          type: "geneAnnotation",
          name: "refGene",
          genome: newList.name,
        },
        {
          name: "bed",
          genome: newList.name,
        },
        {
          name: "bedDensity",

          genome: newList.name,
        },
      ];
      newList.chrOrder = items;
      newList.defaultRegion = "chr7:27053397-28573765";
      const serializedArray = JSON.stringify(newList);
      sessionStorage.setItem("myArray", serializedArray);
      for (let i = 0; i < props.selectedGenome.length; i++) {
        setGenomeList(new Array<any>(newList));
        setTrackManagerView(<></>);
      }
    }
  }

  useEffect(() => {
    async function handler() {
      const storedArray = sessionStorage.getItem("myArray");
      const chrOrderStorage = sessionStorage.getItem("chrOrder");
      if (storedArray !== null) {
        const parsedArray = JSON.parse(storedArray);
        if (chrOrderStorage !== null) {
          setItems([...JSON.parse(chrOrderStorage)]);
          parsedArray.chrOrder = [...JSON.parse(chrOrderStorage)];
        }
        setGenomeList(new Array<any>(parsedArray));
      } else if (props.selectedGenome.length !== 0) {
        getSelectedGenome();
      }
    }
    handler();
  }, []);

  useEffect(() => {
    async function handler() {
      if (genomeList.length !== 0) {
        setTrackManagerView(
          <TrackManager
            currGenome={genomeList[0]}
            addTrack={addTrack}
            startBp={startBp}
          />
        );
      }
    }
    handler();
  }, [genomeList]);

  return (
    <>
      <div style={{ display: "flex" }}>
        <Drag items={items} changeChrOrder={changeChrOrder} />
      </div>
      <div>{TrackManagerView}</div>
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
