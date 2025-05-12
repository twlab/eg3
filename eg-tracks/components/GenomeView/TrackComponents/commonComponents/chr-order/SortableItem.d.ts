import React from "react";
import type { PropsWithChildren } from "react";
import type { UniqueIdentifier } from "@dnd-kit/core";
interface Props {
    id: UniqueIdentifier;
    onMouseDown?: React.MouseEventHandler<HTMLDivElement>;
    onContextMenu?: React.MouseEventHandler<HTMLDivElement>;
    selectedTool: any;
}
export declare function SortableItem({ children, id, onMouseDown, onContextMenu, selectedTool, }: PropsWithChildren<Props>): import("react/jsx-runtime").JSX.Element;
export {};
