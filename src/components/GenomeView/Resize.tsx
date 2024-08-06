// useResizeObserver.ts
import { useEffect, useRef, useState } from "react";
import { ResizeObserver } from "@juggle/resize-observer";

function useResizeObserver(): {
  ref: React.RefObject<HTMLElement>;
  width: number;
  height: number;
} {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        // You can access entry.contentRect.width and entry.contentRect.height here
        setWidth(Math.floor(entry.contentRect.width));
        setHeight(Math.floor(entry.contentRect.height));
      }
    });

    observer.observe(ref.current);

    return () => {
      observer.unobserve(ref.current!);
    };
  }, []);

  return { ref, width, height };
}

export default useResizeObserver;
