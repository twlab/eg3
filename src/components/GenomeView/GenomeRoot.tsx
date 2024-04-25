/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import TrackManager from "./TrackManager";

import { DefaultTrack } from "../../localdata/defaulttrack";
import { ChromosomeData } from "../../localdata/chromosomedata";
import { AnnotationTrackData } from "../../localdata/annotationtrackdata";
import { TwoBitUrlData } from "../../localdata/twobiturl";
import { PublicHubAllData } from "../../localdata/publichub";
import { parse } from "path";
import Drag from "./ChrOrder";

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
  const [items, setItems] = useState([
    "chr1",
    "chr2",
    "chr3",
    "chr4",
    "chr5",
    "chr6",
    "chr7",
    "chr8",
    "chr9",
    "chr10",
    "chr11",
    "chr12",
    "chr13",
    "chr14",
    "chr15",
    "chr16",
    "chr17",
    "chr18",
    "chr19",
    "chr20",
    "chr21",
    "chr22",
    "chr23",
    "chr24",
    "chr25",
    "chr26",
    "chr27",
    "chr28",
    "chr29",
    "chr30",
    "chr31",
    "chr32",
    "chr33",
    "chr34",
    "chr35",
    "chr36",
    "chr37",
    "chr38",
    "chrM",
    "chrUn",
    "chrY",
    "chrX",
  ]);
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
    setGenomeList([...newList]);
    setTrackManagerView(<></>);
  }
  function startBp(region: string) {
    console.log(region);
    let newList = { ...genomeList[0] };
    newList.defaultRegion = region;
    const serializedArray = JSON.stringify(newList);
    sessionStorage.clear();
    sessionStorage.setItem("myArray", serializedArray);
  }
  function changeChrOrder(chrArr: any) {
    setItems([...chrArr]);
  }
  function getSelectedGenome() {
    if (props.selectedGenome != undefined) {
      let newList = props.selectedGenome[0];

      newList.defaultTracks = [
        {
          type: "geneAnnotation",
          name: "refGene",
          genome: "hg38",
        },
        {
          name: "bed",
          genome: "hg38",
        },
        {
          name: "bedDensity",

          genome: "hg38",
        },
      ];
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
      if (storedArray !== null) {
        const parsedArray = JSON.parse(storedArray);
        const newObj: { [key: string]: any } = parsedArray;
        setGenomeList(new Array<any>(newObj));
      } else if (props.selectedGenome.length !== 0) {
        getSelectedGenome();
      } else {
        let chrObj = {};
        for (const chromosome of ChromosomeData["HG38"]) {
          chrObj[chromosome.getName()] = chromosome.getLength();
        }
        let testGen: any = {
          name: "hg38",
          species: "human",
          defaultRegion: "chr7:27053397-27373765",

          chromosomes: chrObj,
          defaultTracks: [
            {
              type: "geneAnnotation",
              name: "refGene",
              genome: "hg38",
            },
            {
              name: "bed",
              genome: "hg38",
            },
            {
              name: "bedDensity",

              genome: "hg38",
            },
          ],
          annotationTrackData: AnnotationTrackData["HG38"],
          publicHubData: PublicHubAllData["HG38"]["publicHubData"],
          publicHubList: PublicHubAllData["HG38"]["publicHubList"],
          twoBitURL: TwoBitUrlData["HG38"],
        };
        setGenomeList(testGen);

        // }
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
            chrOrder={items}
            startBp={startBp}
          />
        );
      }
    }
    handler();
  }, [genomeList]);

  useEffect(() => {
    async function handler() {
      if (genomeList.length !== 0) {
        setTrackManagerView(
          <TrackManager
            currGenome={genomeList[0]}
            addTrack={addTrack}
            chrOrder={items}
            startBp={startBp}
          />
        );
      }
    }
    handler();
  }, [items]);
  return (
    <>
      <div style={{ display: "flex" }}>
        <Drag items={items} changeChrOrder={changeChrOrder} />
      </div>
      <div>
        {/* {items}
    {bedDensityView}
    {bedView} */}
        {TrackManagerView}
      </div>
    </>
  );
}

export default GenomeHub;
