export function removeDuplicates(arr: Array<any>) {
  const idSet = new Set<number>();
  const uniqueObjects: Array<any> = [];

  for (const obj of arr) {
    if (!idSet.has(obj.id)) {
      // This is a unique ID; add it to the set and the result array
      idSet.add(obj.id);
      uniqueObjects.push(obj);
    }
    // Otherwise, skip this object (it's a duplicate)
  }

  return uniqueObjects;
}
