# Using App Component with Multiple Isolated Instances

When exporting the App component as a package, you may want to create multiple independent genome browser instances. Each instance needs its own isolated Redux state to prevent interference between different genome hubs.

## Quick Start

### Single Instance (Default)

```tsx
import App from "your-package-name";

function MyComponent() {
  return <App />;
}
```

### Multiple Isolated Instances

```tsx
import App from "your-package-name";

function MultipleGenomeHubs() {
  return (
    <div>
      {/* First genome hub instance */}
      <div className="genome-hub">
        <App storeConfig={{ storeId: "genome-hub-1" }} />
      </div>

      {/* Second genome hub instance */}
      <div className="genome-hub">
        <App storeConfig={{ storeId: "genome-hub-2" }} />
      </div>
    </div>
  );
}
```

## Configuration Options

### `storeConfig` Props

```tsx
interface StoreConfig {
  /**
   * Unique identifier for this store instance.
   * Used to namespace the persisted state in localStorage.
   * IMPORTANT: Each App instance should have a unique storeId.
   */
  storeId?: string;

  /**
   * Whether to enable persistence for this store.
   * Default: true
   * Set to false if you don't want the state saved to localStorage.
   */
  enablePersistence?: boolean;
}
```

## Use Cases

### 1. Dynamic Genome Hubs

Create genome hubs dynamically based on user actions:

```tsx
import { useState } from "react";
import App from "your-package-name";

function DynamicGenomeHubs() {
  const [hubs, setHubs] = useState<string[]>([]);

  const addNewHub = () => {
    const newHubId = `genome-hub-${Date.now()}`;
    setHubs([...hubs, newHubId]);
  };

  const removeHub = (hubId: string) => {
    setHubs(hubs.filter((id) => id !== hubId));
    // Optionally clear the persisted state
    localStorage.removeItem(`persist:${hubId}`);
  };

  return (
    <div>
      <button onClick={addNewHub}>Add New Genome Hub</button>

      {hubs.map((hubId) => (
        <div key={hubId} className="genome-hub-container">
          <button onClick={() => removeHub(hubId)}>Close</button>
          <App storeConfig={{ storeId: hubId }} />
        </div>
      ))}
    </div>
  );
}
```

### 2. Tab-Based Genome Browsers

Create separate genome browsers in tabs:

```tsx
import { useState } from "react";
import App from "your-package-name";

function TabbedGenomeBrowsers() {
  const [tabs, setTabs] = useState([
    { id: "tab-1", title: "Human Genome" },
    { id: "tab-2", title: "Mouse Genome" },
  ]);
  const [activeTab, setActiveTab] = useState("tab-1");

  return (
    <div>
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? "active" : ""}
          >
            {tab.title}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={{ display: activeTab === tab.id ? "block" : "none" }}
          >
            <App storeConfig={{ storeId: tab.id }} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Comparison View

Show multiple genomes side-by-side:

```tsx
import App from "your-package-name";

function GenomeComparison() {
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
    >
      <div>
        <h2>Human Genome (hg38)</h2>
        <App storeConfig={{ storeId: "comparison-human" }} />
      </div>

      <div>
        <h2>Mouse Genome (mm10)</h2>
        <App storeConfig={{ storeId: "comparison-mouse" }} />
      </div>
    </div>
  );
}
```

### 4. Non-Persistent Instances

Create temporary instances without localStorage persistence:

```tsx
import App from "your-package-name";

function TemporaryGenomeBrowser() {
  return (
    <App
      storeConfig={{
        storeId: "temporary-browser",
        enablePersistence: false,
      }}
    />
  );
}
```

## Important Notes

### State Isolation

- Each `storeId` creates a completely isolated Redux store
- Sessions, tracks, and settings are NOT shared between instances
- Each instance has its own localStorage entry (if persistence is enabled)

### Performance Considerations

- Each App instance is a full React component tree with its own state
- For many instances (>5), consider lazy loading or virtualization
- Monitor localStorage usage - each instance stores its own state

### Cleanup

When removing an instance, consider cleaning up its persisted state:

```tsx
const cleanupInstance = (storeId: string) => {
  // Remove from localStorage
  localStorage.removeItem(`persist:${storeId}`);
};
```

### Migration from Single Instance

If you're migrating from a single-instance setup:

1. The default behavior (no `storeConfig`) still works
2. Existing localStorage data remains at the `persist:root` key
3. Add `storeConfig` only when you need multiple instances

## API Reference

### App Component Props

```tsx
interface AppProps {
  /**
   * Store configuration for state isolation
   */
  storeConfig?: {
    storeId?: string;
    enablePersistence?: boolean;
  };

  /**
   * Any additional props passed to RootLayout
   */
  [key: string]: any;
}
```

## Troubleshooting

### Issue: State is shared between instances

**Solution:** Ensure each instance has a unique `storeId`:

```tsx
// ❌ Wrong - same storeId
<App storeConfig={{ storeId: 'hub' }} />
<App storeConfig={{ storeId: 'hub' }} />

// ✅ Correct - unique storeIds
<App storeConfig={{ storeId: 'hub-1' }} />
<App storeConfig={{ storeId: 'hub-2' }} />
```

### Issue: LocalStorage quota exceeded

**Solution:** Reduce the number of persisted instances or disable persistence:

```tsx
<App storeConfig={{ enablePersistence: false }} />
```

### Issue: Old state persists after reload

**Solution:** Clear the specific instance's localStorage:

```tsx
localStorage.removeItem("persist:your-store-id");
```

## Advanced: Programmatic Store Access

If you need direct access to a store instance:

```tsx
import { createAppStore } from "your-package-name/lib/redux/createStore";

const { store, persistor } = createAppStore({ storeId: "my-store" });

// Now you can dispatch actions directly
store.dispatch(someAction());
```
