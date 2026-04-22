import { MotionConfig } from "framer-motion";
import RootLayout from "./components/root-layout/RootLayout";
import AppProvider, { AppProviderProps } from "./lib/redux/AppProvider";

import "./index.css";

export interface AppProps {
  storeConfig?: AppProviderProps["storeConfig"];

  viewRegion?: string | { [key: string]: any } | null | undefined;
  genomeName?: string;
  tracks?: Array<any>;
  windowWidth?: number;
  chromosomes?: any;
  showGenomeNavigator?: boolean;
  showNavBar?: boolean;
  showToolBar?: boolean;
  width?: number;
  height?: number;
}

export default function App({
  storeConfig,
  viewRegion,
  genomeName,
  tracks,
  showGenomeNavigator,
  showNavBar,
  showToolBar,
}: AppProps) {
  return (
    <MotionConfig transition={snappyTransition}>
      <AppProvider storeConfig={storeConfig}>
        <RootLayout
          viewRegion={viewRegion}
          genomeName={genomeName}
          tracks={tracks}
          showGenomeNavigator={showGenomeNavigator}
          showNavBar={showNavBar}
          showToolBar={showToolBar}
          persistState={false}
        />
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
