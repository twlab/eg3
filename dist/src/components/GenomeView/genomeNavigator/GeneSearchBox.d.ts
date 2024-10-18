import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
export default GeneSearchBox;
/**
 * A box that accepts gene name queries, and gives suggestions as well.
 *
 * @author Daofeng Li and Silas Hsu
 */
declare class GeneSearchBox extends React.PureComponent<any, any, any> {
    static propTypes: {
        navContext: PropTypes.Validator<any>;
        /**
         * Called when the user chooses a gene and wants to go to it in the nav context.  Signature:
         *     (newStart: number, newEnd: number): void
         *         `newStart`: the nav context coordinate of the start of the view interval
         *         `newEnd`: the nav context coordinate of the end of the view interval
         */
        onRegionSelected: PropTypes.Validator<(...args: any[]) => any>;
        handleCloseModal: PropTypes.Validator<(...args: any[]) => any>;
        onToggleHighlight: PropTypes.Requireable<(...args: any[]) => any>;
        doHighlight: PropTypes.Requireable<boolean>;
    };
    constructor(props: any);
    constructor(props: any, context: any);
    /**
     * @param {Gene} gene
     */
    setViewToGene: (gene: Gene) => void;
    render(): import("react/jsx-runtime").JSX.Element;
}
