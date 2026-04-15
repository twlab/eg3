import React, { useRef, useEffect } from "react";

interface OutsideClickDetectorProps {
  onOutsideClick?: () => void;
  innerRef?: (node: Node | null) => void;
  children: React.ReactNode;
}

const OutsideClickDetector: React.FC<OutsideClickDetectorProps> = ({
  onOutsideClick,

  children,
}) => {
  const nodeRef = useRef<Node | null>(null);

  const handleRef = (node: Node | null) => {
    nodeRef.current = node;
  };

  const detectOutsideClick = (event: MouseEvent) => {
    if (
      nodeRef.current &&
      !nodeRef.current.contains(event.target as Node) &&
      onOutsideClick
    ) {
      onOutsideClick();
    }
  };

  useEffect(() => {
    // Use mouseup (and touchend) so users can press-and-drag to select
    // text inside the tooltip without it closing on initial mousedown.
    document.addEventListener("pointerup", detectOutsideClick);

    return () => {
      document.removeEventListener("pointerup", detectOutsideClick);
    };
  }, []);

  return (
    <div style={{ position: "relative", zIndex: 50 }} ref={handleRef}>
      {children}
    </div>
  );
};

export default OutsideClickDetector;
