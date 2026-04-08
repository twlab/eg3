import { useEffect, useRef, useState } from "react";
import { ResizeObserver } from "@juggle/resize-observer";
import { debounce } from "lodash";

const useResizeObserver = () => {
  const [size, setSize] = useState({ width: window.innerWidth, height: 0 });
  const ref = useRef<HTMLDivElement | null>(null);
  const prevSize = useRef({ width: window.innerWidth, height: 0 });

  useEffect(() => {
    const handleResize = debounce((entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;

        // Only update size if the change is significant (e.g., exclude scrollbar adjustments)
        if (Math.abs(width - prevSize.current.width) > 50) {
          setSize({ width: width, height: prevSize.current.height });
          prevSize.current = { width: width, height: prevSize.current.height };
        }

        if (Math.abs(height - prevSize.current.height) > 10) {
          setSize({ width: prevSize.current.width, height: height });
          prevSize.current = { width: prevSize.current.width, height: height };
        }
      }
    }, 400); // Adjust debounce delay as needed

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
