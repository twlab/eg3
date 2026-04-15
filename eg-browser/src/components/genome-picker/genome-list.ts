export interface Genome {
  name: string;
  logoUrl: string;
  croppedUrl?: string;
  versions: string[];
  color: string;
}

export const GENOME_LIST: Genome[] = [
  {
    name: "Human",
    logoUrl: "default/human.png",
    croppedUrl: "default/human.png",
    versions: ["hg38", "hg19", "t2t-chm13-v2.0", "t2t-chm13-v1.1"],
    color: "white",
  },
  {
    name: "Chimp",
    logoUrl: "default/chimp.png",
    croppedUrl: "default/chimp.png",
    versions: ["panTro6", "panTro5", "panTro4"],
    color: "white",
  },
  {
    name: "Gorilla",
    logoUrl: "https://vizhub.wustl.edu/public/gorGor3/Gorilla.png",
    versions: ["gorGor4", "gorGor3"], color: "yellow",
  },
  {
    name: "Gibbon",
    logoUrl: "https://vizhub.wustl.edu/public/nomLeu3/Gibbon.png",
    versions: ["nomLeu3"],
    color: "yellow",
  },
  {
    name: "Baboon",
    logoUrl: "https://vizhub.wustl.edu/public/papAnu2/Baboon.png",
    versions: ["papAnu2"],
    color: "yellow",
  },
  {
    name: "Rhesus",
    logoUrl: "https://vizhub.wustl.edu/public/rheMac8/Rhesus_macaque.png",
    versions: ["rheMac10", "rheMac8", "rheMac3", "rheMac2"], color: "yellow",
  },
  {
    name: "Marmoset",
    logoUrl: "https://vizhub.wustl.edu/public/calJac3/Marmoset.png",
    versions: ["mCalJa1.2.pat.X", "calJac4", "calJac3"], color: "yellow",
  },
  {
    name: "Cow",
    logoUrl: "https://vizhub.wustl.edu/public/bosTau8/Cow.png",
    versions: ["bosTau8"], color: "yellow",
  },
  {
    name: "Sheep",
    logoUrl: "https://vizhub.wustl.edu/public/oviAri4/sheep.png",
    versions: ["oviAri4"], color: "yellow",
  },
  {
    name: "Pig",
    logoUrl: "https://vizhub.wustl.edu/public/susScr11/pig.png",
    versions: ["susScr11", "susScr3"],
    color: "white",

  },
  {
    name: "Rabbit",
    logoUrl: "https://vizhub.wustl.edu/public/oryCun2/rabbit.png",
    versions: ["oryCun2"], color: "yellow",
  },
  {
    name: "Dog",
    logoUrl: "https://vizhub.wustl.edu/public/canFam3/dog.png",
    versions: ["canFam6", "canFam3", "canFam2"], color: "yellow",
  },
  {
    name: "Mouse",
    logoUrl: "default/mouse.png",
    croppedUrl: "default/mouse.png",
    versions: ["mm39", "mm10", "mm9", "mT2T-Y_v1.0"],
    color: "yellow",
  },
  {
    name: "Rat",
    logoUrl: "default/rat.png",
    croppedUrl: "default/rat.png",
    versions: ["rn7", "rn6", "rn4"],
    color: "white",

  },
  {
    name: "Opossum",
    logoUrl: "https://vizhub.wustl.edu/public/monDom5/opossum.png",
    versions: ["monDom5"],
    color: "white",
  },
  {
    name: "Chicken",
    logoUrl: "default/chicken.png",
    croppedUrl: "default/chicken.png",
    versions: ["GRCg7w", "GRCg7b", "galGal6", "galGal5"], color: "yellow",
  },
  {
    name: "Frog",
    logoUrl: "https://vizhub.wustl.edu/public/xenTro10/frog.png",
    versions: ["xenTro10"], color: "white"
  },
  {
    name: "Zebrafish",
    logoUrl: "default/zebrafish.png",
    croppedUrl: "default/zebrafish.png",
    versions: ["danRer11", "danRer10", "danRer7"], color: "yellow",
  },
  {
    name: "Spotted Gar",
    logoUrl: "https://vizhub.wustl.edu/public/lepOcu1/SpottedGar.png",
    versions: ["lepOcu1"], color: "white",
  },
  {
    name: "Fruit Fly",
    logoUrl: "default/fruitfly.png",
    versions: ["dm6"], color: "white"
  },
  {
    name: "C.elegans",
    logoUrl: "default/celegans.png",
    versions: ["ce11"], color: "black"
  },
  {
    name: "Arabidopsis",
    logoUrl: "default/arabidopsis.png",
    croppedUrl: "default/arabidopsis.png",
    versions: ["araTha1"], color: "yellow",
  },
  {
    name: "Brapa",
    logoUrl: "https://vizhub.wustl.edu/public/b_chiifu_v3/brapa.png",
    versions: ["b_chiifu_v3"],
    color: "white"
  },
  {
    name: "Seahare",
    logoUrl: "https://vizhub.wustl.edu/public/aplCal3/seaHare.png",
    versions: ["aplCal3"],
    color: "white"
  },
  {
    name: "Yeast",
    logoUrl: "default/yeast.png",
    versions: ["sacCer3"],
    color: "black"
  },
  {
    name: "P. falciparum",
    logoUrl: "default/pfalciparum.png",
    versions: ["Pfal3D7"], color: "black"
  },
  {
    name: "Green Algae",
    logoUrl:
      "https://vizhub.wustl.edu/public/Creinhardtii506/Creinhardtii506.png",
    versions: ["Creinhardtii5.6"],
    color: "yellow"

  },
  {
    name: "Virus",
    logoUrl: "https://vizhub.wustl.edu/public/virus/virus.png",
    versions: ["SARS-CoV-2", "MERS", "SARS", "Ebola", "hpv16"],
    color: "yellow"
  },
  {
    name: "Trypanosome",
    logoUrl: "https://vizhub.wustl.edu/public/trypanosome/trypanosome.png",
    versions: ["TbruceiTREU927", "TbruceiLister427"],
    color: "blue"
  },
];




export function getSpeciesInfo(genomeName: string) {

  for (let genome of GENOME_LIST) {
    if (genome.versions.includes(genomeName)) {
      return { name: genome.name, logo: genome.logoUrl, color: genome.color };
    }
  }
  return { name: "", logo: "", color: "" };
}