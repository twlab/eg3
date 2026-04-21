import React, { useRef, useCallback } from "react";
import { MouseButton } from "../../../models/util";

export interface CoordinateDiff {
  dx: number;
  dy: number;
}

interface DragAcrossDivProps extends React.HTMLAttributes<HTMLDivElement> {
  mouseButton?: MouseButton;
  onDragStart?(event: React.PointerEvent<HTMLDivElement>): void;
  onDrag?(
    event: React.PointerEvent<HTMLDivElement>,
    coordinateDiff: CoordinateDiff,
  ): void;
  onDragEnd?(
    event: React.PointerEvent<HTMLDivElement>,
    coordinateDiff: CoordinateDiff,
  ): void;
}

function doNothing() {}

/**
 * A <div> that listens for drag-across events, where a user drags the cursor inside the div.  The drag callbacks will
 * fire even for short clicks; be sure to take this possibility into account when working with this component!
 *
 * Implemented as a function component using hooks.
 */
export function DragAcrossDiv(props: DragAcrossDivProps) {
  const {
    mouseButton,
    onDragStart = doNothing,
    onDrag = doNothing,
    onDragEnd = doNothing,
    children,
    ...remainingProps
  } = props;

  const originRef = useRef<{ x: number; y: number } | null>(null);

  const mousedown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (originRef.current === null && event.button === mouseButton) {
        originRef.current = { x: event.clientX, y: event.clientY };
        onDragStart(event);
      }
    },
    [mouseButton, onDragStart],
  );

  const mousemove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (originRef.current !== null) {
        const diff = {
          dx: event.clientX - originRef.current.x,
          dy: event.clientY - originRef.current.y,
        };
        onDrag(event, diff);
      }
    },
    [onDrag],
  );

  const mouseup = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (originRef.current !== null) {
        const diff = {
          dx: event.clientX - originRef.current.x,
          dy: event.clientY - originRef.current.y,
        };
        onDragEnd(event, diff);
        originRef.current = null;
      }
    },
    [onDragEnd],
  );

  return (
    <div
      onPointerDown={mousedown}
      onPointerMove={mousemove}
      onPointerUp={mouseup}
      {...remainingProps}
    >
      {children}
    </div>
  );
}
