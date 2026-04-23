import RootLayout from "./components/root-layout/RootLayout";
import AppProvider from "./lib/redux/AppProvider";
import { GenomeCoordinate } from "wuepgg3-track";
import "./index.css";
import { StoreConfig } from "./lib/redux/createStore";
import { SessionData } from "./lib/hooks/useSessionData";
import SessionDataMonitor from "./components/SessionDataMonitor";

/**
 * Props for the `App` component.
 */
export interface AppProps {
  /** Config for state, storeId: uniqueid for the GenomeHub component, can persist state by default or disable by setting `enablePersistence` to `false`   */
  storeConfig?: StoreConfig;

  /** Initial view region. String or object with `genomeCoordinate`. */
  viewRegion?:
  | string
  | { genomeCoordinate: string | GenomeCoordinate }
  | null
  | undefined;
  /** Genome name to load, e.g. 'hg38'. */
  genomeName?: string;
  /** Array of track configurations to render. */
  tracks?: Array<any>;
  /** Optional window width in pixels for responsive layout. */
  windowWidth?: number;
  /** Chromosome list or mapping used by the genome picker. */
  chromosomes?: any;
  /** Show the genome navigator panel. */
  showGenomeNavigator?: boolean;
  /** Show the top navigation bar. */
  showNavBar?: boolean;
  /** Show the toolbar controls. */
  showToolBar?: boolean;
  /** Show the genome picker in the navigation bar. */
  showGenomePicker?: boolean;
  /** Desired app width in pixels. */
  width?: number;
  /** Desired app height in pixels. */
  height?: number;
  onSessionUpdate?: (data: SessionData | null) => void;
  sessionId?: string | null | undefined; 
}

/**
 * Main application component.
 *
 * Example usage: <App storeConfig={...} genomeName="hg38" />
 */
export default function App({
  storeConfig,
  viewRegion,
  genomeName,
  tracks,
  showGenomeNavigator,
  showNavBar,
  showToolBar,
  showGenomePicker,
  sessionId,
  onSessionUpdate
}: AppProps) {
  return (
    // <MotionConfig transition={snappyTransition}>
    <AppProvider storeConfig={storeConfig}>
      {onSessionUpdate ? <SessionDataMonitor onSessionUpdate={onSessionUpdate} /> : null}
      <RootLayout
        viewRegion={viewRegion}
        sessionId={sessionId}
        genomeName={genomeName}
        tracks={tracks}
        showGenomeNavigator={showGenomeNavigator}
        showNavBar={showNavBar}
        showToolBar={showToolBar}
        showGenomePicker={showGenomePicker}

      />
    </AppProvider>
    // </MotionConfig>
  );
}

// const snappyTransition: any = {
//   type: "spring",
//   damping: 35,
//   stiffness: 400,
//   mass: 0.8,
// };
