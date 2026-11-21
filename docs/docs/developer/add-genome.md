---
sidebar_position: 1
---

# Add a new genome

There are two ways to use a genome that is not in the Browser's list.

- **Without changing code:** add a custom genome from the genome picker. This is the right choice for a private or draft assembly. See [Pick a genome](../use-the-browser/pick-genome.md).
- **In the code:** make the genome part of the Browser, so it is listed for every user. The rest of this page describes this, using mouse `mm10` as the example.

## Prepare the genome sequence file

The Browser reads the genome sequence from a file in the [2bit](http://genome.ucsc.edu/FAQ/FAQformat.html#format7) format developed by UCSC. For mouse mm10, it can be downloaded from `http://hgdownload.soe.ucsc.edu/goldenPath/mm10/bigZips/mm10.2bit`. Put the 2bit file on a web server that allows CORS access, see [Configure your webserver to enable CORS](../tracks/file-tracks.md).

## Create the folder for the genome configuration files

Create a folder called `mm10` under `eg-tracks/src/models/genomes`. All the files below go in this folder.

### Cytoband file (optional)

The cytoband file draws the chromosome ideogram in the genome navigator. Download the cytoband information from `http://hgdownload.soe.ucsc.edu/goldenPath/mm10/database/cytoBandIdeo.txt.gz` and unzip it. The Browser needs it as a JSON file that lists the bands of each chromosome:

```json
{
    "chr1": [
        {"chrom": "chr1", "chromStart": 0, "chromEnd": 8918386, "name": "qA1", "gieStain": "gpos100"},
        {"chrom": "chr1", "chromStart": 8918386, "chromEnd": 12386647, "name": "qA2", "gieStain": "gneg"}
    ]
}
```

This command converts the UCSC text file to that format and writes `cytoBandIdeo.json`:

```sh
node -e '
const fs = require("fs");
const bands = {};
for (const line of fs.readFileSync(process.argv[1], "utf8").split("\n")) {
  const [chrom, chromStart, chromEnd, name, gieStain] = line.split("\t");
  if (!chromEnd) continue;
  (bands[chrom] = bands[chrom] || []).push({ chrom, chromStart: Number(chromStart), chromEnd: Number(chromEnd), name, gieStain });
}
fs.writeFileSync("cytoBandIdeo.json", JSON.stringify(bands));
' cytoBandIdeo.txt
```

### Annotation tracks

Create a file called `annotationTracks.json`. It lists the tracks offered under **Tracks → Annotation Tracks** for this genome, grouped by category:

```json
{
    "Ruler": [
        {
            "type": "ruler",
            "label": "Ruler",
            "name": "Ruler"
        }
    ],
    "Genes": [
        {
            "name": "refGene",
            "label": "RefSeq genes",
            "filetype": "geneAnnotation"
        }
    ],
    "RepeatMasker": {
        "All Repeats": [
            {
                "name": "rmsk_all",
                "label": "RepeatMasker",
                "filetype": "repeatmasker",
                "url": "https://vizhub.wustl.edu/public/mm10/rmsk16.bb",
                "height": 30
            }
        ]
    },
    "Genome Comparison": [
        {
            "name": "hg38tomm10",
            "label": "Human hg38 to mm10 blastz",
            "querygenome": "hg38",
            "filetype": "genomealign",
            "url": "https://vizhub.wustl.edu/public/mm10/weaver/mm10_hg38_axt.gz"
        }
    ]
}
```

:::info note

A `geneAnnotation` track has no file: its data come from the WashU gene annotation service, which only knows the gene sets of the genomes it hosts. For a genome it does not host, provide gene annotation as a file-based track instead, for example a [refbed](../tracks/file-tracks.md) track.
:::

### Genome configuration file

Create a file called `mm10.js`. It defines the chromosomes and their sizes (available from `http://hgdownload.soe.ucsc.edu/goldenPath/mm10/bigZips/mm10.chrom.sizes`), the region and tracks shown when the genome is opened, and the location of the 2bit file:

```js
import Chromosome from "../../Chromosome";
import Genome from "../../Genome";
import TrackModel from "../../TrackModel";
import cytobands from "./cytoBandIdeo.json";
import annotationTracks from "./annotationTracks.json";

const genome = new Genome("mm10", [
  new Chromosome("chr1", 195471971),
  new Chromosome("chr2", 182113224),
  // ... one line for each chromosome
  new Chromosome("chrM", 16299),
]);

const navContext = genome.makeNavContext();
const defaultRegion = "chr6:52425276-52425961";
const defaultTracks = [
  new TrackModel({
    type: "ruler",
    name: "Ruler",
  }),
  new TrackModel({
    type: "geneAnnotation",
    name: "refGene",
    genome: "mm10",
  }),
  new TrackModel({
    type: "repeatmasker",
    name: "RepeatMasker",
    url: "https://vizhub.wustl.edu/public/mm10/rmsk16.bb",
  }),
];

const MM10 = {
  genome: genome,
  navContext: navContext,
  cytobands: cytobands,
  defaultRegion: defaultRegion,
  defaultTracks: defaultTracks,
  twoBitURL: "https://vizhub.wustl.edu/public/mm10/mm10.2bit",
  annotationTracks,
};

export default MM10;
```

#### defaultRegion

The region displayed when the genome is opened, written as `chromosome:start-end`.

#### defaultTracks

The tracks displayed when the genome is opened. Each one is a track as you would write it in a [datahub](../datahub/datahub.md).

#### publicHubList

Optional. The data hubs offered under **Tracks → Public Data Hubs** for this genome. Add two more members to the configuration object: `publicHubData`, which describes each collection, and `publicHubList`, which lists the hubs:

```js
const publicHubData = {
  "4D Nucleome Network":
    "The 4D Nucleome Network aims to understand the principles underlying nuclear organization in space and time.",
};

const publicHubList = [
  {
    collection: "4D Nucleome Network",
    name: "4DN HiC datasets",
    numTracks: 23,
    oldHubFormat: false,
    url: "https://vizhub.wustl.edu/public/mm10/4dn_mm10.json",
    description: {
      "hub built by": "Daofeng Li (dli23@wustl.edu)",
      "hub built date": "Sep 1 2018",
    },
  },
];

const MM10 = {
  // ... the members shown above
  publicHubData,
  publicHubList,
};
```

## Add the new genome to the system

Open `eg-tracks/src/models/genomes/allGenomes.ts` and make three additions.

1. Import the configuration:

    ```js
    import MM10 from "./mm10/mm10";
    ```

2. Add it to the `allGenomes` list:

    ```js
    export const allGenomes = [
      // ... the other genomes
      MM10,
    ];
    ```

3. List the assembly under its species in `Tree_of_Life`, which is what the genome picker shows. Add the assembly to an existing species, or add a new species with a name, a logo image and its assemblies:

    ```js
    {
      name: "Mouse",
      logoUrl: "https://vizhub.wustl.edu/public/images/Mouse.png",
      assemblies: [MM39.genome._name, MM10.genome._name, MM9.genome._name],
      color: "white",
    },
    ```

Two genomes cannot have the same name: the Browser refuses to start if they do, because sessions are saved with the genome name.

Start the Browser (see [Run your own copy](../installation.md)); the new genome appears in the genome picker.
