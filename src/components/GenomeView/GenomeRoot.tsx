/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import GenRefTrack from "./GenRefTrack";
export const AWS_API = "https://lambda.epigenomegateway.org/v2";
/**
 * The GenomeHub root component. This is where track component are gathered and organized
 * for the genomes that the user selected
 */
function GenomeHub(props: any) {
  const [items, setItems] = useState();
  const [genRefView, setgenRefView] = useState(<></>);
  const [tabix, setTabix] = useState(<></>);
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
      //3. add more types of tracks, currently only testing on genRef
      setgenRefView(
        props.selectedGenome.map((item: any, index) => (
          <GenRefTrack key={index} currGenome={item} />
        ))
      );
    }
  }

  //TESTING DELETE THIS PART WHEN READYT
  useEffect(() => {
    setgenRefView(
      <GenRefTrack
        currGenome={{
          name: "mm10",
          species: "mouse",
          defaultRegion: "chr6:52149465-52164219",
        }}
      />
    );
  }, []);
  return (
    <div>
      {items}
      {genRefView}
    </div>
  );
}

export default GenomeHub;
