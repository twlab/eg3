import React, { Component } from "react";
interface HorizontalFragmentProps {
    relativeY?: number;
    xSpanList?: any[];
    height: number;
    segmentArray: any;
    strand: string;
    viewWindowStart: number;
    primaryColor: string;
    queryColor: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    rectHeight: number;
    relativeX: number;
}
declare class HorizontalFragment extends Component<HorizontalFragmentProps> {
    constructor(props: HorizontalFragmentProps);
    render(): import("react/jsx-runtime").JSX.Element;
}
export default HorizontalFragment;
