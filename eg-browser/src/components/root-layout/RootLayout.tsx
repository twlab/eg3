import {
  useAppDispatch,
  useAppSelector,
  useUndoRedo,
} from "../../lib/redux/hooks";

import GenomePicker from "../genome-picker/GenomePicker";

import TabView from "../ui/tab-view/TabView";
import AddCustomGenome from "../genome-hub/AddCustomGenome";
import ImportSession from "../sessions/ImportSession";
import SessionList from "../sessions/SessionList";

import GenomeView from "../genome-view/GenomeView";
import NavBar from "../navbar/NavBar";
import {
  createSession,
  selectCurrentSessionId,
  setCurrentSession,
  updateCurrentSession,
  selectSessions,
  selectCurrentSession,
} from "@/lib/redux/slices/browserSlice";

import GoogleAnalytics from "./GoogleAnalytics";
import useBrowserInitialization from "@/lib/hooks/useBrowserInitialization";
import GenomeErrorBoundary from "../genome-view/GenomeErrorBoundary";
import MouseFollowingTooltip from "../ui/tooltip/MouseFollowingTooltip";

import * as firebase from "firebase/app";
import {
  selectDarkTheme,
  setNavBarVisibility,
  setNavigatorVisibility,
  setToolBarVisibility,
  selectIsNavBarVisible,
} from "@/lib/redux/slices/settingsSlice";
import {
  selectNavigationTab,
  setNavigationTab,
  selectNavSearchOpen,
  setNavSearchOpen,
} from "@/lib/redux/slices/navigationSlice";
import { useEffect, useRef, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import SessionToggleButton from "../sessions/SessionToggleButton";

import {
  getGenomeConfig,
  ITrackModel,
  GenomeCoordinate,
  IGenome,
  OutsideClickDetector,
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
  const sessions = useAppSelector(selectSessions);
  const currentSession = useAppSelector(selectCurrentSession);
  const darkTheme = useAppSelector(selectDarkTheme);
  const initialState = useRef(true);
  const { clearHistory } = useUndoRedo();
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const currentTab = useAppSelector(selectNavigationTab);
  const navSearchOpen = useAppSelector(selectNavSearchOpen);

  // Escape closes the session panel and/or the active nav tab, and the search bar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (leftPanelOpen) setLeftPanelOpen(false);
      if (currentTab !== null) dispatch(setNavigationTab(null));
      if (navSearchOpen) dispatch(setNavSearchOpen(false));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [leftPanelOpen, currentTab, navSearchOpen, dispatch]);

  // Check if running in package mode (props explicitly passed) or web mode
  const isPackageMode =
    (props.genomeName && props.tracks && props.viewRegion) ||
    props.customGenome;

  const handleGoHome = () => {
    dispatch(setCurrentSession(null));
  };

  const isNavBarVisible = useAppSelector(selectIsNavBarVisible);

  // Reset state when session is cleared
  useEffect(() => {
    console.log(sessionId)
    setLeftPanelOpen(false);
    dispatch(resetState());
    clearHistory();
  }, [sessionId]);
  const showNavBar = isPackageMode ? isNavBarVisible : true;
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

      <div className="flex flex-col h-full text-primary dark:text-white bg-secondary dark:bg-dark-secondary ">
        {showNavBar === false ? (
          ""
        ) : (
          <div>
            <NavBar />
          </div>
        )}
        <AnimatePresence>
          {leftPanelOpen ? (
            <OutsideClickDetector
              onOutsideClick={() => dispatch(setLeftPanelOpen(false))}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 h-full z-60"

              >
                <ResizablePanel
                  navigationPath={[]}
                  initialWidth={window.innerWidth * 0.4}
                  initialHeight={window.innerHeight - 50}
                  onClose={() => setLeftPanelOpen(false)}
                  header={false}
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
            </OutsideClickDetector>
          ) : null}
        </AnimatePresence>

        <div>
          {!leftPanelOpen && (
            <SessionToggleButton
              open={leftPanelOpen}
              onClick={() => setLeftPanelOpen((v) => !v)}
              className="absolute
               rounded-full bg-white shadow"
              style={{ zIndex: 40, left: 0, top: "115px" }}
              count={sessionId ? null : sessions.length}
              textContent={
                currentSession?.title
                  ? `Current Session: "${currentSession.title}"`
                  : "Previous sessions"
              }
            />
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
                <TabView<"picker" | "add" | "import">
                  centerTabs
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
