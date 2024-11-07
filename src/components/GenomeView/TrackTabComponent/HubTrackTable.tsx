import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import ReactTable, { Column } from "react-table";
import TrackModel from "@/models/TrackModel";
import TrackSearchBox from "./TrackSearchBox";

import { UNUSED_META_KEY } from "./FacetTable";
import Fuse from "fuse.js";
import _ from "lodash";

/**
 * Table that displays tracks available from loaded hubs.
 *
 * @param {Object} props - React props
 * @returns {JSX.Element} the rendered component
 */
const HubTrackTable: React.FC<HubTrackTableProps> = ({
  tracks,
  onTracksAdded,
  addedTrackSets,
  rowHeader,
  columnHeader,
}) => {
  const [searchText, setSearchText] = useState<string>("");
  const [fuse, setFuse] = useState<Fuse<TrackModel> | null>(null);
  const [filteredTracks, setFilteredTracks] = useState<TrackModel[]>(tracks);
  const reactTableRef = useRef<ReactTable>(null);

  useEffect(() => {
    const metaKeys = tracks.map((tk) => Object.keys(tk.metadata));
    const uniqKeys = _.uniq(_.flatten(metaKeys));
    const keys = [
      "label",
      ...uniqKeys.filter((k) => k !== "Track type").map((k) => `metadata.${k}`),
    ];
    const option = {
      shouldSort: true,
      threshold: 0.4,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 2,
      keys,
    };
    const fuseInstance = new Fuse(tracks, option);
    setFuse(fuseInstance);
    setFilteredTracks(tracks);
  }, [tracks]);

  const handleSearchChange = useCallback(
    _.debounce((value: string) => {
      if (!value) {
        setFilteredTracks(tracks);
      } else {
        const result = fuse ? fuse.search(value) : [];
        setFilteredTracks(result.map((r) => r.item));
      }
      setSearchText(value);
    }, 250),
    [fuse, tracks]
  );

  const handleSearchChangeRequest = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const search = event.target.value.trim();
    handleSearchChange(search);
  };

  const getAddTrackCell = useCallback(
    (reactTableRow: any, addedTrackUrls: Set<string>) => {
      let track = reactTableRow.original;
      if (!onTracksAdded) {
        return null;
      }
      if (addedTrackUrls.has(track.url) || addedTrackUrls.has(track.name)) {
        return <span>✓</span>;
      }
      return (
        <button
          onClick={() => onTracksAdded([filteredTracks[reactTableRow.index]])}
        >
          +
        </button>
      );
    },
    [filteredTracks, onTracksAdded]
  );

  const handleAddAll = () => {
    const current = reactTableRef.current;
    if (current) {
      const page = current.state.page;
      const pageSize = current.state.pageSize;
      const allData = current.getResolvedState().sortedData;
      const startIdx = page * pageSize;
      const currentData = allData
        .slice(startIdx, startIdx + pageSize)
        .map((item: any) => item._original);
      const availableTracks = currentData.filter(
        (track: TrackModel) =>
          !(addedTrackSets?.has(track.url) || addedTrackSets?.has(track.name))
      );
      if (availableTracks.length && onTracksAdded) {
        onTracksAdded(availableTracks);
      }
    }
  };

  const renderAddAll = () => {
    return (
      <div className="text-right">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleAddAll}
        >
          Add all
        </button>
      </div>
    );
  };

  const defaultFilterMethod = (filter: any, row: any) =>
    String(row[filter.id]).toLowerCase().includes(filter.value.toLowerCase());

  const columns: Column<TrackModel>[] = useMemo(() => {
    let cols: Column<TrackModel>[] = [
      {
        Header: "Genome",
        id: "genome",
        accessor: (data) => data.getMetadata("genome"),
        width: 100,
      },
      {
        Header: "Name",
        accessor: "name",
      },
      {
        Header: "Data hub",
        accessor: "datahub",
      },
    ];

    if (rowHeader !== UNUSED_META_KEY && rowHeader !== "genome") {
      cols.push({
        Header: rowHeader,
        id: rowHeader!.toLowerCase(),
        accessor: (data) => data.getMetadataAsArray(rowHeader).join(" > "),
        Filter: (cellInfo) => (
          <TrackSearchBox
            tracks={filteredTracks}
            metadataPropToSearch={rowHeader}
            onChange={cellInfo.onChange}
          />
        ),
        headerStyle: { flex: "100 0 auto", overflow: "visible" },
      });
    }

    if (columnHeader !== UNUSED_META_KEY && rowHeader !== "genome") {
      cols.push({
        Header: columnHeader,
        id: columnHeader!.toLowerCase(),
        accessor: (data) => data.getMetadataAsArray(columnHeader).join(" > "),
        Filter: (cellInfo) => (
          <TrackSearchBox
            tracks={filteredTracks}
            metadataPropToSearch={columnHeader}
            onChange={cellInfo.onChange}
          />
        ),
        headerStyle: { flex: "100 0 auto", overflow: "visible" },
      });
    }

    if (columnHeader === UNUSED_META_KEY || rowHeader === UNUSED_META_KEY) {
      cols.push({
        Header: "URL",
        accessor: "url",
        width: 200,
      });
    }

    cols.push({
      Header: "Format",
      accessor: "type",
      width: 100,
    });

    cols.push({
      Header: "Add",
      Cell: (reactTableRow: any) =>
        getAddTrackCell(reactTableRow, addedTrackSets!),
      width: 50,
      filterable: false,
    });

    return cols;
  }, [
    filteredTracks,
    rowHeader,
    columnHeader,
    getAddTrackCell,
    addedTrackSets,
  ]);

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
      {renderAddAll()}
      <ReactTable
        filterable
        defaultFilterMethod={defaultFilterMethod}
        data={filteredTracks}
        columns={columns}
        className="-striped -highlight"
        ref={reactTableRef}
      />
    </React.Fragment>
  );
};

export default HubTrackTable;

// Define TypeScript interfaces
interface HubTrackTableProps {
  tracks: TrackModel[];
  onTracksAdded?: (tracks: TrackModel[]) => void;
  addedTrackSets?: Set<string>;
  rowHeader?: string;
  columnHeader?: string;
}
