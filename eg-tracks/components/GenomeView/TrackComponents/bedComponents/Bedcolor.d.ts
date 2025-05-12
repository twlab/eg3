import React from "react";
import { ColoredFeature } from "../../../../models/Feature";
import OpenInterval from "../../../../models/OpenInterval";
interface BedcolorProps {
    feature: any;
    xSpan: OpenInterval;
    y: number;
    height: number;
    isMinimal: boolean;
    onClick?: (event: React.MouseEvent, feature: ColoredFeature) => void;
}
declare const Bedcolor: React.FC<BedcolorProps>;
export default Bedcolor;
