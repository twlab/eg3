import React, { useState, useEffect, useCallback, useMemo } from "react";

import _ from "lodash";
import HubTrackTable from "./HubTrackTable";
import { TrackModel, ITrackModel, variableIsObject } from "wuepgg3-track";

import "./FacetTable.css";

const DEFAULT_ROW = "Sample";
const DEFAULT_COLUMN = "Assay";
const UNUSED_META_KEY = "notused";

type FacetTableProps = {
  tracks: ITrackModel[];
  addedTracks: ITrackModel[];
  onTracksAdded?: (tracks: ITrackModel[]) => void;
  addTermToMetaSets: (keys: string[]) => void;
  addedTrackSets: Set<string>;
  publicTrackSets?: Set<string>;
  contentColorSetup: any;
};

const FacetTable: React.FC<FacetTableProps> = ({
  tracks,
  addedTracks,
  onTracksAdded,
  addTermToMetaSets,
  addedTrackSets,
  publicTrackSets,
}) => {
  const [state, setState] = useState<any>({
    tracks: [] as TrackModel[],
    rowList: [] as { name: string; expanded: boolean; children: Set<string> }[],
    columnList: [] as {
      name: string;
      expanded: boolean;
      children: Set<string>;
    }[],
    parent2children: {} as Record<string, Set<string>>,
    child2ancestor: {} as Record<string, string>,
    rowHeader: "",
    columnHeader: "",
    showModalId: null as string | null,
    modalFound: null as any[] | null,
    metaKeys: [] as string[],
  });

  const initializeTracks = useCallback(
    (allTracks: TrackModel[]) => {
      const allKeys = allTracks.map((track) => Object.keys(track.metadata));
      const metaKeys = _.union(...allKeys);
      addTermToMetaSets(metaKeys);
      let parent2children: Record<string, Set<string>> = {};
      let child2ancestor: Record<string, string> = {};
      for (let meta of metaKeys) {
        parent2children[meta] = new Set();
        child2ancestor[meta] = meta;
      }
      let tracks = [] as TrackModel[];
      let rawtracks = [] as any[];
      for (let track of allTracks) {
        let metadata = {} as Record<string, any>;
        for (let [metaKey, metaValue] of Object.entries(track.metadata)) {
          if (Array.isArray(metaValue)) {
            metaValue = _.uniq(metaValue);
            if (metaValue.length > 1) {
              for (let [idx, ele] of metaValue.entries()) {
                if (idx < metaValue.length - 1) {
                  if (!parent2children[ele]) {
                    parent2children[ele] = new Set();
                  }
                  parent2children[ele].add(metaValue[idx + 1]);
                  child2ancestor[ele] = metaKey;
                }
              }
            }
            parent2children[metaKey].add(metaValue[0]);
            child2ancestor[metaValue[0]] = metaKey;
          } else {
            if (variableIsObject(metaValue)) {
              parent2children[metaKey].add(metaValue.name);
              child2ancestor[metaValue.name] = metaKey;
            } else {
              parent2children[metaKey].add(metaValue);
              child2ancestor[metaValue] = metaKey;
            }
          }
          metadata[metaKey] = metaValue;
        }
        let newTrack = { ...track, metadata: metadata };
        rawtracks.push(newTrack);
      }
      for (let track of rawtracks) {
        let metadata = {} as Record<string, any>;
        for (let [metaKey, metaValue] of Object.entries(track.metadata)) {
          let lastValue, newValue;
          if (Array.isArray(metaValue)) {
            lastValue = metaValue[metaValue.length - 1];
          } else {
            lastValue = metaValue;
          }
          if (_.has(parent2children, lastValue)) {
            if (Array.isArray(metaValue)) {
              newValue = [...metaValue, `(${lastValue})`];
            } else {
              newValue = [metaValue, `(${lastValue})`];
            }
            if (!parent2children[lastValue]) {
              parent2children[lastValue] = new Set();
            }
            parent2children[lastValue].add(`(${lastValue})`);
            metadata[metaKey] = newValue;
          } else {
            metadata[metaKey] = metaValue;
          }
        }
        let newTrack = { ...track, metadata: metadata };
        tracks.push(new TrackModel(newTrack));
      }
      const rowHeader = metaKeys.includes(DEFAULT_ROW)
        ? DEFAULT_ROW
        : metaKeys[0];
      let columnHeader =
        metaKeys.includes(DEFAULT_COLUMN) && DEFAULT_COLUMN !== rowHeader
          ? DEFAULT_COLUMN
          : metaKeys[1];
      const rowList = [
        {
          name: rowHeader,
          expanded: false,
          children: parent2children[rowHeader],
        },
      ];
      let columnList;
      if (columnHeader) {
        columnList = [
          {
            name: columnHeader,
            expanded: false,
            children: parent2children[columnHeader],
          },
        ];
      } else {
        columnList = [{ name: "--" }];
      }
      setState((prevState) => ({
        ...prevState,
        rowList,
        columnList,
        tracks,
        parent2children,
        child2ancestor,
        metaKeys,
        rowHeader,
        columnHeader: columnHeader || UNUSED_META_KEY,
      }));
    },
    [addTermToMetaSets],
  );

  useEffect(() => {
    initializeTracks(tracks);
  }, [tracks]);

  const handleOpenModal = (id: string, found: any[]) => {
    setState((prevState) => ({
      ...prevState,
      showModalId: id,
      modalFound: found,
    }));
  };

  const handleCloseModal = () => {
    setState((prevState) => ({
      ...prevState,
      showModalId: null,
      modalFound: null,
    }));
  };

  const toggleHeader = (event: React.MouseEvent<HTMLButtonElement>) => {
    const { name } = event.currentTarget;

    let attrList;
    if (state.child2ancestor[name] === state.rowHeader) {
      attrList = state.rowList;
    } else {
      attrList = state.columnList;
    }

    const index = _.findIndex(attrList, ["name", name]);

    const isExpanded = !attrList[index].expanded;
    const newAttr = { ...attrList[index], expanded: isExpanded };
    let newList = [...attrList];
    newList[index] = newAttr;
    if (isExpanded) {
      for (let item of state.parent2children[name]) {
        newList.splice(index + 1, 0, {
          name: item,
          expanded: false,
          children: state.parent2children[item],
        });
      }
    } else {
      newList = [
        ...newList.slice(0, index + 1),
        ...newList.slice(index + 1 + state.parent2children[name].size),
      ];
      removeChild(newList, name);
    }

    if (state.child2ancestor[name] === state.rowHeader) {
      setState((prevState) => ({ ...prevState, rowList: newList }));
    } else {
      setState((prevState) => ({ ...prevState, columnList: newList }));
    }
    setColNumber();
  };

  const removeChild = (list: any[], parentName: string) => {
    if (state.parent2children[parentName]) {
      for (let item of state.parent2children[parentName]) {
        _.remove(list, (n) => n.name === item);
        removeChild(list, item);
      }
    }
    return list;
  };

  // Header components memoized to avoid re-render on unrelated changes
  const ColumnHeaders = React.memo(({ list }: { list: any[] }) => {
    const colClass = "facet-column-header";
    return (
      <>
        {list.map((element: any, idx: number) => {
          const hasChildren = element.children && element.children.size;
          const prefix = hasChildren ? (element.expanded ? "⊟" : "⊞") : "";
          const expandClass = hasChildren && element.expanded ? "expanded" : "";
          return (
            <div key={`${element.name}-${idx}`} className={`${colClass}`}>
              {hasChildren ? (
                <button
                  name={element.name}
                  type="button"
                  onClick={toggleHeader}
                  className={expandClass}
                >
                  <span>
                    {prefix}
                    {element.name}
                  </span>
                </button>
              ) : (
                <button name={element.name} className="not-button">
                  <span>
                    {prefix}
                    {element.name}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </>
    );
  });

  const RowHeaders = React.memo(({ list }: { list: any[] }) => {
    const rowClass = "facet-row-header";
    return (
      <>
        {list.map((element: any, idx: number) => {
          const hasChildren = element.children && element.children.size;
          const prefix = hasChildren ? (element.expanded ? "⊟" : "⊞") : "";
          const expandClass = hasChildren && element.expanded ? "expanded" : "";
          return (
            <div key={`${element.name}-${idx}`} className={`${rowClass}`}>
              {hasChildren ? (
                <button
                  name={element.name}
                  type="button"
                  onClick={toggleHeader}
                  className={expandClass}
                >
                  <span>
                    {prefix}
                    {element.name}
                  </span>
                </button>
              ) : (
                <button name={element.name} className="not-button">
                  <span>
                    {prefix}
                    {element.name}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </>
    );
  });

  const swapHeader = () => {
    let { rowHeader, columnHeader, rowList, columnList } = state;
    if (columnHeader === UNUSED_META_KEY) {
      return;
    }
    [rowHeader, columnHeader] = [columnHeader, rowHeader];
    [rowList, columnList] = [columnList, rowList];
    setState((prevState) => ({
      ...prevState,
      rowHeader,
      columnHeader,
      rowList,
      columnList,
    }));
    buildMatrix();
    setColNumber();
  };

  const MatrixGrid = React.memo(
    ({
      rowList,
      columnList,
      columnHeader,
    }: {
      rowList: any[];
      columnList: any[];
      columnHeader: string;
    }) => {
      const divs: Array<any> = [];
      if (columnHeader !== UNUSED_META_KEY) {
        for (let row of rowList) {
          for (let col of columnList) {
            if (row.expanded || col.expanded) {
              divs.push(<div key={`${row.name}-${col.name}`}></div>);
            } else {
              divs.push(
                <div key={`${row.name}-${col.name}`}>
                  {countTracks(row, col)}
                </div>,
              );
            }
          }
        }
      } else {
        for (let row of rowList) {
          if (row.expanded) {
            divs.push(<div key={`${row.name}-col`}></div>);
          } else {
            divs.push(
              <div key={`${row.name}-col`}>
                {countTracks(row, UNUSED_META_KEY)}
              </div>,
            );
          }
        }
      }

      return <>{divs}</>;
    },
  );

  const trackMetadataBelongsTo = (
    tkMeta: string | string[],
    metaType: string,
  ) => {
    if (Array.isArray(tkMeta)) {
      return tkMeta.includes(metaType);
    } else {
      return tkMeta === metaType;
    }
  };

  const countTracks = (row: any, col: any) => {
    const { tracks, rowHeader, columnHeader, showModalId } = state;

    let found: Array<any> = [];
    for (let track of tracks) {
      if (!track.metadata[rowHeader]) continue;
      const tkRowInfo = variableIsObject(track.metadata[rowHeader])
        ? track.metadata[rowHeader]?.name
        : track.metadata[rowHeader];
      const tkColumnInfo = variableIsObject(track.metadata[columnHeader])
        ? track.metadata[columnHeader]?.name
        : track.metadata[columnHeader];
      if (
        row.name === rowHeader ||
        trackMetadataBelongsTo(tkRowInfo, row.name)
      ) {
        if (col === UNUSED_META_KEY) {
          found.push(track);
        } else {
          if (!tkColumnInfo) {
            if (col.name === columnHeader) found.push(track);
            continue;
          }
          if (
            col.name === columnHeader ||
            trackMetadataBelongsTo(tkColumnInfo, col.name)
          ) {
            found.push(track);
          }
        }
      }
    }
    if (!found.length) return null;
    const id = `modal-${row.name}-${col.name}`;
    const addUrls = found.filter(
      (tk) => addedTrackSets?.has(tk.url) || addedTrackSets?.has(tk.name),
    );
    return (
      <div>
        <button
          onClick={() => handleOpenModal(id, found)}
          className="facet-item"
        >
          <span className="green">{addUrls.length}</span>/{found.length}
        </button>
      </div>
    );
  };

  const setColNumber = () => {
    let colNum = Math.max(1, state.columnList.length);
    document.documentElement.style.setProperty(
      "--colNum",
      (colNum + 1).toString(),
    );
  };

  // update column number when column list length or panel size changes
  useEffect(() => {
    setColNumber();
  }, [state.columnList.length]);

  const renderHeaderSelection = (isColumn: boolean) => {
    let stateToRead, otherState, changeCallback;
    if (isColumn) {
      stateToRead = state.columnHeader;
      otherState = state.rowHeader;
      changeCallback = handleColumnChange;
    } else {
      stateToRead = state.rowHeader;
      otherState = state.columnHeader;
      changeCallback = handleRowChange;
    }

    return (
      <label>
        {isColumn ? "Column: " : "Row: "}
        <select value={stateToRead} onChange={changeCallback}>
          {state.metaKeys
            .filter((metaKey) => metaKey !== otherState)
            .map((metaKey) => (
              <option key={metaKey} value={metaKey}>
                {metaKey}
              </option>
            ))}
          {isColumn && (
            <>
              <option key="disabled" disabled>
                ────
              </option>
              <option key={UNUSED_META_KEY} value={UNUSED_META_KEY}>
                Not used
              </option>
            </>
          )}
        </select>
      </label>
    );
  };

  const handleRowChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMetaKey = event.currentTarget.value;
    setState((prevState) => ({
      ...prevState,
      rowHeader: selectedMetaKey,
      rowList: [
        {
          name: selectedMetaKey,
          expanded: false,
          children: state.parent2children[selectedMetaKey],
        },
      ],
    }));
  };

  const handleColumnChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMetaKey = event.currentTarget.value;
    if (selectedMetaKey === UNUSED_META_KEY) {
      setState((prevState) => ({
        ...prevState,
        columnHeader: UNUSED_META_KEY,
        columnList: [{ name: "--" }],
      }));
    } else {
      setState((prevState) => ({
        ...prevState,
        columnHeader: selectedMetaKey,
        columnList: [
          {
            name: selectedMetaKey,
            expanded: false,
            children: state.parent2children[selectedMetaKey],
          },
        ],
      }));
    }
  };

  if (!state.tracks.length) {
    return <p>Table is empty, please add some tracks.</p>;
  } else {
    return (
      <>
        <div className="facet-container">
          <div className="facet-config">
            <div>{renderHeaderSelection(false)}</div>
            <div
              className="facet-swap"
              title="swap row/column"
              onClick={swapHeader}
            >
              &#8646;
            </div>
            <div>{renderHeaderSelection(true)}</div>
          </div>
          <div className="facet-outer">
            <div className="facet-content">
              <div className="facet-holder"></div>
              <ColumnHeaders list={state.columnList} />
              <RowHeaders list={state.rowList} />
              <MatrixGrid
                rowList={state.rowList}
                columnList={state.columnList}
                columnHeader={state.columnHeader}
              />
            </div>
          </div>
        </div>

        {state.showModalId && state.modalFound && (
          <div
            style={{
              backgroundColor: "rgba(111,107,101, 0.07)",
              padding: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={handleCloseModal}
            role="dialog"
            aria-label="track list"
          >
            <div
              style={{
                position: "relative",
                backgroundColor: "white",
                padding: "16px 20px 10px 15px",
                borderRadius: "4px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                textAlign: "left",
                width: "100%",
                maxWidth: "90vw",
                maxHeight: "70vh",
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <span
                className="text-right"
                style={{
                  cursor: "pointer",
                  color: "red",
                  fontSize: "2em",
                  position: "absolute",
                  top: "-5px",
                  right: "20px",
                }}
                onClick={handleCloseModal}
              >
                ×
              </span>
              <HubTrackTable
                key={state.showModalId || "modal"}
                tracks={state.modalFound}
                addedTrackSets={addedTrackSets}
                onTracksAdded={onTracksAdded}
                rowHeader={state.rowHeader}
                columnHeader={state.columnHeader}
              />
            </div>
          </div>
        )}
      </>
    );
  }
};

export default FacetTable;
