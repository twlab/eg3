import React from "react";
import "./Tooltip.css";

/**
 * Calculates genomic coordinates/sequences for both query and target alignment
 * at a page coordinate and displays them in hover box (using alignment segments).
 *
 * @author Xiaoyu Zhuo
 */
const GAP_CHAR = "-";
export function makeBaseNumberLookup(
  sequence: string,
  baseAtStart: number,
  isReverse = false
): number[] {
  const diff = isReverse ? -1 : 1;

  const bases: Array<any> = [];
  let currentBase = baseAtStart;
  for (const char of sequence) {
    bases.push(currentBase);
    if (char !== GAP_CHAR) {
      currentBase += diff;
    }
  }
  return bases;
}
interface AlignSeqData {
  alignment?: { [key: string]: any }; // Optional alignment object
  x: number; // X coordinate (required)
  halfLength: number; // Half length (required)
  target: string; // Target (required)
  query: string; // Query (required)
  basesPerPixel: number; // Bases per pixel (required)
}
class AlignmentSequence extends React.Component<AlignSeqData> {
  /**
   * @inheritdoc
   */
  render() {
    const { alignment, x, halfLength, target, query, basesPerPixel } =
      this.props;
    if (!alignment) {
      return <div>No alignment available</div>;
    } else {
      const highlightLength = Math.max(Math.round(basesPerPixel), 1);
      const halfHighlightLength = Math.floor(highlightLength / 2);
      const { visiblePart, record } = alignment;

      const { start, end } = visiblePart.sequenceInterval;

      const length = end - start;
      const cusorLocus = Math.floor(
        ((x - alignment.targetXSpan.start) /
          (alignment.targetXSpan.end - alignment.targetXSpan.start)) *
          length
      );

      const relativeDisplayStart =
        cusorLocus - halfLength > 0 ? cusorLocus - halfLength : 0;
      const relativeDisplayEnd =
        cusorLocus + halfLength < length ? cusorLocus + halfLength : length - 1;
      const relativeHighlightStart =
        cusorLocus - halfHighlightLength > 0
          ? cusorLocus - halfHighlightLength
          : 0;
      const relativeHighlightEnd =
        cusorLocus + halfHighlightLength < length
          ? cusorLocus + halfHighlightLength
          : length - 1;

      const cusorTargetSeqLeft = record.targetSeq
        .substr(
          start + relativeDisplayStart,
          relativeHighlightStart - relativeDisplayStart
        )
        .toUpperCase();
      const cusorTargetSeqMid = record.targetSeq
        .substr(start + relativeHighlightStart, highlightLength)
        .toUpperCase();
      const cusorTargetSeqRight = record.targetSeq
        .substr(
          start + relativeHighlightStart + highlightLength,
          relativeDisplayEnd - relativeHighlightEnd
        )
        .toUpperCase();

      const cusorQuerySeqLeft = record.querySeq
        .substr(
          start + relativeDisplayStart,
          relativeHighlightStart - relativeDisplayStart
        )
        .toUpperCase();
      const cusorQuerySeqMid = record.querySeq
        .substr(start + relativeHighlightStart, highlightLength)
        .toUpperCase();
      const cusorQuerySeqRight = record.querySeq
        .substr(
          start + relativeHighlightStart + highlightLength,
          relativeDisplayEnd - relativeHighlightEnd
        )
        .toUpperCase();

      const targetBaseLookup = makeBaseNumberLookup(
        alignment.targetSequence,
        visiblePart.relativeStart
      );
      const targetStart =
        record.locus.start + targetBaseLookup[relativeDisplayStart];
      const targetEnd =
        record.locus.start + targetBaseLookup[relativeDisplayEnd];
      const targetHighlightStart =
        record.locus.start + targetBaseLookup[relativeHighlightStart];
      const targetHighlightEnd =
        record.locus.start + targetBaseLookup[relativeHighlightEnd];
      const isReverse = record.queryStrand === "-" ? true : false;

      const queryLookupStart = isReverse
        ? alignment.queryLocusFine.end
        : alignment.queryLocusFine.start;
      const queryBaseLookup = makeBaseNumberLookup(
        alignment.querySequence,
        queryLookupStart,
        isReverse
      );

      const queryStart = queryBaseLookup[relativeDisplayStart];
      const queryEnd = queryBaseLookup[relativeDisplayEnd];
      const queryHighlightStart = queryBaseLookup[relativeHighlightStart];
      const queryHighlightEnd = queryBaseLookup[relativeHighlightEnd];

      const maxTextLength = Math.max(
        targetStart.toString().length,
        targetEnd.toString().length,
        queryStart.toString().length,
        queryEnd.toString().length
      );
      const displayPix = maxTextLength * 10 + 10 + "px"; // text width with font-size: 16px;
      const tickLeft = _getick(cusorTargetSeqLeft, cusorQuerySeqLeft);
      const tickMid = _getick(cusorTargetSeqMid, cusorQuerySeqMid);
      const tickRight = _getick(cusorTargetSeqRight, cusorQuerySeqRight);

      function _getick(targetSeq, querySeq) {
        const targetSeqArray = targetSeq.split("");
        const querySeqArray = querySeq.split("");
        const tickArray = targetSeqArray.map(function (char, i) {
          return char === querySeqArray[i] ? "|" : " ";
        });
        return tickArray.join("");
      }
      return (
        <React.Fragment>
          <div>
            <span>
              {target}:{record.locus.chr}:{" "}
            </span>
            <span className="Tooltip-highlight-text">
              {targetHighlightStart}-{targetHighlightEnd}
            </span>
          </div>
          <div>
            <span
              className="Tooltip-monospace-text"
              style={{ width: displayPix }}
            >
              {targetStart}
            </span>
            <span className="Tooltip-monospace-seq">{cusorTargetSeqLeft}</span>
            <span className="Tooltip-monospace-central-seq">
              {cusorTargetSeqMid}
            </span>
            <span className="Tooltip-monospace-seq">{cusorTargetSeqRight}</span>
            <span
              className="Tooltip-monospace-text"
              style={{ width: displayPix }}
            >
              {targetEnd}
            </span>
          </div>
          <div>
            <pre
              className="Tooltip-monospace-seq"
              style={{ marginLeft: displayPix }}
            >
              {tickLeft}
            </pre>
            <pre className="Tooltip-monospace-central-seq">{tickMid}</pre>
            <pre className="Tooltip-monospace-seq">{tickRight}</pre>
          </div>
          <div>
            <span
              className="Tooltip-monospace-text"
              style={{ width: displayPix }}
            >
              {queryStart}
            </span>
            <span className="Tooltip-monospace-seq">{cusorQuerySeqLeft}</span>
            <span className="Tooltip-monospace-central-seq">
              {cusorQuerySeqMid}
            </span>
            <span className="Tooltip-monospace-seq">{cusorQuerySeqRight}</span>
            <span
              className="Tooltip-monospace-text"
              style={{ width: displayPix }}
            >
              {queryEnd}
            </span>
          </div>
          <div>
            <span>
              {query}:{record.queryLocus.chr}:{" "}
            </span>
            <span className="Tooltip-highlight-text">
              {queryHighlightStart}-{queryHighlightEnd}
            </span>
          </div>
        </React.Fragment>
      );
    }
  }
}

export default AlignmentSequence;
