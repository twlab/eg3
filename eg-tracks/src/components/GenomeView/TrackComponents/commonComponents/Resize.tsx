import { useEffect, useRef, useState } from "react";
import { ResizeObserver } from "@juggle/resize-observer";
import { debounce } from "lodash";

const useResizeObserver = () => {
  const [size, setSize] = useState({ width: window.innerWidth - 20, height: 0 });
  const ref = useRef<HTMLDivElement | null>(null);
  const prevSize = useRef({ width: window.innerWidth - 20, height: 0 });


  useEffect(() => {
    const handleResize = debounce((entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;

        const roundWidth = Math.floor(width);
        // Only update size if the change is significant (e.g., exclude scrollbar adjustments)
        if (

          Math.abs(roundWidth - prevSize.current.width) > 50
        ) {

          setSize({ width: roundWidth, height: prevSize.current.height });
          prevSize.current = { width: roundWidth, height: prevSize.current.height };

        }
        const roundHeight = Math.floor(height);
        if (
          Math.abs(roundHeight - prevSize.current.height) > 25
        ) {
          setSize({ width: prevSize.current.width, height: roundHeight });
          prevSize.current = { width: prevSize.current.width, height: roundHeight };

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
