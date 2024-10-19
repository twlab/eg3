import { default as React } from 'react';
export default History;
declare class History extends React.Component<any, any, any> {
    constructor();
    state: {
        showModal: boolean;
    };
    handleOpenModal(): void;
    handleCloseModal(): void;
    renderHistory(): import("react/jsx-runtime").JSX.Element;
    render(): import("react/jsx-runtime").JSX.Element;
}
