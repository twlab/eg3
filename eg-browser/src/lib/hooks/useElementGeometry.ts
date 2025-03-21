import { useCallback, useEffect, useState } from 'react';

interface ElementGeometry {
    width: number;
    height: number;
    top: number;
    left: number;
    right: number;
    bottom: number;
}

export function useElementGeometry({
    shouldRespondToResize = true,
}: {
    shouldRespondToResize?: boolean;
} = {}) {
    const [ref, setRef] = useState<HTMLElement | null>(null);
    const [geometry, setGeometry] = useState<ElementGeometry>({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    });

    const handleResize = useCallback(() => {
        if (!ref) return;

        const rect = ref.getBoundingClientRect();
        setGeometry({
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
        });
    }, [ref]);

    useEffect(() => {
        if (!ref) return;

        let resizeObserver: ResizeObserver | null = null;

        if (shouldRespondToResize) {
            resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(ref);
        }

        handleResize();

        return () => {
            resizeObserver?.disconnect();
        };
    }, [ref, handleResize, shouldRespondToResize]);

    return { ref: setRef, ...geometry };
}
