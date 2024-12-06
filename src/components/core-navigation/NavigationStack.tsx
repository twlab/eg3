import { createContext, useCallback, useContext, useMemo, useState } from "react";
import NotFound from "./NotFound";
import NavigationToolbar from "./NavigationToolbar";
import { useElementGeometry } from "@/lib/hooks/useElementGeometry";
import { motion, AnimatePresence } from "framer-motion";

export interface NavigationPathElement {
    path: string,
    params?: Record<string, string>;
}

export type NavigationPath = NavigationPathElement[];

export interface NavigationDestination {
    path: string;
    component: React.ComponentType;
    options?: NavigationDestinationOptions;
}

interface NavigationDestinationOptions {
    title?: string;
}

interface NavigationStackContext {
    path: NavigationPath;
    setPath: (path: NavigationPath) => void;
}

const NavigationStackContext = createContext<NavigationStackContext | null>(null);

export function useNavigation() {
    const context = useContext(NavigationStackContext);

    if (!context) {
        throw new Error("useNavigation must be used within a NavigationStack");
    }

    const push = useCallback((path: NavigationPathElement) => {
        context?.setPath([...context.path, path]);
    }, [context]);

    const pop = useCallback(() => {
        context?.setPath(context.path.slice(0, -1));
    }, [context]);

    const canGoBack = useMemo(() => context?.path.length > 0, [context?.path]);

    return { push, pop, canGoBack };
}

const notFoundDestination: NavigationDestination = {
    path: "*",
    component: NotFound,
    options: {
        title: "Not Found"
    }
};

export default function NavigationStack({
    children,
    destinations,
    rootOptions
}: {
    children: React.ReactNode;
    destinations: NavigationDestination[];
    rootOptions?: NavigationDestinationOptions;
}) {
    const { ref, width, height } = useElementGeometry();

    const [path, setPath] = useState<NavigationPath>([]);

    const destinationMap: Record<string, NavigationDestination> = useMemo(() =>
        destinations.reduce((acc, destination) => {
            acc[destination.path] = destination;
            return acc;
        }, {} as Record<string, NavigationDestination>),
        [destinations]
    );

    const currentDestination = useMemo(() =>
        path.length > 0
            ? destinationMap[path[path.length - 1]?.path]
            : null,
        [destinationMap, path]
    );

    const currentOptions = useMemo(() =>
        path.length > 0
            ? currentDestination?.options
            : rootOptions,
        [path.length, currentDestination?.options, rootOptions]
    );

    return (
        <NavigationStackContext.Provider value={{ path, setPath }}>
            <div className="flex flex-col h-full">
                <NavigationToolbar title={currentOptions?.title} />
                <div className="relative flex-1 overflow-hidden min-w-[25vw]" ref={ref}>
                    <motion.div 
                        className="px-4 pb-4 absolute overflow-y-scroll bg-white"
                        animate={{ x: path.length > 0 ? "-33%" : 0, opacity: path.length > 0 ? 0.3 : 1 }}
                        style={{ width, height }}
                    >
                        {children}
                    </motion.div>
                    <AnimatePresence mode="popLayout">
                        {path.map((element) => {
                            const destination = destinationMap[element.path] ?? notFoundDestination;

                            return (
                                <motion.div 
                                    key={element.path}
                                    className="px-4 pb-4 absolute overflow-y-scroll bg-white"
                                    initial={{ x: "100%" }}
                                    animate={{ x: 0 }}
                                    exit={{ x: "100%" }}
                                    style={{ width, height }}
                                >
                                    <destination.component />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </NavigationStackContext.Provider>
    );
}
