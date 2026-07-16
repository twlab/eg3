import React from "react";
import Snp from "../../../models/Snp";
import {
  getFeatureHasStrand,
  getFeatureLength,
  getFeatureLocusString,
  getFeatureStrand,
} from "../../../models/Feature";
import "../commonComponents/HoverToolTips/Tooltip.css";

interface SnpDetailProps {
  snp: Snp;
}

const SnpDetail: React.FC<SnpDetailProps> = ({ snp }) => {
  const ncbiURL = `https://www.ncbi.nlm.nih.gov/snp/?term=${snp.id}`;
  const ncbiLink = (
    <a href={ncbiURL} target="_blank" rel="noopener noreferrer">
      dbSNP
      <span role="img" aria-label="dbsnp">
        🔗
      </span>
    </a>
  );

  return (
    <div>
      <div>
        {snp.id} {ncbiLink}
      </div>
      <div>
        {getFeatureLocusString(snp)} ({getFeatureLength(snp)}bp)
      </div>
      {getFeatureHasStrand(snp, "snp") ? (
        <div>Strand: {getFeatureStrand(snp, "snp")}</div>
      ) : null}
    </div>
  );
};

export default SnpDetail;
