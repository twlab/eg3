import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useTable, usePagination, useFilters, Column } from "react-table";
import Fuse from "fuse.js";
import _ from "lodash";
import TrackModel from "@/models/TrackModel";
import TrackSearchBox from "./TrackSearchBox";
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
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 2,
      keys,
    };
    const fuseInstance = new Fuse(tracks, fuseOptions);
    setFuse(fuseInstance);
    setFilteredTracks(tracks);
  }, [tracks]);

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

  const handleAddAll = () => {
    const pageTracks = rows.map((row) => row.original);
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
    prepareRow,
    page,
    rows,
    setPageSize,
    state: { pageSize },
  } = useTable(
    {
      columns,
      data: filteredTracks,
      initialState: { pageSize: 10 },
    },
    useFilters,
    usePagination
  );

  return (
    <React.Fragment>
      <h1>Track table</h1>
      <label htmlFor="searchTrack">Search tracks</label>
      <input
        type="text"
        className="form-control"
        placeholder="H1 or H3K4me3, etc..."
        value={searchText}
        onChange={handleSearchChangeRequest}
      />
      <small id="searchTrackHelp" className="form-text text-muted">
        Free text search over track labels and metadata.
      </small>
      <br />
      <div className="text-right">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleAddAll}
        >
          Add all
        </button>
      </div>
      <table
        {...getTableProps()}
        className="table table-bordered table-striped table-hover"
      >
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()} key={column.id}>
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
                  <td {...cell.getCellProps()} key={cell.column.id}>
                    {cell.render("Cell")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="pagination">
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          {[10, 20, 30, 40, 50].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </React.Fragment>
  );
};

export default HubTrackTable;
