import fetch from "isomorphic-fetch";
import _ from "lodash";
import ChromosomeInterval from "../models/ChromosomeInterval";
import { GenomeInteraction } from "./GenomeInteraction";
const HIGLASS_API_URL = "https://higlass.io/api/v1/fragments_by_loci/";
const MATRIX_SIZE = 50; // how many data chunks returned from the API for a query region

function getCoolSource(loci, options, url) {
  /**
   * FIXME this doesn't do well in region set view.
   *
   * @param {ChromosomeInterval} queryLocus1
   * @param {ChromosomeInterval} queryLocus2
   * @param {number} binSize
   */

  async function getInteractionsBetweenLoci(queryLocus1, queryLocus2) {
    const record = await fetch(HIGLASS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        [
          queryLocus1.chr,
          queryLocus1.start,
          queryLocus1.end,
          queryLocus2.chr,
          queryLocus2.start,
          queryLocus2.end,
          url,
          -1,
        ],
      ]),
      params: {
        precision: 3,
        dims: MATRIX_SIZE,
      },
    });

    const records = await record.json();
    const basesPerCell1 = Math.round(
      queryLocus1.end - queryLocus1.start / MATRIX_SIZE
    );
    const basesPerCell2 = Math.round(
      queryLocus2.end - queryLocus2.start / MATRIX_SIZE
    );
    const interactions: Array<any> = [];
    for (let i = 0; i < MATRIX_SIZE; i++) {
      for (let j = i; j < MATRIX_SIZE; j++) {
        // Upper triangle of the contact matrix
        const recordLocus1 = new ChromosomeInterval(
          queryLocus1.chr,
          queryLocus1.start + i * basesPerCell1,
          queryLocus1.start + (i + 1) * basesPerCell1
        );
        const recordLocus2 = new ChromosomeInterval(
          queryLocus2.chr,
          queryLocus2.start + j * basesPerCell2,
          queryLocus2.start + (j + 1) * basesPerCell2
        );

        interactions.push(
          new GenomeInteraction(
            recordLocus1,
            recordLocus2,
            records.data.fragments[0][i][j]
          )
        );
      }
    }
    return interactions;
  }

  /**
   * Gets cool data in the view region.  Note that only a triangular portion of the contact matrix is returned.
   *
   * @param {DisplayedRegionModel} region - region for which to fetch data
   * @param {number} basesPerPixel - bases per pixel.  Higher = more zoomed out
   * @param {Object} options - rendering options
   * @return {Promise<ContactRecord>} a Promise for the data
   */
  async function getData(loci, options = {}) {
    const promises: Array<any> = [];
    for (let i = 0; i < loci.length; i++) {
      for (let j = i; j < loci.length; j++) {
        if (loci[i].chr === loci[j].chr) {
          // higlass API somehow erros out at multiple chroms
          promises.push(await getInteractionsBetweenLoci(loci[i], loci[j]));
        }
      }
    }
    const dataForEachSegment = await Promise.all(promises);
    return _.flatMap(dataForEachSegment);
  }

  function handle() {
    let data = getData(loci, options);

    return data;
  }

  return handle();
}
export default getCoolSource;
