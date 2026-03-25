import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import NotFound from "./NotFound";
import NavigationToolbar from "./NavigationToolbar";
import { useElementGeometry } from "@/lib/hooks/useElementGeometry";
// animations removed: no framer-motion

export interface NavigationPathElement {
  path: string;
  params?: Record<string, string>;
}

export type NavigationPath = NavigationPathElement[];

export interface NavigationComponentProps {
  params?: Record<string, string>;
}

export interface NavigationDestination {
  path: string;
  component: React.ComponentType<NavigationComponentProps>;
  options?: NavigationDestinationOptions;
}

export interface NavigationDestinationOptions {
  title?: string;
  trailing?: React.ReactNode;
}

interface NavigationStackContext {
  path: NavigationPath;
  setPath: (path: NavigationPath) => void;
}

const NavigationStackContext = createContext<NavigationStackContext | null>(
  null,
);

export function useNavigation() {
  const context = useContext(NavigationStackContext);

  if (!context) {
    throw new Error("useNavigation must be used within a NavigationStack");
  }

  const push = useCallback(
    (path: NavigationPathElement) => {
      context?.setPath([...context.path, path]);
    },
    [context],
  );

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
    title: "Not Found",
  },
};

export default function NavigationStack({
  children,
  destinations = [],
  rootOptions,
}: {
  children: React.ReactNode;
  destinations?: NavigationDestination[];
  rootOptions?: NavigationDestinationOptions;
}) {
  const { ref, width, height } = useElementGeometry();

  const [path, setPath] = useState<NavigationPath>([]);

  const destinationMap: Record<string, NavigationDestination> = useMemo(
    () =>
      destinations.reduce(
        (acc, destination) => {
          acc[destination.path] = destination;
          return acc;
        },
        {} as Record<string, NavigationDestination>,
      ),
    [destinations],
  );

  const currentDestination = useMemo(
    () =>
      path.length > 0 ? destinationMap[path[path.length - 1]?.path] : null,
    [destinationMap, path],
  );

  const currentOptions = useMemo(
    () => (path.length > 0 ? currentDestination?.options : rootOptions),
    [path.length, currentDestination?.options, rootOptions],
  );

  return (
    <NavigationStackContext.Provider value={{ path, setPath }}>
      <div className="flex flex-col h-full bg-white dark:bg-dark-background">
        <NavigationToolbar
          options={currentOptions}
          canGoBack={path.length > 0}
          pop={() => setPath(path.slice(0, -1))}
        />
        <div className="relative flex-1 overflow-hidden min-w-[5vw]" ref={ref}>
          <div
            className="px-4 pb-4 absolute overflow-y-scroll"
            style={{
              width,
              height,
              // transform: path.length > 0 ? "translateX(-33%)" : "translateX(0)",
              // opacity: path.length > 0 ? 0.3 : 1,
              // transition: "transform 220ms ease, opacity 220ms ease",
            }}
          >
            {children}
          </div>

          {path.map((element, idx) => {
            const destination =
              destinationMap[element.path] ?? notFoundDestination;
            // const transform =
            //   idx === path.length - 1 ? "translateX(0)" : "translateX(-33%)";

            return (
              <div
                key={element.path}
                className="px-4 pb-4 absolute overflow-y-scroll bg-white dark:bg-dark-background"
                style={{
                  width,
                  height,
                  // transform,
                  // transition: "transform 220ms ease",
                }}
              >
                <destination.component params={element.params} />
              </div>
            );
          })}
        </div>
      </div>
    </NavigationStackContext.Provider>
  );
}
