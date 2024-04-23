/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import TrackManager from "./TrackManager";

import { DefaultTrack } from "../../localdata/defaulttrack";
import { ChromosomeData } from "../../localdata/chromosomedata";
import { AnnotationTrackData } from "../../localdata/annotationtrackdata";
import { TwoBitUrlData } from "../../localdata/twobiturl";
import { PublicHubAllData } from "../../localdata/publichub";

const testgen: any = {
  name: "hg38",
  species: "human",
  defaultRegion: "chr7:27053397-27373765",
  cytobands: ChromosomeData["HG38"],
  defaultTracks: DefaultTrack["HG38"],
  annotationTrackData: AnnotationTrackData["HG38"],
  publicHubData: PublicHubAllData["HG38"]["publicHubData"],
  publicHubList: PublicHubAllData["HG38"]["publicHubList"],
  twoBitURL: TwoBitUrlData["HG38"],
};

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
  const [genRefView, setgenRefView] = useState(<></>);
  const [bedView, setBedView] = useState(<></>);
  const [bedDensityView, setBedDensityView] = useState(<></>);
  const [TrackManagerView, setTrackManagerView] = useState(<></>);
  function addGenome(currGenome: any) {
    props.addToView(currGenome);
  }
  function getSelectedGenome() {
    if (props.selectedGenome != undefined) {
      setItems(
        props.selectedGenome.map((item: any, index) => (
          <div key={index}>
            name: {item.name} species: {item.species}{" "}
          </div>
        ))
      );
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
    let tenGen2 = {
      name: "mm10",
      species: "mouse",
      defaultRegion: "chr6:52149465-52164219",
    };
    let testGen: any = {
      name: "hg38",
      species: "human",
      defaultRegion: "chr7:147053397-150373765",

      chromosomes: ChromosomeData["HG38"],
      defaultTracks: DefaultTrack["HG38"],
      annotationTrackData: AnnotationTrackData["HG38"],
      publicHubData: PublicHubAllData["HG38"]["publicHubData"],
      publicHubList: PublicHubAllData["HG38"]["publicHubList"],
      twoBitURL: TwoBitUrlData["HG38"],
    };
    setTrackManagerView(<TrackManager currGenome={testGen} />);
  }, []);
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
