// MARK: flatCache
// Flat per-track feature cache.
//
// Legacy storage kept each region's features in `cache[regionIdx].dataCache`,
// so drawing had to gather the visible regions into a fresh combined array on
// every render. The flat model stores the features for all cached regions once
// in `cache.dataCache` (a single array) and records where each region lives in
// `cache.regionIdx[idx] = { start, end }` (end exclusive). A region is then
// just an index range into the shared array, and the visible regions can be
// handed to the renderer as lightweight range descriptors — no copying and no
// per-draw recombination.

// Track types whose per-region payload is not a flat list of features
// (matplot/dynamic store 2D sub-track arrays, genomealign stores precomputed
// alignment data). These keep the legacy per-region storage.
export const FLAT_CACHE_EXCLUDED_TYPES: { [key: string]: number } = {
  matplot: 1,
  dynamic: 1,
  dynamicbed: 1,
  dynamichic: 1,
  dynamiclongrange: 1,
  genomealign: 1,
};

export interface RangeDescriptor {
  dataCache: Array<any>;
  start: number;
  end: number;
}

// A track cache uses the flat model when it draws the primary nav window of 3
// adjacent regions and its payload is a flat feature list (i.e. not an
// expanded-loci or matplot/genomealign track).
export function usesFlatCache(cache: { [key: string]: any }): boolean {
  return !!(
    cache &&
    cache.usePrimaryNav &&
    !cache.useExpandedLoci &&
    !(cache.trackType in FLAT_CACHE_EXCLUDED_TYPES)
  );
}

export function flatHasRegion(
  cache: { [key: string]: any },
  idx: number,
): boolean {
  return !!(cache.regionIdx && cache.regionIdx[idx]);
}

// True when feature data for `idx` is present, regardless of storage model.
export function regionHasData(
  cache: { [key: string]: any },
  idx: number,
): boolean {
  return usesFlatCache(cache)
    ? flatHasRegion(cache, idx)
    : !!(cache[idx] && cache[idx].dataCache);
}

// Shift the recorded ranges of every region (except `exceptIdx`) that starts at
// or after `fromStart` by `delta`, keeping ranges consistent after an in-place
// splice of `cache.dataCache`.
function flatShiftRanges(
  cache: { [key: string]: any },
  fromStart: number,
  delta: number,
  exceptIdx: number,
) {
  const ranges = cache.regionIdx;
  for (const k in ranges) {
    if (Number(k) === Number(exceptIdx)) {
      continue;
    }
    const r = ranges[k];
    if (r.start >= fromStart) {
      r.start += delta;
      r.end += delta;
    }
  }
}

// Remove a region's block from `cache.dataCache` and drop its recorded range,
// shifting the ranges of regions stored after it.
export function flatClearRegion(cache: { [key: string]: any }, idx: number) {
  if (!cache.regionIdx || !cache.regionIdx[idx]) {
    return;
  }
  const r = cache.regionIdx[idx];
  const len = r.end - r.start;
  if (cache.dataCache && len > 0) {
    cache.dataCache.splice(r.start, len);
    flatShiftRanges(cache, r.start, -len, idx);
  }
  delete cache.regionIdx[idx];
}

// Store `features` (a flat feature array for a single region) into the shared
// `cache.dataCache`, recording its index range in `cache.regionIdx[idx]`. On a
// refetch of an already-present region, the old block is removed first so the
// region's data is replaced rather than duplicated. New regions are appended;
// the visible regions are gathered by range at draw time, so insertion order
// need not follow region order.
export function flatSetRegion(
  cache: { [key: string]: any },
  idx: number,
  features: Array<any>,
) {
  if (!cache.dataCache) {
    cache.dataCache = [];
  }
  if (!cache.regionIdx) {
    cache.regionIdx = {};
  }
  flatClearRegion(cache, idx);
  const arr = cache.dataCache;
  const start = arr.length;
  for (let i = 0; i < features.length; i++) {
    arr.push(features[i]);
  }
  cache.regionIdx[idx] = { start, end: arr.length };
}

// Drop all flat feature data for a track (used when its config changes and the
// data must be refetched).
export function flatClearAll(cache: { [key: string]: any }) {
  cache.dataCache = [];
  cache.regionIdx = {};
}

// Build lightweight range descriptors for the given regions. Each descriptor
// points at the shared `cache.dataCache` and carries the region's [start, end)
// range, so a consumer can read just that region without copying or combining
// arrays. Only regions that currently have data are included.
export function flatRegionDescriptors(
  cache: { [key: string]: any },
  idxs: Array<number>,
): Array<RangeDescriptor> {
  const out: Array<RangeDescriptor> = [];
  if (!cache.regionIdx) {
    return out;
  }
  for (const idx of idxs) {
    const r = cache.regionIdx[idx];
    if (r) {
      out.push({ dataCache: cache.dataCache, start: r.start, end: r.end });
    }
  }
  return out;
}
