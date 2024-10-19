declare const useResizeObserver: () => readonly [import('react').MutableRefObject<HTMLDivElement | null>, {
    width: number;
    height: number;
}];
export default useResizeObserver;
