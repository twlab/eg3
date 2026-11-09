import { useId, useLayoutEffect, useRef } from "react";
import type { MutableRefObject, ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════════════
   The outline round what the pointer is on, and round what a kept card is
   about, in the linear view and on the ref bar (the user, 2026-11-09: "an
   outline, a lot more stylized ... Frutiger Aero style").

   Three rectangles on one box, all of it clipped to the box so nothing
   stands outside the bar: a soft aqua glow fading inward from the edge,
   blurred; the outline itself, a glassy stroke running from sky blue
   through aqua to lime; and a thin white shine just inside it. Rounded
   corners. (A glow outside the box read as the outline sitting high: the
   white band above a bar shows it, the tinted band below hides it.) The hover
   outline is placed by hand on every pointer move (placeOutline), since a
   hover is a hundred events long and nothing React would need to work
   out again changes; the kept outline is rendered from its box.

   The gradient and the blur are SVG defs, rendered once per drawing
   (AeroDefs); their ids are shared by every view on the page.
   ═══════════════════════════════════════════════════════════════════════ */

export const AERO_STROKE_ID = "pgv-aero-stroke";
export const AERO_GLOW_ID = "pgv-aero-glow";

/** The gradient and the blur the outlines use: once in each drawing's svg. */
export function AeroDefs(): ReactNode {
  return (
    <defs>
      <linearGradient id={AERO_STROKE_ID} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#7dd3fc" />
        <stop offset="0.45" stopColor="#22d3ee" />
        <stop offset="1" stopColor="#a3e635" />
      </linearGradient>
      <filter id={AERO_GLOW_ID} x="-30%" y="-80%" width="160%" height="260%">
        <feGaussianBlur stdDeviation="1.6" />
      </filter>
    </defs>
  );
}

export interface OutlineBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The screen's device pixels a CSS pixel: 1.25 or 1.5 on a Windows
    display at 125 % or 150 %. Everything below is laid on device pixels,
    so the top and the bottom of an outline are mirror images at any
    scale (the user, at 100 %, saw half a pixel less at the bottom). */
const dpr = (): number => (typeof window !== "undefined" && window.devicePixelRatio) || 1;
/** So many device pixels, in CSS pixels. */
const devicePx = (n: number): number => n / dpr();
/** A CSS length rounded to whole device pixels, at least one. */
const wholeDevice = (css: number): number => Math.max(1, Math.round(css * dpr())) / dpr();

/** The stroke's width, by kind, in CSS pixels before rounding: the kept
    outline is heavier. */
const STROKE_CSS = { hover: 1.2, kept: 2 } as const;
/** The white shine's width before rounding ("make the white a bit
    thicker": two pixels at 100 %). */
const SHINE_CSS = 1.8;

interface Layer {
  className: string;
  inset: number;
  /** The stroke's width; the glow keeps the stylesheet's. */
  width?: number;
}

/** The three rectangles, each inset from the box by its own amount, on
    device pixels. The glow sits on the box, clipped to it, so it fades
    inward. The stroke is a whole number of device pixels wide, one device
    pixel in from the edge, its centre half a width further, so it fills
    whole rows. The shine, also whole device pixels, two device pixels in
    from the stroke. The stroke carries the class the checks read
    (`pgv-hover-node` or `pgv-kept-node`). */
const layersOf = (kind: "hover" | "kept"): Layer[] => {
  const stroke = wholeDevice(STROKE_CSS[kind]);
  const shine = wholeDevice(SHINE_CSS);
  const gap = devicePx(1);
  return [
    { className: "pgv-aero-glow", inset: 0 },
    { className: "", inset: gap + stroke / 2, width: stroke },
    { className: "pgv-aero-shine", inset: gap + stroke + devicePx(2) + shine / 2, width: shine },
  ];
};

/** The box on the device rows the canvas under it is painted on. The
    browser places the canvas element and this svg, siblings in one
    drawing, on whole device pixels alike; inside the canvas the bar is
    painted so many whole device pixels down and so many tall
    (BarCanvas.tsx paintBar: round(MARK_BAND * sy), round(barHeight *
    sy)). So, in the drawing's own units: the canvas's top, rounded; the
    box's offset in the canvas, rounded; the height, rounded. Rounding
    the box's own edges instead was a device pixel off at some scales
    (110 %: the user saw the bottom cover more). `canvasTop` is the
    canvas's top in the drawing's units. The sides stay where they are. */
const snap = (box: OutlineBox, canvasTop: number): OutlineBox => {
  const d = dpr();
  const canvasDev = Math.round(canvasTop * d);
  const topDev = canvasDev + Math.round((box.y - canvasTop) * d);
  const heightDev = Math.max(1, Math.round(box.height * d));
  return { x: box.x, y: topDev / d, width: box.width, height: heightDev / d };
};

/** Places a hover outline group on a box, or hides it. Each rectangle's
    display is set too, so a check reading the stroke alone sees it. */
export function placeOutline(group: SVGGElement | null, box: OutlineBox | null, canvasTop: number): void {
  if (!group) return;
  const rects = group.querySelectorAll("rect");
  if (!box) {
    group.style.display = "none";
    rects.forEach((rect) => (rect.style.display = "none"));
    return;
  }
  group.style.display = "";
  const snapped = snap(box, canvasTop);
  rects.forEach((rect) => {
    const inset = Number(rect.dataset.inset ?? 0);
    rect.setAttribute("x", String(snapped.x + inset));
    rect.setAttribute("y", String(snapped.y + inset));
    rect.setAttribute("width", String(Math.max(1, snapped.width - 2 * inset)));
    rect.setAttribute("height", String(Math.max(1, snapped.height - 2 * inset)));
    rect.style.display = "";
  });
}

/** An outline: `hover`, placed later by placeOutline through `groupRef`
    and hidden at first; or `kept`, drawn on `box`, snapped the same way
    once laid out. `canvasTop` is the top, in the svg's units, of the
    canvas the box sits on. */
export function AeroOutline({ kind, box, canvasTop = 0, groupRef }: { kind: "hover" | "kept"; box?: OutlineBox; canvasTop?: number; groupRef?: React.Ref<SVGGElement> }): ReactNode {
  const main = kind === "hover" ? "pgv-hover-node" : "pgv-kept-node";
  const at = box ?? { x: 0, y: 0, width: 0, height: 0 };
  const hidden = kind === "hover";
  const own = useRef<SVGGElement | null>(null);
  const setRef = (element: SVGGElement | null) => {
    own.current = element;
    if (typeof groupRef === "function") groupRef(element);
    else if (groupRef) (groupRef as MutableRefObject<SVGGElement | null>).current = element;
  };
  /* The kept outline is snapped once it is in the document, where its
     screen position is known. */
  useLayoutEffect(() => {
    if (kind === "kept" && box) placeOutline(own.current, box, canvasTop);
  }, [kind, box?.x, box?.y, box?.width, box?.height, canvasTop]);
  /* The clip is the box itself: a rectangle like the others, moved with
     them (placeOutline reads every rect of the group). */
  const clipId = useId();
  return (
    <g ref={setRef} className={`pgv-aero pgv-aero-${kind}`} clipPath={`url(#${clipId})`} style={hidden ? { display: "none" } : undefined}>
      <clipPath id={clipId}>
        <rect data-inset={0} x={at.x} y={at.y} width={Math.max(1, at.width)} height={Math.max(1, at.height)} rx={3} />
      </clipPath>
      {layersOf(kind).map((layer) => (
        <rect
          key={layer.className || main}
          className={layer.className || main}
          data-inset={layer.inset}
          x={at.x + layer.inset}
          y={at.y + layer.inset}
          width={Math.max(1, at.width - 2 * layer.inset)}
          height={Math.max(1, at.height - 2 * layer.inset)}
          rx={layer.inset ? 2 : 3}
          {...(layer.width ? { strokeWidth: layer.width } : {})}
          style={hidden ? { display: "none" } : undefined}
        />
      ))}
    </g>
  );
}
