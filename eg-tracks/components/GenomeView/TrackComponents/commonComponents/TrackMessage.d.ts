import React from "react";
/**
 * A message in a <p> that says "x items too small - zoom in to view".
 *
 * @param {Object} props - props as specified by React
 * @return {JSX.Element} - message to render
 * @author Silas Hsu
 */
export declare function HiddenItemsMessage(props: any): import("react/jsx-runtime").JSX.Element | null;
export declare namespace HiddenItemsMessage {
    var propTypes: {
        numHidden: any;
    };
}
export declare function HiddenImagesMessage(props: any): import("react/jsx-runtime").JSX.Element | null;
export declare namespace HiddenImagesMessage {
    var propTypes: {
        numHidden: any;
    };
}
export declare class TrackMessage extends React.PureComponent {
    static propTypes: {
        message: any;
        style: any;
    };
    constructor(props: any);
    /**
     * Re-shows the message every time it changes.
     */
    UNSAFE_componentWillReceiveProps(nextProps: any): void;
    render(): import("react/jsx-runtime").JSX.Element | null;
}
export default TrackMessage;
