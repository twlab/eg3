// import React from "react";
// import { scaleLinear, ScaleLinear } from "d3-scale";
// import BedAnnotation from "./BedAnnotation";
// import Track, { PropsFromTrackContainer } from "../commonComponents/Track";

// import JasparDetail from "../commonComponents/annotation/JasparDetail";

// import { JasparFeature } from "../../../models/Feature";
// import { PlacedFeatureGroup } from "../../../models/FeatureArranger";
// import OpenInterval from "../../../models/OpenInterval";
// import DisplayedRegionModel from "../../../models/DisplayedRegionModel";

// const ROW_VERTICAL_PADDING = 2;
// const ROW_HEIGHT = BedAnnotation.HEIGHT + ROW_VERTICAL_PADDING;
// export const MAX_BASES_PER_PIXEL = 2; // The higher this number, the more zooming out we support
// interface JasparTrackProps extends PropsFromTrackContainer, TooltipCallbacks {
//   data: JasparFeature[];
//   viewRegion: DisplayedRegionModel;
//   options: {
//     color?: string;
//     color2?: string;
//     alwaysDrawLabel?: boolean;
//     hiddenPixels?: number;
//     height?: number;
//   };
// }

// export const DEFAULT_OPTIONS = {
//   hiddenPixels: 0.5,
//   alwaysDrawLabel: true,
// };

// /**
//  * Track component for BED annotations.
//  *
//  * @author Daofeng Li
//  */
// class JasparTrackNoTooltip extends React.Component<JasparTrackProps> {
//   static displayName = "JasparTrack";
//   scoreScale: ScaleLinear<number, number>;
//   constructor(props: JasparTrackProps) {
//     super(props);
//     this.renderTooltip = this.renderTooltip.bind(this);
//     this.renderAnnotation = this.renderAnnotation.bind(this);
//     this.scoreScale = scaleLinear().domain([0, 1000]).range([0, 1]).clamp(true);
//   }

//   /**
//    * Renders the tooltip for a feature.
//    *
//    * @param {React.MouseEvent} event - mouse event that triggered the tooltip request
//    * @param {Feature} feature - Feature for which to display details
//    */
//   renderTooltip(event: React.MouseEvent, feature: JasparFeature) {
//     const tooltip = (
//       <Tooltip
//         pageX={event.pageX}
//         pageY={event.pageY}
//         onClose={this.props.onHideTooltip}
//       >
//         <JasparDetail feature={feature} />
//       </Tooltip>
//     );
//     this.props.onShowTooltip(tooltip);
//   }

//   paddingFunc = (feature: JasparFeature, xSpan: OpenInterval) => {
//     const width = xSpan.end - xSpan.start;
//     const estimatedLabelWidth = feature.getName().length * 9;
//     if (estimatedLabelWidth < 0.5 * width) {
//       return 5;
//     } else {
//       return 9 + estimatedLabelWidth;
//     }
//   };

//   /**
//    * Renders one annotation.
//    *
//    * @param {PlacedFeature} - feature and drawing info
//    * @param {number} y - y coordinate to render the annotation
//    * @param {boolean} isLastRow - whether the annotation is assigned to the last configured row
//    * @param {number} index - iteration index
//    * @return {JSX.Element} element visualizing the feature
//    */
//   renderAnnotation(
//     placedGroup: PlacedFeatureGroup,
//     y: number,
//     isLastRow: boolean,
//     index: number
//   ) {
//     return placedGroup.placedFeatures.map((placement, i) => (
//       <BedAnnotation
//         key={i}
//         feature={placement.feature}
//         xSpan={placement.xSpan}
//         y={y}
//         isMinimal={isLastRow}
//         color={this.props.options.color}
//         reverseStrandColor={this.props.options.color2}
//         isInvertArrowDirection={placement.isReverse}
//         onClick={this.renderTooltip}
//         alwaysDrawLabel={this.props.options.alwaysDrawLabel}
//         hiddenPixels={this.props.options.hiddenPixels}
//         opacity={this.scoreScale((placement.feature as JasparFeature).score)}
//       />
//     ));
//   }

//   render() {
//     const { viewRegion, width, trackModel, options } = this.props;
//     if (viewRegion.getWidth() / width > MAX_BASES_PER_PIXEL) {
//       return "";
//     }
//     return (
//       <AnnotationTrack
//         {...this.props}
//         rowHeight={ROW_HEIGHT}
//         getAnnotationElement={this.renderAnnotation}
//         featurePadding={this.paddingFunc}
//       />
//     );
//   }
// }

// export const JasparTrack = withTooltip(JasparTrackNoTooltip as any);
