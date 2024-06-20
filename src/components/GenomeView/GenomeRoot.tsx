/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react';
import TrackManager from './TrackManager';
import Drag from './commonComponents/chr-order/ChrOrder';
import { chrType } from '../../localdata/genomename';
import { ChromosomeData } from '../../localdata/chromosomedata';
import { AnnotationTrackData } from '../../localdata/annotationtrackdata';
import { PublicHubAllData } from '../../localdata/publichub';
import { TwoBitUrlData } from '../../localdata/twobiturl';
import HicStraw from 'hic-straw/dist/hic-straw.min.js';
export const AWS_API = 'https://lambda.epigenomegateway.org/v2';
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
  const [TrackManagerView, setTrackManagerView] = useState<any>();

  // for hic track when being added, create an instance of straw to be sent to the track so it can be used to query
  function addTrack(curGen: any) {
    curGen.genome.defaultRegion = curGen.region;
    curGen.genome.defaultTracks = [
      ...curGen.genome.defaultTracks,
      {
        name: 'bed',
        url: 'https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz',
      },
    ];
    let newList = [curGen.genome];

    const serializedArray = JSON.stringify(newList);

    sessionStorage.setItem('myArray', serializedArray);
    setGenomeList([...newList]);
    setTrackManagerView('');
  }
  function startBp(region: string) {
    let newList = { ...genomeList[0] };
    newList.defaultRegion = region;
    const serializedArray = JSON.stringify(newList);
    sessionStorage.setItem('myArray', serializedArray);
  }
  function changeChrOrder(chrArr: any) {
    let newList = { ...genomeList[0] };
    newList.chrOrder = chrArr;
    setItems([...chrArr]);
    setGenomeList([...newList]);

    const serializedArray = JSON.stringify(chrArr);

    sessionStorage.setItem('chrOrder', serializedArray);
    setTrackManagerView('');
  }
  function getSelectedGenome() {
    if (props.selectedGenome != undefined) {
      let newList = props.selectedGenome[0];
      let straw = new HicStraw({
        url: 'https://epgg-test.wustl.edu/dli/long-range-test/test.hic',
      });
      let metadata = straw.getMetaData();
      let normOptions = straw.getNormalizationOptions();
      newList.defaultTracks = [
        {
          type: 'geneAnnotation',
          name: 'refGene',
          genome: newList.name,
        },
        {
          name: 'bed',
          genome: newList.name,
          url: 'https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz',
        },

        {
          name: 'bigWig',
          genome: newList.name,
          url: 'https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig',
        },

        {
          name: 'dynseq',
          genome: 'hg19',
          url: 'https://target.wustl.edu/dli/tmp/deeplift.example.bw',
        },
        {
          name: 'methylc',
          genome: 'hg19',
          url: 'https://vizhub.wustl.edu/public/hg19/methylc2/h1.liftedtohg19.gz',
        },
        {
          name: 'hic',
          straw: straw,
          metadata: metadata,
          normOptions: normOptions,

          genome: 'hg19',
        },
      ];
      newList.chrOrder = items;
      const serializedArray = JSON.stringify(newList);
      sessionStorage.setItem('myArray', serializedArray);
      for (let i = 0; i < props.selectedGenome.length; i++) {
        setGenomeList(new Array<any>(newList));
        setTrackManagerView('');
      }
    }
  }

  useEffect(() => {
    async function handler() {
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
        let chrObj = {};
        for (const chromosome of ChromosomeData['HG38']) {
          chrObj[chromosome.getName()] = chromosome.getLength();
        }
        let straw = new HicStraw({
          url: 'https://epgg-test.wustl.edu/dli/long-range-test/test.hic',
        });
        let metadata = straw.getMetaData();
        let normOptions = straw.getNormalizationOptions();
        let testGen: any = {
          name: 'hg38',
          species: 'human',
          // testing mutiple chr 'chr7:150924404-152924404'
          defaultRegion: 'chr7:150924404-152924404',
          chrOrder: items,
          chromosomes: chrObj,
          defaultTracks: [
            {
              type: 'geneAnnotation',
              name: 'refGene',
              genome: 'hg19',
            },
            {
              name: 'bed',
              genome: 'hg19',
              url: 'https://epgg-test.wustl.edu/d/mm10/mm10_cpgIslands.bed.gz',
            },

            {
              name: 'bigWig',
              genome: 'hg19',
              url: 'https://vizhub.wustl.edu/hubSample/hg19/GSM429321.bigWig',
            },

            {
              name: 'dynseq',
              genome: 'hg19',
              url: 'https://target.wustl.edu/dli/tmp/deeplift.example.bw',
            },
            {
              name: 'methylc',
              genome: 'hg19',
              url: 'https://vizhub.wustl.edu/public/hg19/methylc2/h1.liftedtohg19.gz',
            },
            {
              name: 'hic',
              straw: straw,
              metadata: metadata,
              normOptions: normOptions,

              genome: 'hg19',
            },
          ],
          annotationTrackData: AnnotationTrackData['HG19'],
          publicHubData: PublicHubAllData['HG19']['publicHubData'],
          publicHubList: PublicHubAllData['HG19']['publicHubList'],
          twoBitURL: TwoBitUrlData['HG19'],
        };
        setGenomeList([...genomeList, testGen]);
        // setTrackManagerView(
        //   <TrackManager
        //     currGenome={testGen}
        //     addTrack={addTrack}
        //     startBp={startBp}
        //   />
        // );

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
            startBp={startBp}
          />
        );
      }
    }
    handler();
  }, [genomeList]);

  return (
    <>
      <div style={{ display: 'flex' }}>
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
