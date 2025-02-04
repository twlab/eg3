import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { selectTool, setTool } from '@/lib/redux/slices/utilitySlice';
import { Tool } from '@eg/tracks';
import { ArrowsUpDownIcon, BookOpenIcon, ClockIcon, HandRaisedIcon, MagnifyingGlassIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, PaintBrushIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

enum MagnifyingDirection {
    In,
    Out,
}

export default function Toolbar() {
    const tool = useAppSelector(selectTool);
    const dispatch = useAppDispatch();

    const [hoveredMagnifyingDirection, setHoveredMagnifyingDirection] = useState<MagnifyingDirection | null>(null);

    const getButtonClass = (buttonTool?: Tool) => {
        return `p-1.5 ${tool === buttonTool ? 'bg-secondary' : ''} ${tool !== buttonTool ? 'hover:bg-gray-200' : ''} rounded-md`;
    };

    return (
        <div className="bg-white/80 backdrop-blur-md flex flex-col p-1.5 gap-1.5 mb-4 border-gray-300 border rounded-xl shadow-md">
            <div className='flex flex-row pt-1 gap-1'>
                <MagnifyingGlassIcon className='size-6 text-gray-500' />
                <input
                    className='flex-1 outline-none bg-transparent'
                    placeholder="Search for something..."
                />
            </div>
            <div className='w-full my-1 border-b border-gray-400' />
            <div className="flex flex-row items-center gap-1.5">
                <motion.div
                    className="flex flex-row items-center gap-1.5"
                    animate={{
                        opacity: hoveredMagnifyingDirection !== null ? 0 : 1,
                        scale: hoveredMagnifyingDirection !== null ? 0.95 : 1
                    }}
                    transition={{ duration: 0.2 }}
                >
                    <button
                        onClick={() => dispatch(setTool(Tool.Pan))}
                        className={getButtonClass(Tool.Pan)}
                        title="Pan"
                    >
                        <HandRaisedIcon className="size-6 text-gray-600" />
                    </button>
                    <button
                        onClick={() => dispatch(setTool(Tool.Reorder))}
                        className={getButtonClass(Tool.Reorder)}
                        title="Reorder tracks"
                    >
                        <ArrowsUpDownIcon className="size-6 text-gray-600" />
                    </button>
                    <button
                        onClick={() => dispatch(setTool(Tool.Zoom))}
                        className={getButtonClass(Tool.Zoom)}
                        title="Zoom out"
                    >
                        <MagnifyingGlassIcon className="size-6 text-gray-600" />
                    </button>
                    <button
                        onClick={() => dispatch(setTool(Tool.Highlight))}
                        className={getButtonClass(Tool.Highlight)}
                        title="Highlight region"
                    >
                        <PaintBrushIcon className="size-6 text-gray-600" />
                    </button>

                    <div className='h-full border-r border-gray-400' />
                </motion.div>

                <motion.div
                    className='self-stretch w-[1px] border-r border-gray-400'
                    animate={{
                        opacity: hoveredMagnifyingDirection !== null ? 0 : 1,
                        scale: hoveredMagnifyingDirection !== null ? 0.95 : 1
                    }}
                    transition={{ duration: 0.2 }}
                />

                <motion.div
                    className='relative'
                    animate={{
                        opacity: hoveredMagnifyingDirection === MagnifyingDirection.Out ? 1 : (hoveredMagnifyingDirection !== null ? 0 : 1),
                        scale: hoveredMagnifyingDirection === MagnifyingDirection.Out ? 1 : (hoveredMagnifyingDirection !== null ? 0.95 : 1)
                    }}
                    transition={{ duration: 0.2 }}
                    onMouseEnter={() => setHoveredMagnifyingDirection(MagnifyingDirection.Out)}
                    onMouseLeave={() => setHoveredMagnifyingDirection(null)}
                >
                    <button
                        className={getButtonClass() + ` relative rounded-none ${hoveredMagnifyingDirection === MagnifyingDirection.Out ? 'z-20' : ''}`}
                        title="Zoom out"
                    >
                        <MagnifyingGlassMinusIcon className="size-6 text-gray-600" />
                    </button>
                    <AnimatePresence>
                        {hoveredMagnifyingDirection === MagnifyingDirection.Out && (
                            <motion.div
                                className='absolute top-0 left-0 h-full border border-gray-secondary rounded-full flex flex-row justify-between items-center z-10'
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: '350%', opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ translateX: '-40%' }}
                            >
                                <button
                                    className={getButtonClass() + ' text-gray-600 rounded-l-full pr-1.5 -mr-1.5 w-[33%]'}
                                >
                                    -⅓
                                </button>
                                <button
                                    className={getButtonClass() + ' text-gray-600 rounded-r-full pl-1.5 -ml-1.5 w-[33%]'}
                                >
                                    -5
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <motion.div
                    className='relative'
                    animate={{
                        opacity: hoveredMagnifyingDirection === MagnifyingDirection.In ? 1 : (hoveredMagnifyingDirection !== null ? 0 : 1),
                        scale: hoveredMagnifyingDirection === MagnifyingDirection.In ? 1 : (hoveredMagnifyingDirection !== null ? 0.95 : 1)
                    }}
                    transition={{ duration: 0.2 }}
                    onMouseEnter={() => setHoveredMagnifyingDirection(MagnifyingDirection.In)}
                    onMouseLeave={() => setHoveredMagnifyingDirection(null)}
                >
                    <button
                        className={getButtonClass() + ` relative rounded-none ${hoveredMagnifyingDirection === MagnifyingDirection.In ? 'z-20' : ''}`}
                        title="Zoom in"
                    >
                        <MagnifyingGlassPlusIcon className="size-6 text-gray-600" />
                    </button>
                    <AnimatePresence>
                        {hoveredMagnifyingDirection === MagnifyingDirection.In && (
                            <motion.div
                                className='absolute top-0 left-0 h-full border border-gray-secondary rounded-full flex flex-row justify-between items-center z-10'
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: '350%', opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ translateX: '-33%' }}
                            >
                                <button
                                    className={getButtonClass() + ' text-gray-600 rounded-l-full pr-1.5 -mr-1.5 w-[33%]'}
                                >
                                    +⅓
                                </button>
                                <button
                                    className={getButtonClass() + ' text-gray-600 rounded-r-full pl-1.5 -ml-1.5 w-[33%]'}
                                >
                                    +5
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <motion.div
                    className='self-stretch w-[1px] border-r border-gray-400'
                    animate={{
                        opacity: hoveredMagnifyingDirection !== null ? 0 : 1,
                        scale: hoveredMagnifyingDirection !== null ? 0.95 : 1
                    }}
                    transition={{ duration: 0.2 }}
                />

                <motion.div
                    className="flex flex-row items-center gap-1.5"
                    animate={{
                        opacity: hoveredMagnifyingDirection !== null ? 0 : 1,
                        scale: hoveredMagnifyingDirection !== null ? 0.95 : 1
                    }}
                    transition={{ duration: 0.2 }}
                >
                    <div className='h-full border-r border-gray-400' />

                    <button
                        className={getButtonClass()}
                        title="Zoom in"
                    >
                        <ClockIcon className="size-6 text-gray-600" />
                    </button>
                    <button
                        className={getButtonClass()}
                        title="Zoom in"
                    >
                        <BookOpenIcon className="size-6 text-gray-600" />
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
