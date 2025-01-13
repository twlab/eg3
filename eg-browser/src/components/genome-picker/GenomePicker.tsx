import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import placeholder from "../../assets/placeholder.png";
import { GENOME_LIST } from "./genome-list";
import Progress from "../ui/progress/Progress";
import { useAppDispatch } from "../../lib/redux/hooks";
import { createSessionWithGenomeId } from "@/lib/redux/slices/browserSlice";
interface SpeciesConfig {
  logoUrl: string;
  assemblies: string[];
  color: string;
}

export const treeOfLifeObj: { [speciesName: string]: SpeciesConfig } = {
  human: {
    logoUrl: "https://epigenomegateway.wustl.edu/browser/images/Human.png",
    assemblies: ["hg19", "hg38", "t2t-chm13-v1.1", "t2t-chm13-v2.0"],
    color: "white",
  },
  chimp: {
    logoUrl: "https://epigenomegateway.wustl.edu/browser/images/Chimp.png",
    assemblies: ["panTro6", "panTro5", "panTro4"],
    color: "white",
  },
  gorilla: {
    logoUrl: "https://vizhub.wustl.edu/public/gorGor3/Gorilla.png",
    assemblies: ["gorGor4", "gorGor3"],
    color: "yellow",
  },
  gibbon: {
    logoUrl: "https://vizhub.wustl.edu/public/nomLeu3/Gibbon.png",
    assemblies: ["nomLeu3"],
    color: "yellow",
  },
  baboon: {
    logoUrl: "https://vizhub.wustl.edu/public/papAnu2/Baboon.png",
    assemblies: ["papAnu2"],
    color: "yellow",
  },
  rhesus: {
    logoUrl: "https://vizhub.wustl.edu/public/rheMac8/Rhesus_macaque.png",
    assemblies: ["rheMac10", "rheMac8", "rheMac3", "rheMac2"],
    color: "yellow",
  },
  marmoset: {
    logoUrl: "https://vizhub.wustl.edu/public/calJac3/Marmoset.png",
    assemblies: ["calJac4", "calJac3"],
    color: "yellow",
  },
  cow: {
    logoUrl: "https://vizhub.wustl.edu/public/bosTau8/Cow.png",
    assemblies: ["bosTau8"],
    color: "yellow",
  },
  sheep: {
    logoUrl: "https://vizhub.wustl.edu/public/oviAri4/sheep.png",
    assemblies: ["oviAri4"],
    color: "white",
  },
  pig: {
    logoUrl: "https://vizhub.wustl.edu/public/susScr11/pig.png",
    assemblies: ["susScr11", "susScr3"],
    color: "white",
  },
  rabbit: {
    logoUrl: "https://vizhub.wustl.edu/public/oryCun2/rabbit.png",
    assemblies: ["oryCun2"],
    color: "yellow",
  },
  dog: {
    logoUrl: "https://vizhub.wustl.edu/public/canFam3/dog.png",
    assemblies: ["canFam3", "canFam2"],
    color: "yellow",
  },
  mouse: {
    logoUrl: "https://epigenomegateway.wustl.edu/browser/images/Mouse.png",
    assemblies: ["mm39", "mm10", "mm9"],
    color: "yellow",
  },
  rat: {
    logoUrl: "https://epigenomegateway.wustl.edu/browser/images/Rat.png",
    assemblies: ["rn7", "rn6", "rn4"],
    color: "white",
  },
  opossum: {
    logoUrl: "https://vizhub.wustl.edu/public/monDom5/opossum.png",
    assemblies: ["monDom5"],
    color: "white",
  },
  chicken: {
    logoUrl: "https://epigenomegateway.wustl.edu/browser/images/Chicken.png",
    assemblies: ["GRCg7w", "GRCg7b", "GalGal6", "GalGal5"],
    color: "yellow",
  },
  frog: {
    logoUrl: "https://vizhub.wustl.edu/public/xenTro10/frog.png",
    assemblies: ["xenTro10"],
    color: "white",
  },
  zebrafish: {
    logoUrl: "https://epigenomegateway.wustl.edu/browser/images/Zebrafish.png",
    assemblies: ["danRer11", "danRer10", "danRer7"],
    color: "yellow",
  },
  "spotted Gar": {
    logoUrl: "https://vizhub.wustl.edu/public/lepOcu1/SpottedGar.png",
    assemblies: ["lepOcu1"],
    color: "white",
  },
  "P. hawaiensis": {
    logoUrl: "https://vizhub.wustl.edu/public/phaw5/phaw.png",
    assemblies: ["phaw5"],
    color: "white",
  },
  "fruit fly": {
    logoUrl: "https://epigenomegateway.wustl.edu/legacy/images/Fruit%20fly.png",
    assemblies: ["dm6"],
    color: "white",
  },
  "c.elegans": {
    logoUrl: "https://epigenomegateway.wustl.edu/legacy/images/C.elegans.png",
    assemblies: ["ce11"],
    color: "black",
  },
  arabidopsis: {
    logoUrl:
      "https://epigenomegateway.wustl.edu/browser/images/Arabidopsis.png",
    assemblies: ["araTha1"],
    color: "yellow",
  },
  brapa: {
    logoUrl: "https://vizhub.wustl.edu/public/b_chiifu_v3/brapa.png",
    assemblies: ["b_chiifu_v3"],
    color: "white",
  },
  seahare: {
    logoUrl: "https://vizhub.wustl.edu/public/aplCal3/seaHare.png",
    assemblies: ["aplCal3"],
    color: "white",
  },
  yeast: {
    logoUrl: "https://epigenomegateway.wustl.edu/browser/images/Yeast.png",
    assemblies: ["sacCer3"],
    color: "black",
  },
  "P. falciparum": {
    logoUrl:
      "https://epigenomegateway.wustl.edu/browser/images/Pfalciparum.png",
    assemblies: ["Pfal3D7"],
    color: "black",
  },
  "Green algae": {
    logoUrl:
      "https://vizhub.wustl.edu/public/Creinhardtii506/Creinhardtii506.png",
    assemblies: ["Creinhardtii5.6"],
    color: "yellow",
  },
  virus: {
    logoUrl: "https://vizhub.wustl.edu/public/virus/virus.png",
    assemblies: ["SARS-CoV-2", "MERS", "SARS", "Ebola", "hpv16"],
    color: "yellow",
  },
  trypanosome: {
    logoUrl: "https://vizhub.wustl.edu/public/trypanosome/trypanosome.png",
    assemblies: ["TbruceiTREU927", "TbruceiLister427"],
    color: "blue",
  },
};

type GenomeName = string;
type AssemblyName = string;
const genomeList = Object.entries(treeOfLifeObj).map(
  ([name, data]: [string, any]) => ({
    name,
    versions: data.assemblies,
    logoUrl: data.logoUrl,
  })
);

export default function GenomePicker() {
  const dispatch = useAppDispatch();

  const [selectedPath, setSelectedPath] = useState<
    [GenomeName, AssemblyName] | null
  >(null);

  useEffect(() => {
    let timeout: any;

    if (selectedPath !== null) {
      timeout = setTimeout(() => {
        dispatch(createSessionWithGenomeId(selectedPath[1]));
      }, 0);
    }

    return () => clearTimeout(timeout);
  }, [selectedPath]);

  return (
    <div className="max-w-2xl mx-auto pt-4 h-full">
      <h2 className="text-3xl text-tint mb-4">Select a Genome</h2>
      <div
        className={`grid grid-cols-3 gap-4 ${
          selectedPath !== null ? "items-center" : ""
        }`}
      >
        {(selectedPath === null
          ? genomeList
          : genomeList.filter((g) => g.name === selectedPath[0])
        ).map((genome) => (
          <motion.div
            key={genome.name}
            className={`rounded-2xl shadow-md ${
              selectedPath !== null ? "col-start-2" : ""
            }`}
            layout
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
          >
            <motion.img
              layout
              src={placeholder}
              alt={genome.name}
              className="rounded-2xl h-24 w-full object-cover"
            />
            <motion.div className="p-4 pb-6">
              <motion.h2
                layout
                className={`text-primary mb-2`}
                initial={{
                  textAlign: "left",
                  fontSize: "24px",
                  lineHeight: "32px",
                }}
                animate={{
                  textAlign: selectedPath !== null ? "center" : "left",
                  fontSize: selectedPath !== null ? "30px" : "24px",
                  lineHeight: selectedPath !== null ? "36px" : "32px",
                }}
              >
                {genome.name}
              </motion.h2>
              {(selectedPath === null
                ? genome.versions
                : genome.versions.filter((v: any) => v === selectedPath[1])
              ).map((version: any) => (
                <motion.div
                  layout
                  key={version}
                  className="flex items-center gap-2 text-primary cursor-pointer"
                  onClick={() => setSelectedPath([genome.name, version])}
                >
                  {selectedPath === null && (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                  <motion.p
                    className={`${
                      selectedPath !== null ? "text-center text-xl w-full" : ""
                    }`}
                  >
                    {version}
                  </motion.p>
                </motion.div>
              ))}
              {selectedPath !== null && (
                <div className="flex justify-center pt-4">
                  <Progress size={36} />
                </div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>
      {selectedPath && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-primary"
          onClick={() => setSelectedPath(null)}
        >
          ← Back to all genomes
        </motion.button>
      )}
    </div>
  );
}
