import { GenomeConfig } from "./GenomeConfig";
import HG19 from "./hg19/hg19";
import HG38 from "./hg38/hg38";
import MM10 from "./mm10/mm10";
import MM39 from "./mm39/mm39";
import DAN_RER10 from "./danRer10/danRer10";
import DAN_RER11 from "./danRer11/danRer11";
import DAN_RER7 from "./danRer7/danRer7";
import PANTRO5 from "./panTro5/panTro5";
import PANTRO6 from "./panTro6/panTro6";
import rn4 from "./rn4/rn4";
import RN6 from "./rn6/rn6";
import RN7 from "./rn7/rn7";
import MM9 from "./mm9/mm9";
import BosTau8 from "./bosTau8/bosTau8";
import rheMac2 from "./rheMac2/rheMac2";
import rheMac3 from "./rheMac3/rheMac3";
import rheMac10 from "./rheMac10/rheMac10";
import RheMac8 from "./rheMac8/rheMac8";
import GalGal6 from "./galGal6/galGal6";
import GalGal5 from "./galGal5/galGal5";
import AraTha1 from "./araTha1/araTha1";
import DM6 from "./dm6/dm6";
import CE11 from "./ce11/ce11";
import APLCAL3 from "./aplCal3/aplCal3";
import SACCER3 from "./sacCer3/sacCer3";
import Ebola from "./virus/ebola";
import SARS from "./virus/sars";
import MERS from "./virus/mers";
import hpv16 from "./virus/hpv16";
import nCoV2019 from "./virus/nCoV2019";
import LEPOCU1 from "./lepOcu1/lepOcu1";
import panTro4 from "./panTro4/panTro4";
import gorGor4 from "./gorGor4/gorGor4";
import gorGor3 from "./gorGor3/gorGor3";
import nomLeu3 from "./nomLeu3/nomLeu3";
import papAnu2 from "./papAnu2/papAnu2";
import oryCun2 from "./oryCun2/oryCun2";
import canFam2 from "./canFam2/canFam2";
import canFam3 from "./canFam3/canFam3";
import canFam6 from "./canFam6/canFam6";
import monDom5 from "./monDom5/monDom5";
import calJac3 from "./calJac3/calJac3";
import calJac4 from "./calJac4/calJac4";
import Pfal3D7 from "./pfal3d7/pfal3d7";
import TbruceiTREU927 from "./trypanosome/TbruceiTREU927";
import TbruceiLister427 from "./trypanosome/TbruceiLister427";
import Creinhardtii506 from "./Creinhardtii506/Creinhardtii506";
import CHM13v1_1 from "./t2t-chm13-v1.1/chm13";
import xenTro10 from "./xenTro10/xenTro10";
import b_chiifu_v3 from "./brapa/brara_chiifu_v3.0";
import susScr11 from "./susScr11/susScr11";
import susScr3 from "./susScr3/susScr3";
import oviAri4 from "./oviAri4/oviAri4";
import CHMV2 from "./t2t-chm13-v2.0/chm13v2";
import GRCg7b from "./GRCg7b/GRCg7b";
import GRCg7w from "./GRCg7w/GRCg7w";
import phaw5 from "./phaw5/phaw5";
import mCalJa1_2_pat_X from "./mCalJa1.2.pat.X/mCalJa1.2.pat.X";
import mT2T_Y_v1 from "./mT2T-Y_v1.0/mT2T-Y_v1.0";
import PAN010Mat from "./PAN010Mat/PAN010Mat";
import PAN010Pat from "./PAN010Pat/PAN010Pat";
import PAN011Mat from "./PAN011Mat/PAN011Mat";
import PAN011Pat from "./PAN011Pat/PAN011Pat";
import PAN027Mat from "./PAN027Mat/PAN027Mat";
import PAN027Pat from "./PAN027Pat/PAN027Pat";
import PAN028Mat from "./PAN028Mat/PAN028Mat";
import PAN028Pat from "./PAN028Pat/PAN028Pat";
/**
 * All available genomes.
 */

export const allGenomes = [
  HG38,
  HG19,
  MM39,
  MM10,
  MM9,
  PANTRO6,
  PANTRO5,
  panTro4,
  BosTau8,
  DAN_RER11,
  DAN_RER10,
  DAN_RER7,
  RN6,
  rn4,
  RheMac8,
  rheMac3,
  rheMac2,
  GalGal6,
  GalGal5,
  DM6,
  CE11,
  APLCAL3,
  SACCER3,
  Ebola,
  SARS,
  MERS,
  nCoV2019,
  hpv16,
  LEPOCU1,
  gorGor4,
  gorGor3,
  nomLeu3,
  papAnu2,
  oryCun2,
  canFam3,
  canFam2,
  canFam6,
  monDom5,
  calJac3,
  AraTha1,
  Pfal3D7,
  Creinhardtii506,
  TbruceiTREU927,
  TbruceiLister427,
  CHM13v1_1,
  xenTro10,
  b_chiifu_v3,
  susScr11,
  susScr3,
  oviAri4,
  calJac4,
  rheMac10,
  RN7,
  CHMV2,
  GRCg7b,
  GRCg7w,
  phaw5,
  mCalJa1_2_pat_X,
  mT2T_Y_v1,
  PAN010Mat,
  PAN010Pat,
  PAN011Mat,
  PAN011Pat,
  PAN027Mat,
  PAN027Pat,
  PAN028Mat,
  PAN028Pat,
];

export const genomeNameToConfig = {};
for (const config of allGenomes) {
  const genomeName = config.genome.getName();
  if (genomeNameToConfig[genomeName]) {
    // We need this, because when saving session, we save the genome name.
    throw new Error(
      `Two genomes have the same name ${genomeName}.  Refusing to continue!`,
    );
  }
  genomeNameToConfig[genomeName] = config;
}

export interface Genome {
  name: string;
  logoUrl: string;
  assemblies: string[];
  color: string;
}
export const Pedigree_T2T = [
  {
    name: "Human",
    logoUrl: "https://vizhub.wustl.edu/public/images/Human.png",
    assemblies: [
      PAN010Mat.genome._name,
      PAN010Pat.genome._name,
      PAN011Mat.genome._name,
      PAN011Pat.genome._name,
      PAN027Mat.genome._name,
      PAN027Pat.genome._name,
      PAN028Mat.genome._name,
      PAN028Pat.genome._name,
    ],
    color: "white",
  },
];
export const Tree_of_Life: Genome[] = [
  {
    name: "Human",
    logoUrl: "https://vizhub.wustl.edu/public/images/Human.png",
    assemblies: [
      HG38.genome._name,
      HG19.genome._name,
      CHMV2.genome._name,
      CHM13v1_1.genome._name,
    ],
    color: "white",
  },
  {
    name: "Chimp",
    logoUrl: "https://vizhub.wustl.edu/public/images/Chimp.png",
    assemblies: [
      PANTRO6.genome._name,
      PANTRO5.genome._name,
      panTro4.genome._name,
    ],
    color: "white",
  },
  {
    name: "Gorilla",
    logoUrl: "https://vizhub.wustl.edu/public/gorGor3/Gorilla.png",
    assemblies: [gorGor4.genome._name, gorGor3.genome._name],
    color: "yellow",
  },
  {
    name: "Gibbon",
    logoUrl: "https://vizhub.wustl.edu/public/nomLeu3/Gibbon.png",
    assemblies: [nomLeu3.genome._name],
    color: "yellow",
  },
  {
    name: "Baboon",
    logoUrl: "https://vizhub.wustl.edu/public/papAnu2/Baboon.png",
    assemblies: [papAnu2.genome._name],
    color: "yellow",
  },
  {
    name: "Rhesus",
    logoUrl: "https://vizhub.wustl.edu/public/rheMac8/Rhesus_macaque.png",
    assemblies: [
      rheMac10.genome._name,
      RheMac8.genome._name,
      rheMac3.genome._name,
      rheMac2.genome._name,
    ],
    color: "yellow",
  },
  {
    name: "Marmoset",
    logoUrl: "https://vizhub.wustl.edu/public/calJac3/Marmoset.png",
    assemblies: [
      mCalJa1_2_pat_X.genome._name,
      calJac4.genome._name,
      calJac3.genome._name,
    ],
    color: "yellow",
  },
  {
    name: "Cow",
    logoUrl: "https://vizhub.wustl.edu/public/bosTau8/Cow.png",
    assemblies: [BosTau8.genome._name],
    color: "yellow",
  },
  {
    name: "Sheep",
    logoUrl: "https://vizhub.wustl.edu/public/oviAri4/sheep.png",
    assemblies: [oviAri4.genome._name],
    color: "yellow",
  },
  {
    name: "Pig",
    logoUrl: "https://vizhub.wustl.edu/public/susScr11/pig.png",
    assemblies: [susScr11.genome._name, susScr3.genome._name],
    color: "white",
  },
  {
    name: "Rabbit",
    logoUrl: "https://vizhub.wustl.edu/public/oryCun2/rabbit.png",
    assemblies: [oryCun2.genome._name],
    color: "yellow",
  },
  {
    name: "Dog",
    logoUrl: "https://vizhub.wustl.edu/public/canFam3/dog.png",
    assemblies: [
      canFam6.genome._name,
      canFam3.genome._name,
      canFam2.genome._name,
    ],
    color: "yellow",
  },
  {
    name: "Mouse",
    logoUrl: "https://vizhub.wustl.edu/public/images/Mouse.png",
    assemblies: [
      MM39.genome._name,
      MM10.genome._name,
      MM9.genome._name,
      mT2T_Y_v1.genome._name,
    ],
    color: "yellow",
  },
  {
    name: "Rat",
    logoUrl: "https://vizhub.wustl.edu/public/images/Rat.png",
    assemblies: [RN7.genome._name, RN6.genome._name, rn4.genome._name],
    color: "white",
  },
  {
    name: "Opossum",
    logoUrl: "https://vizhub.wustl.edu/public/monDom5/opossum.png",
    assemblies: [monDom5.genome._name],
    color: "white",
  },
  {
    name: "Chicken",
    logoUrl: "https://vizhub.wustl.edu/public/images/Chicken.png",
    assemblies: [
      GRCg7w.genome._name,
      GRCg7b.genome._name,
      GalGal6.genome._name,
      GalGal5.genome._name,
    ],
    color: "yellow",
  },
  {
    name: "Frog",
    logoUrl: "https://vizhub.wustl.edu/public/xenTro10/frog.png",
    assemblies: [xenTro10.genome._name],
    color: "white",
  },
  {
    name: "Zebrafish",
    logoUrl: "https://vizhub.wustl.edu/public/images/Zebrafish.png",
    assemblies: [
      DAN_RER11.genome._name,
      DAN_RER10.genome._name,
      DAN_RER7.genome._name,
    ],
    color: "yellow",
  },
  {
    name: "Spotted Gar",
    logoUrl: "https://vizhub.wustl.edu/public/lepOcu1/SpottedGar.png",
    assemblies: [LEPOCU1.genome._name],
    color: "white",
  },
  {
    name: "P. hawaiensis",
    logoUrl: "https://vizhub.wustl.edu/public/phaw5/phaw.png",
    assemblies: [phaw5.genome._name],
    color: "white",
  },
  {
    name: "Fruit Fly",
    logoUrl: "https://vizhub.wustl.edu/public/images/Fruit%20fly.png",
    assemblies: [DM6.genome._name],
    color: "white",
  },
  {
    name: "C.elegans",
    logoUrl: "https://vizhub.wustl.edu/public/images/C.elegans.png",
    assemblies: [CE11.genome._name],
    color: "black",
  },
  {
    name: "Arabidopsis",
    logoUrl: "https://vizhub.wustl.edu/public/images/Arabidopsis.png",
    assemblies: [AraTha1.genome._name],
    color: "yellow",
  },
  {
    name: "Brapa",
    logoUrl: "https://vizhub.wustl.edu/public/b_chiifu_v3/brapa.png",
    assemblies: [b_chiifu_v3.genome._name],
    color: "white",
  },
  {
    name: "Seahare",
    logoUrl: "https://vizhub.wustl.edu/public/aplCal3/seaHare.png",
    assemblies: [APLCAL3.genome._name],
    color: "white",
  },
  {
    name: "Yeast",
    logoUrl: "https://vizhub.wustl.edu/public/images/Yeast.png",
    assemblies: [SACCER3.genome._name],
    color: "black",
  },
  {
    name: "P. falciparum",
    logoUrl: "https://vizhub.wustl.edu/public/images/Pfalciparum.png",
    assemblies: [Pfal3D7.genome._name],
    color: "black",
  },
  {
    name: "Green Algae",
    logoUrl:
      "https://vizhub.wustl.edu/public/Creinhardtii506/Creinhardtii506.png",
    assemblies: [Creinhardtii506.genome._name],
    color: "yellow",
  },
  {
    name: "Virus",
    logoUrl: "https://vizhub.wustl.edu/public/virus/virus.png",
    assemblies: [
      nCoV2019.genome._name,
      MERS.genome._name,
      SARS.genome._name,
      Ebola.genome._name,
      hpv16.genome._name,
    ],
    color: "yellow",
  },
  {
    name: "Trypanosome",
    logoUrl: "https://vizhub.wustl.edu/public/trypanosome/trypanosome.png",
    assemblies: [TbruceiTREU927.genome._name, TbruceiLister427.genome._name],
    color: "blue",
  },
];
export const allDefaultGenomeCollections = {
  Tree_of_Life,
  Pedigree_T2T,
};

/**
 * @param {string} genomeName - name of a genome
 * @return {GenomeConfig} the genome's configuration object, or null if no such genome exists.
 */
export function getGenomeConfig(genomeName: string): GenomeConfig | null {
  if (genomeNameToConfig[genomeName]) {
    return { ...genomeNameToConfig[genomeName] };
  } else {
    return null;
  }
}

export function getSpeciesInfo(genomeName: string) {
  for (const genomeList of Object.values(allDefaultGenomeCollections)) {
    for (const genome of genomeList) {
      if (genome.assemblies.includes(genomeName)) {
        return { name: genome.name, logo: genome.logoUrl, color: genome.color };
      }
    }
  }
  return { name: "", logo: "", color: "" };
}
