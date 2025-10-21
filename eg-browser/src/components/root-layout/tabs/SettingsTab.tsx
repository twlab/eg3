import NavigationStack, {
  NavigationDestination,
} from "@/components/core-navigation/NavigationStack";
import Switch from "@/components/ui/switch/Switch";
import {
  selectIsNavigatorVisible,
  setNavigatorVisibility,
  selectDarkTheme,
  setDarkTheme,
  selectIsToolBarVisible,
  setToolBarVisibility,
  selectTrackLegendWidth,
  setTrackLegendWidth,
} from "@/lib/redux/slices/settingsSlice";
import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { ArrowTurnDownLeftIcon } from "@heroicons/react/24/outline";

export default function SettingsTab() {
  const dispatch = useAppDispatch();
  const isNavigatorVisible = useAppSelector(selectIsNavigatorVisible);
  const isToolbarVisible = useAppSelector(selectIsToolBarVisible);
  const isDarkTheme = useAppSelector(selectDarkTheme);
  const legendWidth = useAppSelector(selectTrackLegendWidth);
  const [tempLegendWidth, setTempLegendWidth] = useState<string>(
    legendWidth.toString()
  );

  const destinations: NavigationDestination[] = useMemo(() => [], []);

  const handleLegendWidthSave = () => {
    const value = parseInt(tempLegendWidth);
    if (value > 0) {
      dispatch(setTrackLegendWidth(value));
    } else {
      // Reset to current value if invalid
      setTempLegendWidth(legendWidth.toString());
    }
  };

  return (
    <NavigationStack destinations={destinations}>
      <div className="flex flex-col gap-4 pt-4">
        <div className="w-full flex items-center justify-between">
          <p>Show Navigator</p>
          <Switch
            checked={isNavigatorVisible}
            onChange={(checked) => dispatch(setNavigatorVisibility(checked))}
          />
        </div>
        <div className="w-full flex items-center justify-between">
          <p>Show Tool Bar</p>
          <Switch
            checked={isToolbarVisible}
            onChange={(checked) => dispatch(setToolBarVisibility(checked))}
          />
        </div>
        <div className="w-full flex items-center justify-between">
          <p>Legend Width</p>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              min="1"
              value={tempLegendWidth}
              onChange={(e) => setTempLegendWidth(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLegendWidthSave();
                }
              }}
              onBlur={handleLegendWidthSave}
              className="w-20 px-2 py-1 border border-gray-300 rounded"
              style={{ paddingRight: "32px" }}
            />
            <button
              type="button"
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "black",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseOver={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "grey")
              }
              onMouseOut={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "black")
              }
              onClick={handleLegendWidthSave}
              title="Save legend width (Enter)"
            >
              <ArrowTurnDownLeftIcon
                className="w-4 h-4"
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                }}
              />
            </button>
          </div>
        </div>
        <div className="w-full h-[1px] bg-gray-200"></div>
        <div className="w-full flex items-center justify-between">
          <p>Dark Mode</p>
          <Switch
            checked={isDarkTheme}
            onChange={(checked) => dispatch(setDarkTheme(checked))}
          />
        </div>
      </div>
    </NavigationStack>
  );
}
