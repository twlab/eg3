import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useTable, usePagination, useFilters, Column } from "react-table";
import Fuse from "fuse.js";
import _ from "lodash";
import TrackSearchBox from "./TrackSearchBox";
import { TrackModel } from "wuepgg3-track-test";

const UNUSED_META_KEY = "notused";

interface Props {
  tracks: TrackModel[];
  onTracksAdded?: (tracks: TrackModel[]) => void;
  addedTrackSets: Set<string>;
  rowHeader?: string;
  columnHeader?: string;
}

const HubTrackTable: React.FC<Props> = ({
  tracks,
  onTracksAdded = () => {},
  addedTrackSets,
  rowHeader = UNUSED_META_KEY,
  columnHeader = UNUSED_META_KEY,
}) => {
  const [filteredTracks, setFilteredTracks] = useState(tracks);
  const [searchText, setSearchText] = useState("");
  const [fuse, setFuse] = useState<Fuse<TrackModel> | null>(null);

  useEffect(() => {
    const metaKeys = tracks.map((tk) => Object.keys(tk.metadata));
    const uniqKeys = _.uniq(_.flatten(metaKeys));
    const keys = [
      "label",
      ...uniqKeys.filter((k) => k !== "Track type").map((k) => `metadata.${k}`),
    ];
    const fuseOptions: any = {
      shouldSort: true,
      threshold: 0.4,
      location: 3,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 2,
      keys,
    };
    const fuseInstance = new Fuse(tracks, fuseOptions);
    setFuse(fuseInstance);
    setFilteredTracks(tracks);
  }, []);

  const handleSearchChange = useCallback(
    _.debounce((value: string) => {
      if (value.length > 0 && fuse) {
        const result = fuse.search(value);
        setFilteredTracks(result.map((res) => res.item));
      } else {
        setFilteredTracks(tracks);
      }
    }, 250),
    [fuse, tracks]
  );

  const handleSearchChangeRequest = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const search = event.target.value.trim();
    setSearchText(search);
    handleSearchChange(search);
  };

  const getAddTrackCell = useCallback(
    (row: any) => {
      const track = row.original;
      if (addedTrackSets.has(track.url) || addedTrackSets.has(track.name)) {
        return <span>✓</span>;
      }
      return (
        <button onClick={() => onTracksAdded([filteredTracks[row.index]])}>
          +
        </button>
      );
    },
    [filteredTracks, addedTrackSets, onTracksAdded]
  );

  const handleAddAll = (page) => {
    const pageTracks = page.map((row) => row.original);
    if (pageTracks.length > 30) {
      return [];
    }
    const availableTracks = pageTracks.filter(
      (track: TrackModel) =>
        !(addedTrackSets.has(track.url) || addedTrackSets.has(track.name))
    );
    onTracksAdded(availableTracks);
  };

  const columns: Column<TrackModel>[] = useMemo(() => {
    const baseColumns: Column<TrackModel>[] = [
      {
        Header: "Genome",
        accessor: (data: TrackModel) => data.getMetadata("genome") ?? "",
        width: 100,
      },
      { Header: "Name", accessor: "name" },
      { Header: "Data hub", accessor: "datahub" },
      { Header: "Format", accessor: "type", width: 100 },
      {
        Header: "Add",
        Cell: ({ row }: any) => getAddTrackCell(row),
        width: 50,
        disableFilters: true,
      },
    ];

    if (rowHeader !== UNUSED_META_KEY && rowHeader !== "genome") {
      baseColumns.splice(3, 0, {
        Header: rowHeader,
        accessor: (data: TrackModel) =>
          data.getMetadataAsArray(rowHeader)!.join(" > "),
        Filter: ({ column: { setFilter } }) => (
          <TrackSearchBox
            tracks={filteredTracks}
            metadataPropToSearch={rowHeader}
            onChange={setFilter}
          />
        ),
        headerStyle: { flex: "100 0 auto", overflow: "visible" },
      });
    }

    if (columnHeader !== UNUSED_META_KEY && columnHeader !== "genome") {
      baseColumns.splice(4, 0, {
        Header: columnHeader,
        accessor: (data: TrackModel) =>
          data.getMetadataAsArray(columnHeader)!.join(" > "),
        Filter: ({ column: { setFilter } }) => (
          <TrackSearchBox
            tracks={filteredTracks}
            metadataPropToSearch={columnHeader}
            onChange={setFilter}
          />
        ),
        headerStyle: { flex: "100 0 auto", overflow: "visible" },
      });
    }

    return baseColumns;
  }, [filteredTracks, getAddTrackCell, rowHeader, columnHeader]);

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
      data: filteredTracks,
      initialState: { pageSize: 10 },
    },
    useFilters,
    usePagination
  );

  const buttonStyle = {
    padding: "4px 8px",
    margin: "0 2px",
    backgroundColor: "#E1EBEE",
    color: "black",
    border: "none",
    borderRadius: "2px",
    cursor: "pointer",
    disabled: {
      backgroundColor: "#ddd",
    },
  };

  return (
    <React.Fragment>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1>Track Table</h1>
        <label htmlFor="searchTrack" style={{ marginBottom: "8px" }}>
          Search tracks
        </label>
        <input
          type="text"
          id="searchTrack"
          style={{
            padding: "8px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
          placeholder="H1 or H3K4me3, etc..."
          value={searchText}
          onChange={handleSearchChangeRequest}
        />
        <small
          id="searchTrackHelp"
          style={{ color: "#6c757d", marginBottom: "16px" }}
        >
          Free text search over track labels and metadata.
        </small>
        <div style={{ textAlign: "right", marginBottom: "16px" }}>
          <button
            type="button"
            style={{
              padding: "8px 12px",
              backgroundColor: "#1F7D53",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
            onClick={() => handleAddAll(page)}
          >
            Add all in page
          </button>
        </div>
        <table
          {...getTableProps()}
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "16px",
          }}
        >
          <thead>
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                {headerGroup.headers.map((column) => (
                  <th
                    {...column.getHeaderProps()}
                    key={column.id}
                    style={{
                      borderBottom: "2px solid #ddd",
                      padding: "8px",
                      textAlign: "left",
                    }}
                  >
                    {column.render("Header")}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map((row) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} key={row.id}>
                  {row.cells.map((cell) => (
                    <td
                      {...cell.getCellProps()}
                      key={cell.column.id}
                      style={{
                        borderBottom: "1px solid #ddd",
                        padding: "8px",
                      }}
                    >
                      {cell.render("Cell")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ textAlign: "center" }}>
          <button
            onClick={() => gotoPage(0)}
            disabled={!canPreviousPage}
            style={buttonStyle}
          >
            {"<< "} First
          </button>
          <button
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            style={buttonStyle}
          >
            {"<"}
          </button>
          <span style={{ margin: "0 8px" }}>
            Page{" "}
            <strong>
              {pageIndex + 1} of {pageOptions.length}
            </strong>
          </span>
          <button
            onClick={() => nextPage()}
            disabled={!canNextPage}
            style={buttonStyle}
          >
            {">"}
          </button>
          <button
            onClick={() => gotoPage(pageCount - 1)}
            disabled={!canNextPage}
            style={buttonStyle}
          >
            Last
            {" >>"}
          </button>
          <span style={{ margin: "0 8px" }}>
            | Go to page:
            <input
              type="number"
              defaultValue={pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                gotoPage(page);
              }}
              style={{
                width: "50px",
                padding: "5px",
                marginLeft: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={{
              marginLeft: "8px",
              padding: "5px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          >
            {[10, 20, 30, 40, 50].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </React.Fragment>
  );
};

export default HubTrackTable;
