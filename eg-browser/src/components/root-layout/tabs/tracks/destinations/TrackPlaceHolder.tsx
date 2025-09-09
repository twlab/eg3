import React, { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/lib/redux/hooks";
import { selectDarkTheme } from "@/lib/redux/slices/settingsSlice";

interface TrackPlaceHolderProps {
  width?: number;
  height?: number;
  barCount?: number;
  style?: React.CSSProperties;
}

const DEFAULT_HEIGHT = 40;
const DEFAULT_WIDTH = 250;
const DEFAULT_BAR_COUNT = 3;

export const TrackPlaceHolder: React.FC<TrackPlaceHolderProps> = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  barCount = DEFAULT_BAR_COUNT,
}) => {
  const darkTheme = useAppSelector(selectDarkTheme);

  const bars = useMemo(
    () =>
      Array.from({ length: barCount }, (_, i) => {
        // Predetermined values based on index for consistency
        const widthMultipliers = [0.3, 0.9, 0.6, 0.6, 0.9]; // Different widths for each bar
        const alignments = ["flex-start", "flex-end", "flex-start", "flex-end", "flex-start"]; // Alternating alignments

        const barWidth = Math.floor(width * widthMultipliers[i % widthMultipliers.length]);
        const align = alignments[i % alignments.length];
        const color = ["#6b7280", "#9ca3af", "#d1d5db"][i % 3];
        return { barWidth, align, color, key: i };
      }),
    [width, barCount]
  );

  return (
    <div
      className={`bg-white dark:bg-dark-background ${darkTheme ? "dark" : ""}`}
      data-theme={darkTheme ? "dark" : "light"}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        height,
        width,
        backgroundColor: "var(--bg-color)",
        gap: "2px",
        // ...style,
      }}
    >
      {bars.map(({ barWidth, align, color, key }) => (
        <div
          key={key}
          style={{
            display: "flex",
            width: "100%",
            justifyContent: align,
          }}
        >
          <Skeleton
            style={{
              width: `${barWidth}px`,
              height: `10px`,
              backgroundColor: color,
              opacity: 0.8,
              borderRadius: "1rem",
            }}
          />
        </div>
      ))}
    </div>
  );
};
