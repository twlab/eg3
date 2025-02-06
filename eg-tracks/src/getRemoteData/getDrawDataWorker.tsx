import _ from "lodash";
import ChromosomeInterval from "../models/ChromosomeInterval";
import Feature, {
  Fiber,
  JasparFeature,
  NumericalArrayFeature,
  NumericalFeature,
} from "../models/Feature";
import { parseNumberString } from "../models/util";
import { BamAlignment } from "@eg/core/src/eg-lib/models/BamAlignment";
import ImageRecord from "@eg/core/src/eg-lib/models/ImageRecord";
import QBed from "@eg/core/src/eg-lib/models/QBed";
import Snp from "@eg/core/src/eg-lib/models/Snp";
import { removeDuplicates } from "../components/GenomeView/TrackComponents/commonComponents/check-obj-dupe";
import { displayModeComponentMap } from "../components/GenomeView/TrackComponents/displayModeComponentMap";
import Gene, { IdbRecord } from "../models/Gene";
import MethylCRecord from "../models/MethylCRecord";
import {
  RepeatDASFeature,
  RepeatMaskerFeature,
} from "../models/RepeatMaskerFeature";
import { GenomeInteraction } from "./GenomeInteraction";
import { NumericalAggregator } from "../components/GenomeView/TrackComponents/commonComponents/numerical/NumericalAggregator";
enum BedColumnIndex {
  CATEGORY = 3,
}

self.onmessage = async (event: MessageEvent) => {
  const expandGenomicLoci = event.data.expandedGenLoci;
  const trackToFetch = event.data.trackToFetch;
  const genomicLoci = event.data.genomicLoci;

  const fetchResults = {};
  const trackToDrawId = {};
  const genomicFetchCoord = {};
  const useFineModeNav = event.data.useFineModeNav;
  const primaryGenName = event.data.primaryGenName;
  const initGenomicLoci = event.data.initGenomicLoci;

  function getDisplayModeFunction(
    drawData: { [key: string]: any },
    displaySetter?: any,
    displayCache?: any,
    cacheIdx?: any,
    curXPos?: any
  ) {
    if (drawData.trackModel.type === "ruler") {
    } else if (
      drawData.configOptions.displayMode === "full" &&
      drawData.trackModel.type !== "genomealign"
    ) {
      let formattedData: Array<any> = [];
      if (drawData.trackModel.type === "geneannotation") {
        const filteredArray = removeDuplicates(drawData.genesArr, "id");

        formattedData = filteredArray.map((record) => new Gene(record));
      } else if (drawData.trackModel.type === "refbed") {
        const filteredArray = removeDuplicates(drawData.genesArr, 7);

        formattedData = filteredArray.map((record) => {
          const refBedRecord = {} as IdbRecord;
          refBedRecord.chrom = record.chr;
          refBedRecord.txStart = record.start;
          refBedRecord.txEnd = record.end;
          refBedRecord.id = record[7];
          refBedRecord.name = record[6];
          refBedRecord.description = record[11] ? record[11] : "";
          refBedRecord.transcriptionClass = record[8];
          refBedRecord.exonStarts = record[9];
          refBedRecord.exonEnds = record[10];
          refBedRecord.cdsStart = Number.parseInt(record[3], 10);
          refBedRecord.cdsEnd = Number.parseInt(record[4], 10);
          refBedRecord.strand = record[5];
          return new Gene(refBedRecord);
        });
      } else if (drawData.trackModel.type === "bed") {
        const filteredArray = removeDuplicates(
          drawData.genesArr,
          "start",
          "end"
        );
        formattedData = filteredArray.map((record) => {
          let newChrInt = new ChromosomeInterval(
            record.chr,
            record.start,
            record.end
          );
          return new Feature(
            newChrInt.toStringWithOther(newChrInt),
            newChrInt,
            drawData.trackModel.isText ? record[5] : ""
          );
        });
      } else if (drawData.trackModel.type === "categorical") {
        const filteredArray = removeDuplicates(
          drawData.genesArr,
          "start",
          "end"
        );
        formattedData = filteredArray.map(
          (record) =>
            new Feature(
              record[BedColumnIndex.CATEGORY],
              new ChromosomeInterval(record.chr, record.start, record.end)
            )
        );
      } else if (drawData.trackModel.type === "bam") {
        const filteredArray = removeDuplicates(drawData.genesArr, "_id");
        formattedData = BamAlignment.makeBamAlignments(filteredArray);
      } else if (drawData.trackModel.type === "omeroidr") {
        formattedData = drawData.genesArr.map(
          (record) => new ImageRecord(record)
        );
      } else if (drawData.trackModel.type === "bigbed") {
        const filteredArray = removeDuplicates(drawData.genesArr, "rest");
        formattedData = filteredArray.map((record) => {
          const fields = record.rest.split("\t");

          const name = fields[0];
          const numVal = fields[1];
          const strand = fields[2];

          return new Feature(
            name,
            new ChromosomeInterval(record.chr, record.start, record.end),
            strand
          );
        });
      } else if (drawData.trackModel.type === "snp") {
        const filteredArray = removeDuplicates(drawData.genesArr, "id");
        formattedData = filteredArray.map((record) => new Snp(record));
      } else if (drawData.trackModel.type === "repeatmasker") {
        let rawDataArr: Array<RepeatDASFeature> = [];
        drawData.genesArr.map((record) => {
          const restValues = record.rest.split("\t");
          const output: RepeatDASFeature = {
            genoLeft: restValues[7],
            label: restValues[0],
            max: record.end,
            milliDel: restValues[5],
            milliDiv: restValues[4],
            milliIns: restValues[6],
            min: record.start,
            orientation: restValues[2],
            repClass: restValues[8],
            repEnd: restValues[11],
            repFamily: restValues[9],
            repLeft: restValues[12],
            repStart: restValues[10],
            score: Number(restValues[1]),
            segment: record.chr,
            swScore: restValues[3],
            type: "bigbed",
            _chromId: record.chromId,
          };

          rawDataArr.push(output);
        });

        formattedData = rawDataArr.map(
          (feature) => new RepeatMaskerFeature(feature)
        );
      } else if (drawData.trackModel.type === "jaspar") {
        const filteredArray = removeDuplicates(drawData.genesArr, "uniqueId");

        formattedData = filteredArray.map((record) => {
          const rest = record.rest.split("\t");
          return new JasparFeature(
            rest[3],
            new ChromosomeInterval(record.chr, record.start, record.end),
            rest[2]
          ).withJaspar(Number.parseInt(rest[1], 10), rest[0]);
        });
      }

      let svgDATA = displayModeComponentMap.full({
        formattedData,
        trackState: drawData.trackState,
        windowWidth: drawData.windowWidth,
        configOptions: drawData.configOptions,
        renderTooltip: drawData.renderTooltip,
        svgHeight: drawData.svgHeight,
        updatedLegend: drawData.updatedLegend,
        trackModel: drawData.trackModel,
        getGenePadding: drawData.getGenePadding,
        getHeight: drawData.getHeight,
        ROW_HEIGHT: drawData.ROW_HEIGHT,
      });

      return svgDATA;
    } else if (drawData.trackModel.type === "matplot") {
      let formattedData: Array<any> = [];

      for (let i = 0; i < drawData.genesArr.length; i++) {
        formattedData.push(
          drawData.genesArr[i].map((record) => {
            let newChrInt = new ChromosomeInterval(
              record.chr,
              record.start,
              record.end
            );
            return new NumericalFeature("", newChrInt).withValue(record.score);
          })
        );
      }
      let tmpObj = { ...drawData.configOptions };
      tmpObj.displayMode = "auto";

      let canvasElements = displayModeComponentMap["matplot"]({
        formattedData,
        trackState: drawData.trackState,
        windowWidth: drawData.windowWidth,
        configOptions: tmpObj,
        updatedLegend: drawData.updatedLegend,
        trackModel: drawData.trackModel,
      });

      return canvasElements;
    } else if (drawData.trackModel.type === "modbed") {
      let formattedData;
      formattedData = drawData.genesArr.map((record) => {
        return new Fiber(
          record[3],
          new ChromosomeInterval(record.chr, record.start, record.end),
          record[5]
        ).withFiber(parseNumberString(record[4]), record[6], record[7]);
      });

      let elements = displayModeComponentMap.modbed({
        formattedData,
        trackState: drawData.trackState,
        windowWidth: drawData.windowWidth,
        configOptions: drawData.configOptions,
        updatedLegend: drawData.updatedLegend,
        trackModel: drawData.trackModel,
        renderTooltip: drawData.renderTooltip,
        svgHeight: drawData.svgHeight,
        getGenePadding: drawData.getGenePadding,
        getHeight: drawData.getHeight,
        ROW_HEIGHT: drawData.configOptions.rowHeight + 2,
        onHideToolTip: drawData.onHideToolTip,
      });

      return elements;
    } else if (
      drawData.trackModel.type in { hic: "", biginteract: "", longrange: "" }
    ) {
      let formattedData: any = [];
      if (drawData.trackModel.type === "biginteract") {
        drawData.genesArr.map((record) => {
          const regexMatch = record.rest.match(
            /([\w.]+)\W+(\d+)\W+(\d+)\W+(\d+)/
          );

          if (regexMatch) {
            const fields = record.rest.split("\t");

            const score = parseInt(fields[1]);
            const region1Chrom = fields[5];
            const region1Start = parseInt(fields[6]);
            const region1End = parseInt(fields[7]);
            const region2Chrom = fields[10];
            const region2Start = parseInt(fields[11]);
            const region2End = parseInt(fields[12]);

            const recordLocus1 = new ChromosomeInterval(
              region1Chrom,
              region1Start,
              region1End
            );
            const recordLocus2 = new ChromosomeInterval(
              region2Chrom,
              region2Start,
              region2End
            );
            formattedData.push(
              new GenomeInteraction(recordLocus1, recordLocus2, score)
            );
          } else {
            console.error(
              `${record[3]} not formatted correctly in BIGinteract track`
            );
          }
        });
      } else if (drawData.trackModel.type === "longrange") {
        drawData.genesArr.map((record) => {
          const regexMatch = record[3].match(
            /([\w.]+)\W+(\d+)\W+(\d+)\W+(\d+)/
          );

          if (regexMatch) {
            const chr = regexMatch[1];
            const start = Number.parseInt(regexMatch[2], 10);
            const end = Number.parseInt(regexMatch[3], 10);
            const score = Number.parseFloat(record[3].split(",")[1]);
            const recordLocus1 = new ChromosomeInterval(
              record.chr,
              record.start,
              record.end
            );
            const recordLocus2 = new ChromosomeInterval(chr, start, end);
            formattedData.push(
              new GenomeInteraction(recordLocus1, recordLocus2, score)
            );
          } else {
            console.error(
              `${record[3]} not formatted correctly in longrange track`
            );
          }
        });
      } else {
        formattedData = drawData.genesArr;
      }

      let canvasElements = displayModeComponentMap.interaction({
        formattedData,
        trackState: drawData.trackState,
        windowWidth: drawData.windowWidth,
        configOptions: drawData.configOptions,
        updatedLegend: drawData.updatedLegend,
        trackModel: drawData.trackModel,
      });

      return canvasElements;
    } else if (drawData.trackModel.type === "dynamichic") {
      let formattedData = drawData.genesArr;
      let canvasElements = displayModeComponentMap[drawData.trackModel.type]({
        formattedData,
        trackState: drawData.trackState,
        windowWidth: drawData.windowWidth,
        configOptions: { ...drawData.configOptions, displayMode: "heatmap" },
        updatedLegend: drawData.updatedLegend,
        trackModel: drawData.trackModel,
      });

      return canvasElements;
    } else if (
      drawData.trackModel.type in
      { dynamic: "", dynamicbed: "", dynamiclongrange: "" }
    ) {
      let formattedData: Array<any> = [];
      if (drawData.trackModel.type === "dynamicbed") {
        formattedData = drawData.genesArr.map((geneArr: any) =>
          geneArr.map(
            (record) =>
              new Feature(
                record[3],
                new ChromosomeInterval(record.chr, record.start, record.end)
              )
          )
        );
      } else if (drawData.trackModel.type === "dynamiclongrange") {
        formattedData = drawData.genesArr.map((geneArr: any) => {
          let tempLongrangeData: any[] = [];
          geneArr.map((record) => {
            const regexMatch = record[3].match(
              /([\w.]+)\W+(\d+)\W+(\d+)\W+(\d+)/
            );
            if (regexMatch) {
              const chr = regexMatch[1];
              const start = Number.parseInt(regexMatch[2], 10);
              const end = Number.parseInt(regexMatch[3], 10);
              const score = Number.parseFloat(record[3].split(",")[1]);
              const recordLocus1 = new ChromosomeInterval(
                record.chr,
                record.start,
                record.end
              );
              const recordLocus2 = new ChromosomeInterval(chr, start, end);
              tempLongrangeData.push(
                new GenomeInteraction(recordLocus1, recordLocus2, score)
              );
            } else {
              console.error(
                `${record[3]} not formatted correctly in longrange track`
              );
            }
          });
          return tempLongrangeData;
        });
      } else {
        formattedData = drawData.genesArr.map((geneArr: any) =>
          geneArr.map((record) =>
            new NumericalFeature(
              "",
              new ChromosomeInterval(record.chr, record.start, record.end)
            ).withValue(record.score)
          )
        );
      }

      let canvasElements = displayModeComponentMap[
        drawData.trackModel.type === "dynamiclongrange"
          ? "dynamichic"
          : drawData.trackModel.type
      ]({
        formattedData,
        trackState: drawData.trackState,
        windowWidth: drawData.windowWidth,
        configOptions: drawData.configOptions,
        updatedLegend: drawData.updatedLegend,
        trackModel: drawData.trackModel,
        getGenePadding: drawData.getGenePadding,
        getHeight: drawData.getHeight,
        ROW_HEIGHT: drawData.ROW_HEIGHT,
      });

      return canvasElements;
    } else if (drawData.trackModel.type in { methylc: "", dynseq: "" }) {
      let formattedData = drawData.genesArr.map((record) => {
        if (drawData.trackModel.type === "methylc") {
          return new MethylCRecord(record);
        } else {
          let newChrInt = new ChromosomeInterval(
            record.chr,
            record.start,
            record.end
          );
          return new NumericalFeature("", newChrInt).withValue(record.score);
        }
      });

      let canvasElements = displayModeComponentMap[drawData.trackModel.type]({
        formattedData,
        trackState: drawData.trackState,
        windowWidth: drawData.windowWidth,
        configOptions: drawData.configOptions,
        updatedLegend: drawData.updatedLegend,
        trackModel: drawData.trackModel,
        genomeConfig: drawData.genomeConfig,
        basesByPixel: drawData.basesByPixel,
      });

      return canvasElements;
    } else if (drawData.trackModel.type === "qbed") {
      let formattedData = drawData.genesArr.map((record) => new QBed(record));

      let canvasElements = displayModeComponentMap.qbed({
        formattedData,
        trackState: drawData.trackState,
        windowWidth: drawData.windowWidth,
        configOptions: drawData.configOptions,
        updatedLegend: drawData.updatedLegend,
        trackModel: drawData.trackModel,
      });

      return canvasElements;
    } else if (drawData.trackModel.type === "dbedgraph") {
      const VALUE_COLUMN_INDEX = 3;
      let formattedData = drawData.genesArr.map((record) => {
        const locus = new ChromosomeInterval(
          record.chr,
          record.start,
          record.end
        );
        let parsedValue;
        try {
          parsedValue = JSON.parse(record[VALUE_COLUMN_INDEX]);
        } catch (e) {
          console.error(e);
          parsedValue = [0];
        }
        return new NumericalArrayFeature("", locus).withValues(parsedValue);
      });

      let canvasElements = displayModeComponentMap.dbedgraph({
        formattedData,
        trackState: drawData.trackState,
        windowWidth: drawData.windowWidth,
        configOptions: drawData.configOptions,
        updatedLegend: drawData.updatedLegend,
        trackModel: drawData.trackModel,
      });

      return canvasElements;
    } else if (drawData.trackModel.type === "boxplot") {
      let formattedData = drawData.genesArr.map((record) => {
        let newChrInt = new ChromosomeInterval(
          record.chr,
          record.start,
          record.end
        );
        return new NumericalFeature("", newChrInt).withValue(record.score);
      });

      let canvasElements = displayModeComponentMap.boxplot({
        formattedData,
        trackState: drawData.trackState,
        windowWidth: drawData.windowWidth,
        configOptions: drawData.configOptions,
        updatedLegend: drawData.updatedLegend,
        trackModel: drawData.trackModel,
      });

      return canvasElements;
    } else if (
      drawData.trackModel.type in { bigwig: "", qbed: "", bedgraph: "" } ||
      drawData.configOptions.displayMode === "density"
    ) {
      let formattedData;
      if (drawData.trackModel.type === "geneannotation") {
        const filteredArray = removeDuplicates(drawData.genesArr, "id");
        formattedData = filteredArray.map((record) => {
          let newChrInt = new ChromosomeInterval(
            record.chrom,
            record.txStart,
            record.txEnd
          );
          return new NumericalFeature("", newChrInt).withValue(record.score);
        });
      } else if (drawData.trackModel.type === "bigbed") {
        formattedData = drawData.genesArr.map((record) => {
          const fields = record.rest.split("\t");

          const name = fields[0];
          const numVal = fields[1];
          const strand = fields[2];
          let newChrInt = new ChromosomeInterval(
            record.chr,
            record.start,
            record.end
          );
          return new NumericalFeature(name, newChrInt, strand).withValue(
            record.score
          );
        });
      } else if (
        drawData.trackModel.type === "bedgraph" ||
        drawData.trackModel.filetype === "bedgraph"
      ) {
        const VALUE_COLUMN_INDEX = 3;
        formattedData = drawData.genesArr.map((record) => {
          let newChrInt = new ChromosomeInterval(
            record.chr,
            record.start,
            record.end
          );
          const unsafeValue = Number(record[VALUE_COLUMN_INDEX]);
          const value = Number.isFinite(unsafeValue) ? unsafeValue : 0;
          return new NumericalFeature("", newChrInt).withValue(value);
        });
      } else if (drawData.trackModel.type === "snp") {
        formattedData = drawData.genesArr.map((record) => new Snp(record));
      } else if (drawData.trackModel.type === "bam") {
        formattedData = BamAlignment.makeBamAlignments(drawData.genesArr);
      } else if (drawData.trackModel.type === "omeroidr") {
        formattedData = drawData.genesArr.map(
          (record) => new ImageRecord(record)
        );
      } else {
        formattedData = drawData.genesArr.map((record) => {
          let newChrInt = new ChromosomeInterval(
            record.chr,
            record.start,
            record.end
          );
          return new NumericalFeature("", newChrInt).withValue(record.score);
        });
      }
      let newConfigOptions = { ...drawData.configOptions };
      if (drawData.trackModel.type !== "bigwig") {
        newConfigOptions.displayMode = "auto";
      }

      const aggregator = new NumericalAggregator();
      let xToValue, xToValue2, hasReverse;
      if (data) {
        const xvalues = aggregator.xToValueMaker(
          data,
          viewRegion,
          width,
          options
        );
        [xToValue, xToValue2, hasReverse] = xvalues;
      }
      e;

      const [canvasElements, xToFeaturesArr] = displayModeComponentMap.density({
        formattedData,
        trackState: drawData.trackState,
        windowWidth: drawData.windowWidth,
        configOptions: newConfigOptions,
        updatedLegend: drawData.updatedLegend,
        trackModel: drawData.trackModel,
      });
      console.log(xToFeaturesArr);
      return [canvasElements, xToFeaturesArr];
    }
  }

  postMessage({
    fetchResults,

    navData: {
      ...event.data,
      genomicFetchCoord,
      trackToDrawId,
      side: event.data.trackSide,
    },
  });
};
