import React, { useEffect, useState } from "react";
import ReactModal from "react-modal";

import "./History.css";

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
  jumpToPast: (actionType: string, index: number) => void;
  jumpToFuture: (actionType: string, index: number) => void;
  clearHistory: (actionType: string) => any;
};
const History: React.FC<Props> = ({
  state,
  jumpToPast,
  jumpToFuture,
  clearHistory,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [checkStateEmpty, setCheckStateEmpty] = useState(false);
  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };
  function handleClear() {
    clearHistory("clear");
    setCheckStateEmpty(true);
    renderHistory();
  }
  const renderHistory = () => {
    const { past, future } = state;

    if ((past.length === 0 && future.length === 0) || checkStateEmpty) {
      return <div>No operation history yet!</div>;
    }

    const pastItems = makeItemList(past, jumpToPast, "past");
    const futureItems = makeItemList(future, jumpToFuture, "future");

    return (
      <div className="History">
        {past.length > 0 && <p>Go back:</p>}
        {pastItems}
        {future.length > 0 && <p>Go forward:</p>}
        {futureItems}
      </div>
    );
  };

  const makeItemList = (
    stateList: any[],
    callback: (actionType: string, index: number) => void,
    type: string
  ) => {
    const items = stateList.map((value, index) => (
      <li key={index} onClick={() => callback(type, index)}>
        <button className="btn btn-sm btn-warning">
          Region:{" "}
          {value.viewRegion
            ? value.viewRegion.currentRegionAsString()
            : "(none)"}
          , # of tracks: {value.tracks ? value.tracks.length : 0}
        </button>
      </li>
    ));
    return <ol>{items}</ol>;
  };
  useEffect(() => {
    setCheckStateEmpty(false);
  }, [state]);
  return (
    <>
      <button
        onClick={handleOpenModal}
        title="Operation history"
        className="border border-gray-500 rounded-md p-2 mx-2"
        style={{ width: "50px" }}
      >
        <span role="img" aria-label="History">
          📗
        </span>
      </button>
      <ReactModal
        isOpen={showModal}
        contentLabel="History"
        ariaHideApp={false}
        onRequestClose={handleCloseModal}
        shouldCloseOnOverlayClick={true}
        style={MODAL_STYLE}
      >
        <div className="History">
          <h5>Operation history</h5>
          <button onClick={handleCloseModal} className="btn btn-sm btn-danger">
            Close
          </button>
          <button onClick={() => handleClear()} className="btn btn-sm btn-info">
            Clear History
          </button>
        </div>
        <div>{renderHistory()}</div>
      </ReactModal>
    </>
  );
};

const MODAL_STYLE = {
  content: {
    top: "40px",
    left: "unset",
    right: "50px",
    bottom: "unset",
    overflow: "visible",
    padding: "5px",
    color: "black",
  },
};

export default History;
