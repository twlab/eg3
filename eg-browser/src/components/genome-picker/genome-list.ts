export interface Genome {
    name: string,
    logoUrl: string,
    croppedUrl?: string,
    versions: string[]
}

export const GENOME_LIST: Genome[] = [
    {
        "name": "Human",
        "logoUrl": "default/human.png",
        "croppedUrl": "cropped/human.jpeg",
        "versions": ["hg38", "hg19",  "t2t-chm13-v2.0", "t2t-chm13-v1.1"]
    },
    {
        "name": "Chimp",
        "logoUrl": "default/chimp.png",
        "croppedUrl": "cropped/chimp.jpeg",
        "versions": ["panTro6", "panTro5", "panTro4"]
    },
    {
        "name": "Gorilla",
        "logoUrl": "default/gorilla.png",
        "croppedUrl": "cropped/gorilla.jpeg",
        "versions": ["gorGor4", "gorGor3"]
    },
    {
        "name": "Gibbon",
        "logoUrl": "default/gibbon.png",
        "croppedUrl": "cropped/gibbon.jpeg",
        "versions": ["nomLeu3"]
    },
    {
        "name": "Baboon",
        "logoUrl": "default/baboon.png",
        "croppedUrl": "cropped/baboon.jpeg",
        "versions": ["papAnu2"]
    },
    {
        "name": "Rhesus",
        "logoUrl": "default/rhesus.png",
        "croppedUrl": "cropped/rhesus.jpeg",
        "versions": ["rheMac10", "rheMac8", "rheMac3", "rheMac2"]
    },
    {
        "name": "Marmoset",
        "logoUrl": "default/marmoset.png",
        "croppedUrl": "cropped/marmoset.jpeg",
        "versions": ["mCalJa1.2.pat.X", "calJac4", "calJac3"]
    },
    {
        "name": "Cow",
        "logoUrl": "default/cow.png",
        "croppedUrl": "cropped/cow.jpeg",
        "versions": ["bosTau8"]
    },
    {
        "name": "Sheep",
        "logoUrl": "default/sheep.png",
        "croppedUrl": "cropped/sheep.jpeg",
        "versions": ["oviAri4"]
    },
    {
        "name": "Pig",
        "logoUrl": "default/pig.png",
        "croppedUrl": "cropped/pig.jpeg",
        "versions": ["susScr11", "susScr3"]
    },
    {
        "name": "Rabbit",
        "logoUrl": "default/rabbit.png",
        "croppedUrl": "cropped/rabbit.jpeg",
        "versions": ["oryCun2"]
    },
    {
        "name": "Dog",
        "logoUrl": "default/dog.png",
        "croppedUrl": "cropped/dog.jpeg",
        "versions": ["canFam6", "canFam3", "canFam2"]
    },
    {
        "name": "Mouse",
        "logoUrl": "default/mouse.png",
        "croppedUrl": "cropped/mouse.jpeg",
        "versions": ["mm39", "mm10", "mm9"]
    },
    {
        "name": "Rat",
        "logoUrl": "default/rat.png",
        "croppedUrl": "cropped/rat.jpeg",
        "versions": ["rn7", "rn6", "rn4"]
    },
    {
        "name": "Opossum",
        "logoUrl": "default/opossum.png",
        "croppedUrl": "cropped/opossum.jpeg",
        "versions": ["monDom5"]
    },
    {
        "name": "Chicken",
        "logoUrl": "default/chicken.png",
        "croppedUrl": "cropped/chicken.jpeg",
        "versions": ["GRCg7w", "GRCg7b", "galGal6", "galGal5"]
    },
    {
        "name": "Frog",
        "logoUrl": "default/frog.png",
        "croppedUrl": "cropped/frog.jpeg",
        "versions": ["xenTro10"]
    },
    {
        "name": "Zebrafish",
        "logoUrl": "default/zebrafish.png",
        "croppedUrl": "cropped/zebrafish.jpeg",
        "versions": ["danRer11", "danRer10", "danRer7"]
    },
    {
        "name": "Spotted Gar",
        "logoUrl": "default/spotted_gar.png",
        "croppedUrl": "cropped/spotted_gar.jpeg",
        "versions": ["lepOcu1"]
    },
    {
        "name": "Fruit Fly",
        "logoUrl": "default/fruit_fly.png",
        "croppedUrl": "cropped/fruit_fly.jpeg",
        "versions": ["dm6"]
    },
    {
        "name": "C.elegans",
        "logoUrl": "default/c_elegans.png",
        "croppedUrl": "cropped/c_elegans.jpeg",
        "versions": ["ce11"]
    },
    {
        "name": "Arabidopsis",
        "logoUrl": "default/arabidopsis.png",
        "croppedUrl": "cropped/arabidopsis.jpeg",
        "versions": ["araTha1"]
    },
    {
        "name": "Brapa",
        "logoUrl": "default/brapa.png",
        "croppedUrl": "cropped/brapa.jpeg",
        "versions": ["b_chiifu_v3"]
    },
    {
        "name": "Seahare",
        "logoUrl": "default/seahare.png",
        "croppedUrl": "cropped/seahare.jpeg",
        "versions": ["aplCal3"]
    },
    {
        "name": "Yeast",
        "logoUrl": "default/yeast.png",
        "croppedUrl": "cropped/yeast.jpeg",
        "versions": ["sacCer3"]
    },
    {
        "name": "P. falciparum",
        "logoUrl": "default/p_falciparum.png",
        "croppedUrl": "cropped/p_falciparum.jpeg",
        "versions": ["Pfal3D7"]
    },
    {
        "name": "Green Algae",
        "logoUrl": "default/green_algae.png",
        "croppedUrl": "cropped/green_algae.jpeg",
        "versions": ["Creinhardtii5.6"]
    },
    {
        "name": "Virus",
        "logoUrl": "default/virus.png",
        "croppedUrl": "cropped/virus.jpeg",
        "versions": ["SARS-CoV-2", "MERS", "SARS", "Ebola", "hpv16"]
    },
    {
        "name": "Trypanosome",
        "logoUrl": "default/trypanosome.png",
        "croppedUrl": "cropped/trypanosome.jpeg",
        "versions": ["TbruceiTREU927", "TbruceiLister427"]
    }
]

export const versionToLogoUrl: Record<string, { logoUrl: string, croppedUrl: string | undefined }> = {};


for (const genome of GENOME_LIST) {
    for (const version of genome.versions) {
        versionToLogoUrl[version] = { logoUrl: genome.logoUrl, croppedUrl: genome.croppedUrl };
    }
}
