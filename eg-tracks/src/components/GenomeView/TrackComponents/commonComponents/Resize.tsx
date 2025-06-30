import { useEffect, useRef, useState } from "react";
import { ResizeObserver } from "@juggle/resize-observer";
import { debounce } from "lodash";

const useResizeObserver = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const ref = useRef<HTMLDivElement | null>(null);
  const prevSize = useRef({ width: 0, height: 0 });
  const initialWidth = useRef(true);
  const initialHeight = useRef(true);

  useEffect(() => {
    const handleResize = debounce((entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;

        // Only update size if the change is significant (e.g., exclude scrollbar adjustments)
        if (
          initialWidth.current ||
          Math.abs(width - prevSize.current.width) > 50
        ) {
          setSize({ width, height: prevSize.current.height });
          prevSize.current = { width, height: prevSize.current.height };
          initialWidth.current = false;
        }
      }
    }, 500); // Adjust debounce delay as needed

    const observer = new ResizeObserver(handleResize as any);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
      handleResize.cancel();
    };
  }, []);

  return [ref, size] as const;
};

export default useResizeObserver;
