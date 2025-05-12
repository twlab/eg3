import type { ReactNode } from "react";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { SortableItem } from "./SortableItem";
interface BaseItem {
    id: UniqueIdentifier;
}
interface Props<T extends BaseItem> {
    items: T[];
    onChange(items: T[]): void;
    renderItem(item: T): ReactNode;
    selectedTracks?: any;
}
export declare function SortableList<T extends BaseItem>({ items, onChange, renderItem, selectedTracks }: Props<T>): import("react/jsx-runtime").JSX.Element;
export declare namespace SortableList {
    var Item: typeof SortableItem;
}
export {};
