import React, {
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useElementGeometry } from "@/lib/hooks/useElementGeometry";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   selectSuggestions,
//   setSearchQuery,
//   SearchSuggestion,
//   selectSlashCommand,
//   selectSearchHistory,
//   addToSearchHistory,
//   clearSearchHistory,
// } from "@/lib/redux/slices/searchSlice";
import { debounce } from "lodash";
import useCurrentGenome from "@/lib/hooks/useCurrentGenome";

import {
  Gene,
  ChromosomeInterval,
  GenomeSerializer,
  OutsideClickDetector,
  IsoformSelection,
} from "wuepgg3-track";

export const AWS_API = "https://lambda.epigenomegateway.org/v3";
const SNP_ENDPOINTS: any = {
  hg19: "https://grch37.rest.ensembl.org/variation/human",
  hg38: "https://rest.ensembl.org/variation/human",
};
const MIN_CHARS_FOR_SUGGESTIONS = 3; // Minimum characters to type before displaying suggestions
interface SearchBarProps {
  isSearchFocused: boolean;
  onSearchFocusChange: (focused: boolean) => void;
  onNewRegionSelect: (
    start: number,
    end: number,
    highlightSearch?: boolean
  ) => void;
  windowWidth?: number;
  fontSize?: number;
  buttonPadding?: number;
  gapSize?: number;
}

type CommandType = "gene" | "snp";

interface GeneResult {
  id: string;
  symbol: string;
  type: "gene";
  description: string;
}

interface SnpResult {
  id: string;
  rsId: string;
  type: "snp";
  description: string;
  snpData: { [key: string]: any };
}

type SearchResult = GeneResult | SnpResult;

const SLASH_COMMANDS: CommandType[] = ["gene", "snp"];

const typeToEmoji: Record<CommandType, string> = {
  gene: "🧬",
  snp: "🔍",
};

// Cache for gene search results to avoid repeated API calls
const geneSearchCache = new Map<
  string,
  { results: GeneResult[]; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// AbortController to cancel previous requests
let currentGeneSearchController: AbortController | null = null;
let currentSnpSearchController: AbortController | null = null;

const geneSearch = async (
  query: string,
  genomeName: string
): Promise<GeneResult[]> => {
  if (query.trim().length < MIN_CHARS_FOR_SUGGESTIONS) return [];

  const cacheKey = `${genomeName}:${query.trim().toLowerCase()}`;

  // Check cache first
  const cached = geneSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.results;
  }

  // Cancel previous request if still running
  if (currentGeneSearchController) {
    currentGeneSearchController.abort();
  }

  // Create new AbortController for this request
  currentGeneSearchController = new AbortController();

  try {
    const params: any = {
      q: query.trim(),
      getOnlyNames: true,
    };
    const url = new URL(`${AWS_API}/${genomeName}/genes/queryName`);
    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, params[key])
    );

    const response = await fetch(url.toString(), {
      method: "GET",
      signal: currentGeneSearchController.signal,
      // Add timeout and better headers
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.map((item: any, index: any) => {
      return {
        id: `${index}`,
        symbol: item,
        type: "gene" as const,
        description: "",
      };
    });

    // Cache the results
    geneSearchCache.set(cacheKey, {
      results,
      timestamp: Date.now(),
    });

    return results;
  } catch (error) {
    // Don't throw on abort - that's expected behavior
    if (error instanceof Error && error.name === "AbortError") {
      return [];
    }
    console.error("Gene search failed:", error);
    // Return empty array on error to prevent UI breaks
    return [];
  } finally {
    // Clear the controller reference
    currentGeneSearchController = null;
  }
};

const snpSearch = async (
  query: string,
  genomeName: string
): Promise<SnpResult[]> => {
  if (!query || query.trim().length < 1) return [];

  const endpoint: any = SNP_ENDPOINTS[`${genomeName}`];
  if (!endpoint) {
    console.log("This genome is not supported in SNP search.", "error", 2000);
    return [];
  }

  // Cancel previous SNP request
  if (currentSnpSearchController) {
    currentSnpSearchController.abort();
  }

  currentSnpSearchController = new AbortController();
  const trimmedInput = query.trim();

  try {
    const response = await fetch(`${endpoint}/${trimmedInput}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: currentSnpSearchController.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return [
      {
        id: "0",
        rsId: data.name,
        type: "snp" as const,
        description: "",
        snpData: data,
      },
    ];
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return [];
    }
    console.error("SNP search failed:", error);
    return [];
  } finally {
    currentSnpSearchController = null;
  }
};
interface SnpMapping {
  seq_region_name: string;
  start: number;
  end: number;
  strand: number;
  allele_string: string;
  location: string;
}

const REGION_REGEX = /^(chr)?(\d+|[XYxy]):(\d+)-(\d+)$/;

function SearchSuggestionDivider(props: any) {
  const [isChecked, setIsChecked] = useState(false);

  // Effect to set the initial checkbox state
  useEffect(() => {
    if (props.highlightSearch !== undefined) {
      setIsChecked(props.highlightSearch.current);
    }
  }, [props.highlightSearch]);

  const handleChange = (event: any) => {
    setIsChecked(event.target.checked);
    props.highlightSearch.current = event.target.checked;
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        margin: "0.125rem 0.75rem",
        // padding: "0 0.75rem",
      }}
    >
      <div
        className="text-gray-600 dark:text-dark-primary"
        style={{
          fontSize: props.fontSize,
        }}
      >
        {props.text}
      </div>
      {props.highlightSearch !== undefined ? (
        <div style={{ display: "flex", alignItems: "center" }}>
          <label
            htmlFor="highsearch"
            className="text-gray-600 dark:text-dark-primary"
            style={{
              fontSize: props.fontSize,
            }}
          >
            Highlight search
          </label>
          <input
            type="checkbox"
            id="highsearch"
            name="highsearch"
            checked={isChecked}
            onChange={handleChange}
            style={{ transform: "scale(0.85)" }}
          />
        </div>
      ) : (
        ""
      )}
    </div>
  );
}

function SearchSuggestionBase({
  icon,
  text,
  desc,
  onClick,
  fontSize,
}: {
  icon: React.ReactNode;
  text: string;
  desc: string;
  onClick: () => void;
  fontSize?: number;
}) {
  return (
    <div
      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-background p-1.5 rounded-lg flex items-center gap-1.5"
      onClick={onClick}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <div
          className="font-medium"
          style={{
            fontSize: fontSize,
          }}
        >
          {text}
        </div>
        <div
          className="text-gray-500"
          style={{
            fontSize: fontSize,
          }}
        >
          {desc}
        </div>
      </div>
    </div>
  );
}

export default function SearchBar({
  isSearchFocused,
  onSearchFocusChange,
  onNewRegionSelect,
  windowWidth = 1920,
  buttonPadding = 2,
  fontSize = 16,
}: SearchBarProps) {
  const { ref: searchContainerRef } = useElementGeometry({
    shouldRespondToResize: false,
  });

  const currentGenome = useCurrentGenome();

  const snpSearchEnabled = useMemo(() => {
    return currentGenome?.id === "hg19" || currentGenome?.id === "hg38";
  }, [currentGenome]);

  const highlightSearch = useRef(false);
  const [activeCommand, setActiveCommand] = useState<CommandType | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRegion, setIsRegion] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedInput, setSelectedInput] = useState("");
  const latestUserInput = useRef("");
  const [badInputMessage, setBadInputMessage] = useState("");
  const genome = useCurrentGenome();
  const [isShowingIsoforms, setIsShowingIsoforms] = useState(false);
  const [isShowingSNPforms, setIsShowingSNPforms] = useState(false);

  // Helper functions for responsive sizing (matching Toolbar.tsx)
  const getIconSize = () => {
    return Math.max(16, Math.min(24, (windowWidth || 1920) * 0.012));
  };

  const iconSizeStyle = {
    width: `${getIconSize()}px`,
    height: `${getIconSize()}px`,
  };

  const getButtonStyle = () => ({
    padding: `${buttonPadding}px`,
  });

  const getRegionButtonSize = () => {
    return `${Math.max(16, Math.min(20, (windowWidth || 1920) * 0.01))}px`;
  };

  const getArrowIconSize = () => {
    return `${Math.max(10, Math.min(14, (windowWidth || 1920) * 0.007))}px`;
  };

  const getEmojiSize = () => {
    return `${Math.max(16, Math.min(20, (windowWidth || 1920) * 0.01))}px`;
  };

  const genomeConfig = useMemo(() => {
    if (genome) {
      return GenomeSerializer.deserialize(genome!);
    }
  }, [genome]);

  const parseRegion = (query: string) => {
    const navContext = genomeConfig?.navContext;
    let parsedRegion;

    try {
      parsedRegion = navContext!.parse(query || "");
    } catch (error) {
      if (error instanceof RangeError) {
        setBadInputMessage(error.message);
        return;
      } else {
        throw error;
      }
    }

    // Parsing successful
    if (badInputMessage) {
      setBadInputMessage("");
    }

    onNewRegionSelect(
      parsedRegion.start,
      parsedRegion.end,
      highlightSearch.current
    );
  };
  function onGeneSelected(gene: Gene) {
    const navContext = genomeConfig?.navContext;

    const contextInterval = navContext!.convertGenomeIntervalToBases(
      gene.locus
    );

    const baseStart = contextInterval[0].start;
    const baseEnd = contextInterval[contextInterval.length - 1].end;
    onNewRegionSelect(baseStart, baseEnd, highlightSearch.current);
  }

  function onSnpSelected(mapping: SnpMapping) {
    const navContext = genomeConfig?.navContext;
    const chrInterval = new ChromosomeInterval(
      `chr${mapping.seq_region_name}`,
      mapping.start - 1,
      mapping.end
    );
    const interval = navContext!.convertGenomeIntervalToBases(chrInterval)[0];

    if (interval) {
      onNewRegionSelect(interval.start, interval.end, highlightSearch.current);
    } else {
      console.log(
        "SNP not available in current region set view",
        "error",
        2000
      );
    }
  }
  const handleSearch = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      setIsRegion(false);
      setIsSearching(false);
      return;
    }

    if (REGION_REGEX.test(query)) {
      setIsRegion(true);
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsRegion(false);
    setIsSearching(true);

    try {
      if (activeCommand === "gene") {
        const results = await geneSearch(query, genomeConfig!.genome.getName());
        // Compare the ref value with the current query before updating the state:
        if (latestUserInput.current === query) {
          setSearchResults(results);
        }
      } else if (activeCommand === "snp") {
        const results = await snpSearch(query, genomeConfig!.genome.getName());
        if (latestUserInput.current === query) {
          setSearchResults(results);
        }
      } else {
        const [geneResults, snpResults] = await Promise.all([
          geneSearch(query, genomeConfig!.genome.getName()),
          snpSearchEnabled
            ? snpSearch(query, genomeConfig!.genome.getName())
            : Promise.resolve([]),
        ]);
        if (latestUserInput.current === query) {
          setSearchResults([...geneResults, ...snpResults]);
        }
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = debounce(handleSearch, 300);

  const handleSearchChange = (e: any) => {
    const value = e.target.value;
    latestUserInput.current = value; // Update the ref with the latest input
    setSearchInput(value);

    if (value.startsWith("/")) {
      const command = value.slice(1);
      if (SLASH_COMMANDS.includes(command)) {
        setActiveCommand(command);
        setSearchInput("");
        return;
      }
    }

    setIsShowingIsoforms(false);
    setIsShowingSNPforms(false);
    setSelectedInput("");
    if (value.trim().length < MIN_CHARS_FOR_SUGGESTIONS) {
      setSearchResults([]);
    }

    debouncedSearch(value);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "gene") {
      setSelectedInput(result.symbol);
      setIsShowingIsoforms(true);
    } else if (result.type === "snp") {
      // Handle SNP selection directly
      if (result.snpData?.mappings?.[0]) {
        onSnpSelected(result.snpData.mappings[0]);
      }
    }
    setSearchResults([]);
    setSearchInput("");
  };

  const renderSearchSuggestions = (): ReactElement[] => {
    const suggestions: ReactElement[] = [];

    if (isRegion) {
      suggestions.push(
        <SearchSuggestionBase
          key="region-message"
          icon={<span style={{ fontSize: getEmojiSize() }}>🎯</span>}
          text={`"${searchInput}"`}
          desc="You're entering coordinates. Press enter or click here to jump to this region."
          onClick={() => parseRegion(searchInput)}
        />
      );
      return suggestions;
    }

    // Show loading indicator
    if (isSearching && searchInput.trim().length >= MIN_CHARS_FOR_SUGGESTIONS) {
      suggestions.push(
        <div key="loading" className="px-3 py-2 text-gray-500 text-center">
          <span style={{ fontSize: fontSize }}>Searching...</span>
        </div>
      );
      return suggestions;
    }

    if (!activeCommand && !searchResults.length) {
      suggestions.push(
        <SearchSuggestionDivider
          key="filters"
          text="Filters"
          highlightSearch={highlightSearch}
          fontSize={fontSize}
        />
      );
      SLASH_COMMANDS.forEach((command) => {
        suggestions.push(
          <motion.div
            key={`command-${command}`}
            className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-dark-secondary dark:text-dark-primary cursor-pointer flex items-center gap-1.5"
            onClick={() => setActiveCommand(command)}
          >
            <span style={{ fontSize: getEmojiSize() }}>
              {typeToEmoji[command]}
            </span>
            <span
              className="text-gray-600 dark:text-dark-primary"
              style={{ fontSize: fontSize }}
            >
              /{command}
            </span>
          </motion.div>
        );
      });
    }

    if (searchResults.length > 0) {
      const geneResults = searchResults.filter(
        (r): r is GeneResult => r.type === "gene"
      );
      const snpResults = searchResults.filter(
        (r): r is SnpResult => r.type === "snp"
      );

      if (geneResults.length > 0) {
        suggestions.push(
          <SearchSuggestionDivider
            key="genes"
            text="Genes"
            fontSize={fontSize}
          />
        );
        geneResults.forEach((result) => {
          suggestions.push(
            <motion.div
              key={`gene-${result.id}`}
              className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-dark-background cursor-pointer"
              whileHover={{ backgroundColor: "#f3f4f6" }}
              onClick={() => handleResultClick(result)}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-medium" style={{ fontSize: fontSize }}>
                  {result.symbol}
                </span>
                <span className="text-gray-500" style={{ fontSize: fontSize }}>
                  {result.description}
                </span>
              </div>
            </motion.div>
          );
        });
      }

      if (snpResults.length > 0) {
        suggestions.push(
          <SearchSuggestionDivider
            key="snps"
            text="Variants"
            fontSize={fontSize}
          />
        );
        snpResults.forEach((result) => {
          suggestions.push(
            <motion.div
              key={`snp-${result.id}`}
              className="px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-dark-background"
              whileHover={{ backgroundColor: "#f3f4f6" }}
            >
              <SnpComponent
                snp={result.snpData}
                onSnpSelected={onSnpSelected}
              />
            </motion.div>
          );
        });
      }
    }

    return suggestions;
  };
  function SnpComponent(props: any) {
    return (
      <table className="table table-sm table-striped table-bordered">
        <tbody>
          <tr>
            <td>name</td>
            <td>{props.snp.name}</td>
          </tr>
          <tr>
            <td>location</td>
            <td>
              <ol style={{ marginBottom: 0 }}>
                {props.snp.mappings.map((item: any, i: number) => (
                  <li
                    key={i}
                    style={{
                      color: "#3f51b5",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                    onClick={() => props.onSnpSelected(item)}
                  >
                    chr{item.location} {item.strand === 1 ? "+" : "-"}{" "}
                    {item.allele_string}
                  </li>
                ))}
              </ol>
            </td>
          </tr>
          <tr>
            <td>ambiguity</td>
            <td>{props.snp.ambiguity}</td>
          </tr>
          <tr>
            <td>ancestral_allele</td>
            <td>{props.snp.ancestral_allele}</td>
          </tr>
          <tr>
            <td>synonyms</td>
            <td>
              <ol style={{ marginBottom: 0 }}>
                {props.snp.synonyms.map((item: any, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </td>
          </tr>
          <tr>
            <td>source</td>
            <td>{props.snp.source}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <OutsideClickDetector
      onOutsideClick={() => {
        onSearchFocusChange(false);
        setIsShowingIsoforms(false);

        setSelectedInput("");
        setSearchResults([]);
      }}
    >
      <AnimatePresence>
        {isShowingIsoforms ? (
          <motion.div
            className="absolute top-full left-0 right-0 bg-white dark:bg-dark-background rounded-lg shadow-lg mt-2 z-50"
            initial={{ opacity: 0, y: -10, maxHeight: 0 }}
            animate={{ opacity: 1, y: 0, maxHeight: "400px" }}
            exit={{ opacity: 0, y: -10, maxHeight: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <IsoformSelection
              geneName={selectedInput}
              onGeneSelected={onGeneSelected}
              simpleMode={false}
              color={"#222"}
              background={"#F8FAFC"}
              genomeConfig={genomeConfig}
            />
          </motion.div>
        ) : (
          ""
        )}
      </AnimatePresence>
      <motion.div
        ref={searchContainerRef}
        className="flex flex-col relative"
        transition={{ duration: 0.2 }}
      >
        <AnimatePresence>
          {isSearchFocused &&
          ((!isShowingIsoforms && !isShowingSNPforms) || searchInput === "") ? (
            <motion.div
              className="absolute top-full left-0 right-0 bg-white dark:bg-dark-background rounded-lg shadow-lg mt-2 overflow-hidden z-50"
              initial={{ opacity: 0, y: -10, maxHeight: 0 }}
              animate={{ opacity: 1, y: 0, maxHeight: "400px" }}
              exit={{ opacity: 0, y: -10, maxHeight: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {renderSearchSuggestions()}
            </motion.div>
          ) : (
            ""
          )}
        </AnimatePresence>

        {/* Outer row for search input + dynamic buttons; increased flex growth & min width */}
        <div className="flex flex-row items-center w-full h-full flex-grow">
          {/* Inner container: give it stronger flex and a minimum width so it claims more horizontal space */}
          <div className="flex flex-row items-center w-full flex-[2] min-w-[227px]">
            {activeCommand ? (
              <div
                className="flex items-center bg-secondary dark:bg-dark-secondary rounded-md mr-1.5 flex-shrink-0"
                style={getButtonStyle()}
              >
                <span
                  className="text-tint dark:text-dark-primary leading-none"
                  style={{ fontSize: fontSize }}
                >
                  /{activeCommand}
                </span>
              </div>
            ) : (
              <MagnifyingGlassIcon
                className="text-gray-400 flex-shrink-0 mr-1"
                style={iconSizeStyle}
              />
            )}
            <input
              className="flex-1 outline-none bg-transparent min-w-0 w-full leading-tight py-1"
              style={{
                minWidth: fontSize,
                fontSize: fontSize,
              }}
              placeholder={
                activeCommand
                  ? `Search ${activeCommand}s`
                  : "Search regions, genes, snps"
              }
              onFocus={() => onSearchFocusChange(true)}
              // onBlur={() => onSearchFocusChange(false)}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (
                  e.key === "Backspace" &&
                  !e.currentTarget.value &&
                  activeCommand
                ) {
                  setActiveCommand(null);
                } else if (e.key === "Enter" && activeCommand === "gene") {
                  setSelectedInput(searchInput);
                  setIsShowingIsoforms(true);
                } else if (e.key === "Enter" && isRegion) {
                  parseRegion(e.currentTarget.value);
                }
              }}
            />
            {isRegion && (
              <button
                onClick={() =>
                  parseRegion(document.querySelector("input")?.value || "")
                }
                className="flex items-center justify-center rounded-full bg-secondary hover:bg-opacity-80 transition-colors dark:bg-dark-secondary dark:hover:bg-dark-secondary"
                style={{
                  width: getRegionButtonSize(),
                  height: getRegionButtonSize(),
                }}
              >
                <ArrowRightIcon
                  className="text-tint"
                  style={{
                    width: getArrowIconSize(),
                    height: getArrowIconSize(),
                  }}
                />
              </button>
            )}
          </div>
        </div>
      </motion.div>{" "}
      {/* <motion.div
        className="w-full absolute bottom-0 border-b border-gray-300"
        animate={{ opacity: isSearchFocused ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      /> */}
    </OutsideClickDetector>
  );
}
