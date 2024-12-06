import { createContext, useContext, ReactNode, useEffect } from 'react';
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { useRef, useState } from "react";
import { chrType } from "../../localdata/genomename";
import { treeOfLifeObj } from "../../localdata/treeoflife";
import { genomeNameToConfig } from "../../models/genomes/allGenomes";
import DisplayedRegionModel from "../../models/DisplayedRegionModel";
import _ from "lodash";

function useGenomeState(isLocal = 1) {
    const [selectedGenome, setSelectedGenome] = useState<Array<any>>([]);
    const [allGenome, setAllGenome] = useState<{ [key: string]: any }>({});
    const [treeOfLife, setTreeOfLife] = useState<{ [key: string]: any }>({});
    const [currSelectGenome, setCurrSelectGenome] = useState({});

    const [genomeList, setGenomeList] = useState<Array<any>>([]);
    const [items, setItems] = useState(chrType);
    const [viewRegion, setViewRegion] = useState<DisplayedRegionModel | null>(null);
    const [showGenNav, setShowGenNav] = useState<boolean>(true);
    const [legendWidth, setLegendWidth] = useState<number>(120);
    const [restoreViewRefresh, setRestoreViewRefresh] = useState<boolean>(true);
    const [publicTracksPool, setPublicTracksPool] = useState<Array<any>>([]);
    const [customTracksPool, setCustomTracksPool] = useState<Array<any>>([]);
    const [suggestedMetaSets, setSuggestedMetaSets] = useState<any>(new Set());
    const [selectedSet, setSelectedSet] = useState<any>();
    const [regionSets, setRegionSets] = useState<Array<any>>([]);
    const [curBundle, setCurBundle] = useState<{ [key: string]: any } | null>();

    const isInitial = useRef<boolean>(true);
    const stateArr = useRef<Array<any>>([]);
    const presentStateIdx = useRef(0);
    const trackModelId = useRef(0);

    async function fetchGenomeData(s3Config?: S3Client) {
        let tempTree: { [key: string]: any } = {};
        let tempObj: { [key: string]: any } = {};

        for (const key in treeOfLifeObj) {
            tempTree[key] = {
                assemblies: [...treeOfLifeObj[key].assemblies],
                color: treeOfLifeObj[key].color,
                logoUrl: treeOfLifeObj[key].logoUrl,
            };
        }

        if (!isLocal) {
            if (!s3Config) {
                s3Config = new S3Client({
                    region: "abc",
                    credentials: {
                        accessKeyId: "123",
                        secretAccessKey: "123",
                    },
                });
            }

            var command = new ListObjectsV2Command({
                Bucket: "GenomeViews",
                StartAfter: "/",
                MaxKeys: 1000,
            });

            var isTruncated = true;

            while (isTruncated) {
                var { Contents, IsTruncated, NextContinuationToken } = await s3Config.send(command);
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
        } else {
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

    function addGenomeView(obj: any) {
        sessionStorage.clear();

        if (!currSelectGenome[obj.genome.getName() as keyof typeof currSelectGenome]) {
            if (selectedGenome.length < 1) {
                setSelectedGenome((prevList: any) => [...prevList, obj]);
            }
            let newObj: { [key: string]: any } = currSelectGenome;
            newObj[obj.name as keyof typeof newObj] = " ";
            setCurrSelectGenome(newObj);
        }
    }

    useEffect(() => {
        fetchGenomeData();
    }, []);

    function addGlobalState(data: any) {
        if (presentStateIdx.current !== stateArr.current.length - 1) {
            stateArr.current.splice(presentStateIdx.current + 1);
        } else if (stateArr.current.length >= 20) {
            stateArr.current.shift();
        }

        stateArr.current.push(data);
        presentStateIdx.current = stateArr.current.length - 1;

        setViewRegion(data.viewRegion);
    }

    function recreateTrackmanager(trackConfig: { [key: string]: any }) {
        let curGenomeConfig = trackConfig.genomeConfig;
        curGenomeConfig["isInitial"] = isInitial.current;
        curGenomeConfig["curState"] = stateArr.current[presentStateIdx.current];
        setGenomeList(new Array<any>(curGenomeConfig));
    }

    return {
        selectedGenome,
        allGenome,
        treeOfLife,
        genomeList,
        viewRegion,
        showGenNav,
        legendWidth,
        publicTracksPool,
        customTracksPool,
        suggestedMetaSets,
        selectedSet,
        regionSets,
        curBundle,
        items,

        fetchGenomeData,
        addGenomeView,
        addGlobalState,
        recreateTrackmanager,
        setGenomeList,
        setShowGenNav,
        setLegendWidth,
        setPublicTracksPool,
        setCustomTracksPool,
        setSuggestedMetaSets,
        setSelectedSet,
        setRegionSets,
        setCurBundle,
        setItems,
        setViewRegion,

        stateArr,
        presentStateIdx,
        trackModelId,
        isInitial
    };
}

const GenomeContext = createContext<ReturnType<typeof useGenomeState> | undefined>(undefined);

export function GenomeProvider({ children, isLocal = 1 }: { children: ReactNode, isLocal?: number }) {
    const genomeState = useGenomeState(isLocal);
    
    return (
        <GenomeContext.Provider value={genomeState}>
            {children}
        </GenomeContext.Provider>
    );
}

export function useGenome() {
    const context = useContext(GenomeContext);
    if (context === undefined) {
        throw new Error('useGenome must be used within a GenomeProvider');
    }
    return context;
}
