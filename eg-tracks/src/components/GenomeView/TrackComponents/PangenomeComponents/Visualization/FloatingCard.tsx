import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

/* ══════════════════════════════════════════════════════════════════════════
   A card opened by a click, where the click was - placed the way eg3 places
   its track config menu (ConfigMenuComponent).

   On the page's body, fixed to the window, so the band it was clicked in -
   which clips whatever hangs past it - cannot cut it off. It opens just
   below the pointer; near the bottom of the window, where it would run off,
   it opens above the pointer instead, and near the top it stays below.
   Taller than either side has room for, it opens on the side with more and
   is cut to fit, scrolling inside - never over the pointer. It is moved
   left rather than run off the right edge.

   Measured before the browser paints, so it is never seen in the wrong
   place first.
   ══════════════════════════════════════════════════════════════════════════ */

/** Between the pointer and the card's edge. */
const GAP = 8;
/** Kept clear of the window's edges. */
const MARGIN = 8;
/** The tallest it is drawn, whatever it holds; see the stylesheet. */
const TALLEST = 480;

interface Place {
  left: number;
  top: number;
  /** Set when neither side has room for all of it. */
  maxHeight?: number;
}

export default function FloatingCard({
  x,
  y,
  className,
  children,
}: {
  /** The pointer, in window coordinates (a mouse event's clientX/Y). */
  x: number;
  y: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<Place | null>(null);

  useLayoutEffect(() => {
    const card = ref.current;
    if (!card) return;
    const fit = () => {
      const { width } = card.getBoundingClientRect();
      /* All of it, however much is scrolled out of sight now. */
      const height = Math.min(card.scrollHeight, TALLEST);
      const roomW = window.innerWidth;
      const roomH = window.innerHeight;
      /* Beside the pointer, moved left rather than off the right edge. */
      const left = Math.max(MARGIN, Math.min(x, roomW - width - MARGIN));
      /* Below the pointer if it fits there, above it if it fits there; if
         neither, on the side with more room, cut to fit. */
      const roomBelow = roomH - (y + GAP) - MARGIN;
      const roomAbove = y - GAP - MARGIN;
      let next: Place;
      if (height <= roomBelow) {
        next = { left, top: y + GAP };
      } else if (height <= roomAbove) {
        next = { left, top: y - GAP - height };
      } else if (roomBelow >= roomAbove) {
        next = { left, top: y + GAP, maxHeight: Math.max(0, roomBelow) };
      } else {
        next = { left, top: MARGIN, maxHeight: Math.max(0, roomAbove) };
      }
      setPlace((was) =>
        was &&
        was.left === next.left &&
        was.top === next.top &&
        was.maxHeight === next.maxHeight
          ? was
          : next,
      );
    };
    fit();
    /* Its size can change after it opens - a list filtered, a group
       expanded - and the window can be resized. */
    const observer = new ResizeObserver(fit);
    observer.observe(card);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [x, y]);

  return createPortal(
    <div
      ref={ref}
      className={`pgv-floating-card${className ? ` ${className}` : ""}`}
      style={{
        left: place?.left ?? x,
        top: place?.top ?? y + GAP,
        ...(place?.maxHeight !== undefined ? { maxHeight: place.maxHeight } : {}),
        /* Measured first, then shown. */
        visibility: place ? "visible" : "hidden",
      }}
      /* Its presses and scrolls are its own. A portal's events still go up
         the component tree it was opened from, and there a press on the card
         reached eg3's pan (DragAcrossDiv's onPointerDown): the view panned
         under the card, and the press could not select the card's text. */
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      {children}
    </div>,
    document.body,
  );
}
