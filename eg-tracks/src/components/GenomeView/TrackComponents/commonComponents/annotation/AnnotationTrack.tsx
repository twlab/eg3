import React from "react";


import FullDisplayMode from "./FullDisplayMode";

import NumericalTrack from "../numerical/NumericalTrack";

import { DefaultAggregators } from "../../../../../models/FeatureAggregator";
import {
    AnnotationDisplayModes,
    FiberDisplayModes,
    NumericalDisplayModes,
    VcfDisplayModes,
} from "../../../../../trackConfigs/config-menu-models.tsx/DisplayModes";


export const DEFAULT_OPTIONS = {
    displayMode: AnnotationDisplayModes.FULL,
    color: "blue",
    color2: "red",
    maxRows: 20,
    height: 40, // For density display mode
    hideMinimalItems: false,
    sortItems: false,
};

/**
 * A component that visualizes annotations or Features.
 *
 * @author Silas Hsu
 */
interface AnnotationTrackProps {
    options: {
        displayMode: string;
        [key: string]: any; // Allow additional properties
    };
}

export class AnnotationTrack extends React.PureComponent<AnnotationTrackProps> {


    render() {
        if (this.props.options.displayMode === AnnotationDisplayModes.DENSITY) {
            const numericalOptions = {
                ...DEFAULT_OPTIONS,
                ...this.props.options,
                displayMode: NumericalDisplayModes.AUTO,
                aggregateMethod: DefaultAggregators.types.COUNT,
            };
            return <NumericalTrack {...this.props} unit="feature density" options={numericalOptions} />;
        } else {
            // Assume FULL display mode
            return <FullDisplayMode {...this.props} />;
        }
    }
}

export default AnnotationTrack;
