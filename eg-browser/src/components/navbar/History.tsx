import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ResizablePanel from "../ui/panel/ResizablePanel";
/**
 * A component to show users' history of operations
 * @param props The component props
 * @returns The History component
 */

type Props = {
  state: {
    past: any[];
    future: any[];
  };
  jumpToPast: (index: number) => void;
  clearHistory: () => void;
  jumpToFuture: (index: number) => void;
  handleToolClick: (tool: string | null) => void;
  anchorEl?: React.RefObject<HTMLElement | null>;
};
const History: React.FC<Props> = ({
  state,
  jumpToPast,
  jumpToFuture,
  clearHistory,
  handleToolClick,
  anchorEl,
}) => {
  const [checkStateEmpty, setCheckStateEmpty] = useState(false);

  const handleCloseModal = () => {
    handleToolClick(null);
  };

  function handleClear() {
    setCheckStateEmpty(true);
    renderHistory();
    clearHistory();
  }
  const renderHistory = () => {
    const { past, future } = state;

    if ((past.length === 0 && future.length === 0) || checkStateEmpty) {
      return <div>No operation history yet!</div>;
    }

    const pastItems = makeItemList(past, (index) => jumpToPast(index), "past");
    const futureItems = makeItemList(
      future,
      (index) => jumpToFuture(index),
      "future",
    );

    return (
      <div>
        {past.length > 0 && <p>Go back:</p>}
        {pastItems}
        {future.length > 0 && <p>Go forward:</p>}
        {futureItems}
      </div>
    );
  };

  // Updated History component to match the style of HighlightMenu
  const makeItemList = (
    stateList: any[],
    callback: (index: number) => void,
    _type: string,
  ) => {
    const items = stateList.map((value, index) => {
      const currentSessionKey = value.currentSession;
      let stateData = null;
      if (
        currentSessionKey &&
        value.sessions.entities[`${currentSessionKey}`]
      ) {
        stateData = value.sessions.entities[`${currentSessionKey}`];
      }

      return (
        <li
          key={index}
          onClick={() => callback(index)}
          style={{
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "clamp(0.4em, 0.5vw, 0.4em)",
            fontSize: "clamp(10px, 0.9vw, 16px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "clamp(4px, 0.5vw, 8px)",
            marginBottom: "0.1em",
          }}
        >
          <span>
            Region:{" "}
            {stateData && stateData.userViewRegion
              ? stateData.userViewRegion
              : stateData && stateData.viewRegion
                ? stateData.viewRegion
                : "(None)"}
            , # of tracks:{" "}
            {stateData && stateData.tracks ? stateData.tracks.length : 0}
          </span>
          <button
            style={{
              fontSize: "clamp(10px, 0.8vw, 16px)",
              marginRight: "4px",
              fontStyle: "italic",
              textDecoration: "underline",
              padding: "2px 6px",
              border: "1px solid transparent",
              borderRadius: "3px",
              transition: "background-color 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f3f4f6";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            Select
          </button>
        </li>
      );
    });
    return (
      <ol style={{ display: "flex", flexDirection: "column", gap: "0.1em" }}>
        {items}
      </ol>
    );
  };
  useEffect(() => {
    setCheckStateEmpty(false);
  }, [state]);
  return (
    <>
      {createPortal(
        (() => {
          const rect = anchorEl?.current?.getBoundingClientRect();
          const top = rect ? Math.round(rect.bottom) + 8 : 90;
          const left = rect ? Math.round(rect.left) : 100;
          return (
            <div style={{ position: "fixed", top, left, zIndex: 1000 }}>
              <ResizablePanel
                title="Operation History"
                initialWidth={450}
                initialHeight={360}
                onClose={handleCloseModal}
                navigationPath={[]}
                header
                excludeRefs={anchorEl ? [anchorEl] : []}
              >
                <div className="p-4">
                  <div className="flex items-center justify-end mb-3">
                    <button
                      onClick={() => handleClear()}
                      className="px-2 py-0.5 text-base border-1 border-blue-500 text-blue-500 bg-transparent rounded hover:bg-blue-50 transition-colors"
                    >
                      Clear History
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {renderHistory()}
                  </div>
                </div>
              </ResizablePanel>
            </div>
          );
        })(),
        document.body
      )}
    </>
  );
};

export default History;
