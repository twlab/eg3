import { motion } from "framer-motion";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import React from "react";

export default function SessionToggleButton({
    open,
    onClick,
    className,
    style,
    count,
}: {
    open: boolean;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
    count?: number;
}) {

    const needsRelative = !/(?:\bfixed\b|\babsolute\b)/.test(className ?? "");

    return (
        <motion.button
            layoutId="session-toggle-button"
            onClick={onClick}
            initial={false}
            className={`${className ?? ""}${needsRelative ? " relative" : ""}`}
            style={style}
            aria-label={open ? "Close panel" : "Open panel"}
        >
            <div className="flex items-center gap-2 px-3 py-1">
                {typeof count === "number" ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs rounded-full bg-blue-600 text-white">{count}</span>
                ) : null}
                <span className="text-sm whitespace-nowrap">
                    Previous sessions
                </span>

                <motion.div
                    initial={false}
                    animate={{ rotate: open ? 90 : 0 }}
                    transition={{ duration: 0.18 }}
                    className="ml-2"
                >
                    <ChevronRightIcon className="w-5 h-5" />
                </motion.div>
            </div>
        </motion.button>
    );
}
