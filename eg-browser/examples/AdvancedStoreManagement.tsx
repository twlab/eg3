/**
 * Example: Using StoreManager for Advanced Control
 *
 * This example shows how to use the StoreManager class for programmatic
 * control over multiple store instances, including cleanup and monitoring.
 */

import { useState, useEffect } from "react";
import App from "../src/App";
import { StoreManager } from "../src/lib/redux/StoreManager";

export default function AdvancedStoreManagement() {
  // Create a manager instance (or use the global one)
  const [manager] = useState(() => new StoreManager());
  const [activeStores, setActiveStores] = useState<string[]>([]);
  const [storageInfo, setStorageInfo] = useState<Record<string, number>>({});

  // Update active stores list when it changes
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStores(manager.getStoreIds());

      // Calculate storage usage for each store
      const info: Record<string, number> = {};
      manager.getStoreIds().forEach((id) => {
        try {
          const data = localStorage.getItem(`persist:${id}`);
          info[id] = data ? new Blob([data]).size : 0;
        } catch (error) {
          info[id] = 0;
        }
      });
      setStorageInfo(info);
    }, 1000);

    return () => clearInterval(interval);
  }, [manager]);

  const createNewStore = () => {
    const id = `managed-store-${Date.now()}`;
    manager.getOrCreateStore(id, { enablePersistence: true });
    setActiveStores(manager.getStoreIds());
  };

  const removeStore = (storeId: string) => {
    manager.removeStore(storeId, true);
    setActiveStores(manager.getStoreIds());
  };

  const cleanupOrphaned = () => {
    manager.cleanupOrphanedStorage();
    alert("Orphaned storage cleaned up!");
  };

  const clearAllStores = () => {
    if (confirm("Are you sure you want to clear all stores?")) {
      manager.clearAll(true);
      setActiveStores([]);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const totalStorage = Object.values(storageInfo).reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Advanced Store Management Example</h1>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={createNewStore}
          style={{
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          + Create New Store
        </button>

        <button
          onClick={cleanupOrphaned}
          style={{
            padding: "10px 20px",
            backgroundColor: "#ffc107",
            color: "black",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          🧹 Cleanup Orphaned Storage
        </button>

        <button
          onClick={clearAllStores}
          style={{
            padding: "10px 20px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          🗑️ Clear All Stores
        </button>
      </div>

      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "15px",
          borderRadius: "5px",
          marginBottom: "20px",
        }}
      >
        <h3>Store Statistics</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
          }}
        >
          <div>
            <strong>Active Stores:</strong> {manager.getStoreCount()}
          </div>
          <div>
            <strong>Total Storage:</strong> {formatBytes(totalStorage)}
          </div>
          <div>
            <strong>Average Size:</strong>{" "}
            {manager.getStoreCount() > 0
              ? formatBytes(totalStorage / manager.getStoreCount())
              : "0 Bytes"}
          </div>
        </div>
      </div>

      {activeStores.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            backgroundColor: "#e9ecef",
            borderRadius: "5px",
          }}
        >
          <p style={{ fontSize: "18px", color: "#6c757d" }}>
            No active stores. Click "Create New Store" to get started.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {activeStores.map((storeId) => (
            <div
              key={storeId}
              style={{
                border: "2px solid #dee2e6",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "15px",
                  backgroundColor: "#343a40",
                  color: "white",
                }}
              >
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                    {storeId}
                  </div>
                  <div
                    style={{ fontSize: "12px", opacity: 0.8, marginTop: "5px" }}
                  >
                    Storage: {formatBytes(storageInfo[storeId] || 0)}
                  </div>
                </div>
                <button
                  onClick={() => removeStore(storeId)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  Remove & Cleanup
                </button>
              </div>

              <div style={{ height: "500px", backgroundColor: "#fff" }}>
                <App storeConfig={{ storeId }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#d1ecf1",
          borderRadius: "5px",
          border: "1px solid #bee5eb",
        }}
      >
        <h3>StoreManager Features:</h3>
        <ul>
          <li>
            <strong>Programmatic Control:</strong> Create and remove stores via
            code
          </li>
          <li>
            <strong>Automatic Cleanup:</strong> Removes persisted state when
            stores are deleted
          </li>
          <li>
            <strong>Orphan Detection:</strong> Find and clean up old
            localStorage entries
          </li>
          <li>
            <strong>Monitoring:</strong> Track active stores and their storage
            usage
          </li>
          <li>
            <strong>Lifecycle Management:</strong> Complete control over store
            creation and disposal
          </li>
        </ul>

        <h3>Use Cases:</h3>
        <ul>
          <li>Applications with dynamic workspace management</li>
          <li>Systems that need to monitor resource usage</li>
          <li>Tools requiring programmatic store manipulation</li>
          <li>Admin interfaces for managing multiple genome browsers</li>
        </ul>

        <h3>API Example:</h3>
        <pre
          style={{
            backgroundColor: "#2d3748",
            color: "#e2e8f0",
            padding: "15px",
            borderRadius: "5px",
            overflow: "auto",
          }}
        >
          {`const manager = new StoreManager();

// Create stores
const store1 = manager.getOrCreateStore('my-store-1');
const store2 = manager.getOrCreateStore('my-store-2');

// List all stores
const storeIds = manager.getStoreIds(); // ['my-store-1', 'my-store-2']

// Remove a store and clean up
manager.removeStore('my-store-1', true);

// Clean up orphaned entries
manager.cleanupOrphanedStorage();

// Clear everything
manager.clearAll(true);`}
        </pre>
      </div>
    </div>
  );
}
