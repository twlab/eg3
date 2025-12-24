import GeneAnnotation from "../TrackComponents/geneAnnotationTrackComponents/GeneAnnotation";
import Gene from "../../../models/Gene";
import { PlacedFeature } from "../../../models/getXSpan/FeaturePlacer";
import OpenInterval from "../../../models/OpenInterval";
import { FeatureSegment } from "../../../models/FeatureSegment";
import { generateUUID } from "../../../util";
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
 * @author Chanrung(Chad) Seng, Silas Hsu
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
  const uniqueKey = generateUUID();
  return (
    <svg width={elementWidth} height={HEIGHT}>
      <GeneAnnotation key={uniqueKey} id={uniqueKey} placedGene={placedGene} />
    </svg>
  );
}
