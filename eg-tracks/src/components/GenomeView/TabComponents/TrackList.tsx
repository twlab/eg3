import React, { useMemo } from "react";
import { useTable, Column, useFilters } from "react-table";
import { ITrackModel } from "@/types/track-container";

type TrackListProps = {
  addedTracks: ITrackModel[];
  onTracksAdded: (track: ITrackModel) => void;
  onTrackRemoved: (trackId: string | number) => void;
  savedDeleteTrackList: Array<ITrackModel>;
  addTracktoAvailable: (track: ITrackModel) => void;
  removeTrackFromAvailable: (trackId: string | number) => void;
};

const TrackList: React.FC<TrackListProps> = ({
  addedTracks,
  onTracksAdded,
  onTrackRemoved,
  savedDeleteTrackList,
  addTracktoAvailable,
  removeTrackFromAvailable,
}) => {
  const removeTrack = (index: number) => {
    const track = addedTracks[index];
    onTrackRemoved(track.id);
    addTracktoAvailable(track);
  };

  const addTrack = (track: ITrackModel) => {
    removeTrackFromAvailable(track.id);
    onTracksAdded(track);
  };

  const columnsForRemove: Column<ITrackModel>[] = useMemo(
    () => [
      {
        Header: "Label",
        accessor: (row) => row.options.label,
      },
      {
        Header: "Track type",
        accessor: "type",
      },
      {
        Header: "Remove",
        id: "remove",
        Cell: ({ row }) => (
          <button
            className="size-6 rounded-md flex items-center justify-center"
            onClick={() => removeTrack(row.index)}
            style={{
              cursor: "pointer",
              border: "1px solid red",
              color: "red",
            }}
          >
            x
          </button>
        ),
        width: 50,
        disableFilters: true,
      },
    ],
    [addedTracks, onTrackRemoved, addTracktoAvailable]
  );

  const columnsForAdd: Column<ITrackModel>[] = useMemo(
    () => [
      {
        Header: "Label",
        accessor: (row) => row.options.label,
      },
      {
        Header: "Track type",
        accessor: "type",
      },
      {
        Header: "Add",
        id: "add",
        Cell: ({ row }) => (
          <button
            className="size-6 rounded-md flex items-center justify-center"
            onClick={() => addTrack(row.original)}
            style={{
              cursor: "pointer",
              border: "1px solid blue",
              color: "blue",
            }}
          >
            +
          </button>
        ),
        width: 50,
        disableFilters: true,
      },
    ],
    [savedDeleteTrackList, onTracksAdded, removeTrackFromAvailable]
  );

  const {
    getTableProps: getTablePropsRemove,
    getTableBodyProps: getTableBodyPropsRemove,
    headerGroups: headerGroupsRemove,
    rows: rowsRemove,
    prepareRow: prepareRowRemove,
  } = useTable({ columns: columnsForRemove, data: addedTracks }, useFilters);

  const {
    getTableProps: getTablePropsAdd,
    getTableBodyProps: getTableBodyPropsAdd,
    headerGroups: headerGroupsAdd,
    rows: rowsAdd,
    prepareRow: prepareRowAdd,
  } = useTable(
    { columns: columnsForAdd, data: savedDeleteTrackList },
    useFilters
  );

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const thStyle = {
    background: "#f4f5f7",
    padding: "10px",
    border: "1px solid #dee2e6",
    textAlign: "left",
  };

  const tdStyle = {
    padding: "10px",
    border: "1px solid #dee2e6",
  };

  const trStyle = {
    transition: "background-color 0.3s",
  };

  const trHoverStyle = {
    backgroundColor: "#f1f3f5",
  };

  return (
    <React.Fragment>
      <h3>Displayed tracks</h3>
      <table {...getTablePropsRemove()} style={tableStyle}>
        <thead>
          {headerGroupsRemove.map((headerGroup) => {
            const headerGroupProps = headerGroup.getHeaderGroupProps();
            const { key: headerGroupKey, ...restHeaderGroupProps } =
              headerGroupProps;
            return (
              <tr
                key={headerGroupKey}
                {...restHeaderGroupProps}
                style={trStyle}
              >
                {headerGroup.headers.map((column) => {
                  const columnProps = column.getHeaderProps();
                  const { key: columnKey, ...restColumnProps } = columnProps;
                  return (
                    <th key={columnKey} {...restColumnProps} style={thStyle}>
                      {column.render("Header")}
                    </th>
                  );
                })}
              </tr>
            );
          })}
        </thead>
        <tbody {...getTableBodyPropsRemove()}>
          {rowsRemove.map((row) => {
            prepareRowRemove(row);
            const { key: rowKey, ...restRowProps } = row.getRowProps();
            return (
              <tr
                key={rowKey}
                {...restRowProps}
                style={trStyle}
                onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor =
                  trHoverStyle.backgroundColor)
                }
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "")}
              >
                {row.cells.map((cell) => {
                  const cellProps = cell.getCellProps();
                  const { key: cellKey, ...restCellProps } = cellProps;
                  return (
                    <td key={cellKey} {...restCellProps} style={tdStyle}>
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {savedDeleteTrackList.length > 0 && (
        <React.Fragment>
          <h3 style={{ marginTop: "10px" }}>Available tracks</h3>
          <table {...getTablePropsAdd()} style={tableStyle}>
            <thead>
              {headerGroupsAdd.map((headerGroup) => {
                const headerGroupProps = headerGroup.getHeaderGroupProps();
                const { key: headerGroupKey, ...restHeaderGroupProps } =
                  headerGroupProps;
                return (
                  <tr
                    key={headerGroupKey}
                    {...restHeaderGroupProps}
                    style={trStyle}
                  >
                    {headerGroup.headers.map((column) => {
                      const columnProps = column.getHeaderProps();
                      const { key: columnKey, ...restColumnProps } =
                        columnProps;
                      return (
                        <th
                          key={columnKey}
                          {...restColumnProps}
                          style={thStyle}
                        >
                          {column.render("Header")}
                        </th>
                      );
                    })}
                  </tr>
                );
              })}
            </thead>
            <tbody {...getTableBodyPropsAdd()}>
              {rowsAdd.map((row) => {
                prepareRowAdd(row);
                const { key: rowKey, ...restRowProps } = row.getRowProps();
                return (
                  <tr
                    key={rowKey}
                    {...restRowProps}
                    style={trStyle}
                    onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      trHoverStyle.backgroundColor)
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "")
                    }
                  >
                    {row.cells.map((cell) => {
                      const cellProps = cell.getCellProps();
                      const { key: cellKey, ...restCellProps } = cellProps;
                      return (
                        <td key={cellKey} {...restCellProps} style={tdStyle}>
                          {cell.render("Cell")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default TrackList;
