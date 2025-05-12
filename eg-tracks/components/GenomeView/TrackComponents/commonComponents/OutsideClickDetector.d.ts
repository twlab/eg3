import React from "react";
interface OutsideClickDetectorProps {
    onOutsideClick?: (event: MouseEvent) => void;
    innerRef?: (node: Node | null) => void;
    children: React.ReactNode;
}
declare const OutsideClickDetector: React.FC<OutsideClickDetectorProps>;
export default OutsideClickDetector;
