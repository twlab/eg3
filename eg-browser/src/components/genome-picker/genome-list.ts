export interface Genome {
    name: string,
    logoUrl: string,
    croppedUrl?: string,
    versions: string[]
}

export const GENOME_LIST: Genome[] = [
    {
        "name": "Human",
        "logoUrl": "default/Human.png",
        "croppedUrl": "cropped/Human.png",
        "versions": ["hg38", "hg19", "t2t-chm13-v2.0", "t2t-chm13-v1.1"]
    },
    {
        "name": "Chimp",
        "logoUrl": "default/Chimp.png",
        "croppedUrl": "cropped/Chimp.png",
        "versions": ["panTro6", "panTro5", "panTro4"]
    },
    {
        "name": "Gorilla",
        "logoUrl": "https://vizhub.wustl.edu/public/gorGor3/Gorilla.png",
        "versions": ["gorGor4", "gorGor3"]
    },
    {
        "name": "Gibbon",
        "logoUrl": "https://vizhub.wustl.edu/public/nomLeu3/Gibbon.png",
        "versions": ["nomLeu3"]
    },
    {
        "name": "Baboon",
        "logoUrl": "https://vizhub.wustl.edu/public/papAnu2/Baboon.png",
        "versions": ["papAnu2"]
    },
    {
        "name": "Rhesus",
        "logoUrl": "https://vizhub.wustl.edu/public/rheMac8/Rhesus_macaque.png",
        "versions": ["rheMac10", "rheMac8", "rheMac3", "rheMac2"]
    },
    {
        "name": "Marmoset",
        "logoUrl": "https://vizhub.wustl.edu/public/calJac3/Marmoset.png",
        "versions": ["mCalJa1.2.pat.X", "calJac4", "calJac3"]
    },
    {
        "name": "Cow",
        "logoUrl": "https://vizhub.wustl.edu/public/bosTau8/Cow.png",
        "versions": ["bosTau8"]
    },
    {
        "name": "Sheep",
        "logoUrl": "https://vizhub.wustl.edu/public/oviAri4/sheep.png",
        "versions": ["oviAri4"]
    },
    {
        "name": "Pig",
        "logoUrl": "https://vizhub.wustl.edu/public/susScr11/pig.png",
        "versions": ["susScr11", "susScr3"]
    },
    {
        "name": "Rabbit",
        "logoUrl": "https://vizhub.wustl.edu/public/oryCun2/rabbit.png",
        "versions": ["oryCun2"]
    },
    {
        "name": "Dog",
        "logoUrl": "https://vizhub.wustl.edu/public/canFam3/dog.png",
        "versions": ["canFam6", "canFam3", "canFam2"]
    },
    {
        "name": "Mouse",
        "logoUrl": "default/Mouse.png",
        "croppedUrl": "cropped/Mouse.png",
        "versions": ["mm39", "mm10", "mm9", "mT2T-Y_v1.0"]
    },
    {
        "name": "Rat",
        "logoUrl": "default/Rat.png",
        "croppedUrl": "cropped/Rat.png",
        "versions": ["rn7", "rn6", "rn4"]
    },
    {
        "name": "Opossum",
        "logoUrl": "https://vizhub.wustl.edu/public/monDom5/opossum.png",
        "versions": ["monDom5"]
    },
    {
        "name": "Chicken",
        "logoUrl": "default/Chicken.png",
        "croppedUrl": "cropped/Chicken.png",
        "versions": ["GRCg7w", "GRCg7b", "galGal6", "galGal5"]
    },
    {
        "name": "Frog",
        "logoUrl": "https://vizhub.wustl.edu/public/xenTro10/frog.png",
        "versions": ["xenTro10"]
    },
    {
        "name": "Zebrafish",
        "logoUrl": "default/Zebrafish.png",
        "croppedUrl": "cropped/Zebrafish.png",
        "versions": ["danRer11", "danRer10", "danRer7"]
    },
    {
        "name": "Spotted Gar",
        "logoUrl": "https://vizhub.wustl.edu/public/lepOcu1/SpottedGar.png",
        "versions": ["lepOcu1"]
    },
    {
        "name": "Fruit Fly",
        "logoUrl": "",
        "versions": ["dm6"]
    },
    {
        "name": "C.elegans",
        "logoUrl": "",
        "versions": ["ce11"]
    },
    {
        "name": "Arabidopsis",
        "logoUrl": "default/Arabidopsis.png",
        "croppedUrl": "cropped/Arabidopsis.png",
        "versions": ["araTha1"]
    },
    {
        "name": "Brapa",
        "logoUrl": "https://vizhub.wustl.edu/public/b_chiifu_v3/brapa.png",
        "versions": ["b_chiifu_v3"]
    },
    {
        "name": "Seahare",
        "logoUrl": "https://vizhub.wustl.edu/public/aplCal3/seaHare.png",
        "versions": ["aplCal3"]
    },
    {
        "name": "Yeast",
        "logoUrl": "",
        "versions": ["sacCer3"]
    },
    {
        "name": "P. falciparum",
        "logoUrl": "default/Pfalciparum.png",
        "croppedUrl": "cropped/Pfalciparum.png",
        "versions": ["Pfal3D7"]
    },
    {
        "name": "Green Algae",
        "logoUrl": "https://vizhub.wustl.edu/public/Creinhardtii506/Creinhardtii506.png",
        "versions": ["Creinhardtii5.6"]
    },
    {
        "name": "Virus",
        "logoUrl": "https://vizhub.wustl.edu/public/virus/virus.png",
        "versions": ["SARS-CoV-2", "MERS", "SARS", "Ebola", "hpv16"]
    },
    {
        "name": "Trypanosome",
        "logoUrl": "https://vizhub.wustl.edu/public/trypanosome/trypanosome.png",
        "versions": ["TbruceiTREU927", "TbruceiLister427"]
    }
]

export const versionToLogoUrl: Record<string, { logoUrl: string, croppedUrl: string | undefined, name: string }> = {};


for (const genome of GENOME_LIST) {
    for (const version of genome.versions) {
        versionToLogoUrl[version] = { logoUrl: genome.logoUrl, croppedUrl: genome.croppedUrl, name: genome.name };
    }
}
