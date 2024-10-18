import { default as React } from 'react';
import { TrackProps } from '../../models/trackModels/trackProps';
export declare const DEFAULT_OPTIONS: {
    height: number;
    isCombineStrands: boolean;
    colorsForContext: {
        CG: {
            color: string;
            background: string;
        };
        CHG: {
            color: string;
            background: string;
        };
        CHH: {
            color: string;
            background: string;
        };
    };
    depthColor: string;
    depthFilter: number;
    maxMethyl: number;
    aggregateMethod: string;
    displayMode: string;
    color: string;
    colorAboveMax: string;
    color2: string;
    color2BelowMin: string;
    yScale: import('../../models/ScaleChoices').ScaleChoices;
    yMax: number;
    yMin: number;
    smooth: number;
    ensemblStyle: boolean;
    backgroundColor: string;
};
declare const _default: React.NamedExoticComponent<TrackProps>;
export default _default;
