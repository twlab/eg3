/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import TrackManager from "./TrackManager";

import { DefaultTrack } from "../../localdata/defaulttrack";
import { ChromosomeData } from "../../localdata/chromosomedata";
import { AnnotationTrackData } from "../../localdata/annotationtrackdata";
import { TwoBitUrlData } from "../../localdata/twobiturl";
import { PublicHubAllData } from "../../localdata/publichub";

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
  const [items, setItems] = useState();
  const [genomeList, setGenomeList] = useState<Array<any>>(
    props.selectedGenome
  );
  const [genRefView, setgenRefView] = useState(<></>);
  const [bedView, setBedView] = useState(<></>);
  const [bedDensityView, setBedDensityView] = useState(<></>);
  const [TrackManagerView, setTrackManagerView] = useState(<></>);
  function addGenome(currGenome: any) {
    props.addToView(currGenome);
  }

  function addTrack(curGen: any) {
    curGen.genome.defaultRegion = curGen.region;
    curGen.genome.defaultTracks = [
      ...curGen.genome.defaultTracks,
      { name: "bed" },
    ];
    let newList = [curGen.genome];
    setGenomeList(newList);
    setTrackManagerView(<></>);
  }
  function getSelectedGenome() {
    // const serializedArray = JSON.stringify(props.selectedGenome[0]);
    // sessionStorage.setItem("myArray", serializedArray);

    if (props.selectedGenome != undefined) {
      for (let i = 0; i < props.selectedGenome.length; i++) {
        console.log(props.selectedGenome[i]);
        setTrackManagerView(<></>);
      }
      //goes through selected genome and create the tracks that are applicable to them
      //users can display mutiple genome and their tracks at the same time
      //features to be add:
      //1. user can add or delete track from each genome
      //2. use styling to display the genomes in multi view
      //3. add more types of tracks, currently only TrackManagering on genRef
      // setgenRefView(
      //   props.selectedGenome.map((item: any, index) => (
      //     <GenRefTrack key={index} currGenome={item} />
      //   ))
      // );
    }
  }

  //TrackManagerING DELETE THIS PART WHEN READYT
  useEffect(() => {
    async function handler() {
      // const storedArray = sessionStorage.getItem("myArray");
      // console.log("IOTWORK>?");
      // if (storedArray !== null) {
      //   const parsedArray = JSON.parse(storedArray);
      //   setTrackManagerView(
      //     <TrackManager currGenome={parsedArray} addTrack={addTrack} />
      //   );
      // } else
      // if (props.selectedGenome.length !== 0) {
      //   getSelectedGenome();
      // } else {
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
      setTrackManagerView(
        <TrackManager currGenome={testGen} addTrack={addTrack} />
      );
      // }
    }
    handler();
  }, []);

  useEffect(() => {
    async function handler() {
      if (genomeList.length !== 0)
        setTrackManagerView(
          <TrackManager currGenome={genomeList[0]} addTrack={addTrack} />
        );
    }
    handler();
  }, [genomeList]);
  return (
    <div>
      {/* {items}
      {bedDensityView}
      {bedView} */}
      {TrackManagerView}
    </div>
  );
}

export default GenomeHub;
