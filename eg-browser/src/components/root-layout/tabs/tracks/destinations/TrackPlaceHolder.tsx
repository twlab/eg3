import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/lib/redux/hooks";
import { selectDarkTheme } from "@/lib/redux/slices/settingsSlice";

interface TrackPlaceHolderProps {
  width?: number;
  height?: number;
  barCount?: number;
  style?: React.CSSProperties;
}

const DEFAULT_HEIGHT = 80;
const DEFAULT_WIDTH = 250;
const DEFAULT_BAR_COUNT = 25;

const BAR_HEIGHTS = [40, 70, 60, 80, 50, 65, 40, 55, 75, 30]; // You can adjust or randomize

export const TrackPlaceHolder: React.FC<TrackPlaceHolderProps> = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  barCount = DEFAULT_BAR_COUNT,
  style = {},
}) => {
  const darkTheme = useAppSelector(selectDarkTheme);
  const barWidth = Math.floor(width / barCount) - 10; // 20px gap
  // Repeat or slice BAR_HEIGHTS to match barCount
  const heights = Array.from(
    { length: barCount },
    (_, i) => BAR_HEIGHTS[i % BAR_HEIGHTS.length]
  );

  return (
    <div
      className={`bg-white dark:bg-dark-background  ${darkTheme ? "dark" : ""}`}
      data-theme={darkTheme ? "dark" : "light"}
      style={{
        display: "flex",
        alignItems: "flex-end",
        height,
        width,
        backgroundColor: "var(--bg-color)",
        borderRadius: "0.75rem",
        padding: 0,
        position: "relative",
        overflow: "hidden",
        gap: "4px",
        ...style,
      }}
    >
      {heights.map((barHeight, i) => (
        <Skeleton
          key={i}
          style={{
            width: `${barWidth}px`,
            height: `${barHeight}px`,
            borderRadius: ".9rem",
            backgroundColor: ["#60a5fa", "#3b82f6", "#2563eb"][i % 3],
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  );
};
