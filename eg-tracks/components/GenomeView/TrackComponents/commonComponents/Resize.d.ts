/// <reference types="react" />
declare const useResizeObserver: () => readonly [import("react").RefObject<HTMLDivElement | null>, {
    width: number;
    height: number;
}];
export default useResizeObserver;
