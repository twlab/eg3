import {
  useAppDispatch,
  useAppSelector,
  useUndoRedo,
} from "../../lib/redux/hooks";
import {
  selectNavigationTab,
  setNavigationTab,
  selectSessionPanelOpen,
  setSessionPanelOpen,
} from "../../lib/redux/slices/navigationSlice";

import GenomePicker from "../genome-picker/GenomePicker";
import GenomeView from "../genome-view/GenomeView";
import NavBar from "../navbar/NavBar";

import TracksTab from "./tabs/tracks/TracksTab";
import AppsTab from "./tabs/apps/AppsTab";
import HelpTab from "./tabs/HelpTab";
import ShareTab from "./tabs/ShareTab";
import SettingsTab from "./tabs/SettingsTab";
import useSmallScreen from "../../lib/hooks/useSmallScreen";
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
import { useEffect, useRef } from "react";

import {
  GenomeSerializer,
  getGenomeConfig,
  ITrackModel,
  GenomeCoordinate,
  GenomeConfig,
} from "wuepgg3-track";

import { resetState } from "@/lib/redux/slices/hubSlice";

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
  const navigationTab = useAppSelector(selectNavigationTab);
  const sessionPanelOpen = useAppSelector(selectSessionPanelOpen);
  const darkTheme = useAppSelector(selectDarkTheme);
  const isNavigationTabEmpty = !sessionId || navigationTab === null;
  const isSmallScreen = useSmallScreen();
  const showModal = isSmallScreen && !isNavigationTabEmpty;
  const initialState = useRef(true);
  const { clearHistory } = useUndoRedo();
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

  // For package mode: use Redux state (controlled by props)
  // For web mode: default to true (ignore persisted state)
  const showNavBar = isPackageMode
    ? useAppSelector(selectIsNavBarVisible)
    : true;
  function getConfig() {
    if (props.customGenome) {
      try {
        return GenomeSerializer.deserialize(props.customGenome);
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
      const genomeConfig: GenomeConfig | null = getConfig();
      if (genomeConfig) {
        if (!sessionId) {
          if (genomeConfig?.genome) {
            const genome = GenomeSerializer.serialize(genomeConfig);

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

  // Keyboard handler for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && navigationTab !== null) {
        dispatch(setNavigationTab(null));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigationTab, dispatch]);

  return (
    <div
      className={`h-screen flex flex-col ${darkTheme ? "dark" : ""}`}
      data-theme={darkTheme ? "dark" : "light"}
    >
      <GoogleAnalytics />

      {/* Main wrapper */}
      <div className="flex flex-col h-full text-primary dark:text-white">
        {showNavBar === false ? "" : <NavBar />}

        <div className="flex flex-row flex-1 relative bg-black overflow-hidden">

          {/* Session panel — position:absolute + transform so it never causes GenomeView to resize */}
          <div
            className="h-full overflow-hidden absolute top-0 left-0 z-20"
            style={{
              width: "25vw",
              borderTopRightRadius: CURL_RADIUS,
              borderBottomRightRadius: CURL_RADIUS,
              transform: sessionPanelOpen ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 0.3s ease",
              willChange: "transform",
            }}
          >
            <SessionPanel />
          </div>

          {/* MARK: - Main Content */}
          {/* NO filter here — use an overlay div below for the dim effect */}
          <div
            className="flex flex-1 h-full relative overflow-hidden"
            style={{
              borderRadius: sessionPanelOpen ? CURL_RADIUS : 0,
              transition: "border-radius 0.3s ease",
            }}
            onClick={
              sessionPanelOpen
                ? () => dispatch(setSessionPanelOpen(false))
                : undefined
            }
          >
            {/* MARK: - Genome View — fills entire area, nav tabs overlay on top */}
            <div
              className="flex-1 overflow-y-auto relative bg-white dark:bg-dark-background"
              style={{
                pointerEvents: sessionPanelOpen ? "none" : "auto",
              }}
            >
              {!sessionId && (
                <div className="h-full w-full">
                  <GenomePicker />
                </div>
              )}
            </div>

            {/* Overlay to dim main content when session panel is open — cheaper than filter on parent */}
            <div
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
            />
          </div>

          {/* Mobile modal — drops down over content area, clipped by parent overflow:hidden */}
          {isSmallScreen && (
            <div
              className="absolute inset-0 bg-white dark:bg-dark-background z-50 overflow-hidden"
              style={{
                transform: showModal ? "translateY(0)" : "translateY(-100%)",
                transition: "transform 0.3s ease",
                pointerEvents: showModal ? "auto" : "none",
              }}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                  <h2 className="text-lg text-gray-800 dark:text-white capitalize">
                    {navigationTab}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Press Esc to close
                    </span>
                    <button
                      onClick={() => dispatch(setNavigationTab(null))}
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Close tab"
                    >
                      <svg
                        className="w-5 h-5 text-gray-600 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col flex-1 overflow-hidden">
                  {navigationTab === "tracks" && <TracksTab />}
                  {navigationTab === "apps" && <AppsTab />}
                  {navigationTab === "help" && <HelpTab />}
                  {navigationTab === "share" && <ShareTab />}
                  {navigationTab === "settings" && <SettingsTab />}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 0, isolation: "isolate" }}>
        <GenomeErrorBoundary onGoHome={handleGoHome}>
          <GenomeView />
        </GenomeErrorBoundary>
      </div>
      <MouseFollowingTooltip />
    </div>
  );
}
