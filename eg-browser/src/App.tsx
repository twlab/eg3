import { MotionConfig } from "framer-motion";
import RootLayout from "./components/root-layout/RootLayout";
import AppProvider, { AppProviderProps } from "./lib/redux/AppProvider";
import "./index.css";

export interface AppProps {
  storeConfig?: AppProviderProps["storeConfig"];
  [key: string]: any;
}

/**
 * app component can be exported and used as a package.
 * supports multiple isolated instances through the storeConfig prop. give it a unique id for separate instances
 *
 * @param props configuration and layout props
 */

// storeConfig={{ storeId: "genome-1" }}
// viewRegion={viewRegionInput}
// genomeName={genomeName}
// tracks={tracks}
// showGenomeNavigator={showGenomeNavigator}
// showNavBar={showNavBar}
// showToolBar={showToolBar}
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
