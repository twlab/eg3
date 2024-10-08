import PropTypes from "prop-types";
import React from "react";
import FeatureDetail from "../commonComponents/annotation/FeatureDetail";
import Gene from "../../../models/Gene";
import GeneAnnotation, {
  DEFAULT_OPTIONS,
  GeneDisplayOptions,
} from "./GeneAnnotation";
import { getDrawColors } from "./GeneAnnotationScaffold";
import { safeParseJsonString, variableIsObject } from "../../../models/util";

import "./Tooltip.css";

/**
 * Box that contains gene details when a gene annotation is clicked.
 *
 * @author Silas Hsu
 */
interface GeneDetailProps {
  gene: Gene; // Assuming Gene is a class or interface defined elsewhere
  collectionName: string;
  queryEndpoint?: Record<string, any>; // Optional object with any properties
}
/**
 * Box that contains gene details when a gene annotation is clicked.
 *
 * @author Silas Hsu
 */

const GeneDetail: React.FC<GeneDetailProps> = ({ gene, queryEndpoint }) => {
  const colors = getDrawColors(gene);
  const desc = safeParseJsonString(gene.description!);

  let descContent: React.ReactNode;
  if (variableIsObject(desc)) {
    let rows;
    if (desc.hasOwnProperty("maneStat")) {
      rows = (
        <>
          <tr>
            <td colSpan={2}>
              <i style={{ wordBreak: "break-word" }}>{desc.description}</i>
            </td>
          </tr>
          <tr>
            <td>Ensembl id:</td>
            <td>
              <a
                href={`https://www.ensembl.org/Homo_sapiens/Transcript/Summary?t=${desc["Ensembl id"]}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {desc["Ensembl id"]}
              </a>
            </td>
          </tr>
          <tr>
            <td>Ensembl gene:</td>
            <td>
              <a
                href={`https://www.ensembl.org/homo_sapiens/Gene/Summary?g=${desc["Ensembl gene"]}&db=core}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {desc["Ensembl gene"]}
              </a>
            </td>
          </tr>
          <tr>
            <td>Ensembl protein:</td>
            <td>
              <a
                href={`https://www.ensembl.org/Homo_sapiens/Transcript/Summary?t=${desc["Ensembl protein"]}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {desc["Ensembl protein"]}
              </a>
            </td>
          </tr>
          <tr>
            <td>NCBI id:</td>
            <td>
              <a
                href={`https://www.ncbi.nlm.nih.gov/nuccore/${desc["NCBI id"]}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {desc["NCBI id"]}
              </a>
            </td>
          </tr>
          <tr>
            <td>NCBI gene:</td>
            <td>{desc["NCBI gene"]}</td>
          </tr>
          <tr>
            <td>NCBI protein:</td>
            <td>
              <a
                href={`https://www.ncbi.nlm.nih.gov/nuccore/${desc["NCBI protein"]}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {desc["NCBI protein"]}
              </a>
            </td>
          </tr>
          <tr>
            <td>MANE transcript status:</td>
            <td>{desc.maneStat}</td>
          </tr>
        </>
      );
    } else {
      // Render all properties
      rows = Object.entries(desc).map(([key, value], index) => (
        <tr key={index}>
          <td>{key}:</td>
          <td>{value as any}</td>
        </tr>
      ));
      descContent = (
        <table className="table table-sm table-striped">
          <tbody>{rows}</tbody>
        </table>
      );
    }
  } else {
    descContent = <i style={{ wordBreak: "break-word" }}>{desc}</i>;
  }

  return (
    <div style={{ maxWidth: 400 }}>
      {/* Assuming FeatureDetail is another component */}
      <FeatureDetail feature={gene} queryEndpoint={queryEndpoint} />
      {descContent}
      <div>
        {gene.transcriptionClass && (
          <span>
            Transcription class:{" "}
            <span style={{ color: colors.color }}>
              {gene.transcriptionClass}
            </span>
          </span>
        )}
      </div>
    </div>
  );
};

export default GeneDetail;
