import React, { useMemo, useCallback } from "react";
import {
  useTable,
  useFilters,
  useGlobalFilter,
  usePagination,
} from "react-table";
import _ from "lodash";
import Json5Fetcher from "@/models/Json5Fetcher";
import DataHubParser from "@/models/DataHubParser";
import TrackModel from "@/models/TrackModel";

interface ObjectAsTableProps {
  title?: string;
  content: any;
}

const ObjectAsTable: React.FC<ObjectAsTableProps> = ({ title, content }) => {
  if (typeof content === "string") {
    return <div>{content}</div>;
  }

  const rows = useMemo(
    () =>
      Object.entries(content).map((values: any, idx) => {
        let tdContent;
        if (React.isValidElement(values[1])) {
          tdContent = values[1];
        } else if (typeof values[1] === "object" && values[1] !== null) {
          tdContent = <ObjectAsTable content={values[1]} />;
        } else {
          tdContent = Array.isArray(values[1])
            ? values[1].join(" > ")
            : values[1];
        }
        return (
          <tr key={idx}>
            <td>{values[0]}</td>
            <td>{tdContent}</td>
          </tr>
        );
      }),
    [content]
  );

  return (
    <>
      {title && <h6>{title}</h6>}
      <table className="table table-sm table-striped">
        <tbody>{rows}</tbody>
      </table>
    </>
  );
};

const HubTable: React.FC<HubTableProps> = ({
  onHubLoaded,
  onHubUpdated,
  publicHubs,
  onTracksAdded,
  genomeConfig,
}) => {
  const hubParser = useMemo(() => new DataHubParser(), []);

  const _cloneHubsAndModifyOne = useCallback(
    (index: number, propsToMerge: Partial<Hub>) => {
      const hubs = [...publicHubs];
      const hub = _.cloneDeep(hubs[index]);
      Object.assign(hub, propsToMerge);
      hubs[index] = hub;
      return hubs;
    },
    [publicHubs]
  );

  const loadHub = useCallback(
    async (index: number) => {
      const hub = publicHubs[index];
      const newHubs = _cloneHubsAndModifyOne(index, { isLoading: true });

      try {
        const json = await new Json5Fetcher().get(hub.url);
        const lastSlashIndex = hub.url.lastIndexOf("/");
        const hubBase = hub.url
          .substring(0, lastSlashIndex)
          .replace(/\/+$/, "");
        const tracksStartIndex = hub.oldHubFormat ? 1 : 0;

        const tracks: any = await hubParser.getTracksInHub(
          json,
          hub.name,
          hub.genome,
          hub.oldHubFormat,
          tracksStartIndex,
          hubBase
        );
        const loadedHubs = _cloneHubsAndModifyOne(index, {
          isLoading: false,
          isLoaded: true,
        });
        onHubUpdated!(loadedHubs, tracks, "public");
        const tracksToShow = tracks.filter((track) => track.showOnHubLoad);
        if (tracksToShow.length > 0 && onTracksAdded) {
          onTracksAdded(tracksToShow);
        }
      } catch (error) {
        console.error(error);
        const loadedHubs = _cloneHubsAndModifyOne(index, {
          error: true,
          isLoading: false,
        });
        onHubUpdated!(loadedHubs, [], "public");
      }
    },
    [publicHubs, onHubUpdated, onTracksAdded, _cloneHubsAndModifyOne, hubParser]
  );

  const getAddHubCell = useCallback(
    (row: any) => {
      const hub = row.original;
      if (hub.isLoaded) {
        return <span>✓</span>;
      }
      if (hub.error) {
        return <span>Error</span>;
      }
      if (hub.isLoading) {
        return <span>Loading...</span>;
      }
      return <button onClick={() => loadHub(row.index)}>+</button>;
    },
    [loadHub]
  );

  const columns = useMemo(
    () => [
      { Header: "Genome", accessor: "genome", width: 100 },
      { Header: "Collection", accessor: "collection" },
      { Header: "Hub name", accessor: "name" },
      {
        Header: "Tracks",
        accessor: "numTracks",
        aggregate: (values) => _.sum(values),
        width: 100,
        disableFilters: true,
      },
      {
        Header: "Add",
        Cell: ({ row }) => getAddHubCell(row),
        width: 100,
        disableFilters: true,
      },
    ],
    [getAddHubCell]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data: publicHubs,
      initialState: { pageIndex: 0, pageSize: 10 },
      autoResetFilters: false,
      disableSortRemove: true,
    },
    useFilters,
    useGlobalFilter,
    usePagination
  );

  const { publicHubData } = genomeConfig;

  return (
    <div>
      <h1>Public data hubs</h1>
      <table
        {...getTableProps()}
        className="table table-bordered table-striped table-hover"
      >
        <thead>
          {headerGroups.map((headerGroup, headerIndex) => {
            const { key, ...restProps } = headerGroup.getHeaderGroupProps();
            return (
              <tr key={key || headerIndex} {...restProps}>
                {headerGroup.headers.map((column, columnIndex) => {
                  const { key, ...restProps } = column.getHeaderProps();
                  return (
                    <th key={key || columnIndex} {...restProps}>
                      {column.render("Header")}
                    </th>
                  );
                })}
              </tr>
            );
          })}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row, rowIndex) => {
            prepareRow(row);
            const { key, ...restProps } = row.getRowProps();
            return (
              <tr key={key || rowIndex} {...restProps}>
                {row.cells.map((cell, cellIndex) => {
                  const { key, ...restProps } = cell.getCellProps();
                  return (
                    <td key={key || cellIndex} {...restProps}>
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="pagination">
        <span>
          Page{" "}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{" "}
        </span>
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {"<<"}
        </button>{" "}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {"<"}
        </button>{" "}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {">"}
        </button>{" "}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {">>"}
        </button>{" "}
        <span>
          | Go to page:{" "}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
            style={{ width: "100px" }}
          />
        </span>{" "}
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default HubTable;

// TypeScript interface for Hub
interface Hub {
  name: string;
  genome: string;
  collection: string;
  url: string;
  numTracks: number;
  oldHubFormat?: boolean;
  isLoading?: boolean;
  isLoaded?: boolean;
  error?: any;
  description?: any;
}

// Define TypeScript interfaces for Props
interface HubTableProps {
  onHubLoaded?: (
    tracks: TrackModel[],
    visible: boolean,
    hubUrl: string
  ) => void;
  onHubUpdated?: (hubs: Hub[], publicTracks: Array<any>, type: string) => void;
  publicHubs: Hub[];
  onTracksAdded?: (tracks: TrackModel[]) => void;
  genomeConfig?: any;
}
