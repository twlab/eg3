import { useMemo, useState } from "react";

interface ITabViewItem<T extends string> {
  label: string;
  value: T;
  component: React.ReactNode;
}

export default function TabView<T extends string>({
  tabs,
  initialTab,
  selectedTab: controlledTab,
  onTabChange,
  className,
  centerTabs,
}: {
  tabs: ITabViewItem<T>[];
  initialTab?: T;
  selectedTab?: T;
  onTabChange?: (value: T) => void;
  className?: string;
  centerTabs?: boolean;
}) {
  const [internalTabId, setInternalTabId] = useState<T>(
    initialTab ?? tabs[0].value,
  );

  const isControlled = controlledTab !== undefined;
  const selectedTabId = isControlled ? controlledTab : internalTabId;

  const setSelectedTabId = (value: T) => {
    if (!isControlled) setInternalTabId(value);
    onTabChange?.(value);
  };

  const selectedTab = useMemo(
    () => tabs.find((t) => t.value === selectedTabId),
    [tabs, selectedTabId],
  );

  return (
    <div className={`flex flex-col min-h-0 ${centerTabs ? "w-full" : ""} ${className ?? ""}`}>
      <div className={`flex flex-row items-end border-b border-gray-300 dark:border-gray-600 ${centerTabs ? "w-full" : ""}`}>
        {tabs.map((tab) => {
          const isActive = tab.value === selectedTabId;
          return (
            <button
              key={tab.value}
              onClick={() => setSelectedTabId(tab.value)}
              className={[
                "py-1 text-sm font-bold cursor-pointer outline-none transition-all rounded-t-md border border-b-0",
                "relative",
                centerTabs ? "flex-1 text-center px-2" : "px-4",
                isActive
                  ? "bg-white dark:bg-dark-background border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 z-10 shadow-sm"
                  : "bg-transparent border-transparent text-primary dark:text-dark-primary hover:text-blue-500 dark:hover:text-blue-300",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0">
        {selectedTab?.component}
      </div>
    </div>
  );
}
