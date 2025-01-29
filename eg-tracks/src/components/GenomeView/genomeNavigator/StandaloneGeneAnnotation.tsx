import GeneAnnotation from "../TrackComponents/geneAnnotationTrackComponents/GeneAnnotation";
import Gene from "@eg/core/src/eg-lib/models/Gene";
import { PlacedFeature } from "@eg/core/src/eg-lib/models/getXSpan/FeaturePlacer";
import OpenInterval from "@eg/core/src/eg-lib/models/OpenInterval";
import { FeatureSegment } from "@eg/core/src/eg-lib/models/FeatureSegment";
import { v4 as uuidv4 } from "uuid";
interface StandaloneGeneAnnotationProps {
  gene: Gene;
  contextLocation: OpenInterval;
  xSpan: OpenInterval;
  elementWidth: number;
}
const HEIGHT = 9;
/**
 * A SVG containing a happy solo GeneAnnotation.
 *
 * @author Silas Hsu
 */
export function StandaloneGeneAnnotation(
  props: StandaloneGeneAnnotationProps
): JSX.Element {
  const { gene, contextLocation, xSpan, elementWidth } = props;
  const placedGene: PlacedFeature = {
    feature: gene,
    visiblePart: new FeatureSegment(gene),
    contextLocation,
    xSpan,
    isReverse: false,
  };
  const uniqueKey = uuidv4();
  return (
    <svg width={elementWidth} height={HEIGHT}>
      <GeneAnnotation key={uniqueKey} id={uniqueKey} placedGene={placedGene} />
    </svg>
  );
}
