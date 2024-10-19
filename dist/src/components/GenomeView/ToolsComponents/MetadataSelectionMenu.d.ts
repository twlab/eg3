import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
export default MetadataSelectionMenu;
/**
 * Menu that selects metadata terms to be used in our track metadata indicators.
 *
 * @author Silas Hsu
 */
declare class MetadataSelectionMenu extends React.PureComponent<any, any, any> {
    static propTypes: {
        terms: PropTypes.Requireable<(string | null | undefined)[]>;
        style: PropTypes.Requireable<object>;
        onNewTerms: PropTypes.Requireable<(...args: any[]) => any>;
        suggestedMetaSets: PropTypes.Requireable<Set<unknown>>;
    };
    static defaultProps: {
        terms: never[];
        onNewTerms: () => undefined;
    };
    constructor(props: any);
    state: {
        customTerm: string;
    };
    /**
     * Handles request to add a custom metadata term.
     */
    handleAddCustomTerm(): void;
    /**
     * Requests that an additional metadata term be added to the UI
     *
     * @param {string} term - term to add
     */
    addTerm(term: string): void;
    /**
     * Requests that a metadata term be removed from the UI.
     *
     * @param {string} termToRemove
     */
    removeTerm(termToRemove: string): void;
    /**
     * @return {JSX.Element} UI that displays list of currently displayed terms
     */
    renderTerms(): JSX.Element;
    /**
     * @return {JSX.Element} UI that displays list of suggested terms to add
     */
    renderSuggestedTerms(): JSX.Element;
    render(): import("react/jsx-runtime").JSX.Element;
}
