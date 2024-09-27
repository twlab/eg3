import _ from "lodash";
import getTabixData from "./tabixSource";
import getBigData from "./bigSource";
import getCoolSource from "./CoolSource";
import getRepeatSource from "./RepeatSource";
const AWS_API = "https://lambda.epigenomegateway.org/v2";

const trackFetchFunction: { [key: string]: any } = {
  geneannotation: async function refGeneFetch(regionData: any) {
    const genRefResponse = await fetch(
      `${AWS_API}/${regionData.genomeName}/genes/${regionData.name}/queryRegion?chr=${regionData.chr}&start=${regionData.start}&end=${regionData.end}`,
      { method: "GET" }
    );

    return await genRefResponse.json();
  },

  bed: async function bedFetch(regionData: any) {
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
