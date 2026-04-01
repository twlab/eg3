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
import Button from "@/components/ui/button/Button";

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
    props: RegionSetConfigProps,
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
        2000,
      );
      setLoadingMsg("");
      return;
    }

    const parsed = await Promise.all(
      inputList.map(async (symbol) => {
        try {
          const locus = ChromosomeInterval.parse(symbol);
          if (locus) {
            const displayName = symbol.replace(/[:\-]/g, " ");
            return new Feature(displayName, locus, "+"); // coordinates default have + as strand
          }
        } catch (error) {}
        return getSymbolRegions(genome.getName(), symbol);
      }),
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
                  gene.strand,
                )
              : null,
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
    console.log(parsed, parsed2);
    const nullList = parsed2.filter(
      (item) => item === null || "statusCode" in item,
    );
    if (nullList.length > 0) {
      console.log(
        `${nullList.length} item(s) cannot find location(s) on genome`,
        "error",
        2000,
      );
    } else {
      console.log(`${parsed2.length} region(s) added`, "success", 2000);
      const newSet = new RegionSet(
        "New set",
        parsed2.filter((item) => item !== null) as Feature[],
        genome!,
        new FlankingStrategy(),
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
    [regionSet],
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
            className="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
            onClick={() => deleteRegion(row.index)}
          >
            Delete
          </button>
        ),
        id: "deleteLocus",
      },
    ],
    [flankedFeatures],
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

  const inputCls =
    "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-dark-surface text-primary dark:text-dark-primary text-sm focus:outline-none focus:ring-2 focus:ring-secondary";

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      <p className="text-xs font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
        {propSet ? `Editing: "${propSet.name}"` : "Create a new set"}
      </p>

      {!regionSet && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
            Enter a list of regions
          </p>
          <p className="text-sm text-primary/70 dark:text-dark-primary/70 leading-relaxed">
            Enter gene names or coordinates, one per line. Coordinates must be
            in the form{" "}
            <code className="bg-gray-100 dark:bg-dark-surface px-1 rounded text-xs">
              chr1:345-678
            </code>
            .
          </p>
          <form onSubmit={handleAddList} className="flex flex-col gap-3">
            <textarea
              value={regionList}
              onChange={handleListChange}
              rows={10}
              className={`${inputCls} font-mono resize-y`}
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {}}
                style={{ backgroundColor: "#205781", color: "#fff" }}
              >
                <input
                  type="submit"
                  value="Add"
                  className="cursor-pointer bg-transparent border-none outline-none text-inherit"
                />
              </Button>
              <Button
                onClick={resetList}
                style={{ backgroundColor: "#6c757d", color: "#fff" }}
              >
                Clear
              </Button>
              {loadingMsg && (
                <span className="text-sm italic text-red-500">
                  {loadingMsg}
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {regionSet && regionSet.features.length > 0 && (
        <React.Fragment>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
              1. Set name
            </label>
            <input
              type="text"
              placeholder="Set name"
              value={regionSet ? regionSet.name : "New set"}
              onChange={changeSetName}
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-primary dark:text-dark-primary uppercase tracking-wider">
              2. Add or remove regions
            </p>
            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-1 text-sm text-primary dark:text-dark-primary">
                Region name
                <input
                  type="text"
                  value={newRegionName}
                  onChange={(event) => setNewRegionName(event.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-primary dark:text-dark-primary">
                Region locus
                <input
                  type="text"
                  value={newRegionLocus}
                  onChange={(event) => setNewRegionLocus(event.target.value)}
                  className={inputCls}
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={addRegion}>Add region</Button>
              {newRegionError && (
                <span className="text-sm text-red-600 dark:text-red-400">
                  {newRegionError.message}
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table
              {...getTableProps()}
              className="w-full text-sm text-primary dark:text-dark-primary"
            >
              <thead className="bg-gray-50 dark:bg-dark-surface">
                {headerGroups.map((headerGroup) => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column) => (
                      <th
                        {...column.getHeaderProps(
                          column.getSortByToggleProps(),
                        )}
                        className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 cursor-pointer select-none"
                      >
                        {column.render("Header")}
                        <span className="ml-1">
                          {column.isSorted
                            ? column.isSortedDesc
                              ? "↓"
                              : "↑"
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
                    <tr
                      {...row.getRowProps()}
                      className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-surface/50"
                    >
                      {row.cells.map((cell) => (
                        <td {...cell.getCellProps()} className="px-3 py-2">
                          {cell.render("Cell")}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <FlankingStratConfig
            strategy={regionSet.flankingStrategy}
            onNewStrategy={changeSetStrategy}
          />

          <label
            htmlFor="flip"
            className="flex items-center gap-2 text-sm text-primary dark:text-dark-primary cursor-pointer"
          >
            <input
              type="checkbox"
              name="flip"
              id="flip"
              onChange={handleFlipChange}
              className="rounded"
            />
            No flip for regions on <strong>-</strong> strand
          </label>

          <div className="flex items-center gap-2">
            <Button onClick={() => onSetConfigured(regionSet)}>
              Save changes
            </Button>
            <Button onClick={cancelPressed}>Cancel</Button>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};

export default RegionSetConfig;
