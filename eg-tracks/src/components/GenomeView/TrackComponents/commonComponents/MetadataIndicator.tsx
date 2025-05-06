import React, { useState, FC } from "react";
import TrackModel from "../../../../models/TrackModel";
import "./hoverToolTips/Tooltip.css";
import { variableIsObject } from "../../../../models/util";

export const COLORS = [
  // From https://stackoverflow.com/questions/1168260/algorithm-for-generating-unique-colors
  "#000000",
  "#00FF00",
  "#0000FF",
  "#FF0000",
  "#01FFFE",
  "#FFA6FE",
  "#FFDB66",
  "#006401",
  "#010067",
  "#95003A",
  "#007DB5",
  "#FF00F6",
  "#FFEEE8",
  "#774D00",
  "#90FB92",
  "#0076FF",
  "#D5FF00",
  "#FF937E",
  "#6A826C",
  "#FF029D",
  "#FE8900",
  "#7A4782",
  "#7E2DD2",
  "#85A900",
  "#FF0056",
  "#A42400",
  "#00AE7E",
  "#683D3B",
  "#BDC6FF",
  "#263400",
  "#BDD393",
  "#00B917",
  "#9E008E",
  "#001544",
  "#C28C9F",
  "#FF74A3",
  "#01D0FF",
  "#004754",
  "#E56FFE",
  "#788231",
  "#0E4CA1",
  "#91D0CB",
  "#BE9970",
  "#968AE8",
  "#BB8800",
  "#43002C",
  "#DEFF74",
  "#00FFC6",
  "#FFE502",
  "#620E00",
  "#008F9C",
  "#98FF52",
  "#7544B1",
  "#B500FF",
  "#00FF78",
  "#FF6E41",
  "#005F39",
  "#6B6882",
  "#5FAD4E",
  "#A75740",
  "#A5FFD2",
  "#FFB167",
  "#009BFF",
  "#E85EBE",
];

/**
 * Port of Java's String `hashCode()` function. Consistently returns the same integer for equal strings.
 *
 * @param str string to hash
 * @returns integer hash code value of the string
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

interface MetadataIndicatorProps {
  track: TrackModel; // The track for which to indicate metadata
  terms?: string[]; // Metadata terms to indicate
  // Called when the component is clicked. Signature: (event: React.MouseEvent, term: string)
  onClick?: (event: string, term: string) => void;
  height: number;
}

const MetadataIndicator: FC<MetadataIndicatorProps> = ({
  track,
  terms = [],
  onClick = () => undefined,
  height,
}) => {
  const getColorForTermValue = (termValue?: string): string => {
    if (!termValue) {
      return "white";
    }
    const colorIndex = Math.abs(hashCode(termValue)) % COLORS.length;
    return COLORS[colorIndex];
  };

  const renderBoxForTerm = (term: string) => {
    let termValue: any;
    termValue = track.getMetadataAsis(term);
    if (variableIsObject(termValue) && termValue.name && termValue.color) {
      return (
        <ColoredBox
          key={term}
          color={termValue.color}
          term={term}
          termValue={termValue.name}
          onClick={(event) => onClick(event, term)}
        />
      );
    } else {
      termValue = track.getMetadata(term);
      const color = getColorForTermValue(termValue);

      return (
        <ColoredBox
          key={term}
          color={color}
          term={term}
          termValue={termValue}
          onClick={(event) => onClick(term, termValue)}
        />
      );
    }
  };

  return (
    <div style={{ display: "flex", height: height }}>
      {terms.map((term) => renderBoxForTerm(term))}
    </div>
  );
};

interface ColoredBoxProps {
  color: string; // The color of the box
  term: string; // The metadata term to indicate
  termValue?: string; // The value of the metadata term
  onClick?: React.MouseEventHandler<HTMLDivElement>; // Callback for when the element is clicked
}

const ColoredBox: FC<ColoredBoxProps> = ({
  color,
  term,
  termValue,
  onClick,
}) => {
  const [isShowingTooltip, setIsShowingTooltip] = useState(false);

  const showTooltip = () => setIsShowingTooltip(true);
  const hideTooltip = () => setIsShowingTooltip(false);

  const boxStyle = {
    backgroundColor: color,
    width: 15,
    height: "100%",
    borderLeft: "1px solid lightgrey",
  };

  const tooltipStyle = {
    zIndex: 1,
    marginRight: 5,
    display: isShowingTooltip ? undefined : "none",
  };

  return (
    <div
      style={boxStyle}
      onClick={onClick}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {isShowingTooltip && (
        <div className="Tooltip" style={tooltipStyle}>
          <div className="Tooltip-minor-text">{term}:</div>
          <div>{termValue || "(no value)"}</div>
        </div>
      )}
    </div>
  );
};

export default MetadataIndicator;
