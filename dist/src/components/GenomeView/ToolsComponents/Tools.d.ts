import { default as PropTypes } from 'prop-types';
export declare const Tools: {
    DRAG: {
        buttonContent: string;
        title: string;
        cursor: string;
    };
    REORDER: {
        buttonContent: string;
        title: string;
        cursor: string;
    };
    ZOOM_IN: {
        buttonContent: string;
        title: string;
        cursor: string;
    };
    HIGHLIGHT: {
        buttonContent: string;
        title: string;
        cursor: string;
    };
};
interface ToolButtonsProps {
    selectedTool: any;
    onToolClicked: any;
    allTools: any;
}
export declare function ToolButtons(props: ToolButtonsProps): import("react/jsx-runtime").JSX.Element;
export declare namespace ToolButtons {
    var propTypes: {
        selectedTool: PropTypes.Requireable<{
            buttonContent: string;
            title: string;
            cursor: string;
        } | {
            buttonContent: string;
            title: string;
            cursor: string;
        } | {
            buttonContent: string;
            title: string;
            cursor: string;
        } | {
            buttonContent: string;
            title: string;
            cursor: string;
        }>;
        onToolClicked: PropTypes.Validator<(...args: any[]) => any>;
    };
}
export {};
