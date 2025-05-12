import React from "react";
/**
 * Box that contains feature details when an annotation is clicked.
 *
 * @author Silas Hsu
 */
interface FeatureDetailProps {
    feature: any;
    category: any;
    queryEndpoint: any;
}
declare class FeatureDetail extends React.PureComponent<FeatureDetailProps> {
    static propTypes: {
        feature: any;
        category: any;
        queryEndpoint: any;
    };
    render(): import("react/jsx-runtime").JSX.Element;
}
export default FeatureDetail;
