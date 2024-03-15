import { useEffect, useState } from "react";
import Homepage from "./Homepage-Components/Homepage";
import { BrowserRouter, Link, Switch, Route } from "react-router-dom";
import GenomeHub from "./Genome-Hub-Components/GenomeHub";
import { treeOfLifeObj } from "../localdata/treeoflife";
import { DefaultRegionData } from "../localdata/defaultregiondata";
import mainLogo from "../assets/images/icon.png";
import "../assets/main.css";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

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
function App() {
  // Used to display the home screen and genomehub
  // if a user add or update a new genome to aws bucket the homeView will be updated with a new state and render the newly added genome
  // if a user select or delete from their selected genomes of choice then the genomeView will update our genomehub
  const [genomeView, setGenomeView] = useState(<></>);
  const [homeView, setHomeView] = useState(<></>);

  // list of genome the user has choosen to view
  const [selectedGenome, setSelectedGenome] = useState(Array<any>);

  // all current genome data and url from aws database or local database
  const [allGenome, setAllGenome] = useState<{ [key: string]: any }>({});

  // object to create Genome-Picker
  const [treeOfLife, setTreeOfLife] = useState<{ [key: string]: any }>({});

  // object for checking if user select the same genome
  const [currSelectGenome, setCurrSelectGenome] = useState({});

  function addGenomeView(obj: any) {
    if (!currSelectGenome[obj.name as keyof typeof currSelectGenome]) {
      if (selectedGenome.length < 3)
        setSelectedGenome((prevList: any) => {
          return [...prevList, obj];
        });
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
        Bucket: "genomehubs",
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
          ...allGenome,
          ...tempObj,
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
        for (let genomeName of treeOfLifeObj[key].assemblies) {
          tempObj[genomeName] = {
            name: genomeName,
            species: key,
            defaultRegion: DefaultRegionData[genomeName],
          };
        }
      }
      const updatedData = {
        ...allGenome,
        ...tempObj,
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
  useEffect(() => {
    setHomeView(
      <Homepage
        addToView={addGenomeView}
        treeOfLife={treeOfLife}
        allGenome={allGenome}
        s3Config={s3Config}
        addNewGenomeObj={addNewGenomeObj}
        selectedGenome={selectedGenome}
      />
    );
  }, [allGenome, selectedGenome, treeOfLife]);

  //This useeffect triggers when selectedGenome data is updated
  //This tells us that the GenomeHub component needs to update because a user added or delete a genome from their list
  useEffect(() => {
    setGenomeView(
      <GenomeHub
        selectedGenome={selectedGenome}
        allGenome={allGenome}
        addToView={addGenomeView}
      />
    );
  }, [selectedGenome]);

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
            {homeView}
          </Route>
          <Route path="/genome">{genomeView}</Route>
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;
