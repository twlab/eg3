import { default as React } from 'react';
/**
 * Renders a track subtype wrapped in necessary components, such as an error boundary.  All props passed to this
 * component are passed to the track subtype.
 *
 * @author Silas Hsu
 */
export class TrackHandle extends React.Component<any, any, any> {
    constructor(props: any);
    state: {
        component: any;
        options: any;
    };
    UNSAFE_componentWillReceiveProps(nextProps: any): void;
    getTrackSpecialization(props: any): {
        component: any;
        options: any;
    };
    render(): import("react/jsx-runtime").JSX.Element;
}
export default ReparentableHandle;
/**
 * Everything a TrackHandle is, except reparentable!
 *
 * @param {Object} props - props as specified by React
 * @return {JSX.Element} - track element
 * @see TrackHandle
 */
declare function ReparentableHandle(props: any): JSX.Element;
