import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useTable, usePagination, useFilters, Column } from "react-table";
import Fuse from "fuse.js";
import _ from "lodash";
import TrackSearchBox from "./TrackSearchBox";
import { TrackModel } from "wuepgg3-track";
import { useAppSelector } from "@/lib/redux/hooks";
import { selectDarkTheme } from "@/lib/redux/slices/settingsSlice";

const UNUSED_META_KEY = "notused";

interface Props {
  tracks: TrackModel[];
  onTracksAdded?: (tracks: TrackModel[]) => void;
  addedTrackSets: Set<string>;
  rowHeader?: string;
  columnHeader?: string;
  width?: number;
  height?: number;
}

const HubTrackTable: React.FC<Props> = ({
  tracks,
  onTracksAdded = () => { },
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
    [fuse, tracks],
  );

  const handleSearchChangeRequest = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const search = event.target.value.trim();
    setSearchText(search);
    handleSearchChange(search);
  };

  const isDarkTheme = useAppSelector(selectDarkTheme);

  const textColor = isDarkTheme ? "#e5e7eb" : "#333";
  const mutedColor = isDarkTheme ? "#9CA3AF" : "#6c757d";
  const borderColor = isDarkTheme ? "#374151" : "#ddd";
  const inputBg = isDarkTheme ? "#0b1220" : "#fff";
  const buttonBg = isDarkTheme ? "#111827" : "#fff";
  const buttonColor = isDarkTheme ? "#e5e7eb" : "#333";
  const buttonDisabledBg = isDarkTheme ? "#1f2937" : "#f9f9f9";
  const buttonDisabledColor = isDarkTheme ? "#6b7280" : "#ccc";
  const tableBg = isDarkTheme ? "#0b1220" : "#ffffff";
  const headerFontSize = 13;
  const cellFontSize = 13;

  const getAddTrackCell = useCallback(
    (row: any) => {
      const track = row.original;

      if (addedTrackSets.has(track.url) || addedTrackSets.has(track.name)) {
        return <span>✓</span>;
      }
      return (
        <button
          onMouseDown={(e) => {
            e.stopPropagation();
            onTracksAdded([filteredTracks[row.index]]);
          }}
          style={{ cursor: "pointer" }}
        >
          +
        </button>
      );
    },
    [addedTrackSets, onTracksAdded, filteredTracks],
  );

  const handleAddAll = (page) => {
    const pageTracks = page.map((row) => row.original);
    if (pageTracks.length > 30) {
      return [];
    }
    const availableTracks = pageTracks.filter(
      (track: TrackModel) =>
        !(addedTrackSets.has(track.url) || addedTrackSets.has(track.name)),
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
      {
        Header: <span style={{ fontSize: headerFontSize, color: textColor }}>Name</span>,
        accessor: "name",
        Cell: ({ value }: any) => (
          <span style={{ fontSize: cellFontSize, color: textColor }}>{value}</span>
        ),
      },
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
  }, [filteredTracks, getAddTrackCell, rowHeader, columnHeader, textColor]);

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
    usePagination,
  );

  // Memoized row to avoid re-rendering entire table when unrelated props change
  const MemoRow = React.memo(
    ({ row, prepareRow }: any) => {
      prepareRow(row);
      return (
        <tr {...row.getRowProps()} key={row.id}>
          {row.cells.map((cell: any) => (
            <td
              {...cell.getCellProps()}
              key={cell.column.id}
              style={{ borderBottom: `1px solid ${borderColor}`, padding: "2px", color: textColor, fontSize: cellFontSize }}
            >
              {cell.render("Cell")}
            </td>
          ))}
        </tr>
      );
    },
    (prev: any, next: any) => {
      if (prev.row.id !== next.row.id) return false;
      const prevVals = prev.row.cells.map((c: any) => c.value);
      const nextVals = next.row.cells.map((c: any) => c.value);
      if (prevVals.length !== nextVals.length) return false;
      for (let i = 0; i < prevVals.length; i++) {
        if (prevVals[i] !== nextVals[i]) return false;
      }
      return true;
    },
  );

  const buttonStyle: React.CSSProperties = {
    padding: "6px 12px",
    margin: "0 4px",
    backgroundColor: buttonBg,
    color: buttonColor,
    border: `1px solid ${borderColor}`,
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    transition: "all 0.2s ease",
  };

  const buttonHoverStyle: React.CSSProperties = {
    backgroundColor: isDarkTheme ? "#111827" : "#f5f5f5",
    borderColor: isDarkTheme ? "#9CA3AF" : "#999",
  };

  const buttonDisabledStyle: React.CSSProperties = {
    backgroundColor: buttonDisabledBg,
    color: buttonDisabledColor,
    cursor: "not-allowed",
    borderColor: borderColor,
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: tableBg,
    color: textColor,
    padding: 8,
    borderRadius: 4,
  };

  const PaginationPlaceholder: React.FC = () => {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, width: "100%", justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            overflow: "hidden",
            height: 32,
            background: buttonBg,
          }}
        >
          <button
            onClick={() => gotoPage(0)}
            disabled={!canPreviousPage}
            style={{
              padding: "4px 2px",
              border: "none",
              background: "transparent",
              color: canPreviousPage ? buttonColor : buttonDisabledColor,
              cursor: canPreviousPage ? "pointer" : "not-allowed",
              fontSize: 12,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: canPreviousPage ? 1 : 0.45,
            }}
            onMouseEnter={(e) =>
              canPreviousPage && Object.assign(e.currentTarget.style, buttonHoverStyle)
            }
            onMouseLeave={(e) =>
              canPreviousPage && Object.assign(e.currentTarget.style, { backgroundColor: "transparent" })
            }
            aria-disabled={!canPreviousPage}
          >
            First
          </button>
          <div style={{ width: 1, height: 18, backgroundColor: borderColor }} />
          <button
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            style={{
              padding: "4px 10px",
              border: "none",
              background: "transparent",
              color: canPreviousPage ? buttonColor : buttonDisabledColor,
              cursor: canPreviousPage ? "pointer" : "not-allowed",
              fontSize: 14,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: canPreviousPage ? 1 : 0.45,
            }}
            onMouseEnter={(e) =>
              canPreviousPage && Object.assign(e.currentTarget.style, buttonHoverStyle)
            }
            onMouseLeave={(e) =>
              canPreviousPage && Object.assign(e.currentTarget.style, { backgroundColor: "transparent" })
            }
            aria-disabled={!canPreviousPage}
          >
            ‹
          </button>
          <div style={{ width: 1, height: 18, backgroundColor: borderColor }} />
          <button
            onClick={() => nextPage()}
            disabled={!canNextPage}
            style={{
              padding: "4px 10px",
              border: "none",
              background: "transparent",
              color: canNextPage ? buttonColor : buttonDisabledColor,
              cursor: canNextPage ? "pointer" : "not-allowed",
              fontSize: 14,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: canNextPage ? 1 : 0.45,
            }}
            onMouseEnter={(e) => canNextPage && Object.assign(e.currentTarget.style, buttonHoverStyle)}
            onMouseLeave={(e) => canNextPage && Object.assign(e.currentTarget.style, { backgroundColor: "transparent" })}
            aria-disabled={!canNextPage}
          >
            ›
          </button>
          <div style={{ width: 1, height: 18, backgroundColor: borderColor }} />
          <button
            onClick={() => gotoPage(pageCount - 1)}
            disabled={!canNextPage}
            style={{
              padding: "4px 2px",
              border: "none",
              background: "transparent",
              color: canNextPage ? buttonColor : buttonDisabledColor,
              cursor: canNextPage ? "pointer" : "not-allowed",
              fontSize: 12,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: canNextPage ? 1 : 0.45,
            }}
            onMouseEnter={(e) => canNextPage && Object.assign(e.currentTarget.style, buttonHoverStyle)}
            onMouseLeave={(e) => canNextPage && Object.assign(e.currentTarget.style, { backgroundColor: "transparent" })}
            aria-disabled={!canNextPage}
          >
            Last
          </button>
        </div>

        <div style={{ width: 8 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="number"
              defaultValue={pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                gotoPage(page);
              }}
              style={{
                width: 44,
                padding: "4px 6px",
                border: `1px solid ${borderColor}`,
                borderRadius: 6,
                fontSize: 12,
                backgroundColor: inputBg,
                color: textColor,
                textAlign: "center",
                height: 28,
              }}
              placeholder="Page"
            />
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{
                padding: "4px 2px",
                border: `1px solid ${borderColor}`,
                borderRadius: 6,
                fontSize: 12,
                backgroundColor: inputBg,
                color: textColor,
                cursor: "pointer",
                height: 28,
              }}
            >
              {[10, 20, 30, 40, 50].map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>

          <div style={{ color: mutedColor, fontSize: 12 }}>
            <span style={{ color: textColor, fontWeight: 600 }}>{pageIndex + 1}</span>
            <span style={{ margin: "0 6px" }}>/</span>
            <span style={{ color: textColor, fontWeight: 600 }}>{pageOptions.length}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <React.Fragment>
      <div style={containerStyle}>
        <h1 style={{ margin: 0, textAlign: "center", marginBottom: 4 }}>
          Track Table
        </h1>
        <div style={{ flex: "1", overflow: "auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",

            }}
          >
            <input
              type="text"
              id="searchTrack"
              style={{

                width: "300px",
                backgroundColor: inputBg,
                color: textColor,
                border: `1px solid ${borderColor}`,
                borderRadius: "4px",
                padding: "3px",
                fontSize: 14,
              }}
              placeholder="H1 or H3K4me3, etc..."
              value={searchText}
              onChange={handleSearchChangeRequest}
            />
            <small id="searchTrackHelp" style={{ color: mutedColor }}>
              Free text search over track labels and metadata.
            </small>
            <button
              type="button"
              style={{
                padding: "3px",
                backgroundColor: "#1F7D53",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginLeft: "auto",


                fontSize: 14,
              }}
              onClick={() => handleAddAll(page)}
            >
              Add all in page
            </button>
          </div>
          {/* Top pagination controls */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <PaginationPlaceholder />
          </div>
          <table
            {...getTableProps()}
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "4px",
            }}
          >
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr
                  {...headerGroup.getHeaderGroupProps()}
                  key={headerGroup.id || headerGroup.getHeaderGroupProps().key}
                >
                  {headerGroup.headers.map((column) => (
                    <th
                      {...column.getHeaderProps()}
                      key={column.id}
                      style={{
                        borderBottom: `1px solid ${borderColor}`,
                        padding: "6px 2px",
                        textAlign: "left",
                        color: textColor,
                        fontSize: headerFontSize,
                      }}
                    >
                      {column.render("Header")}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {page.map((row) => (
                <MemoRow row={row} prepareRow={prepareRow} key={row.id} />
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
          <PaginationPlaceholder />
        </div>
      </div>
    </React.Fragment>
  );
};

export default HubTrackTable;
