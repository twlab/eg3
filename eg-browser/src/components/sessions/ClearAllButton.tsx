import { CheckIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function ClearAllButton({
  onClearAll,
  compact = false,
  title = "",
}: {
  onClearAll: () => void;
  compact?: boolean;
  title: string;
}) {
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  useEffect(() => {
    if (isConfirmed) {
      const resetTimer = setTimeout(() => {
        setIsConfirmed(false);
      }, 3000);

      return () => clearTimeout(resetTimer);
    }
  }, [isConfirmed]);

  const handleClick = () => {
    if (isConfirmed) {
      onClearAll();
      setIsConfirmed(false);
    } else {
      setIsConfirmed(true);
    }
  };

  const bgClass = isConfirmed
    ? "bg-red-600 hover:bg-red-700"
    : "bg-red-100 hover:bg-red-200";
  const iconTextClass = isConfirmed
    ? "text-white"
    : "text-red-800 dark:text-red-200";

  if (compact) {
    return (
      <motion.button
        onClick={handleClick}
        initial={false}
        aria-label={isConfirmed ? "Confirm clear all" : title}
        className={`inline-flex items-center outline-none rounded-full shadow py-1 px-2 transition-colors duration-200 cursor-pointer hover:shadow-md ${bgClass} ${iconTextClass}`}
      >
        {isConfirmed ? (
          <CheckIcon className="w-4 h-4 mr-1" />
        ) : (
          <TrashIcon className="w-4 h-4 mr-1" />
        )}
        <span className="text-xs truncate max-w-[130px]">
          {isConfirmed ? "Confirm" : title}
        </span>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      initial={false}
      aria-label={isConfirmed ? "Confirm clear all" : title}
      className={`inline-flex items-center outline-none rounded-full shadow py-1 px-2 transition-colors duration-200 cursor-pointer hover:shadow-md ${bgClass} ${iconTextClass}`}
    >
      {isConfirmed ? (
        <CheckIcon className="w-4 h-4 mr-1" />
      ) : (
        <TrashIcon className="w-4 h-4 mr-1" />
      )}
      <span className="text-sm truncate">
        {isConfirmed ? "Confirm" : title}
      </span>
    </motion.button>
  );
}
