# Quick Reference: Multiple Isolated App Instances

## Installation & Basic Usage

```tsx
import { GenomeHub } from 'your-package-name';

// Single instance (backward compatible)
<GenomeHub />

// Multiple instances (new)
<GenomeHub storeConfig={{ storeId: 'hub-1' }} />
<GenomeHub storeConfig={{ storeId: 'hub-2' }} />
```

## Common Patterns

### 1. Dynamic Instances

```tsx
const [hubs, setHubs] = useState<string[]>(["hub-1"]);

const addHub = () => {
  const newId = `hub-${Date.now()}`;
  setHubs([...hubs, newId]);
};

const removeHub = (id: string) => {
  setHubs(hubs.filter((h) => h !== id));
  localStorage.removeItem(`persist:${id}`);
};

return (
  <>
    <button onClick={addHub}>Add Hub</button>
    {hubs.map((id) => (
      <div key={id}>
        <button onClick={() => removeHub(id)}>Close</button>
        <GenomeHub storeConfig={{ storeId: id }} />
      </div>
    ))}
  </>
);
```

### 2. Tabbed Interface

```tsx
const tabs = ["genome-1", "genome-2"];
const [active, setActive] = useState("genome-1");

return (
  <>
    {tabs.map((tab) => (
      <button key={tab} onClick={() => setActive(tab)}>
        {tab}
      </button>
    ))}
    {tabs.map((tab) => (
      <div key={tab} style={{ display: active === tab ? "block" : "none" }}>
        <GenomeHub storeConfig={{ storeId: tab }} />
      </div>
    ))}
  </>
);
```

### 3. Side-by-Side Comparison

```tsx
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
  <GenomeHub storeConfig={{ storeId: "left" }} />
  <GenomeHub storeConfig={{ storeId: "right" }} />
</div>
```

### 4. Temporary (Non-Persistent)

```tsx
<GenomeHub
  storeConfig={{
    storeId: "temp",
    enablePersistence: false,
  }}
/>
```

## Advanced: Store Manager

```tsx
import { StoreManager } from "your-package-name";

const manager = new StoreManager();

// Create stores programmatically
manager.getOrCreateStore("my-store");

// Get all store IDs
const ids = manager.getStoreIds();

// Remove with cleanup
manager.removeStore("my-store", true);

// Clean orphaned storage
manager.cleanupOrphanedStorage();

// Clear everything
manager.clearAll(true);
```

## Configuration Options

```tsx
interface StoreConfig {
  storeId?: string; // Unique ID (default: 'root')
  enablePersistence?: boolean; // Save to localStorage (default: true)
}
```

## Storage Keys

Each instance stores its state at:

```
localStorage key: `persist:${storeId}`
```

## Cleanup

```tsx
// Manual cleanup
localStorage.removeItem("persist:hub-1");

// With StoreManager
manager.removeStore("hub-1", true);

// Using persistor directly
import { createAppStore } from "your-package-name";
const { persistor } = createAppStore({ storeId: "hub-1" });
persistor?.purge();
```

## TypeScript Types

```tsx
import type {
  AppProps, // App component props
  StoreConfig, // Store configuration
  AppStore, // Store instance type
  RootState, // Redux state type
  AppDispatch, // Dispatch type
} from "your-package-name";
```

## Troubleshooting

| Problem                        | Solution                                                    |
| ------------------------------ | ----------------------------------------------------------- |
| State shared between instances | Ensure unique `storeId` for each                            |
| Old state persists             | Clear localStorage: `localStorage.removeItem('persist:id')` |
| Storage quota exceeded         | Disable persistence or reduce instance count                |
| Memory issues                  | Cleanup removed instances properly                          |

## Performance Tips

1. **Limit instances**: Keep to 3-5 active instances max
2. **Lazy loading**: Load instances on-demand
3. **Proper cleanup**: Always remove localStorage when closing
4. **Monitor storage**: Track usage with StoreManager

## Migration Checklist

- [ ] No code changes needed for single instance
- [ ] Add `storeId` when creating multiple instances
- [ ] Implement cleanup for dynamic instances
- [ ] Test state isolation between instances
- [ ] Monitor localStorage usage
- [ ] Update documentation for consumers

## Examples Location

- `examples/MultipleGenomeHubs.tsx` - Basic multi-instance
- `examples/AdvancedStoreManagement.tsx` - StoreManager usage
- `MULTIPLE_INSTANCES.md` - Full documentation
