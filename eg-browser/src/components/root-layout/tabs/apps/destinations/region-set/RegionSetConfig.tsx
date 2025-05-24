import React, { useState, useEffect, useMemo } from "react";
import _ from "lodash";

// React-Table Imports
import { useTable, useFilters, useSortBy, Column } from "react-table";

// wuepgg3-track Imports
import {
  Genome,
  Feature,
  FlankingStrategy,
  RegionSet,
  ChromosomeInterval,
  getSymbolRegions,
} from "wuepgg3-track";

// Local Component
import FlankingStratConfig from "./FlankingStratConfig";

// Redux Imports
import { selectCurrentSession } from "@/lib/redux/slices/browserSlice";
import { useAppSelector } from "@/lib/redux/hooks";

const DEFAULT_LIST = `CYP4A22
chr10:96796528-96829254
CYP2A6
CYP3A4
chr1:47223509-47276522
CYP1A2
`;

interface RegionSetConfigProps {
  set?: RegionSet;
  onSetConfigured?: (newSet: RegionSet) => void;
  onClose?: () => void;
  genome: Genome;
}

const RegionSetConfig: React.FC<RegionSetConfigProps> = ({
  set: propSet,
  onSetConfigured,
  genome,
}) => {
  const currentSession = useAppSelector(selectCurrentSession);

  const [regionSet, setRegionSet] = useState<RegionSet | null>(null);

  const [newRegionName, setNewRegionName] = useState("");
  const [newRegionLocus, setNewRegionLocus] = useState("");
  const [newRegionError, setNewRegionError] = useState<Error | null>(null);
  const [regionList, setRegionList] = useState(DEFAULT_LIST);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [originalSet, setOriginalSet] = useState<RegionSet | null>(null);

  // Ensure hooks are not called conditionally
  useEffect(() => {
    if (!currentSession || !genome) {
      return;
    }
  }, [currentSession, genome]);
  useEffect(() => {
    const initRegionSet = getRegionSetFromProps({ set: propSet, genome });
    setRegionSet(initRegionSet);
  }, [propSet]);
  function getRegionSetFromProps(
    props: RegionSetConfigProps
  ): RegionSet | null {
    return props.set ? props.set : null;
  }

  const handleListChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRegionList(event.target.value);
  };

  const resetList = () => {
    setRegionList("");
  };

  const handleAddList = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoadingMsg("loading");
    const inputListRaw = regionList.trim().split("\n");
    const inputList = inputListRaw
      .map((item) => item.trim())
      .filter((item) => item !== "");

    if (inputList.length === 0) {
      console.log(
        "Input content is empty or cannot find any location on genome",
        "error",
        2000
      );
      setLoadingMsg("");
      return;
    }

    const parsed = await Promise.all(
      inputList.map(async (symbol) => {
        try {
          const locus = ChromosomeInterval.parse(symbol);
          if (locus) {
            return new Feature(symbol, locus, "+"); // coordinates default have + as strand
          }
        } catch (error) {}
        return getSymbolRegions(genome.getName(), symbol);
      })
    );

    const parsed2 = parsed.map((item, index) => {
      if (Array.isArray(item)) {
        if (item.length === 0) {
          return null;
        }
        const hits = item
          .map((gene) =>
            gene.name.toLowerCase() === inputList[index].toLowerCase()
              ? new Feature(
                  gene.name,
                  new ChromosomeInterval(gene.chrom, gene.txStart, gene.txEnd),
                  gene.strand
                )
              : null
          )
          .filter((hit) => hit);

        if (hits.length === 0) {
          return null;
        }
        return hits[0] || null;
      } else {
        return item;
      }
    });

    const nullList = parsed2.filter(
      (item) => item === null || "statusCode" in item
    );
    if (nullList.length > 0) {
      console.log(
        `${nullList.length} item(s) cannot find location(s) on genome`,
        "error",
        2000
      );
    } else {
      console.log(`${parsed2.length} region(s) added`, "success", 2000);
      const newSet = new RegionSet(
        "New set",
        parsed2.filter((item) => item !== null) as Feature[],
        genome!,
        new FlankingStrategy()
      );
      setRegionSet(newSet);
    }
    setLoadingMsg("");
  };

  const changeSetName = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (regionSet) {
      setRegionSet(regionSet.cloneAndSet("name", event.target.value));
    }
  };

  const changeSetStrategy = (newStrat: FlankingStrategy) => {
    if (regionSet) {
      setRegionSet(regionSet.cloneAndSet("flankingStrategy", newStrat));
    }
  };

  const handleFlipChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!regionSet) return;
    const set = originalSet ? originalSet : regionSet;
    const setOnMinus = set.features.filter((f) => f.getIsReverseStrand());

    if (setOnMinus.length === 0) return;

    if (event.target.checked) {
      const originalSetClone = _.cloneDeep(regionSet);
      const newSet = regionSet.cloneAndAllPlusStrand();
      setOriginalSet(originalSetClone);
      setRegionSet(newSet);
    } else {
      const originalSetClone = _.cloneDeep(originalSet);
      setOriginalSet(originalSetClone);
    }
  };

  const addRegion = () => {
    let newSet;
    try {
      const locus = ChromosomeInterval.parse(newRegionLocus);
      if (!locus) {
        throw new RangeError("Could not parse locus");
      }
      newSet = regionSet!.cloneAndAddFeature(new Feature(newRegionName, locus));
    } catch (error: any) {
      setNewRegionError(error);
    }
    if (newSet) {
      setRegionSet(newSet);
      setNewRegionName("");
      setNewRegionLocus("");
      setNewRegionError(null);
    }
  };

  const deleteRegion = (index: number) => {
    if (regionSet) {
      setRegionSet(regionSet.cloneAndDeleteFeature(index));
    }
  };

  const data = useMemo(() => regionSet?.features || [], [regionSet]);

  const flankedFeatures = useMemo(
    () => (regionSet ? regionSet.makeFlankedFeatures() : []),
    [regionSet]
  );

  const columns = useMemo<Column<Feature>[]>(
    () => [
      {
        Header: "Name",
        accessor: (feature: Feature) => feature.getName(),
        id: "name",
      },
      {
        Header: "Locus",
        accessor: (feature: Feature) => feature.getLocus().toString(),
        id: "locus",
      },
      {
        Header: "Strand",
        accessor: (feature: Feature) =>
          feature.getIsForwardStrand() ? "+" : "-",
        id: "strand",
      },
      {
        Header: "Coordinates to view",
        Cell: ({ row }) =>
          flankedFeatures[row.index]
            ? flankedFeatures[row.index]!.getLocus().toString()
            : "(invalid)",
        id: "adjustedLocus",
      },
      {
        Header: "Delete",
        Cell: ({ row }) => (
          <button
            className="btn btn-sm btn-danger"
            onClick={() => deleteRegion(row.index)}
          >
            Delete
          </button>
        ),
        id: "deleteLocus",
      },
    ],
    [flankedFeatures]
  );

  const tableInstance = useTable({ columns, data }, useFilters, useSortBy);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  const isSaveButtonDisabled = () => {
    return (
      regionSet === propSet ||
      regionSet!.makeFlankedFeatures().some((feature) => feature === null)
    );
  };

  const cancelPressed = () => {
    setRegionSet(getRegionSetFromProps({ set: propSet, genome }));
  };
  const buttonStyle = {
    padding: "8px 12px",
    margin: "4px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    display: "inline-block",
    disabled: {
      backgroundColor: "#E1EBEE", // Lightened color for disabled buttons if necessary
    },
  };
  return (
    <div style={{ marginTop: "16px" }}>
      <h3>{propSet ? `Editing set: "${propSet.name}"` : "Create a new set"}</h3>

      {!regionSet && (
        <div>
          <h4>Enter a list of regions</h4>
          <p style={{ lineHeight: "1.6" }}>
            Enter a list of gene names or coordinates to make a gene set one
            item per line. Gene names and coordinates can be mixed for input.
            Coordinate string must be in the form of "chr1:345-678". Fields can
            be joined by space/tab/comma/colon/hyphen.
          </p>
          <form onSubmit={handleAddList}>
            <label>
              <textarea
                value={regionList}
                onChange={handleListChange}
                rows={10}
                cols={40}
                style={{
                  width: "100%",
                  marginBottom: "10px",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
            </label>
            <div>
              <input
                style={{ ...buttonStyle, backgroundColor: "#205781" }}
                type="submit"
                value="Add"
              />{" "}
              <input
                style={{ ...buttonStyle, backgroundColor: "#6c757d" }}
                type="reset"
                value="Clear"
                onClick={resetList}
              />{" "}
              <span style={{ fontStyle: "italic", color: "red" }}>
                {loadingMsg}
              </span>
            </div>
          </form>
        </div>
      )}

      {regionSet && regionSet.features.length > 0 && (
        <React.Fragment>
          <label style={{ marginTop: "16px", display: "block" }}>
            1. Rename this set:{" "}
            <input
              type="text"
              placeholder="Set name"
              value={regionSet ? regionSet.name : "New set"}
              onChange={changeSetName}
              style={{
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
          </label>

          <div style={{ marginTop: "16px" }}>
            <h6>2. Add one region or delete region(s) from the table below</h6>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label>
                New region name:{" "}
                <input
                  type="text"
                  value={newRegionName}
                  onChange={(event) => setNewRegionName(event.target.value)}
                  style={{
                    marginRight: "8px",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
              </label>
              <label>
                New region locus:{" "}
                <input
                  type="text"
                  value={newRegionLocus}
                  onChange={(event) => setNewRegionLocus(event.target.value)}
                  style={{
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
              </label>
            </div>
            <button
              style={{ ...buttonStyle, backgroundColor: "#28a745" }}
              onClick={addRegion}
            >
              Add new region
            </button>
            {newRegionError ? newRegionError.message : null}
          </div>

          <table
            {...getTableProps()}
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "16px",
            }}
          >
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      style={{
                        borderBottom: "2px solid #E1EBEE",
                        padding: "8px",
                        textAlign: "left",
                        backgroundColor: "#F8FAFB",
                      }}
                    >
                      {column.render("Header")}
                      <span>
                        {column.isSorted
                          ? column.isSortedDesc
                            ? " 🔽"
                            : " 🔼"
                          : ""}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {rows.map((row) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()}>
                    {row.cells.map((cell) => {
                      return (
                        <td
                          {...cell.getCellProps()}
                          style={{
                            borderBottom: "1px solid #E1EBEE",
                            padding: "8px",
                          }}
                        >
                          {cell.render("Cell")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <FlankingStratConfig
            strategy={regionSet.flankingStrategy}
            onNewStrategy={changeSetStrategy}
          />

          <div>
            <label
              htmlFor="flip"
              style={{ display: "block", marginTop: "16px" }}
            >
              No flip for regions on <span className="font-weight-bold">-</span>{" "}
              strand:
              <input
                type="checkbox"
                name="flip"
                id="flip"
                onChange={handleFlipChange}
                style={{ marginLeft: "8px" }}
              />
            </label>
          </div>

          <div style={{ marginTop: "16px" }}>
            <button
              style={{ ...buttonStyle, backgroundColor: "#28a745" }}
              onClick={() => onSetConfigured(regionSet)}
            >
              Add set & Save changes
            </button>{" "}
            <button
              style={{ ...buttonStyle, backgroundColor: "#6c757d" }}
              onClick={cancelPressed}
            >
              Cancel
            </button>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default RegionSetConfig;
