import React, { useEffect, useRef, useState } from "react";
import {
  ChevronLeftIcon,
  XMarkIcon,
  LockClosedIcon,
  LockOpenIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../../lib/redux/hooks";
import {
  setWidth as setTabWidth,
  setHeight as setTabHeight,
  selectTabPanelWidth,
  selectTabPanelHeight,
} from "../../../lib/redux/slices/tabPanelSlice";
import {
  selectExpandNavigationTab,
  selectMidSizeNavigationTab,
} from "../../../lib/redux/slices/navigationSlice";

interface ResizablePanelProps {
  title?: string;
  initialWidth?: number | string;
  initialHeight?: number | string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  onClose?: () => void;
  onIncrement?: () => void;
  onPinChange?: (pinned: boolean) => void;
  children?: React.ReactNode;
  navigationPath: Array<any>;
  header?: boolean;
  excludeRefs?: React.RefObject<HTMLElement | null>[];
}

export default function ResizablePanel(props: ResizablePanelProps) {
  const {
    title,
    initialWidth,
    initialHeight,
    minWidth = 250,
    maxWidth,
    minHeight = 250,
    maxHeight,
    onClose,
    navigationPath,
    children,
    header,
    excludeRefs,
  } = props;

  const panelRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number | string>(initialWidth as number);
  const [height, setHeight] = useState<number | string>(
    initialHeight as number,
  );
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [headerHover, setHeaderHover] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [pinned, setPinned] = useState(false);

  const togglePin = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
    setPinned((prev) => {
      const next = !prev;
      props.onPinChange?.(next);
      return next;
    });
  };

  const dragState = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    naturalLeft: number;
    naturalTop: number;
    panelWidth: number;
    panelHeight: number;
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
  const expandNavigationTab = useAppSelector(selectExpandNavigationTab);
  const midSizeNavTab = useAppSelector(selectMidSizeNavigationTab);
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

  // Close on outside click when not pinned
  useEffect(() => {
    if (!onClose) return;
    const handleOutsideClick = (e: PointerEvent) => {
      if (pinned) return;
      if (excludeRefs?.some((r) => r.current?.contains(e.target as Node))) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [pinned, onClose, excludeRefs]);

  // overlay helpers: lightweight DOM element updated via rAF
  const createGhost = (left: number, top: number, w: number, h: number) => {
    if (ghostRef.current) return;
    const el = document.createElement("div");
    // we use ghost so that it doesn't re-render on every drag resize only when user let go
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
    el.style.background = "rgba(255, 255, 255, 0.8)";
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
      } catch (e) { }
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

  // when navigation tab expands, need bigger panel for content
  useEffect(() => {
    if (expandNavigationTab) {

      const windowSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      const numericInitialW = typeof initialWidth === "number" ? initialWidth : parseSizeToNumber(initialWidth as string, 0);
      const numericInitialH = typeof initialHeight === "number" ? initialHeight : parseSizeToNumber(initialHeight as string, 0);
      const numericWidth = parseSizeToNumber(width, 0);
      const numericHeight = parseSizeToNumber(height, 0);
      const defaultW = Math.round(windowSize.width * 0.6);
      const defaultH = Math.round(windowSize.height * 0.9);
      const altW = Math.round(windowSize.width * 0.4);
      const altH = Math.round(windowSize.height * 0.75);

      let newW = numericWidth !== numericInitialW && numericWidth !== altW ? numericWidth : defaultW;
      let newH = numericHeight !== numericInitialH && numericHeight !== altH ? numericHeight : defaultH;
      newW = Math.max(numericInitialW, newW);
      newH = Math.max(numericInitialH, newH);
      // store current translate/size so we can restore on collapse

      // If the new size would overflow the right or bottom edge, shift until back in view — clamped to (0,0)
      const rectExpand = panelRef.current?.getBoundingClientRect();
      if (rectExpand) {
        const numericNewW = typeof newW === "number" ? newW : parseSizeToNumber(newW as string, 0);
        const numericNewH = typeof newH === "number" ? newH : parseSizeToNumber(newH as string, 0);
        const projectedRight = rectExpand.left + numericNewW;
        const projectedBottom = rectExpand.top + numericNewH;
        let dx = 0;
        let dy = 0;
        if (projectedRight > windowSize.width) {
          const overflow = projectedRight - windowSize.width;
          dx = -Math.min(overflow, rectExpand.left)
          // - 20; // can't move left past viewport left edge
        }
        if (projectedBottom > windowSize.height) {
          const overflow = projectedBottom - windowSize.height;
          dy = -Math.min(overflow, rectExpand.top); // can't move up past viewport top edge
        }
        if (dx !== 0 || dy !== 0) {
          setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        }
      }

      setWidth(newW);
      setHeight(newH);

      // center the panel when opening for the first time
      // const rect = panelRef.current?.getBoundingClientRect();
      // if (
      //   rect &&
      //   !dragState.current?.dragging &&
      //   !resizeState.current?.resizing
      // ) {
      //   const desiredLeft = (window.innerWidth - Number(newW)) / 2;
      //   // const desiredTop = (window.innerHeight - newH) / 2;
      //   const deltaX = Math.round(desiredLeft - rect.left);

      //   const deltaY = Math.round(-rect.top); // 36 for navbar height
      //   setTranslate((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      // }
    } else if (midSizeNavTab) {
      const windowSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      const numericInitialW = typeof initialWidth === "number" ? initialWidth : parseSizeToNumber(initialWidth as string, 0);
      const numericInitialH = typeof initialHeight === "number" ? initialHeight : parseSizeToNumber(initialHeight as string, 0);
      const numericWidth = parseSizeToNumber(width, 0);
      const numericHeight = parseSizeToNumber(height, 0);
      const defaultW = Math.round(windowSize.width * 0.4);
      const defaultH = Math.round(windowSize.height * 0.75);
      const altW = Math.round(windowSize.width * 0.6);
      const altH = Math.round(windowSize.height * 0.9);

      let newW = numericWidth !== numericInitialW && numericWidth !== altW ? numericWidth : defaultW;
      let newH = numericHeight !== numericInitialH && numericHeight !== altH ? numericHeight : defaultH;
      newW = Math.max(numericInitialW, newW);
      newH = Math.max(numericInitialH, newH);
      // store current translate/size so we can restore on collapse


      // If the new size would overflow the right or bottom edge, shift until back in view — clamped to (0,0)
      const rectMid = panelRef.current?.getBoundingClientRect();
      if (rectMid) {
        const numericNewW = typeof newW === "number" ? newW : parseSizeToNumber(newW as string, 0);
        const numericNewH = typeof newH === "number" ? newH : parseSizeToNumber(newH as string, 0);
        const projectedRight = rectMid.left + numericNewW;
        const projectedBottom = rectMid.top + numericNewH;
        let dx = 0;
        let dy = 0;
        if (projectedRight > windowSize.width) {
          const overflow = projectedRight - windowSize.width;
          dx = -Math.min(overflow, rectMid.left)
          // - 20; // can't move left past viewport left edge
        }
        if (projectedBottom > windowSize.height) {
          const overflow = projectedBottom - windowSize.height;
          dy = -Math.min(overflow, rectMid.top); // can't move up past viewport top edge
        }
        if (dx !== 0 || dy !== 0) {
          setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        }
      }

      setWidth(newW);
      setHeight(newH);
    } else {
      // restore to initial sizes\
      const windowSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      const rectMid = panelRef.current?.getBoundingClientRect();
      if (rectMid) {
        const numericNewW = typeof initialWidth === "number" ? initialWidth : parseSizeToNumber(initialWidth as string, 0);
        const numericNewH = typeof initialHeight === "number" ? initialHeight : parseSizeToNumber(initialHeight as string, 0);
        const projectedRight = rectMid.left + numericNewW;
        const projectedBottom = rectMid.top + numericNewH;
        let dx = 0;
        let dy = 0;
        if (projectedRight > windowSize.width) {
          const overflow = projectedRight - windowSize.width;
          dx = -Math.min(overflow, rectMid.left)
          // - 20; // can't move left past viewport left edge
        }
        if (projectedBottom > windowSize.height) {
          const overflow = projectedBottom - windowSize.height;
          dy = -Math.min(overflow, rectMid.top); // can't move up past viewport top edge
        }
        if (dx !== 0 || dy !== 0) {
          setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        }
      }
      setWidth(Number(initialWidth));
      setHeight(Number(initialHeight));
      // reset tab selection to navbar when using back button
      // if (
      //   preExpandRef.current &&
      //   !dragState.current?.dragging &&
      //   !resizeState.current?.resizing
      // ) {
      //   setTranslate(preExpandRef.current.translate);
      // }
      // preExpandRef.current = null;
    }
  }, [expandNavigationTab, midSizeNavTab]);

  useEffect(() => {
    const onPointerMove = (ev: PointerEvent) => {
      if (dragState.current?.dragging) {
        const dx = ev.clientX - dragState.current.startX;
        const dy = ev.clientY - dragState.current.startY;
        const {
          naturalLeft,
          naturalTop,
          panelWidth,
          panelHeight,
          origX,
          origY,
        } = dragState.current;
        // Left/right: at most 80% of panel width can go off-screen
        const minX = -naturalLeft - panelWidth * 0.8;
        const maxX = window.innerWidth - naturalLeft - panelWidth * 0.2;
        // Top: hard stop at window top; Bottom: at most 80% of panel height can go off-screen
        const minY = -naturalTop;
        const maxY = window.innerHeight - naturalTop - panelHeight * 0.2;
        setTranslate({
          x: Math.max(minX, Math.min(maxX, origX + dx)),
          y: Math.max(minY, Math.min(maxY, origY + dy)),
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
    const rect = panelRef.current?.getBoundingClientRect();
    const pw = rect ? rect.width : parseSizeToNumber(width, 300);
    const ph = rect ? rect.height : parseSizeToNumber(height, 300);
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: translate.x,
      origY: translate.y,
      naturalLeft: rect ? rect.left - translate.x : 0,
      naturalTop: rect ? rect.top - translate.y : 0,
      panelWidth: pw,
      panelHeight: ph,
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
    pointerEvents: "auto",
    background: isResizing ? "transparent" : undefined,
    color: "var(--text, #111827)",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    minWidth: 0,
    borderRadius: 5,
    overflow: "hidden",
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
  };

  const headerBg = headerHover
    ? "linear-gradient(180deg, rgba(60,140,200,0.72), rgba(60,140,200,0.22))"
    : "linear-gradient(180deg, rgba(31, 169, 255, 0.56), rgba(135,206,250,0.14))";


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
      style={{ ...panelStyle, zIndex: 51 }}
      className="shadow-lg bg-white dark:bg-dark-background"
    >
      <div
        className="flex items-center justify-between px-2 relative transition-all"
        style={{
          // paddingTop: 1,
          // paddingBottom: 1,
          cursor: "move",
          userSelect: "none",
          touchAction: "none",
          background: headerBg,

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
            height: 8,
            pointerEvents: "none",
            borderTopLeftRadius: 5,
            borderTopRightRadius: 5,
            background: headerHover
              ? "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0))"
              : "linear-gradient(180deg, rgba(255,255,255,0.90), rgba(255,255,255,0))",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {navigationPath.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                props.onIncrement?.();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 rounded-full hover:bg-blue-600 hover:text-white dark:hover:bg-blue-800/60 dark:text-blue-200 transition-colors"
              title="Increment counter"
              aria-label="Back"
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            ""
          )}
          <div className="flex items-center">
            <strong className="text-md text-gray-900 dark:text-dark-primary font-semibold">
              {title ? title.charAt(0).toUpperCase() + title.slice(1) : title}

              {navigationPath.length > 0 &&
                navigationPath[navigationPath.length - 1]?.path
                ? ` / ${String(navigationPath[navigationPath.length - 1].path)
                  .split("-")
                  .map((s) =>
                    s ? s.charAt(0).toUpperCase() + s.slice(1) : s,
                  )
                  .join(" ")}`
                : ""}
            </strong>
          </div>
        </div>
        {header ? <div className="flex items-center gap-1">
          <span className="text-sm text-gray-700 dark:text-dark-primary">
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
            to close
          </span>

          <button
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Close"
            title="Close"
            className="rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-700 transition-colors duration-150"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div> : <div style={{
          height: 8,

        }}></div>}

      </div>
      <div className="flex-1 overflow-auto" style={contentStyle}>
        {children}
      </div>
      <div className="flex flex-row items-center justify-between mt-auto bg-[rgb(237,242,246)] dark:bg-dark-surface">
        {/* Pin toggle — Switch-style pill */}
        <div
          role="button"
          aria-pressed={pinned}
          title={
            pinned
              ? "Pinned: outside clicks won't close"
              : "Click to pin (prevent outside-click close)"
          }
          onClick={togglePin}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center cursor-pointer transition-colors duration-300 ml-2"
          style={{
            width: 40,
            height: 22,
            borderRadius: 11,
            padding: 2,
            backgroundColor: pinned ? "#3b82f6" : "#d1d5db",
            flexShrink: 0,

          }}
        >
          <div
            className="flex items-center justify-center transition-all duration-300"
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              backgroundColor: "white",
              transform: pinned ? "translateX(18px)" : "translateX(0px)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            {pinned ? (
              <LockClosedIcon
                style={{ width: 10, height: 10, color: "#3b82f6" }}
              />
            ) : (
              <LockOpenIcon
                style={{ width: 10, height: 10, color: "#9ca3af" }}
              />
            )}
          </div>
        </div>

        <div
          onPointerDown={onResizePointerDown}
          className="rounded cursor-se-resize flex items-center justify-center"
          style={{
            touchAction: "none",
            height: 22,
            width: 27,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 18 18"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              className="text-gray-500 dark:text-gray-400"
              d="M14.228 16.227a1 1 0 0 1-.707-1.707l1-1a1 1 0 0 1 1.416 1.414l-1 1a1 1 0 0 1-.707.293zm-5.638 0a1 1 0 0 1-.707-1.707l6.638-6.638a1 1 0 0 1 1.416 1.414l-6.638 6.638a1 1 0 0 1-.707.293zm-5.84 0a1 1 0 0 1-.707-1.707L14.52 2.043a1 1 0 1 1 1.415 1.414L3.457 15.934a1 1 0 0 1-.707.293z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
