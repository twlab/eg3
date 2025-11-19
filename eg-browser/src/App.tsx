import { MotionConfig } from "framer-motion";
import RootLayout from "./components/root-layout/RootLayout";
import AppProvider, { AppProviderProps } from "./lib/redux/AppProvider";
import "./index.css";

export interface AppProps extends Omit<AppProviderProps, "children"> {
  /**
   * Unique identifier for this App instance.
   * Required when using multiple App instances to ensure isolated state.
   * Each instance should have a unique storeId.
   *
   * @example
   * <App storeConfig={{ storeId: 'genome-hub-1' }} />
   * <App storeConfig={{ storeId: 'genome-hub-2' }} />
   */
  storeConfig?: AppProviderProps["storeConfig"];

  /**
   * Any additional props to pass to RootLayout
   */
  [key: string]: any;
}

/**
 * Main App component that can be exported and used as a package.
 * Supports multiple isolated instances through the storeConfig prop.
 *
 * @param props Configuration and layout props
 */
export default function App({ storeConfig, ...rootLayoutProps }: AppProps) {
  return (
    <MotionConfig transition={snappyTransition}>
      <AppProvider storeConfig={storeConfig}>
        <RootLayout {...rootLayoutProps} />
      </AppProvider>
    </MotionConfig>
  );
}

const snappyTransition: any = {
  type: "spring",
  damping: 35,
  stiffness: 400,
  mass: 0.8,
};
