import React, { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../../lib/redux/hooks";
import {
  setWidth as setTabWidth,
  setHeight as setTabHeight,
  selectTabPanelWidth,
  selectTabPanelHeight,
} from "../../../lib/redux/slices/tabPanelSlice";
import { selectExpandNavigationTab, selectMidSizeNavigationTab } from "../../../lib/redux/slices/navigationSlice";

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
  children?: React.ReactNode;
  navigationPath: Array<any>;
  overlay?: boolean;
  panelOpen?: boolean;
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
    onClose, navigationPath,
    children
    ,
    overlay = false,
  } = props;

  const panelRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number | string>(initialWidth as number);
  const [height, setHeight] = useState<number | string>(initialHeight as number);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  // keep a mutable ref for translate to avoid re-renders during drag
  const translateRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
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
  const rafDragRef = useRef<number | null>(null);
  const pendingDragRef = useRef<{ x?: number; y?: number } | null>(null);
  const preExpandRef = useRef<{
    translate: { x: number; y: number };
    width: number | string;
    height: number | string;
  } | null>(null);

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
    const numericW = parseSizeToNumber(
      width,
      typeof width === "number"
        ? (width as number)
        : (initialWidth as number) || 300,
    );
    const numericH = parseSizeToNumber(
      height,
      typeof height === "number"
        ? (height as number)
        : (initialHeight as number) || 325,
    );
    if (expandNavigationTab) {

      // setWidth(Math.round(numericW * 4));
      // setHeight(Math.round(numericH * 2));
      const windowSize = { width: window.innerWidth, height: window.innerHeight };

      const newW = width !== initialWidth && width !== Math.round(windowSize.width * 0.5) ? width : Math.round(windowSize.width * 0.6);
      const newH = height !== initialHeight && height !== Math.round(windowSize.height * 0.7) ? height : Math.round(windowSize.height * 0.8);
      // store current translate/size so we can restore on collapse
      if (!preExpandRef.current) {
        preExpandRef.current = { translate: { ...translate }, width, height };
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
    }
    else if (midSizeNavTab) {

      const windowSize = { width: window.innerWidth, height: window.innerHeight };

      const newW = width !== initialWidth && width !== Math.round(windowSize.width * 0.6) ? width : Math.round(windowSize.width * 0.5);
      const newH = height !== initialHeight && height !== Math.round(windowSize.height * 0.8) ? height : Math.round(windowSize.height * 0.7);
      // store current translate/size so we can restore on collapse
      if (!preExpandRef.current) {
        preExpandRef.current = { translate: { ...translate }, width, height };
      }

      setWidth(newW);
      setHeight(newH);
    }

    else {
      // restore to initial sizes
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
          const newX = dragState.current.origX + dx;
          const newY = dragState.current.origY + dy;
          // update mutable ref and schedule a rAF to update DOM directly
          translateRef.current = { x: newX, y: newY };
          pendingDragRef.current = { x: newX, y: newY };
          if (!rafDragRef.current) {
            rafDragRef.current = requestAnimationFrame(() => {
              rafDragRef.current = null;
              const p = pendingDragRef.current;
              if (p && panelRef.current) {
                // apply transform directly to DOM for immediate feedback
                const numericW = parseSizeToNumber(width, 0);
                const externalOffsetX =
                  typeof props.panelOpen === "boolean" && props.panelOpen === false
                    ? -(numericW + 24)
                    : 0;
                panelRef.current.style.transform = `translate(${p.x + externalOffsetX}px, ${p.y}px)`;
              }
              pendingDragRef.current = null;
            });
          }
          return;
        }
      if (resizeState.current?.resizing) {
        const dx = ev.clientX - resizeState.current.startX;
        const dy = ev.clientY - resizeState.current.startY;
        let newW = resizeState.current.startW + dx;
        let newH = resizeState.current.startH + dy;
        // enforce minimums only; allow unlimited maximum unless provi ded
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
      // finalize drag: apply ref value to React state so component remains in sync
      if (translateRef.current) {
        // restore transition for smooth settling
        try {
          if (panelRef.current && !isResizing) {
            panelRef.current.style.transition = "transform 260ms cubic-bezier(.2,.9,.2,1)";
          }
        } catch (e) {}
        setTranslate({ x: translateRef.current.x, y: translateRef.current.y });
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

  // compute an external slide offset when parent wants the panel closed
  const externalOffsetX = (() => {
    if (typeof props.panelOpen === "boolean" && props.panelOpen === false) {
      const numericW = parseSizeToNumber(width, 0);
      return -(numericW + 24); // slide fully left with a small margin
    }
    return 0;
  })();

  const combinedTransform = `translate(${translate.x + externalOffsetX}px, ${translate.y}px)`;

  const panelStyle: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    transform: combinedTransform,
    transition: isResizing ? undefined : "transform 260ms cubic-bezier(.2,.9,.2,1)",
    position: overlay ? "fixed" : "relative",
    top: overlay ? 0 : undefined,
    left: overlay ? 0 : undefined,
    background: isResizing ? "transparent" : "var(--bg, white)",
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
      style={{ ...panelStyle, zIndex: overlay ? 9999 : 51, pointerEvents: "auto" }}
      className="shadow-lg border dark:border-gray-700 bg-white dark:bg-dark-background"

    >
      <div
        className="flex items-center justify-between px-2 py-2 relative transition-all"
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
            <strong className="text-md text-gray-900 dark:text-white font-semibold" >

              {title ? title.charAt(0).toUpperCase() + title.slice(1) : title}

              {navigationPath.length > 0 && navigationPath[navigationPath.length - 1]?.path ? ` / ${String(navigationPath[navigationPath.length - 1].path).split("-").map(s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s).join(" ")}` : ""}
            </strong>
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-700 dark:text-gray-200">

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
            aria-label="Close"
            title="Close"
            className="p-1 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-700 transition-colors duration-150 ml-1"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto" style={contentStyle}>
        {children}
      </div>
      <div
        onPointerDown={onResizePointerDown}
        className="rounded cursor-se-resize flex items-center justify-center mt-auto self-end"
        style={{
          touchAction: "none",
          backgroundColor: "rgb(237, 242, 246)",
          height: 30,
          width: 30,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 18 18"
          aria-hidden="true"
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
