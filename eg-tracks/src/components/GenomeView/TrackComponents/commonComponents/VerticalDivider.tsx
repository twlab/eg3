import React from "react";
import LinearDrawingModel from "../../../../models/LinearDrawingModel";

interface VerticalDividerProps {
    visData: {
        visRegion: any;
        viewWindowRegion: any;
        viewWindow: { getLength: () => number };
    };
}

const VerticalDivider: React.FC<VerticalDividerProps> = ({ visData }) => {
    const { visRegion, viewWindowRegion, viewWindow } = visData;
    if (!visRegion?.getFeatureSegments) return null;

    const drawModel = new LinearDrawingModel(viewWindowRegion, viewWindow.getLength());
    const verticalLines: React.ReactNode[] = [];
    let x = 0;

    let featureSegments;
    try {
        featureSegments = visRegion.getFeatureSegments();
    } catch {
        return null;
    }

    for (const segment of featureSegments) {
        const drawWidth = drawModel.basesToXWidth(segment.getLength());
        if (x > 0) {
            verticalLines.push(
                <div
                    key={"divider" + x}
                    style={{
                        borderRight: "1px solid gray",
                        position: "absolute",
                        top: 0,
                        left: x + "px",
                        height: "100%",
                        pointerEvents: "none",
                    }}
                />
            );
        }
        x += drawWidth;
    }

    return <>{verticalLines}</>;
};

export default VerticalDivider;
