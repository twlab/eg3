import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../lib/redux/hooks";
import {
  setWidth as setTabWidth,
  setHeight as setTabHeight,
  selectTabPanelWidth,
  selectTabPanelHeight,
} from "../../../lib/redux/slices/tabPanelSlice";

interface ResizablePanelProps {
  title?: string;
  initialWidth?: number | string;
  initialHeight?: number | string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  onClose?: () => void;
  children?: React.ReactNode;
}

export default function ResizablePanel(props: ResizablePanelProps) {
  const {
    title,
    initialWidth = 300,
    initialHeight = 325,
    minWidth = 300,
    maxWidth,
    minHeight = 200,
    maxHeight,
    onClose,
    children,
  } = props;

  const panelRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number | string>(initialWidth);
  const [height, setHeight] = useState<number | string>(initialHeight);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [headerHover, setHeaderHover] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragState = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const resizeState = useRef<{
    resizing: boolean;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  const dispatch = useAppDispatch();
  const sliceWidth = useAppSelector(selectTabPanelWidth);
  const sliceHeight = useAppSelector(selectTabPanelHeight);

  const THROTTLE_MS = 1000; // throttle before dispatching
  const DIFF_THRESHOLD = 15;
  const lastDispatchRef = useRef<number>(0);
  const pendingRef = useRef<{ w?: number; h?: number } | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const latestSliceRef = useRef({ w: sliceWidth, h: sliceHeight });
  // preview during drag: don't update React state on every pointermove
  const pendingPreviewRef = useRef<{ w?: number; h?: number } | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    latestSliceRef.current = { w: sliceWidth, h: sliceHeight };
  }, [sliceWidth, sliceHeight]);

  const flushPending = () => {
    const pending = pendingRef.current;
    if (!pending) return;

    const { w, h } = pending;

    if (typeof w === "number") {
      if (Math.abs(w - latestSliceRef.current.w) >= DIFF_THRESHOLD) {
        dispatch(setTabWidth(Math.round(w)));
        latestSliceRef.current.w = Math.round(w);
      }
    }

    if (typeof h === "number") {
      if (Math.abs(h - latestSliceRef.current.h) >= DIFF_THRESHOLD) {
        dispatch(setTabHeight(Math.round(h)));
        latestSliceRef.current.h = Math.round(h);
      }
    }

    pendingRef.current = null;
    lastDispatchRef.current = Date.now();
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const scheduleDispatch = (w: number, h: number) => {
    const now = Date.now();
    const since = now - lastDispatchRef.current;
    pendingRef.current = { ...(pendingRef.current || {}), w, h };

    if (since >= THROTTLE_MS) {
      flushPending();
      return;
    }

    if (!timeoutRef.current) {
      timeoutRef.current = window.setTimeout(() => {
        flushPending();
      }, THROTTLE_MS - since) as unknown as number;
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  // Ghost overlay helpers: lightweight DOM element updated via rAF
  const createGhost = (left: number, top: number, w: number, h: number) => {
    if (ghostRef.current) return;
    const el = document.createElement("div");
    // Use fixed positioning so the ghost doesn't change document flow/height
    el.style.position = "fixed";
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      el.style.left = `${Math.round(rect.left)}px`;
      el.style.top = `${Math.round(rect.top)}px`;
    } else {
      el.style.left = `0px`;
      el.style.top = `0px`;
    }
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.style.border = "2px dashed rgba(31,111,255,0.7)";
    el.style.background = "rgba(31,111,255,0.12)";
    el.style.transition =
      "width 80ms linear, height 80ms linear, left 80ms linear, top 80ms linear";
    el.style.zIndex = "900";
    el.style.pointerEvents = "none";
    el.style.zIndex = "9999";
    el.style.boxSizing = "border-box";
    document.body.appendChild(el);
    ghostRef.current = el;
  };

  const updateGhost = (w: number, h: number) => {
    const el = ghostRef.current;
    if (!el || !panelRef.current) return;
    // position ghost relative to viewport using panel rect so it won't be clipped
    const rect = panelRef.current.getBoundingClientRect();
    el.style.left = `${Math.round(rect.left)}px`;
    el.style.top = `${Math.round(rect.top)}px`;
    el.style.width = `${Math.round(w)}px`;
    el.style.height = `${Math.round(h)}px`;
  };

  const removeGhost = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (ghostRef.current) {
      try {
        document.body.removeChild(ghostRef.current);
      } catch (e) {}
      ghostRef.current = null;
    }
    pendingPreviewRef.current = null;
  };

  const scheduleGhostUpdate = (w: number, h: number) => {
    pendingPreviewRef.current = { ...(pendingPreviewRef.current || {}), w, h };
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const p = pendingPreviewRef.current;
      if (p && typeof p.w === "number" && typeof p.h === "number")
        updateGhost(p.w, p.h);
    });
  };

  // Watch local width/height state and schedule throttled slice updates
  useEffect(() => {
    const numericW = parseSizeToNumber(width, 0);
    const numericH = parseSizeToNumber(height, 0);
    scheduleDispatch(numericW, numericH);
  }, [width, height]);

  // helper to convert sizes like '70vh' to pixels
  const parseSizeToNumber = (val: number | string, fallback: number) => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      if (val.endsWith("vh")) {
        const n = parseFloat(val.replace("vh", ""));
        if (!isNaN(n)) return (n / 100) * window.innerHeight;
      }
      const n = parseFloat(val);
      if (!isNaN(n)) return n;
    }
    return fallback;
  };

  useEffect(() => {
    const onPointerMove = (ev: PointerEvent) => {
      if (dragState.current?.dragging) {
        const dx = ev.clientX - dragState.current.startX;
        const dy = ev.clientY - dragState.current.startY;
        setTranslate({
          x: dragState.current.origX + dx,
          y: dragState.current.origY + dy,
        });
      }
      if (resizeState.current?.resizing) {
        const dx = ev.clientX - resizeState.current.startX;
        const dy = ev.clientY - resizeState.current.startY;
        let newW = resizeState.current.startW + dx;
        let newH = resizeState.current.startH + dy;
        // enforce minimums only; allow unlimited maximum unless provided
        newW = Math.max(minWidth, newW);
        newH = Math.max(minHeight, newH);
        // update a lightweight ghost preview instead of React state to avoid reflow churn
        scheduleGhostUpdate(newW, newH);
        pendingPreviewRef.current = { w: newW, h: newH };
      }
    };

    const onPointerUp = () => {
      if (dragState.current) dragState.current.dragging = false;
      if (resizeState.current && resizeState.current.resizing) {
        // finalize previewed size (if any)
        const p = pendingPreviewRef.current;
        if (p && typeof p.w === "number" && typeof p.h === "number") {
          // apply final sizes to React state
          setWidth(Math.round(p.w));
          setHeight(Math.round(p.h));
          // schedule immediate dispatch by setting pendingRef and flushing
          pendingRef.current = { w: Math.round(p.w), h: Math.round(p.h) };
          flushPending();
        }
        // clean up preview
        removeGhost();
        setIsResizing(false);
        resizeState.current.resizing = false;
      }
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, [minWidth, maxWidth, minHeight, maxHeight]);

  const onHeaderPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: translate.x,
      origY: translate.y,
    };
  };

  const onResizePointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const numericW = parseSizeToNumber(width, 680);
    const numericH = parseSizeToNumber(height, 680);
    resizeState.current = {
      resizing: true,
      startX: e.clientX,
      startY: e.clientY,
      startW: numericW,
      startH: numericH,
    };
    // create a lightweight ghost overlay so dragging doesn't cause React re-renders
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) createGhost(rect.left, rect.top, numericW, numericH);
    setIsResizing(true);
  };

  const panelStyle: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    transform: `translate(${translate.x}px, ${translate.y}px)`,
    position: "relative",
    background: isResizing ? "transparent" : "var(--bg, white)",
    color: "var(--text, #111827)",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    minWidth: 0,
    borderRadius: 5,
    overflow: "hidden",
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
    zIndex: 1000,
  };

  const headerBg = headerHover
    ? "linear-gradient(180deg, rgba(60,140,200,0.72), rgba(60,140,200,0.22))"
    : "linear-gradient(180deg, rgba(31, 169, 255, 0.56), rgba(135,206,250,0.14))";

  const headerBorder = headerHover
    ? "1px solid rgba(255,255,255,0.28)"
    : "1px solid rgba(255,255,255,0.36)";

  const contentStyle: React.CSSProperties = {
    // padding: 12,
    minWidth: 0,
    opacity: isResizing ? 0.5 : 1,
    transition: "opacity 120ms linear",
    pointerEvents: isResizing ? "none" : undefined,
    willChange: "opacity",
  };

  return (
    <div
      ref={panelRef}
      style={panelStyle}
      className="shadow-lg border dark:border-gray-700 bg-white dark:bg-dark-background"
    >
      <div
        className="flex items-center justify-between px-4 py-2 relative transition-all"
        style={{
          paddingTop: 2,
          paddingBottom: 2,
          cursor: "move",
          userSelect: "none",
          touchAction: "none",
          background: headerBg,
          borderBottom: headerBorder,
          backdropFilter: headerHover
            ? "blur(10px) saturate(150%)"
            : "blur(8px) saturate(130%)",
          WebkitBackdropFilter: headerHover
            ? "blur(10px) saturate(150%)"
            : "blur(8px) saturate(130%)",
        }}
        onPointerDown={onHeaderPointerDown}
        onMouseEnter={() => setHeaderHover(true)}
        onMouseLeave={() => setHeaderHover(false)}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 12,
            pointerEvents: "none",
            borderTopLeftRadius: 5,
            borderTopRightRadius: 5,
            background: headerHover
              ? "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0))"
              : "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0))",
          }}
        />

        <div className="flex items-center">
          <div className="text-md text-gray-900 dark:text-white">
            {title ? title.charAt(0).toUpperCase() + title.slice(1) : title}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-200">
            Press{" "}
            <kbd
              className="px-1 font-mono"
              style={{
                backgroundColor: "var(--foreground)",
                color: "var(--background)",
                opacity: 0.7,
              }}
            >
              Esc
            </kbd>{" "}
            to close or
          </span>
          <button
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
            className="px-1 rounded transition-colors bg-red-100 text-red-700 hover:bg-red-600 hover:text-white dark:bg-red-800/30 dark:text-red-200 dark:hover:bg-red-700 dark:hover:text-white"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto" style={contentStyle}>
        {children}
      </div>
      <div
        onPointerDown={onResizePointerDown}
        className="absolute bottom-3 right-10 w-6 h-6 bg-transparent cursor-se-resize"
        style={{ touchAction: "none" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="25px"
          height="25px"
          viewBox="0 0 18 18"
          mirror-in-rtl="true"
        >
          <path
            fill="#494c4e"
            d="M14.228 16.227a1 1 0 0 1-.707-1.707l1-1a1 1 0 0 1 1.416 1.414l-1 1a1 1 0 0 1-.707.293zm-5.638 0a1 1 0 0 1-.707-1.707l6.638-6.638a1 1 0 0 1 1.416 1.414l-6.638 6.638a1 1 0 0 1-.707.293zm-5.84 0a1 1 0 0 1-.707-1.707L14.52 2.043a1 1 0 1 1 1.415 1.414L3.457 15.934a1 1 0 0 1-.707.293z"
          />
        </svg>
      </div>
    </div>
  );
}
