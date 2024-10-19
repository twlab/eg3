import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
export default MetadataHeader;
declare class MetadataHeader extends React.PureComponent<any, any, any> {
    static propTypes: {
        terms: PropTypes.Requireable<(string | null | undefined)[]>;
        onNewTerms: PropTypes.Requireable<(...args: any[]) => any>;
        suggestedMetaSets: PropTypes.Requireable<Set<unknown>>;
    };
    static defaultProps: {
        terms: never[];
        onNewTerms: () => undefined;
    };
    constructor(props: any);
    state: {
        isShowingEditMenu: boolean;
    };
    render(): import("react/jsx-runtime").JSX.Element;
}
