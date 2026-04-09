import React from "react";

interface TrackRegionButtonProps {
    coordinates: string;
    onClick: () => void;
    style?: React.CSSProperties;
}

const TrackRegionButton: React.FC<TrackRegionButtonProps> = ({ coordinates, onClick, style }) => (
    <button
        onClick={onClick}
        style={{
            fontSize: "16px",
            cursor: "pointer",
            transition: "background-color 0.15s ease",
            paddingLeft: 4,
            paddingRight: 4,
            transform: "translateY(.5px)",
            ...style,
        }}
    >
        {coordinates}
    </button>
);

export default TrackRegionButton;
