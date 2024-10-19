import { default as React } from 'react';
export declare function makeBaseNumberLookup(sequence: string, baseAtStart: number, isReverse?: boolean): number[];
interface AlignSeqData {
    alignment?: {
        [key: string]: any;
    };
    x: number;
    halfLength: number;
    target: string;
    query: string;
    basesPerPixel: number;
}
declare class AlignmentSequence extends React.Component<AlignSeqData> {
    /**
     * @inheritdoc
     */
    render(): import("react/jsx-runtime").JSX.Element;
}
export default AlignmentSequence;
