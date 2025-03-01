export interface Genome {
    name: string,
    versions: string[]
}

export const GENOME_LIST: Genome[] = [
    {
        "name": "Human",
        "versions": ["hg19", "hg38", "t2t-chm13-v1.1", "t2t-chm13-v2.0"]
    },
    {
        "name": "Chimp",
        "versions": ["panTro6", "panTro5", "panTro4"]
    },
    {
        "name": "Gorilla",
        "versions": ["gorGor4", "gorGor3"]
    },
    {
        "name": "Gibbon",
        "versions": ["nomLeu3"]
    },
    {
        "name": "Baboon",
        "versions": ["papAnu2"]
    },
    {
        "name": "Rhesus",
        "versions": ["rheMac10", "rheMac8", "rheMac3", "rheMac2"]
    },
    {
        "name": "Marmoset",
        "versions": ["calJac4", "calJac3"]
    },
    {
        "name": "Cow",
        "versions": ["bosTau8"]
    },
    {
        "name": "Sheep",
        "versions": ["oviAri4"]
    },
    {
        "name": "Pig",
        "versions": ["susScr11", "susScr3"]
    },
    {
        "name": "Rabbit",
        "versions": ["oryCun2"]
    },
    {
        "name": "Dog",
        "versions": ["canFam3", "canFam2"]
    },
    {
        "name": "Mouse",
        "versions": ["mm39", "mm10", "mm9"]
    },
    {
        "name": "Rat",
        "versions": ["rn7", "rn6", "rn4"]
    },
    {
        "name": "Opossum",
        "versions": ["monDom5"]
    },
    {
        "name": "Chicken",
        "versions": ["GRCg7w", "GRCg7b", "galGal6", "galGal5"]
    },
    {
        "name": "Frog",
        "versions": ["xenTro10"]
    },
    {
        "name": "Zebrafish",
        "versions": ["danRer11", "danRer10", "danRer7"]
    },
    {
        "name": "Spotted Gar",
        "versions": ["lepOcu1"]
    },
    {
        "name": "Fruit Fly",
        "versions": ["dm6"]
    },
    {
        "name": "C.elegans",
        "versions": ["ce11"]
    },
    {
        "name": "Arabidopsis",
        "versions": ["araTha1"]
    },
    {
        "name": "Brapa",
        "versions": ["b_chiifu_v3"]
    },
    {
        "name": "Seahare",
        "versions": ["aplCal3"]
    },
    {
        "name": "Yeast",
        "versions": ["sacCer3"]
    },
    {
        "name": "P. falciparum",
        "versions": ["Pfal3D7"]
    },
    {
        "name": "Green Algae",
        "versions": ["Creinhardtii5.6"]
    },
    {
        "name": "Virus",
        "versions": ["SARS-CoV-2", "MERS", "SARS", "Ebola", "hpv16"]
    },
    {
        "name": "Trypanosome",
        "versions": ["TbruceiTREU927", "TbruceiLister427"]
    }
]
