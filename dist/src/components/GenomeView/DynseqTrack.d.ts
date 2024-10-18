import { default as React } from 'react';
import { TrackProps } from '../../models/trackModels/trackProps';
export declare const DEFAULT_OPTIONS: {
    aggregateMethod: string;
    height: number;
    color: string;
    color2: string;
    yScale: import('../../models/ScaleChoices').ScaleChoices;
    yMax: number;
    yMin: number;
    displayMode: string;
    colorAboveMax: string;
    color2BelowMin: string;
    smooth: number;
    ensemblStyle: boolean;
    backgroundColor: string;
};
declare const _default: React.NamedExoticComponent<TrackProps>;
export default _default;
