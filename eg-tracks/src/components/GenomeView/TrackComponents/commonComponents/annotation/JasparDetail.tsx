import React from "react";
import "../HoverToolTips/Tooltip.css";
import {
  getFeatureHasStrand,
  getFeatureLength,
  getFeatureLocusString,
  getFeatureName,
  getFeatureScore,
  getFeatureStrand,
  JasparFeature,
} from "../../../../../models/Feature";

interface JasparDetailProps {
  feature: JasparFeature;
}

/**
 * Box that contains jaspar TF details when an annotation is clicked.
 */
class JasparDetail extends React.PureComponent<JasparDetailProps> {
  render() {
    const { feature } = this.props;
    const tfName = getFeatureName(feature, "jaspar");
    // JasparFeature keeps matrixId on the model; a raw jaspar record keeps it in
    // rest[0] (see formatJasper: withJaspar(parseInt(rest[1]), rest[0])).
    const rest =
      typeof (feature as any).rest === "string"
        ? (feature as any).rest.split("\t")
        : [];
    const matrixId = feature.matrixId ?? rest[0];
    const strand = getFeatureStrand(feature, "jaspar");
    const suffix = strand === "-" ? "?revcomp=1" : "";
    const rc = strand === "-" ? ".rc" : "";
    const queryURL = `https://jaspar.genereg.net/matrix/${matrixId}/${suffix}`;
    const logoURL = `https://jaspar.genereg.net/static/logos/all/svg/${matrixId}${rc}.svg`;
    const linkOut = (
      <a href={queryURL} target="_blank" rel="noopener noreferrer">
        view in Jaspar database
        <span role="img" aria-label="jaspar">
          🔗
        </span>
      </a>
    );

    return (
      <div>
        {tfName ? <div className="Tooltip-major-text">{tfName}</div> : null}
        {matrixId ? (
          <div>
            {matrixId} {linkOut}
          </div>
        ) : null}
        <div>Score: {getFeatureScore(feature, "jaspar")}</div>
        <div style={{ textAlign: "center" }}>
          <img
            alt={matrixId}
            className="img-fluid"
            style={{ maxWidth: "100%", height: 225 }}
            src={logoURL}
          />
        </div>
        <div>
          {getFeatureLocusString(feature)} ({getFeatureLength(feature)}bp)
        </div>
        {getFeatureHasStrand(feature, "jaspar") ? (
          <div>Strand: {strand}</div>
        ) : null}
      </div>
    );
  }
}

export default JasparDetail;
