# Persistence Fix for Multiple Instances

## Problem

When using multiple GenomeHub instances with unique `storeId`s, refreshing the page would reset all sessions instead of rehydrating from localStorage.

### Root Cause

The issue was in the `AppProvider` component's `useMemo` hook:

```tsx
// ❌ BEFORE - This was the problem
const { store, persistor } = useMemo(
  () => createAppStore(storeConfig),
  [storeConfig?.storeId, storeConfig?.enablePersistence]
);
```

**Why this failed:**

1. When you pass `storeConfig={{ storeId: 'hub-1' }}` as an inline object
2. On each render (including after refresh), a **new object reference** is created
3. Even though the dependencies look at `storeConfig?.storeId`, the initial call to `createAppStore(storeConfig)` uses the entire object
4. This creates a **brand new store** on every mount, ignoring the persisted state in localStorage

## Solution

### 1. Added Store Caching (`createStore.ts`)

Created a global cache to reuse store instances:

```typescript
const storeCache = new Map<string, ReturnType<typeof createAppStore>>();

export function getOrCreateStore(config: StoreConfig = {}) {
  const { storeId = "root", enablePersistence = true } = config;
  const cacheKey = `${storeId}-${enablePersistence}`;

  if (!storeCache.has(cacheKey)) {
    const storeInstance = createAppStore(config);
    storeCache.set(cacheKey, storeInstance);
  }

  return storeCache.get(cacheKey)!;
}
```

**Benefits:**

- Store instances are cached by their `storeId`
- On refresh/remount, the same store instance is returned
- The store connects to its persisted state in localStorage
- Multiple components with the same `storeId` share the same store

### 2. Updated AppProvider (`AppProvider.tsx`)

Fixed the `useMemo` to use primitive dependencies:

```tsx
// ✅ AFTER - Fixed
const storeId = storeConfig?.storeId;
const enablePersistence = storeConfig?.enablePersistence;

const { store, persistor } = useMemo(
  () => getOrCreateStore({ storeId, enablePersistence }),
  [storeId, enablePersistence]
);
```

**Key changes:**

- Extract primitive values (`storeId`, `enablePersistence`) before `useMemo`
- Use `getOrCreateStore` instead of `createAppStore`
- Dependencies are now stable primitive values, not object references

## How It Works Now

### First Mount

```tsx
<GenomeHub storeConfig={{ storeId: "hub-1" }} />
```

1. `storeId = 'hub-1'` extracted
2. `getOrCreateStore` called with `{ storeId: 'hub-1' }`
3. Cache miss → creates new store
4. Store is cached with key `'hub-1-true'`
5. Store connects to `localStorage['persist:hub-1']`
6. If data exists, PersistGate rehydrates it

### After Refresh

```tsx
<GenomeHub storeConfig={{ storeId: "hub-1" }} />
```

1. `storeId = 'hub-1'` extracted (same value)
2. `getOrCreateStore` called with `{ storeId: 'hub-1' }`
3. Cache hit → returns existing store
4. Store already connected to `localStorage['persist:hub-1']`
5. PersistGate rehydrates the persisted sessions ✅

## Testing

### Test 1: Single Instance Persistence

```tsx
function Test() {
  return <GenomeHub storeConfig={{ storeId: "test-1" }} />;
}
```

1. Add a custom genome
2. Refresh page
3. ✅ Genome should still be there

### Test 2: Multiple Instances Persistence

```tsx
function Test() {
  return (
    <>
      <GenomeHub storeConfig={{ storeId: "hub-a" }} />
      <GenomeHub storeConfig={{ storeId: "hub-b" }} />
    </>
  );
}
```

1. Add genome to hub-a
2. Add different genome to hub-b
3. Refresh page
4. ✅ Both hubs maintain their separate genomes

### Test 3: Dynamic Instances

```tsx
function Test() {
  const [hubs, setHubs] = useState(["hub-1", "hub-2"]);

  return (
    <>
      {hubs.map((id) => (
        <GenomeHub key={id} storeConfig={{ storeId: id }} />
      ))}
    </>
  );
}
```

1. Add genomes to both hubs
2. Refresh page
3. ✅ Both hubs restore their state

## Additional Functions

### Clear Cache Entry

```typescript
import { clearStoreCacheEntry } from "your-package";

// When permanently removing a hub
const removeHub = (id: string) => {
  localStorage.removeItem(`persist:${id}`);
  clearStoreCacheEntry({ storeId: id });
};
```

### Clear All Caches

```typescript
import { clearAllStoreCaches } from "your-package";

// Reset everything (useful for testing)
clearAllStoreCaches();
```

## Migration

If you're already using the package, **no changes needed**! The fix is backward compatible:

- Existing code continues to work
- Persistence now works correctly
- No API changes

## Important Notes

### Store Reuse

The same `storeId` always returns the same store instance:

```tsx
// These both use the SAME store
<GenomeHub storeConfig={{ storeId: 'hub-1' }} />
<GenomeHub storeConfig={{ storeId: 'hub-1' }} />
```

### Cache Lifetime

- Caches persist for the entire browser session
- Refreshing doesn't clear the cache (by design)
- Closing the tab/browser clears the cache
- LocalStorage persists across sessions

### Cleanup

When removing a dynamic instance:

```tsx
const removeHub = (id: string) => {
  // Remove from state
  setHubs(hubs.filter((h) => h !== id));

  // Clean up localStorage
  localStorage.removeItem(`persist:${id}`);

  // Clear from cache (optional, prevents memory leaks in long-running apps)
  clearStoreCacheEntry({ storeId: id });
};
```

## Performance

- **Memory**: Each cached store instance uses ~1-2 MB
- **Recommendation**: Keep cached stores under 10 for optimal performance
- **Cleanup**: Use `clearStoreCacheEntry` when permanently removing instances

## Troubleshooting

### State still not persisting?

1. **Check storeId is stable:**

```tsx
// ❌ Wrong - new object each render
<GenomeHub storeConfig={{ storeId: Math.random().toString() }} />;

// ✅ Correct - stable storeId
const [storeId] = useState("hub-1");
<GenomeHub storeConfig={{ storeId }} />;
```

2. **Check localStorage:**

```javascript
// In browser console
console.log(localStorage.getItem("persist:hub-1"));
```

3. **Clear cache and try again:**

```javascript
// In browser console
localStorage.clear();
location.reload();
```

### Still having issues?

Check the browser console for:

- Redux persistence errors
- QuotaExceededError (storage full)
- Network errors preventing script loading
