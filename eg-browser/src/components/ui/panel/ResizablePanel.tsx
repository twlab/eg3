import React, { useEffect, useRef, useState } from "react";

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
        initialWidth = 480,
        initialHeight = "70vh",
        minWidth = 220,
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

    const dragState = useRef<{ dragging: boolean; startX: number; startY: number; origX: number; origY: number } | null>(null);
    const resizeState = useRef<{ resizing: boolean; startX: number; startY: number; startW: number; startH: number } | null>(null);

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
                setTranslate({ x: dragState.current.origX + dx, y: dragState.current.origY + dy });
            }
            if (resizeState.current?.resizing) {
                const dx = ev.clientX - resizeState.current.startX;
                const dy = ev.clientY - resizeState.current.startY;
                let newW = resizeState.current.startW + dx;
                let newH = resizeState.current.startH + dy;
                // enforce minimums only; allow unlimited maximum unless provided
                newW = Math.max(minWidth, newW);
                newH = Math.max(minHeight, newH);
                setWidth(newW);
                setHeight(newH);
            }
        };

        const onPointerUp = () => {
            if (dragState.current) dragState.current.dragging = false;
            if (resizeState.current) resizeState.current.resizing = false;
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
        const numericW = parseSizeToNumber(width, 480);
        const numericH = parseSizeToNumber(height, 400);
        resizeState.current = {
            resizing: true,
            startX: e.clientX,
            startY: e.clientY,
            startW: numericW,
            startH: numericH,
        };
    };

    const panelStyle: React.CSSProperties = {
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        transform: `translate(${translate.x}px, ${translate.y}px)`,
        position: "relative",
        background: "var(--bg, white)",
        color: "var(--text, #111827)",
        display: "flex",
        flexDirection: "column",
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
    };

    const headerBg = headerHover
        ? "linear-gradient(180deg, rgba(60,140,200,0.72), rgba(60,140,200,0.22))"
        : "linear-gradient(180deg, rgba(31, 169, 255, 0.56), rgba(135,206,250,0.14))";

    const headerBorder = headerHover ? "1px solid rgba(255,255,255,0.28)" : "1px solid rgba(255,255,255,0.36)";

    return (
        <div ref={panelRef} style={panelStyle} className="shadow-lg border dark:border-gray-700 bg-white dark:bg-dark-background">
            <div
                className="flex items-center justify-between px-4 py-2 relative transition-all"
                style={{
                    paddingTop: 8,
                    paddingBottom: 8,
                    cursor: "move",
                    userSelect: "none",
                    touchAction: "none",
                    background: headerBg,
                    borderBottom: headerBorder,
                    backdropFilter: headerHover ? "blur(10px) saturate(150%)" : "blur(8px) saturate(130%)",
                    WebkitBackdropFilter: headerHover ? "blur(10px) saturate(150%)" : "blur(8px) saturate(130%)",
                }}
                onPointerDown={onHeaderPointerDown}
                onMouseEnter={() => setHeaderHover(true)}
                onMouseLeave={() => setHeaderHover(false)}
            >
                <div style={{
                    position: "absolute", left: 0, right: 0, top: 0, height: 12,
                    pointerEvents: "none", borderTopLeftRadius: 8,
                    borderTopRightRadius: 8, background: headerHover ?
                        "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0))" :
                        "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0))"
                }} />

                <div className="flex items-center">
                    <div className="font-semibold text-md text-gray-900 dark:text-white">{title}</div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 dark:text-gray-200">Press Esc to close</span>
                    <button
                        onClick={onClose}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-auto" style={{ padding: 12 }}>{children}</div>
            <div
                onPointerDown={onResizePointerDown}
                className="absolute bottom-3 right-3 w-6 h-6 bg-transparent cursor-se-resize"
                style={{ touchAction: "none" }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-blue-500">
                    <path d="M21 21v-4h-2v2h-2v2h4zM17 21v-2h-2v2h2zM13 21v-1h-2v1h2z" />
                </svg>
            </div>
        </div>
    );
}
