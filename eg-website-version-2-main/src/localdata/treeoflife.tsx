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
