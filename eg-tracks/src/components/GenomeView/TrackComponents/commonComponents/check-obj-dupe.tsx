export function removeDuplicates(
  arr: Array<any>,
  idKey: any,
  idKey2: any = ""
) {
  const uniqueObjectsMap = new Map<string, any>();
  console.log(arr, idKey);
  for (const obj of arr) {
    const combinedKey = idKey2
      ? obj[`${idKey}`] + "|" + obj[`${idKey2}`]
      : obj[`${idKey}`];
    uniqueObjectsMap.set(combinedKey, obj);
  }

  return Array.from(uniqueObjectsMap.values());
}

interface DataObject {
  start: number;
  end: number;
  [key: string]: any; // Allow other properties
}
export function removeDuplicatesWithoutId(arr: DataObject[]): DataObject[] {
  const uniqueObjects = new Map<string, DataObject>();

  arr.map((item: any, index) => {
    let locus;
    if ("start" in item) {
      locus = item;
    } else {
      locus = item.data;
    }

    const key = `${locus.start}-${locus.end}`;
    if (!uniqueObjects.has(key)) {
      uniqueObjects.set(key, item);
    }
  });

  return Array.from(uniqueObjects.values());
}
