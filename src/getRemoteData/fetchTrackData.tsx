import _ from "lodash";
import getTabixData from "./tabixSource";
import getBigData from "./bigSource";
import getCoolSource from "./CoolSource";
import getRepeatSource from "./RepeatSource";
import { BamAlignment } from "@/models/BamAlignment";
const AWS_API = "https://lambda.epigenomegateway.org/v2";

const trackFetchFunction: { [key: string]: any } = {
  geneannotation: async function refGeneFetch(regionData: any) {
    const genRefResponse = await fetch(
      `${AWS_API}/${regionData.genomeName}/genes/${regionData.name}/queryRegion?chr=${regionData.chr}&start=${regionData.start}&end=${regionData.end}`,
      { method: "GET" }
    );

    return await genRefResponse.json();
  },
  snp: async function snpFetch(regionData: any) {
    const SNP_REGION_API = {
      hg19: "https://grch37.rest.ensembl.org/overlap/region/human",
      hg38: "https://rest.ensembl.org/overlap/region/human",
    };

    const api =
      regionData.genomeName in SNP_REGION_API
        ? SNP_REGION_API[`${regionData.genomeName}`]
        : null;

    if (!api) {
      return [];
    }

    const headers = {
      "Content-Type": "application/json",
    };

    if (regionData.end - regionData.start <= 30000) {
      const url = `${api}/${regionData.chr.substr(3)}:${regionData.start}-${
        regionData.end + "?content-type=application%2Fjson&feature=variation"
      }`;
      console.log(url);
      return fetch(url, { headers })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .catch((error) => {
          console.error("There was a problem with the fetch operation:", error);
          return { data: [] };
        });
    } else {
      return [];
    }
  },
  bed: async function bedFetch(regionData: any) {
    return getTabixData(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },
  bedgraph: async function bedgraphFetch(regionData: any) {
    return getTabixData(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },

  qbed: async function qbedFetch(regionData: any) {
    return getTabixData(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },
  dbedgraph: async function dbedgraphFetch(regionData: any) {
    return getTabixData(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },

  boxplot: async function boxplotFetch(regionData: any) {
    return getBigData(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },
  modbed: async function bedFetch(regionData: any) {
    return getTabixData(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },

  jaspar: async function jasparFetch(regionData: any) {
    return getBigData(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },
  bigbed: async function bigbedFetch(regionData: any) {
    return getBigData(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },
  refbed: async function refbedFetch(regionData: any) {
    return getTabixData(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },
  matplot: async function matplotFetch(regionData: any) {
    return getTabixData(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },
  bigwig: async function bigwigFetch(regionData: any) {
    return getBigData(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },
  cool: async function coolFetch(regionData: any) {
    return getCoolSource(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },
  categorical: async function coolFetch(regionData: any) {
    return getTabixData(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },
  longrange: async function coolFetch(regionData: any) {
    return getTabixData(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },
  dynseq: async function dynseqFetch(regionData: any) {
    return getBigData(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },

  repeatmasker: async function repeatmaskerFetch(regionData: any) {
    return getRepeatSource(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url,
      regionData.basesPerPixel
    );
  },
  biginteract: async function biginteractFetch(regionData: any) {
    return getBigData(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },
  methylc: async function methylcFetch(regionData: any) {
    return getTabixData(
      regionData.nav,
      regionData.trackModel.options,
      regionData.trackModel.url
    );
  },
  hic: function hicFetch(straw, options, loci, basesPerPixel) {
    return straw.getData(loci, basesPerPixel, options);
  },
  genomealign: function genomeAlignFetch(
    loci: Array<{ [key: string]: any }>,
    options: { [key: string]: any },
    url: string
  ) {
    return getTabixData(loci, options, url);
  },
};

export default trackFetchFunction;
