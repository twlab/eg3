import { default as PropTypes } from 'prop-types';
import { default as React } from 'react';
import { default as Feature } from '../../../../models/Feature';
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
        feature: PropTypes.Validator<Feature>;
        category: PropTypes.Requireable<object>;
        queryEndpoint: PropTypes.Requireable<object>;
    };
    render(): import("react/jsx-runtime").JSX.Element;
}
export default FeatureDetail;
