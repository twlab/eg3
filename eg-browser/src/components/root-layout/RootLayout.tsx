import {
  useAppDispatch,
  useAppSelector,
  useUndoRedo,
} from "../../lib/redux/hooks";
import {
  selectSessionPanelOpen,
  setSessionPanelOpen,
} from "../../lib/redux/slices/navigationSlice";

import GenomePicker from "../genome-picker/GenomePicker";
import NavigationStack from "../core-navigation/NavigationStack";
import TabView from "../ui/tab-view/TabView";
import AddCustomGenome from "../genome-hub/AddCustomGenome";
import ImportSession from "../sessions/ImportSession";
import SessionList from "../sessions/SessionList";
import GenomeHubPanel from "../genome-hub/GenomeHubPanel";
import GenomeSchemaView from "../genome-hub/GenomeSchemaView";
import GenomeView from "../genome-view/GenomeView";
import NavBar from "../navbar/NavBar";
import {
  createSession,
  selectCurrentSessionId,
  setCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import SessionPanel from "../sessions/SessionPanel";
import GoogleAnalytics from "./GoogleAnalytics";
import useBrowserInitialization from "@/lib/hooks/useBrowserInitialization";
import GenomeErrorBoundary from "../genome-view/GenomeErrorBoundary";
import MouseFollowingTooltip from "../ui/tooltip/MouseFollowingTooltip";
const CURL_RADIUS = 15;
import * as firebase from "firebase/app";
import {
  selectDarkTheme,
  setNavBarVisibility,
  setNavigatorVisibility,
  setToolBarVisibility,
  selectIsNavBarVisible,
} from "@/lib/redux/slices/settingsSlice";
import { useEffect, useRef, useState } from "react";
import useSmallScreen from "@/lib/hooks/useSmallScreen";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

import {
  getGenomeConfig,
  ITrackModel,
  GenomeCoordinate,
  IGenome,
} from "wuepgg3-track";

import { resetState } from "@/lib/redux/slices/hubSlice";
import ResizablePanel from "../ui/panel/ResizablePanel";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
};

firebase.initializeApp(firebaseConfig);

export interface RootLayoutProps {
  viewRegion?: string | null | undefined;
  genomeName?: string;
  tracks?: Array<any> | ITrackModel[];
  windowWidth?: number;
  customGenome?: any;
  showGenomeNavigator?: boolean;
  // showNavBar?: boolean;
  // showToolBar?: boolean;
}

export interface GenomeHubProps {
  viewRegion?: string | null | undefined;
  genomeName?: string;
  tracks?: Array<any> | ITrackModel[];
  windowWidth?: number;
  customGenome?: any;
  showGenomeNavigator?: boolean;
  showNavBar?: boolean;
  showToolBar?: boolean;
  width?: number;
  height?: number;
}

export default function RootLayout(props: GenomeHubProps) {
  useBrowserInitialization();

  const dispatch = useAppDispatch();
  const sessionId = useAppSelector(selectCurrentSessionId);
  const sessionPanelOpen = useAppSelector(selectSessionPanelOpen);
  const darkTheme = useAppSelector(selectDarkTheme);
  const initialState = useRef(true);
  const { clearHistory } = useUndoRedo();
  const isSmallScreen = useSmallScreen();
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(
    Math.round(Math.min(window.innerWidth * 0.35, 480)),
  );

  useEffect(() => {
    const updatePanelWidth = () =>
      setPanelWidth(Math.round(Math.min(window.innerWidth * 0.35, 480)));

    window.addEventListener("resize", updatePanelWidth);
    return () => window.removeEventListener("resize", updatePanelWidth);
  }, []);

  // Check if running in package mode (props explicitly passed) or web mode
  const isPackageMode =
    (props.genomeName && props.tracks && props.viewRegion) ||
    props.customGenome;

  const handleGoHome = () => {
    dispatch(setCurrentSession(null));
  };

  // Reset state when session is cleared
  useEffect(() => {
    dispatch(resetState());
    clearHistory();
  }, [sessionId]);
  const showNavBar = isPackageMode
    ? useAppSelector(selectIsNavBarVisible)
    : true;
  function getConfig() {
    if (props.customGenome) {
      try {
        return props.customGenome;
      } catch {
        return null;
      }
    }
    if (props.genomeName) {
      return getGenomeConfig(props.genomeName);
    }
    return null;
  }

  useEffect(() => {
    // Only apply visibility props in package mode

    if (isPackageMode) {
      if (typeof props.showGenomeNavigator === "boolean") {
        dispatch(setNavigatorVisibility(props.showGenomeNavigator));
      }
      if (typeof props.showNavBar === "boolean") {
        dispatch(setNavBarVisibility(props.showNavBar));
      }
      if (typeof props.showToolBar === "boolean") {
        dispatch(setToolBarVisibility(props.showToolBar));
      }
    }
    // In web mode, ensure defaults are set to true (override any persisted false values)
    else {
      dispatch(setNavigatorVisibility(true));
      dispatch(setNavBarVisibility(true));
      dispatch(setToolBarVisibility(true));
    }
  }, [
    isPackageMode,
    props.showGenomeNavigator,
    props.showNavBar,
    props.showToolBar,
  ]);

  useEffect(() => {
    let usePrevSession = false;

    if (initialState.current && sessionId) {
      usePrevSession = true;
      initialState.current = false;
    } else if (!initialState.current) {
      usePrevSession = false;
    }

    if (
      !usePrevSession &&
      ((props.genomeName && props.tracks && props.viewRegion) ||
        props.customGenome)
    ) {
      const genomeConfig: IGenome | null = getConfig();
      if (genomeConfig) {
        if (!sessionId) {
          if (genomeConfig?.chromosomes && genomeConfig?.name) {
            const genome = genomeConfig;

            let additionalTracks: ITrackModel[] = props.tracks as ITrackModel[];

            dispatch(
              createSession({
                genome,
                viewRegion:
                  typeof props.viewRegion === "string" ||
                    props.viewRegion === null
                    ? undefined
                    : props.viewRegion,
                additionalTracks,
                width:
                  props.width !== null && props.width !== undefined
                    ? props.width
                    : null,
                height:
                  props.height !== null && props.height !== undefined
                    ? props.height
                    : null,
              }),
            );
          }
        } else {

          dispatch(
            updateCurrentSession({
              tracks: props.tracks as ITrackModel[],
              viewRegion:
                typeof props.viewRegion !== "string" ||
                  props.viewRegion === null
                  ? undefined
                  : (props.viewRegion as GenomeCoordinate),
              userViewRegion:
                typeof props.viewRegion !== "string" ||
                  props.viewRegion === null
                  ? undefined
                  : (props.viewRegion as GenomeCoordinate),
              genomeId: props.genomeName,
              customGenome: props.customGenome,
              width:
                props.width !== null && props.width !== undefined
                  ? props.width
                  : null,
              height:
                props.height !== null && props.height !== undefined
                  ? props.height
                  : null,
            }),
          );
        }
      }
    }
  }, [
    props.genomeName,
    props.tracks,
    props.viewRegion,
    props.customGenome,
    sessionId,
  ]);

  return (
    <div
      className={`h-screen flex flex-col ${darkTheme ? "dark" : ""}`}
      data-theme={darkTheme ? "dark" : "light"}
    >
      <GoogleAnalytics />

      <div className="flex flex-col h-full text-primary dark:text-white">
        {showNavBar === false ? (
          ""
        ) : (
          <div>
            <NavBar />
          </div>
        )}
        <AnimatePresence>
          {leftPanelOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute top-12 left-0 h-full z-60"
              style={{ width: "35vw", maxWidth: 480 }}
            >
              <ResizablePanel
                navigationPath={[]}
                initialWidth={Math.round(window.innerWidth * 0.35)}
                initialHeight={window.innerHeight}
                onClose={() => setLeftPanelOpen(false)}

              >
                <SessionList
                  onSessionClick={(s) => {
                    dispatch(setCurrentSession(s.id));
                    setLeftPanelOpen(false);
                  }}
                  showImportSessionButton
                  onRequestClose={() => setLeftPanelOpen(false)}
                />
              </ResizablePanel>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-row flex-1 relative bg-black">
          {!leftPanelOpen && (
            <motion.button
              onClick={() => setLeftPanelOpen((v) => !v)}
              initial={false}
              // position the button fixed relative to viewport so it follows the panel
              animate={{ left: 0 }}

              className="fixed p-2 rounded-full bg-white shadow"
              style={{ zIndex: 70, left: 0, top: "77px" }}
              aria-label={leftPanelOpen ? "Close panel" : "Open panel"}
            >
              <ChevronRightIcon
                className={`w-5 h-5 transform ${leftPanelOpen ? "rotate-180" : ""}`}
              />
            </motion.button>
          )}

          {/* {!sessionId && (
            <div
            className="h-full overflow-hidden absolute top-0 left-0 z-20"
            style={{
              width: "25vw",
              borderTopRightRadius: CURL_RADIUS,
              borderBottomRightRadius: CURL_RADIUS,
              transform: sessionPanelOpen
                ? "translateX(0)"
                : "translateX(-100%)",
              transition: "transform 0.3s ease",
              willChange: "transform",
            }}
          >
            <SessionPanel />
          </div>
          )

          } */}

          {/* MARK: - Main Content */}

          <div
            className="flex flex-1 h-full relative"

          // onClick={
          //   sessionPanelOpen
          //     ? () => dispatch(setSessionPanelOpen(false))
          //     : undefined
          // }
          >
            {/* MARK: - Genome View */}
            <div
              className="flex-1 overflow-y-auto relative bg-white dark:bg-dark-background"
              style={{

                zIndex: 5,

              }}
            >
              {!sessionId && (
                <div className="h-full w-full">

                  <TabView<"picker" | "add" | "import">
                    initialTab={"picker"}
                    tabs={[
                      {
                        label: "CHOOSE A GENOME",
                        value: "picker",
                        component: <GenomePicker />,
                      },
                      {
                        label: "ADD CUSTOM GENOME",
                        value: "add",
                        component: <AddCustomGenome />,
                      },
                      {
                        label: "LOAD A SESSION",
                        value: "import",
                        component: <ImportSession />,
                      },
                    ]}
                  />

                </div>
              )}
              {sessionId && (
                <GenomeErrorBoundary onGoHome={handleGoHome}>
                  <GenomeView />
                </GenomeErrorBoundary>
              )}
            </div>

            {/* <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 15,
                pointerEvents: sessionPanelOpen ? "auto" : "none",
                backgroundColor: "rgba(0,0,0,0.3)",
                opacity: sessionPanelOpen ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
              onClick={() => dispatch(setSessionPanelOpen(false))}
            /> */}
          </div>
        </div>
      </div>

      <MouseFollowingTooltip />
    </div>
  );
}
