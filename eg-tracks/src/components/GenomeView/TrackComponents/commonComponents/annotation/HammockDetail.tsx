import FeatureDetail from "./FeatureDetail";
import { getHammockDetails } from "../../../../../models/Hammock";

// Fields FeatureDetail (name, strand) and the score list below already show.
const SHOWN_ELSEWHERE = new Set(["name", "strand", "scorelst"]);

interface HammockDetailProps {
  feature: any; // raw hammock record
  scoreNames?: string[];
  scoreIndex?: number;
}

/**
 * Box that contains the details of a hammock item when it is clicked: the
 * usual name/locus/strand, every score of its `scorelst`, and any other field
 * of the item.
 */
function HammockDetail({
  feature,
  scoreNames = [],
  scoreIndex = 0,
}: HammockDetailProps) {
  const { scores, fields } = getHammockDetails(feature);
  const otherFields = Object.keys(fields).filter(
    (key) => !SHOWN_ELSEWHERE.has(key),
  );

  return (
    <div>
      <FeatureDetail
        feature={feature}
        category={undefined}
        queryEndpoint={undefined}
        type="hammock"
      />
      {scores.map((score, i) => (
        <div
          key={`score-${i}`}
          style={{ fontWeight: i === scoreIndex ? "bold" : "normal" }}
        >
          {scoreNames[i] || (scores.length > 1 ? `Score ${i + 1}` : "Score")}:{" "}
          {score}
        </div>
      ))}
      {otherFields.map((key) => (
        <div key={key}>
          {key}:{" "}
          {typeof fields[key] === "object"
            ? JSON.stringify(fields[key])
            : String(fields[key])}
        </div>
      ))}
    </div>
  );
}

export default HammockDetail;
