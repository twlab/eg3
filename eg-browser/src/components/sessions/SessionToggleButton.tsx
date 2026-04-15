import { motion } from "framer-motion";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
export default function SessionToggleButton({
  open,
  onClick,
  className,
  style,
  count,
  textContent,
}: {
  open: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  count?: number | null;
  textContent?: React.ReactNode;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={false}
      type="button"

      style={style}
      aria-label={open ? "Close panel" : "Open panel"}
    >
      <div className="flex items-center outline-none rounded-full bg-white dark:bg-dark-secondary shadow py-1 px-2">
        {typeof count === "number" ? (
          <span className=" mr-1  items-center justify-center w-5 h-5  text-sm rounded-full bg-blue-600 text-white ">
            {count}
          </span>
        ) : null}
        <span className="text-sm text-primary dark:text-dark-primary">
          {textContent}
        </span>

        {open ? <div

          className="p-0.5 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-700 transition-colors duration-150"
        >
          <XMarkIcon className="w-4 h-4" />
        </div> : <ChevronRightIcon className="w-4 h-4 text-primary dark:text-dark-primary" />

        }

      </div>
    </motion.button>
  );
}
