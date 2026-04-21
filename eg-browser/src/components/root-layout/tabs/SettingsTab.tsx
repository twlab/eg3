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

export default function SettingsTab({
  panelCounter,
  onNavigationPathChange,
}: {
  panelCounter?: number;
  onNavigationPathChange?: (path: any) => void;
}) {
  const dispatch = useAppDispatch();
  const isNavigatorVisible = useAppSelector(selectIsNavigatorVisible);
  const isToolbarVisible = useAppSelector(selectIsToolBarVisible);
  const isDarkTheme = useAppSelector(selectDarkTheme);
  const legendWidth = useAppSelector(selectTrackLegendWidth);
  const [tempLegendWidth, setTempLegendWidth] = useState<string>(
    legendWidth.toString(),
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
    <NavigationStack
      destinations={destinations}
      panelCounter={panelCounter}
      onPathChange={onNavigationPathChange}
    >
      <div className="flex flex-col gap-4 px-2 py-1">
        <div className="w-full flex items-center justify-between">
          <p className="text-primary dark:text-dark-primary">Show Navigator</p>
          <Switch
            checked={isNavigatorVisible}
            onChange={(checked) => dispatch(setNavigatorVisibility(checked))}
          />
        </div>
        <div className="w-full flex items-center justify-between">
          <p className="text-primary dark:text-dark-primary">Show Tool Bar</p>
          <Switch
            checked={isToolbarVisible}
            onChange={(checked) => dispatch(setToolBarVisibility(checked))}
          />
        </div>
        <div className="w-full flex items-center justify-between">
          <p className="text-primary dark:text-dark-primary">Legend Width</p>
          <div className="relative">
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
              className="w-22 pr-8 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-dark-surface text-primary dark:text-dark-primary focus:outline-none focus:ring-1 focus:ring-secondary"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer p-1 flex items-center justify-center text-gray-600 dark:text-dark-primary hover:text-gray-400 dark:hover:text-gray-400"
              onClick={handleLegendWidthSave}
              title="Save legend width (Enter)"
            >
              <ArrowTurnDownLeftIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="w-full h-[1px] bg-gray-200 dark:bg-gray-700"></div>
        <div className="w-full flex items-center justify-between">
          <p className="text-primary dark:text-dark-primary">Dark Mode</p>
          <Switch
            checked={isDarkTheme}
            onChange={(checked) => dispatch(setDarkTheme(checked))}
          />
        </div>
      </div>
    </NavigationStack>
  );
}
