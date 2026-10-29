import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

/* ══════════════════════════════════════════════════════════════════════════
   The cards of the linear view: what a hover shows and a click keeps.

   A card is a title, the letters under the pointer when there are any, some
   lines, and headed lists of items that open on a click. The hover card
   follows the pointer and is drawn again only when what it is about
   changes; the kept card (FloatingCard) stays where it was clicked.
   ══════════════════════════════════════════════════════════════════════════ */

/** The letters round the pointer, with the ones it covers picked out. */
export interface CardZoom {
  before: string;
  at: string;
  after: string;
  where: ReactNode;
}

/** One item of a card's list: its line, and what opening it says. */
export interface CardItem {
  key: string;
  line: ReactNode;
  details: ReactNode[];
  /** Told when the pointer is on the entry and when it leaves. */
  onPoint?: (on: boolean) => void;
}

/** What a card says, apart from where it is. */
export interface CardContent {
  title: string;
  zoom?: CardZoom;
  lines: ReactNode[];
  /** Headed lists, each opening on a click. `near`: the nodes either side
      of the one the card is about, headed in the yellow they are outlined
      in. `empty`: what to say when the list has none. */
  groups: Array<{ head: string; items: CardItem[]; near?: boolean; empty?: string }>;
}

export function CardBody({
  card,
  openItems,
  onToggle,
}: {
  card: CardContent;
  openItems?: ReadonlySet<string>;
  onToggle?: (key: string) => void;
}) {
  return (
    <>
      <div className="pgv-tooltip-title">{card.title}</div>
      {card.zoom && (
        <div className="pgv-zoom pgv-card-zoom">
          <div className="pgv-zoom-seq">
            {card.zoom.before}
            <span className="pgv-zoom-at">{card.zoom.at}</span>
            {card.zoom.after}
          </div>
          <div className="pgv-zoom-where">{card.zoom.where}</div>
        </div>
      )}
      {card.lines.map((line, index) => (
        <div key={index} className="pgv-section-line">
          {line}
        </div>
      ))}
      {card.groups.map((group) => (
        <div key={group.head}>
          <div className={`pgv-section-head${group.near ? " pgv-head-near" : ""}`}>{group.head}</div>
          {group.items.length === 0 ? (
            <div className="pgv-section-line">{group.empty ?? "none"}</div>
          ) : (
            <div className="pgv-section-list">
              {group.items.map((item) => {
                const key = `${group.head}:${item.key}`;
                const open = openItems?.has(key) ?? false;
                return (
                  <div key={key}>
                    {/* Text, not a button, so it can be selected like the
                        rest of the card: a click opens it, a drag that
                        highlights some of it does not. */}
                    <div
                      role="button"
                      tabIndex={0}
                      className="pgv-section-node pgv-section-item"
                      aria-expanded={open}
                      onClick={() => {
                        if (window.getSelection()?.toString()) return;
                        onToggle?.(key);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        onToggle?.(key);
                      }}
                      onMouseEnter={item.onPoint ? () => item.onPoint?.(true) : undefined}
                      onMouseLeave={item.onPoint ? () => item.onPoint?.(false) : undefined}
                    >
                      <span className="pgv-section-caret">{open ? "▾" : "▸"}</span>
                      {item.line}
                    </div>
                    {open &&
                      item.details.map((line, index) => (
                        <div key={index} className="pgv-section-detail">
                          {line}
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export interface HoverCardHandle {
  /** Shows the card for `key` at the pointer, building it only when the
      key is not the one already shown. */
  show: (key: string, build: () => CardContent | null, x: number, y: number) => void;
  hide: () => void;
}

/** Between the pointer and the card, and the card and the window's edges. */
const HOVER_GAP = 14;
const HOVER_EDGE = 8;

/**
 * The card a hover shows: what a click would keep, following the pointer.
 *
 * A component of its own holding its own state, so a hover renders this
 * and nothing else - the drawing it sits beside is thousands of elements,
 * and a hover is a hundred events long. It is moved by writing to its
 * style, and drawn again only when what it is about changes.
 */
export const HoverCard = forwardRef<HoverCardHandle>(function HoverCard(_props, ref) {
  const [shown, setShown] = useState<{ key: string; card: CardContent } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const at = useRef({ x: 0, y: 0 });
  /* Measured once per change of what it says, so a move costs no layout. */
  const size = useRef({ width: 0, height: 0 });
  /* Below and right of the pointer; left of it near the right edge, above
     it near the bottom. */
  const place = () => {
    const element = box.current;
    if (!element) return;
    const { x, y } = at.current;
    const { width, height } = size.current;
    let left = x + HOVER_GAP;
    if (left + width > window.innerWidth - HOVER_EDGE) {
      left = Math.max(HOVER_EDGE, x - HOVER_GAP - width);
    }
    let top = y + HOVER_GAP;
    if (top + height > window.innerHeight - HOVER_EDGE) {
      top = Math.max(HOVER_EDGE, y - HOVER_GAP - height);
    }
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  };
  useImperativeHandle(
    ref,
    () => ({
      show(key, build, x, y) {
        at.current = { x, y };
        setShown((was) => {
          if (was?.key === key) return was;
          const card = build();
          return card ? { key, card } : null;
        });
        place();
      },
      hide() {
        setShown(null);
      },
    }),
    /* place reads only refs. */
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [],
  );
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    size.current = { width: rect.width, height: rect.height };
    place();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [shown]);
  if (!shown) return null;
  return createPortal(
    <div ref={box} className="pgv-section-card pgv-hover-card">
      <CardBody card={shown.card} />
    </div>,
    document.body,
  );
});

/** Whether a card is kept open anywhere on the page. Each of the graph's
    rows is a view of its own, and while any of them keeps a card, no
    row's hover says anything. */
export const cardKeptOpen = () =>
  typeof document !== "undefined" && !!document.querySelector(".pgv-floating-card");

/** A sequence for a card: all of it. A long one in a box of its own that
    scrolls, so the line it is part of stays a line. */
export const cardSequence = (sequence: string): ReactNode =>
  !sequence ? (
    "(no sequence)"
  ) : (
    <span className={sequence.length > 60 ? "pgv-card-seq pgv-card-seq-long" : "pgv-card-seq"}>
      {sequence}
    </span>
  );
