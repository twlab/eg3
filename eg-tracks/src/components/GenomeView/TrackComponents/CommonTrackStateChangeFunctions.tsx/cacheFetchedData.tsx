// import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";

export function groupTracksArrMatPlot(data: Array<any>) {
  // Pre-determine the size to avoid dynamic resizing
  const maxIndex =
    data.length > 0
      ? Math.max(...data.map((d) => d.dataCache?.length || 0))
      : 0;
  const groupedArrays: any[][] = new Array(maxIndex);

  // Initialize arrays once
  for (let i = 0; i < maxIndex; i++) {
    groupedArrays[i] = [];
  }

  // Use for loops for better performance and flatten during grouping
  for (let i = 0; i < data.length; i++) {
    const dataItem = data[i];
    const dataCache = dataItem.dataCache;

    for (let j = 0; j < dataCache.length; j++) {
      const featArr = dataCache[j];

      groupedArrays[j].push(featArr);
    }
  }

  return groupedArrays;
}

export const trackUsingExpandedLoci = {
  biginteract: "",
  dynamichic: "",
  dynamiclongrange: "",
  hic: "",
  longrange: "",
  genomealign: "",
};

export function transformArray(arr: any[][][]) {
  // Determine the number of subarrays in each inner array (assuming all inner arrays have the same structure)
  const numberOfSubArrays = arr[0].length;

  // Initialize the result array with empty arrays for each subarray
  const result: any[][][] = new Array(numberOfSubArrays)
    .fill(null)
    .map(() => []);

  // Iterate over the input array
  arr.forEach((innerArray) => {
    innerArray.forEach((subArray, index) => {
      result[index].push(subArray);
    });
  });

  return result;
}
