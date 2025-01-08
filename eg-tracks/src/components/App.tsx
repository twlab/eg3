import ReduxProvider from "@/lib/redux/provider";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { MotionConfig } from "framer-motion";
import { useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";

import mainLogo from "../assets/images/icon.png";
import { chrType, genKeyName, genName } from "../localdata/genomename";
import { treeOfLifeObj } from "../localdata/treeoflife";
import { genomeNameToConfig } from "../models/genomes/allGenomes";
import GenomeView from "./GenomeView/GenomeRoot";
import Homepage from "./Home/Homepage";
import RootLayout from "./root-layout/RootLayout";
import { GenomeProvider } from "@/lib/contexts/GenomeContext";
import * as firebase from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBvzikxx1wSAoVp_4Ra2IlktJFCwq8NAnk",
  authDomain: "chadeg3-83548.firebaseapp.com",
  databaseURL: "https://chadeg3-83548-default-rtdb.firebaseio.com",
  storageBucket: "chadeg3-83548.firebasestorage.app",
};

firebase.initializeApp(firebaseConfig);

export default function App() {
  return (
    <MotionConfig transition={snappyTransition}>
      <ReduxProvider>
        <GenomeProvider>
          <RootLayout />
        </GenomeProvider>
      </ReduxProvider>
    </MotionConfig>
  );
}

const snappyTransition = {
  type: "spring",
  damping: 30,
  stiffness: 400,
  mass: 0.8,
};

// this section needs to be moved to a backend if we want to access
// aws backend because it need access key and secret key
// if you  are trying to pull data from aws bucket then create an access token and input them here
// ---------------------------------------------------------------------------------------------------------------------
var s3Config = new S3Client({
  region: "abc",
  credentials: {
    accessKeyId: "123",
    secretAccessKey: "123",
  },
});
// ---------------------------------------------------------------------------------------------------------------------

const isLocal = 1;

function _App() {
  // Used to display the home screen and GenomeView
  // if a user add or update a new genome to aws bucket the homeView will be updated with a new state and render the newly added genome
  // if a user select or delete from their selected genomes of choice then the genomeView will update our GenomeView

  // list of genome the user has choosen to view
  const [selectedGenome, setSelectedGenome] = useState<Array<any>>([]);

  // all current genome data and url from aws database or local database
  const [allGenome, setAllGenome] = useState<{ [key: string]: any }>({});

  // object to create Genome-Picker
  const [treeOfLife, setTreeOfLife] = useState<{ [key: string]: any }>({});

  // object for checking if user select the same genome
  const [currSelectGenome, setCurrSelectGenome] = useState({});
  function createGenKey(genome: string) {
    let genDataKey;
    for (let i = 0; i < genName.length; i++) {
      if (genName[i] === genome) {
        genDataKey = genKeyName[i];
        break;
      }
    }

    return genDataKey;
  }

  // function getChrData(key: string) {
  //   let chrList: Array<any> = [];
  //   let allChrData = ChromosomeData[key];
  //   for (const chromosome of allChrData) {
  //     if (chrType.includes(chromosome.getName())) {
  //       chrData.push(chromosome.getName());
  //       chrLength.push(chromosome.getLength());
  //     }
  //   }
  //   setChr(chrData.indexOf(region));
  // }
  function addGenomeView(obj: any) {
    sessionStorage.clear();

    if (
      !currSelectGenome[obj.genome.getName() as keyof typeof currSelectGenome]
    ) {
      if (selectedGenome.length < 1) {
        setSelectedGenome((prevList: any) => {
          return [...prevList, obj];
        });
      }
      let newObj: { [key: string]: any } = currSelectGenome;
      newObj[obj.name as keyof typeof newObj] = " ";
      setCurrSelectGenome(newObj);
    }
  }

  async function fetchGenomeData() {
    let tempTree: { [key: string]: any } = {};
    let tempObj: { [key: string]: any } = {};

    for (const key in treeOfLifeObj) {
      tempTree[key] = {
        assemblies: [...treeOfLifeObj[key].assemblies],
        color: treeOfLifeObj[key].color,
        logoUrl: treeOfLifeObj[key].logoUrl,
      };
    }
    // This is using aws sdk to get genome data from the bucket, if you are testing using local data look at else statement
    if (!isLocal) {
      var command = new ListObjectsV2Command({
        Bucket: "GenomeViews",
        StartAfter: "/",

        MaxKeys: 1000,
      });

      var isTruncated = true;

      while (isTruncated) {
        var { Contents, IsTruncated, NextContinuationToken } =
          await s3Config.send(command);
        for (var i = 0; i < Contents!.length; i++) {
          var arrStr = Contents![i].Key?.split(/[//]/);
          if (!tempObj[arrStr![1]] && arrStr![1] !== "") {
            var awsApiPathUrl = "/" + arrStr![0] + "/" + arrStr![1] + "/";
            tempTree[arrStr![0]]["assemblies"].push(arrStr![1]);
            tempObj[arrStr![1]] = {
              name: arrStr![1],
              species: arrStr![0],
              cytoBandUrl: awsApiPathUrl + "cytoBand.json",
              annotationUrl: awsApiPathUrl + "annotationTracks.json",
              genomeDataUrl: awsApiPathUrl + arrStr![1] + ".json",
            };
          }
        }
        const updatedData = {
          ...genomeNameToConfig,
        };
        const updatedTree = {
          ...treeOfLife,
          ...tempTree,
        };
        setTreeOfLife(updatedTree);
        setAllGenome(updatedData);
        isTruncated = IsTruncated!;
        command.input.ContinuationToken = NextContinuationToken;
      }
    }
    // Gather genome data from localdata folder and use it to create javascript objects to be used
    // on tracks
    else {
      for (const key in treeOfLifeObj) {
        // for (let genomeName of treeOfLifeObj[key].assemblies) {
        //   const genKey = createGenKey(genomeName);
        //   let chrObj = {};
        //   for (const chromosome of ChromosomeData[genKey]) {
        //     chrObj[chromosome.getName()] = chromosome.getLength();
        //   }
        //   tempObj[genomeName] = {
        //     name: genomeName,
        //     species: key,
        //     defaultRegion: DefaultRegionData[genKey],
        //     chromosomes: chrObj,
        //     defaultTracks: DefaultTrack[genKey],
        //     annotationTrackData: AnnotationTrackData[genKey],
        //     publicHubData: PublicHubAllData[genKey]["publicHubData"],
        //     publicHubList: PublicHubAllData[genKey]["publicHubList"],
        //     twoBitURL: TwoBitUrlData[genKey],
        //   };
        // }
      }
      const updatedData = {
        ...genomeNameToConfig,
      };
      const updatedTree = {
        ...treeOfLife,
        ...tempTree,
      };
      setTreeOfLife(updatedTree);
      setAllGenome(updatedData);
    }
  }
  function addNewGenomeObj() {
    fetchGenomeData();
  }

  //initial render will trigger this useeffect
  useEffect(() => {
    addNewGenomeObj();
  }, []);

  //This useeffect triggers when data is update to allGenome, selectedGenome or treeOfLife
  // the new data will be passed to Homepage component and re render the page with new data

  //This useeffect triggers when selectedGenome data is updated
  //This tells us that the GenomeView component needs to update because a user added or delete a genome from their list
  return (
    <div>
      <BrowserRouter>
        <div className="app-root-1">
          <header className="Paper-root AppBar-root AppBar-positionStatic AppBar-colorPrimary Paper-elevation4">
            <div className="Toolbar-root Toolbar-regular header-appBar-13 Toolbar-gutters">
              <div className="header-left-4"></div>
              <img
                src={mainLogo}
                alt="Browser Icon"
                style={{ height: 60, width: 70, marginRight: 20 }}
              />
              <div className="header-vertical-9"></div>
              <Link to="/">
                <h5 className="Typography-root header-logo-text">
                  Epigenome Browser
                </h5>
              </Link>
            </div>
          </header>
        </div>
        <Switch>
          <Route exact path="/">
            <Homepage
              addToView={addGenomeView}
              treeOfLife={treeOfLife}
              allGenome={allGenome}
              s3Config={s3Config}
              addNewGenomeObj={addNewGenomeObj}
              selectedGenome={selectedGenome}
            />
          </Route>
          <Route path="/genome">
            <GenomeView />
          </Route>
        </Switch>
      </BrowserRouter>
    </div>
  );
}
