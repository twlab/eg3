import { default as React } from 'react';
import { default as PropTypes } from 'prop-types';
export default TrackRegionController;
/**
 * The display that is above the main pane of the genome navigator, which shows the current track region and a text
 * input to modify it.
 *
 * @author Silas Hsu
 */
declare class TrackRegionController extends React.Component<any, any, any> {
    static propTypes: {
        selectedRegion: PropTypes.Validator<any>;
        /**
         * Called when the user types a region to go to and it is successfully parsed.  Has the signature
         *     (newStart: number, newEnd: number): void
         *         `newStart`: the nav context coordinate of the start of the interval
         *         `newEnd`: the nav context coordinate of the end of the interval
         */
        onRegionSelected: PropTypes.Validator<(...args: any[]) => any>;
        onNewHighlight: PropTypes.Requireable<(...args: any[]) => any>;
    };
    constructor(props: any);
    input: HTMLInputElement | null;
    state: {
        badInputMessage: string;
        showModal: boolean;
        doHighlight: boolean;
    };
    handleOpenModal(): void;
    handleCloseModal(): void;
    /**
     * Parses user input that expresses a desired region for tracks to display.
     */
    parseRegion(): void;
    keyPress(e: any): void;
    handleHighlightToggle: () => void;
    /**
     * @inheritdoc
     */
    render(): import("react/jsx-runtime").JSX.Element;
}
