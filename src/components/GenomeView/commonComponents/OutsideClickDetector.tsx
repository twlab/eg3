import React, { useRef, useEffect } from "react";

interface OutsideClickDetectorProps {
  onOutsideClick?: (event: MouseEvent) => void;
  innerRef?: (node: Node | null) => void;
  children: React.ReactNode;
}

const OutsideClickDetector: React.FC<OutsideClickDetectorProps> = ({
  onOutsideClick,
  innerRef,
  children,
}) => {
  const nodeRef = useRef<Node | null>(null);

  const handleRef = (node: Node | null) => {
    nodeRef.current = node;
    if (innerRef) {
      innerRef(node);
    }
  };

  const detectOutsideClick = (event: MouseEvent) => {
    if (
      nodeRef.current &&
      !nodeRef.current.contains(event.target as Node) &&
      onOutsideClick
    ) {
      onOutsideClick(event);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", detectOutsideClick);
    return () => {
      document.removeEventListener("mousedown", detectOutsideClick);
    };
  }, []);

  return (
    <div style={{ position: "relative", zIndex: 0 }} ref={handleRef}>
      {children}
    </div>
  );
};

export default OutsideClickDetector;
