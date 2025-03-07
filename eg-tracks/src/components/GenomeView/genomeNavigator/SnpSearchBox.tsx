import React, { useState, useCallback, useContext } from "react";
import _ from "lodash";

import NavigationContext from "@eg/core/src/eg-lib/models/NavigationContext";
import Genome from "@eg/core/src/eg-lib/models/Genome";
import ChromosomeInterval from "@eg/core/src/eg-lib/models/ChromosomeInterval";

const DEBOUNCE_INTERVAL = 250;
const SNP_ENDPOINTS = {
  hg19: "https://grch37.rest.ensembl.org/variation/human",
  hg38: "https://rest.ensembl.org/variation/human",
};

interface SnpSearchBoxProps {
  genomeConfig: any;
  navContext: NavigationContext;
  onRegionSelected: (newStart: number, newEnd: number) => void;
  handleCloseModal: () => void;
  onNewHighlight?: (start: number, end: number, text: string) => void;
  doHighlight?: boolean;
  color?: string;
  background?: string;
}

interface SnpMapping {
  seq_region_name: string;
  start: number;
  end: number;
  strand: number;
  allele_string: string;
  location: string;
}

interface SnpResult {
  name: string;
  ambiguity: string;
  ancestral_allele: string;
  synonyms: string[];
  mappings: SnpMapping[];
  source: string;
}

const SnpSearchBox: React.FC<SnpSearchBoxProps> = ({
  genomeConfig,
  navContext,
  onRegionSelected,
  handleCloseModal,
  onNewHighlight,
  doHighlight,
  color,
  background,
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [result, setResult] = useState<SnpResult | null>(null);
  const [loadingMsg, setLoadingMsg] = useState<string>("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const searchSnp = useCallback(
    _.debounce(async () => {
      const trimmedInput = inputValue.trim();

      if (trimmedInput.length < 1) {
        console.log("Please input a valid SNP id.", "error", 2000);
        return;
      }

      const genomeName = genomeConfig.genome.getName();
      const endpoint = SNP_ENDPOINTS[genomeName];

      if (!endpoint) {
        console.log(
          "This genome is not supported in SNP search.",
          "error",
          2000
        );
        return;
      }

      setLoadingMsg("searching...");

      try {
        const response = await fetch(`${endpoint}/${trimmedInput}`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();

        setResult(data);
      } catch (error) {
        console.log("Error fetching SNP data.", "error", 2000);
      } finally {
        setLoadingMsg("");
      }
    }, DEBOUNCE_INTERVAL),
    [inputValue, genomeConfig.genome]
  );

  const setViewToSnp = (mapping: SnpMapping) => {
    const chrInterval = new ChromosomeInterval(
      `chr${mapping.seq_region_name}`,
      mapping.start - 1,
      mapping.end
    );
    const interval = navContext.convertGenomeIntervalToBases(chrInterval)[0];

    if (interval) {
      onRegionSelected(interval.start, interval.end);
      handleCloseModal();
      if (doHighlight && onNewHighlight) {
        onNewHighlight(interval.start, interval.end, inputValue.trim());
      }
    } else {
      console.log(
        "SNP not available in current region set view",
        "error",
        2000
      );
    }
  };

  const renderSNP = (snp: SnpResult) => (
    <table className="table table-sm table-striped table-bordered">
      <tbody>
        <tr>
          <td>name</td>
          <td>{snp.name}</td>
        </tr>
        <tr>
          <td>location</td>
          <td>
            <ol style={{ marginBottom: 0 }}>
              {snp.mappings.map((item, i) => (
                <li
                  key={i}
                  style={{
                    color: "#3f51b5",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                  onClick={() => setViewToSnp(item)}
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
          <td>{snp.ambiguity}</td>
        </tr>
        <tr>
          <td>ancestral_allele</td>
          <td>{snp.ancestral_allele}</td>
        </tr>
        <tr>
          <td>synonyms</td>
          <td>
            <ol style={{ marginBottom: 0 }}>
              {snp.synonyms.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </td>
        </tr>
        <tr>
          <td>source</td>
          <td>{snp.source}</td>
        </tr>
      </tbody>
    </table>
  );

  return (
    <div>
      <div>
        <input
          type="text"
          size={20}
          placeholder="SNP id"
          onChange={handleInputChange}
        />
        <button
          className="btn btn-secondary btn-sm"
          style={{ marginLeft: "2px" }}
          onClick={searchSnp}
        >
          Go
        </button>{" "}
        <span className="text-info font-italic">{loadingMsg}</span>
      </div>
      <div
        style={{
          position: "absolute",
          zIndex: 2,
          backgroundColor: background,
          color,
        }}
      >
        {result && renderSNP(result)}
      </div>
    </div>
  );
};

export default SnpSearchBox;
