import { motion, AnimatePresence } from "framer-motion";

interface IStepAccordionItem<T extends string> {
    label: string;
    value: T;
    valuePreview?: string;
    component: React.ReactNode;
}

interface StepAccordionProps<T extends string> {
    items: IStepAccordionItem<T>[];
    selectedItem: T | null;
    onSelectedItemChange: (value: T | null) => void;
}

export default function StepAccordion<T extends string>({
    items,
    selectedItem,
    onSelectedItemChange
}: StepAccordionProps<T>) {
    return (
        <div className="flex flex-col gap-1">
            {items.map((item, idx) => {
                const isSelected = selectedItem === item.value;

                return (
                    <div key={item.value}>
                        <div
                            onClick={() => isSelected ? onSelectedItemChange(null) : onSelectedItemChange(item.value)}
                            className={`flex flex-row items-center justify-start py-2 px-4 rounded-full gap-4 cursor-pointer`}
                        >
                            <div className="relative">
                                <motion.div
                                    className={`p-5 relative`}
                                    initial={false}
                                    animate={{
                                        scale: isSelected ? 1 : 0.8,
                                        backgroundColor: isSelected ? "#E8DEF8" : "transparent",
                                        borderRadius: "9999px"
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 30
                                    }}
                                />
                                <span className="text-black text-center absolute inset-0 flex items-center justify-center">{idx + 1}</span>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-lg">{item.label}</span>
                                <AnimatePresence>
                                    {item.valuePreview && !isSelected && (
                                        <motion.span
                                            className="text-sm text-gray-500 truncate"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {item.valuePreview}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                        <div className={`w-full border-b ${isSelected ? "border-t" : ""} border-gray-400`}>
                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        className="px-4 overflow-hidden"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{
                                            height: "auto",
                                            opacity: 1,
                                            transition: {
                                                height: {
                                                    duration: 0.3
                                                },
                                                opacity: {
                                                    duration: 0.2,
                                                    delay: 0.1
                                                }
                                            }
                                        }}
                                        exit={{
                                            height: 0,
                                            opacity: 0,
                                            transition: {
                                                height: {
                                                    duration: 0.3
                                                },
                                                opacity: {
                                                    duration: 0.2
                                                }
                                            }
                                        }}
                                    >
                                        {item.component}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
