import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import _ from "lodash";
import { useTable, useFilters, useSortBy, Column } from "react-table";
import FlankingStratConfig from "./FlankingStratConfig";
import Genome from "../../../models/Genome";
import Feature from "../../../models/Feature";
import FlankingStrategy from "../../../models/FlankingStrategy";
import RegionSet from "../../../models/RegionSet";
import ChromosomeInterval from "../../../models/ChromosomeInterval";
import { getSymbolRegions } from "../../../models/util";

const DEFAULT_LIST = `CYP4A22
chr10:96796528-96829254
CYP2A6
CYP3A4
chr1:47223509-47276522
CYP1A2
`;

interface RegionSetConfigProps {
  genome: Genome;
  set?: RegionSet;
  onSetConfigured?: (newSet: RegionSet) => void;
  onClose?: () => void;
}

const RegionSetConfig: React.FC<RegionSetConfigProps> = ({
  genome,
  set: propSet,
  onSetConfigured = () => undefined,
  onClose = () => undefined,
}) => {
  const [regionSet, setRegionSet] = useState<RegionSet | null>(
    getRegionSetFromProps({ set: propSet, genome })
  );
  const [newRegionName, setNewRegionName] = useState("");
  const [newRegionLocus, setNewRegionLocus] = useState("");
  const [newRegionError, setNewRegionError] = useState<Error | null>(null);
  const [regionList, setRegionList] = useState(DEFAULT_LIST);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [originalSet, setOriginalSet] = useState<RegionSet | null>(null);

  useEffect(() => {
    if (propSet !== regionSet) {
      setRegionSet(getRegionSetFromProps({ set: propSet, genome }));
    }
  }, [propSet, genome]);

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
    const genomeName = genome.getName();
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
        return getSymbolRegions(genomeName, symbol);
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

    const nullList = parsed2.filter((item) => item === null);
    if (nullList.length > 0) {
      console.log(
        `${nullList.length} item(s) cannot find location(s) on genome`,
        "error",
        2000
      );
    } else {
      console.log(`${parsed2.length} region(s) added`, "success", 2000);
    }
    setLoadingMsg("");

    const newSet = new RegionSet(
      "New set",
      parsed2.filter((item) => item !== null) as Feature[],
      genome,
      new FlankingStrategy()
    );
    setRegionSet(newSet);
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

  // Destructure the tableInstance object
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

  return (
    <div>
      <h3>{propSet ? `Editing set: "${propSet.name}"` : "Create a new set"}</h3>

      {!regionSet && (
        <div>
          <form onSubmit={handleAddList}>
            <textarea
              value={regionList}
              onChange={handleListChange}
              rows={10}
              className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter regions, one per line..."
            />
            <div className="mt-2 space-x-2">
              <button
                className="px-4 py-2 text-sm text-white bg-tint rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                type="submit"
              >
                Add
              </button>
              <button
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                type="reset"
                onClick={resetList}
              >
                Clear
              </button>
              <span className="text-sm italic text-red-500">{loadingMsg}</span>
            </div>
          </form>
        </div>
      )}

      {regionSet && regionSet.features.length > 0 && (
        <React.Fragment>
          <div className="mt-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              1. Rename this set:
            </label>
            <input
              type="text"
              placeholder="Set name"
              value={regionSet ? regionSet.name : "New set"}
              onChange={changeSetName}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <h6 className="text-sm font-medium text-gray-700 mb-2">
              2. Add one region or delete region(s) from the table below
            </h6>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Region name"
                value={newRegionName}
                onChange={(event) => setNewRegionName(event.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Region locus"
                value={newRegionLocus}
                onChange={(event) => setNewRegionLocus(event.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                className="px-4 py-2 text-sm text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                onClick={addRegion}
              >
                Add new region
              </button>
            </div>
            {newRegionError && (
              <p className="text-sm text-red-500 mt-1">
                {newRegionError.message}
              </p>
            )}
          </div>

          <table
            {...getTableProps()}
            className="table table-striped table-hover"
          >
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                    >
                      {column.render("Header")}
                      {/* Add a sort direction indicator */}
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
                        <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
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

          <div className="mt-4">
            <label className="flex items-center space-x-2 mb-4">
              <span className="text-sm text-gray-700">
                No flip for regions on <span className="font-medium">-</span>{" "}
                strand:
              </span>
              <input
                type="checkbox"
                name="flip"
                id="flip"
                onChange={handleFlipChange}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="flex space-x-2 mt-4">
            <button
              className="px-4 py-2 text-sm text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              onClick={() => onSetConfigured(regionSet)}
              disabled={isSaveButtonDisabled()}
            >
              Add set & Save changes
            </button>
            <button
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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

RegionSetConfig.propTypes = {
  genome: PropTypes.instanceOf(Genome).isRequired,
  set: PropTypes.instanceOf(RegionSet),
  onSetConfigured: PropTypes.func,
  onClose: PropTypes.func,
};

RegionSetConfig.defaultProps = {
  onSetConfigured: () => undefined,
};

export default RegionSetConfig;
