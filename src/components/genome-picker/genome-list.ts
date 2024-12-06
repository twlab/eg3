

export interface Genome {
    name: string,
    versions: string[]
}

export const GENOME_LIST: Genome[] = [
    {
        "name": "Human",
        "versions": ["hg19", "hg38"]
    },
    {
        "name": "Gorilla",
        "versions": ["gorGor3", "gorGor4"]
    },
    {
        "name": "Baboon",
        "versions": ["papAnu2"]
    },
    {
        "name": "Marmoset",
        "versions": ["calJac3"]
    },
    {
        "name": "Rabbit",
        "versions": ["oryCun2"]
    },
    {
        "name": "Mouse",
        "versions": ["mm39", "mm10", "mm9"]
    }
]
