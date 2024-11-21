export function removeDuplicates(arr: Array<any>, idKey: string) {
  const idSet = new Set<number>();
  const uniqueObjects: Array<any> = [];

  for (const obj of arr) {
    if (!idSet.has(obj[`${idKey}`])) {
      // This is a unique ID; add it to the set and the result array
      idSet.add(obj[`${idKey}`]);
      uniqueObjects.push(obj);
    }
    // Otherwise, skip this object (it's a duplicate)
  }

  return uniqueObjects;
}

interface DataObject {
  start: number;
  end: number;
  [key: string]: any; // Allow other properties
}
export function removeDuplicatesWithoutId(arr: DataObject[]): DataObject[] {
  const uniqueObjects = new Map<string, DataObject>();
  console.log(arr);
  arr.map((item: any, index) => {
    let locus;
    if ("start" in item) {
      locus = item;
    } else {
      locus = item.data;
    }
    console.log(item);
    const key = `${locus.start}-${locus.end}`;
    if (!uniqueObjects.has(key)) {
      uniqueObjects.set(key, item);
    }
  });

  return Array.from(uniqueObjects.values());
}
