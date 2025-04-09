import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ITabViewItem<T extends string> {
  label: string;
  value: T;
  component: React.ReactNode;
}

export default function TabView<T extends string>({
  tabs,
  initialTab,
}: {
  tabs: ITabViewItem<T>[];
  initialTab?: T;
}) {
  const [selectedTabId, setSelectedTabId] = useState<T>(
    initialTab ?? tabs[0].value
  );

  const selectedTab = useMemo(
    () => tabs.find((t) => t.value === selectedTabId),
    [tabs, selectedTabId]
  );

  return (
    <div className="flex flex-col gap-1 h-full">
      <div className="flex flex-row items-center justify-between gap-1 bg-gray-100 rounded-lg p-1 relative">
        <div
          className="absolute h-[calc(100%-8px)] transition-all duration-300 ease-out bg-secondary rounded-lg"
          style={{
            width: `calc(${100 / tabs.length}% - ${(tabs.length - 1) * 2}px)`,
            left: `calc(${
              (selectedTab
                ? tabs.findIndex((t) => t.value === selectedTab.value)
                : 0) * 100
            }% / ${tabs.length} + 4px)`,
          }}
        />
        {tabs.map((tab) => (
          <div
            key={tab.value}
            className="text-primary relative flex-1 text-center py-1 rounded-lg cursor-pointer z-10 transition-colors"
            onClick={() => setSelectedTabId(tab.value)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTabId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          {selectedTab?.component}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
