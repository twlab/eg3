import { motion } from "framer-motion";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import React from "react";

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
  textContent?: string;
}) {
  return (
    <motion.button
      layoutId="session-toggle-button"
      onClick={onClick}
      initial={false}
      className={`${className ?? ""}${"fixed"}`}
      style={style}
      aria-label={open ? "Close panel" : "Open panel"}
    >
      <div className="flex items-center outline-none  rounded-full  bg-white shadow py-1 px-2">
        {typeof count === "number" ? (
          <span className=" inline-flex items-center justify-center py-2 w-5 h-4 mr-1 text-xs rounded-full bg-blue-600 text-white">
            {count}
          </span>
        ) : null}
        <span className="text-xs  truncatemax-w-[130px]">{textContent}</span>

        <motion.div
          initial={false}
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.18 }}
          className="ml-1"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </motion.div>
      </div>
    </motion.button>
  );
}
