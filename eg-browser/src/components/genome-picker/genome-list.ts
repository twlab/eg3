export interface Genome {
    name: string,
    logoUrl?: string,
    versions: string[]
}

export const GENOME_LIST: Genome[] = [
    {
        "name": "Human",
        "logoUrl": "/default/human.png",
        "versions": ["hg38", "hg19",  "t2t-chm13-v2.0", "t2t-chm13-v1.1"]
    },
    {
        "name": "Chimp",
        "logoUrl": "/default/chimp.png",
        "versions": ["panTro6", "panTro5", "panTro4"]
    },
    {
        "name": "Gorilla",
        "logoUrl": "/default/gorilla.png",
        "versions": ["gorGor4", "gorGor3"]
    },
    {
        "name": "Gibbon",
        "logoUrl": "/default/gibbon.png",
        "versions": ["nomLeu3"]
    },
    {
        "name": "Baboon",
        "logoUrl": "/default/baboon.png",
        "versions": ["papAnu2"]
    },
    {
        "name": "Rhesus",
        "logoUrl": "/default/rhesus.png",
        "versions": ["rheMac10", "rheMac8", "rheMac3", "rheMac2"]
    },
    {
        "name": "Marmoset",
        "logoUrl": "/default/marmoset.png",
        "versions": ["calJac4", "calJac3"]
    },
    {
        "name": "Cow",
        "logoUrl": "/default/cow.png",
        "versions": ["bosTau8"]
    },
    {
        "name": "Sheep",
        "logoUrl": "/default/sheep.png",
        "versions": ["oviAri4"]
    },
    {
        "name": "Pig",
        "logoUrl": "/default/pig.png",
        "versions": ["susScr11", "susScr3"]
    },
    {
        "name": "Rabbit",
        "logoUrl": "/default/rabbit.png",
        "versions": ["oryCun2"]
    },
    {
        "name": "Dog",
        "logoUrl": "/default/dog.png",
        "versions": ["canFam3", "canFam2"]
    },
    {
        "name": "Mouse",
        "logoUrl": "/default/mouse.png",
        "versions": ["mm39", "mm10", "mm9"]
    },
    {
        "name": "Rat",
        "logoUrl": "/default/rat.png",
        "versions": ["rn7", "rn6", "rn4"]
    },
    {
        "name": "Opossum",
        "logoUrl": "/default/opossum.png",
        "versions": ["monDom5"]
    },
    {
        "name": "Chicken",
        "logoUrl": "/default/chicken.png",
        "versions": ["GRCg7w", "GRCg7b", "galGal6", "galGal5"]
    },
    {
        "name": "Frog",
        "logoUrl": "/default/frog.png",
        "versions": ["xenTro10"]
    },
    {
        "name": "Zebrafish",
        "logoUrl": "/default/zebrafish.png",
        "versions": ["danRer11", "danRer10", "danRer7"]
    },
    {
        "name": "Spotted Gar",
        "logoUrl": "/default/spotted_gar.png",
        "versions": ["lepOcu1"]
    },
    {
        "name": "Fruit Fly",
        "logoUrl": "/default/fruit_fly.png",
        "versions": ["dm6"]
    },
    {
        "name": "C.elegans",
        "logoUrl": "/default/c_elegans.png",
        "versions": ["ce11"]
    },
    {
        "name": "Arabidopsis",
        "logoUrl": "/default/arabidopsis.png",
        "versions": ["araTha1"]
    },
    {
        "name": "Brapa",
        "logoUrl": "/default/brapa.png",
        "versions": ["b_chiifu_v3"]
    },
    {
        "name": "Seahare",
        "logoUrl": "/default/seahare.png",
        "versions": ["aplCal3"]
    },
    {
        "name": "Yeast",
        "logoUrl": "/default/yeast.png",
        "versions": ["sacCer3"]
    },
    {
        "name": "P. falciparum",
        "logoUrl": "/default/p_falciparum.png",
        "versions": ["Pfal3D7"]
    },
    {
        "name": "Green Algae",
        "logoUrl": "/default/green_algae.png",
        "versions": ["Creinhardtii5.6"]
    },
    {
        "name": "Virus",
        "logoUrl": "/default/virus.png",
        "versions": ["SARS-CoV-2", "MERS", "SARS", "Ebola", "hpv16"]
    },
    {
        "name": "Trypanosome",
        "logoUrl": "/default/trypanosome.png",
        "versions": ["TbruceiTREU927", "TbruceiLister427"]
    }
]
