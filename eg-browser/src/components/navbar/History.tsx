import React, { useEffect, useState } from "react";

import { ClockIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import {

  OutsideClickDetector,

} from "wuepgg3-track";
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
  jumpToFuture: (index: number) => void;
};
const History: React.FC<Props> = ({ state, jumpToPast, jumpToFuture }) => {
  const [showModal, setShowModal] = useState(false);
  const [checkStateEmpty, setCheckStateEmpty] = useState(false);
  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleToggleModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showModal) {
      handleCloseModal();
    } else {
      handleOpenModal();
    }
  };
  function handleClear() {
    setCheckStateEmpty(true);
    renderHistory();
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
      "future"
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
    _type: string
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
            fontSize: "clamp(10px, 0.9vw, 14px)",
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
              fontSize: "clamp(10px, 0.8vw, 14px)",
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
    <div className="relative">
      <OutsideClickDetector onOutsideClick={handleCloseModal}>
        <button
          onClick={handleToggleModal}
          title="Operation history"
          className="flex items-center gap-2 border border-gray-300 rounded-md px-2 py-1 mx-2 hover:bg-gray-50 transition-colors"
        >
          <ClockIcon className="w-4 h-4" />
          <span className="text-base font-medium">History</span>
          <motion.div
            animate={{ rotate: showModal ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showModal && (
            <motion.div
              className="absolute top-full right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[400px]"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xl font-semibold text-gray-800">
                    Operation history
                  </h5>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleClear()}
                      className="px-2 py-0.5 text-base border-1 border-blue-500 text-blue-500 bg-transparent rounded hover:bg-blue-50 transition-colors"
                    >
                      Clear History
                    </button>
                    <button
                      onClick={handleCloseModal}
                      className="px-2 py-0.5 text-base border-1 border-red-500 text-red-500 bg-transparent rounded hover:bg-red-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {renderHistory()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </OutsideClickDetector>
    </div>
  );
};

export default History;
