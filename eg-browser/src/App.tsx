import { MotionConfig } from "framer-motion";
import RootLayout from "./components/root-layout/RootLayout";
import AppProvider, { AppProviderProps } from "./lib/redux/AppProvider";
import "./index.css";

export interface AppProps extends Omit<AppProviderProps, "children"> {
  storeConfig?: AppProviderProps["storeConfig"];

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
