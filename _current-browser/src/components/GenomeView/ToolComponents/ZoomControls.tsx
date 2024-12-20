import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const ZOOM_IN_OPTIONS = [
    { factor: 0.2, text: "5×", title: "Zoom in 5-fold" },
    { factor: 2 / 3, text: "⅓×", title: "Zoom in 1/3-fold" },
    { factor: 0.5, text: "1×", title: "Zoom in 1-fold (Alt+I)" },
];

const ZOOM_OUT_OPTIONS = [
    { factor: 2, text: "1×", title: "Zoom out 1-fold (Alt+O)" },
    { factor: 4 / 3, text: "⅓×", title: "Zoom out 1/3-fold" },
    { factor: 5, text: "5×", title: "Zoom out 5-fold" },
];

function ZoomControls({ onToolClicked }) {
    return (
        <div className="flex items-center gap-1">
            <motion.div
                className="flex items-center relative rounded-lg"
                whileHover="hover"
                initial="initial"
                animate="initial"
                variants={{
                    initial: { backgroundColor: "rgba(255, 255, 255, 0)" },
                    hover: { backgroundColor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(4px)" }
                }}
            >
                <motion.button
                    variants={{
                        initial: { opacity: 0, scale: 0 },
                        hover: {
                            opacity: 1,
                            scale: 1,
                            backgroundColor: "white",
                            borderWidth: "1px",
                            borderStyle: "solid",
                            borderColor: "rgb(209, 213, 219)",
                            borderRadius: "30px 30px 0 0",
                            borderBottom: "none"
                        }
                    }}
                    className="p-2 absolute bottom-full w-9 h-9 flex items-center justify-center"
                    onClick={() => onToolClicked(ZOOM_IN_OPTIONS[0])}
                    title={ZOOM_IN_OPTIONS[0].title}
                >
                    {ZOOM_IN_OPTIONS[0].text}
                </motion.button>

                <motion.button
                    variants={{
                        initial: {},
                        hover: {
                            borderLeft: "1px solid rgb(209, 213, 219)",
                            borderRight: "1px solid rgb(209, 213, 219)"
                        }
                    }}
                    onClick={() => onToolClicked(ZOOM_IN_OPTIONS[2])}
                    className="p-2 w-9 h-9 flex items-center justify-center"
                    title="Zoom in 1-fold (Alt+I)"
                >
                    <MagnifyingGlassPlusIcon className="w-5 h-5" />
                </motion.button>

                <motion.button
                    variants={{
                        initial: { opacity: 0, scale: 0 },
                        hover: {
                            opacity: 1,
                            scale: 1,
                            backgroundColor: "white",
                            borderWidth: "1px",
                            borderStyle: "solid",
                            borderColor: "rgb(209, 213, 219)",
                            borderRadius: "0 0 30px 30px",
                            borderTop: "none",
                        }
                    }}
                    className="p-2 absolute top-full w-9 h-9 flex items-center justify-center"
                    onClick={() => onToolClicked(ZOOM_IN_OPTIONS[1])}
                    title={ZOOM_IN_OPTIONS[1].title}
                >
                    {ZOOM_IN_OPTIONS[1].text}
                </motion.button>
            </motion.div>

            <motion.div
                className="flex items-center relative rounded-lg"
                whileHover="hover"
                initial="initial"
                animate="initial"
                variants={{
                    initial: { backgroundColor: "rgba(255, 255, 255, 0)" },
                    hover: { backgroundColor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(4px)" }
                }}
            >
                <motion.button
                    variants={{
                        initial: { opacity: 0, scale: 0 },
                        hover: {
                            opacity: 1,
                            scale: 1,
                            backgroundColor: "white",
                            borderWidth: "1px",
                            borderStyle: "solid",
                            borderColor: "rgb(209, 213, 219)",
                            borderRadius: "30px 30px 0 0",
                            borderBottom: "none"
                        }
                    }}
                    className="p-2 absolute bottom-full w-9 h-9 flex items-center justify-center"
                    onClick={() => onToolClicked(ZOOM_OUT_OPTIONS[2])}
                    title={ZOOM_OUT_OPTIONS[2].title}
                >
                    {ZOOM_OUT_OPTIONS[2].text}
                </motion.button>

                <motion.button
                    variants={{
                        initial: {},
                        hover: {
                            borderLeft: "1px solid rgb(209, 213, 219)",
                            borderRight: "1px solid rgb(209, 213, 219)"
                        }
                    }}
                    onClick={() => onToolClicked(ZOOM_OUT_OPTIONS[0])}
                    className="p-2 w-9 h-9 flex items-center justify-center"
                    title="Zoom out 1-fold (Alt+O)"
                >
                    <MagnifyingGlassMinusIcon className="w-5 h-5" />
                </motion.button>

                <motion.button
                    variants={{
                        initial: { opacity: 0, scale: 0 },
                        hover: {
                            opacity: 1,
                            scale: 1,
                            backgroundColor: "white",
                            borderWidth: "1px",
                            borderStyle: "solid",
                            borderColor: "rgb(209, 213, 219)",
                            borderRadius: "0 0 30px 30px",
                            borderTop: "none"
                        }
                    }}
                    className="p-2 absolute top-full w-9 h-9 flex items-center justify-center"
                    onClick={() => onToolClicked(ZOOM_OUT_OPTIONS[1])}
                    title={ZOOM_OUT_OPTIONS[1].title}
                >
                    {ZOOM_OUT_OPTIONS[1].text}
                </motion.button>
            </motion.div>
        </div>
    );
}

export default ZoomControls;
