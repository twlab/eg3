/**
 * Example: Multiple Isolated Genome Hub Instances
 *
 * This example demonstrates how to create multiple independent genome browser
 * instances, each with its own isolated state. This is useful when you want
 * users to work with different genomes simultaneously without interference.
 */

import { useState } from "react";
import App from "../src/App";

interface GenomeHub {
  id: string;
  title: string;
}

export default function MultipleGenomeHubs() {
  const [hubs, setHubs] = useState<GenomeHub[]>([
    { id: "hub-1", title: "Genome Hub 1" },
  ]);
  const [nextId, setNextId] = useState(2);

  const addNewHub = () => {
    const newHub: GenomeHub = {
      id: `hub-${nextId}`,
      title: `Genome Hub ${nextId}`,
    };
    setHubs([...hubs, newHub]);
    setNextId(nextId + 1);
  };

  const removeHub = (hubId: string) => {
    setHubs(hubs.filter((hub) => hub.id !== hubId));

    // Clean up the persisted state from localStorage
    localStorage.removeItem(`persist:${hubId}`);
  };

  const renameHub = (hubId: string, newTitle: string) => {
    setHubs(
      hubs.map((hub) => (hub.id === hubId ? { ...hub, title: newTitle } : hub))
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1>Multiple Genome Hub Instances</h1>
        <p>
          Each genome hub below has completely isolated state. You can add
          custom genomes, create sessions, and configure settings independently
          in each hub.
        </p>
        <button
          onClick={addNewHub}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          + Add New Genome Hub
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(800px, 1fr))",
          gap: "20px",
        }}
      >
        {hubs.map((hub) => (
          <div
            key={hub.id}
            style={{
              border: "2px solid #ddd",
              borderRadius: "8px",
              padding: "10px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
                padding: "10px",
                backgroundColor: "white",
                borderRadius: "5px",
              }}
            >
              <input
                type="text"
                value={hub.title}
                onChange={(e) => renameHub(hub.id, e.target.value)}
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  border: "none",
                  outline: "none",
                  flex: 1,
                }}
              />
              <button
                onClick={() => removeHub(hub.id)}
                disabled={hubs.length === 1}
                style={{
                  padding: "5px 15px",
                  cursor: hubs.length === 1 ? "not-allowed" : "pointer",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  opacity: hubs.length === 1 ? 0.5 : 1,
                }}
                title={
                  hubs.length === 1
                    ? "Cannot remove the last hub"
                    : "Remove this hub"
                }
              >
                × Close
              </button>
            </div>

            {/* Each App instance has its own isolated state via storeConfig */}
            <div
              style={{
                height: "600px",
                backgroundColor: "white",
                borderRadius: "5px",
                overflow: "hidden",
              }}
            >
              <App
                storeConfig={{
                  storeId: hub.id,
                  enablePersistence: true,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#e9ecef",
          borderRadius: "5px",
        }}
      >
        <h3>How it works:</h3>
        <ul>
          <li>
            <strong>Isolated State:</strong> Each genome hub has its own Redux
            store with a unique <code>storeId</code> (e.g., "hub-1", "hub-2")
          </li>
          <li>
            <strong>Independent Sessions:</strong> Custom genomes and sessions
            in one hub don't affect others
          </li>
          <li>
            <strong>Persistent Storage:</strong> Each hub's state is saved
            separately in localStorage using its unique storeId
          </li>
          <li>
            <strong>Clean Removal:</strong> When you close a hub, its
            localStorage entry is cleaned up
          </li>
        </ul>

        <h3>Try it:</h3>
        <ol>
          <li>Add a custom genome in one hub</li>
          <li>Click "Add New Genome Hub" to create another instance</li>
          <li>Notice the custom genome only appears in the first hub</li>
          <li>Refresh the page - all hubs maintain their individual state</li>
        </ol>
      </div>
    </div>
  );
}
