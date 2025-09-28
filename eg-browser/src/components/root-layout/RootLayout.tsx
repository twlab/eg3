import { useAppDispatch, useAppSelector } from "../../lib/redux/hooks";
import {
  selectNavigationTab,
  setNavigationTab,
  selectSessionPanelOpen,
  selectExpandNavigationTab,
  setSessionPanelOpen,
} from "../../lib/redux/slices/navigationSlice";
import { Tool } from "wuepgg3-track";
import { selectTool } from "../../lib/redux/slices/utilitySlice";
import GenomePicker from "../genome-picker/GenomePicker";
import GenomeView from "../genome-view/GenomeView";
import NavBar from "../navbar/NavBar";
import { AnimatePresence, motion } from "framer-motion";
import TracksTab from "./tabs/tracks/TracksTab";
import AppsTab from "./tabs/apps/AppsTab";
import HelpTab from "./tabs/HelpTab";
import ShareTab from "./tabs/ShareTab";
import SettingsTab from "./tabs/SettingsTab";
import useSmallScreen from "../../lib/hooks/useSmallScreen";
import {
  createSession,
  selectCurrentSession,
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
  resetSettings,
  selectDarkTheme,
  selectCookieConsentStatus,
  setNavBarVisibility,
  setNavigatorVisibility,
  setToolBarVisibility,
} from "@/lib/redux/slices/settingsSlice";
import { useEffect } from "react";

import {
  GenomeSerializer,
  getGenomeConfig,
  IGenome,
  ITrackModel,
  generateUUID,
} from "wuepgg3-track";

// const firebaseConfig = {
//   apiKey: "AIzaSyBvzikxx1wSAoVp_4Ra2IlktJFCwq8NAnk",
//   authDomain: "chadeg3-83548.firebaseapp.com",
//   databaseURL: "https://chadeg3-83548-default-rtdb.firebaseio.com",
//   storageBucket: "chadeg3-83548.firebasestorage.app",
// };
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
};

firebase.initializeApp(firebaseConfig);

export interface TracksProps {
  url?: string;
  name?: string;
  options?: { [key: string]: any };
  type: string;
  showOnHubLoad?: boolean;
  metadata?: { [key: string]: any };
}
export interface RootLayoutProps {
  viewRegion?: string | null | undefined;
  genomeName?: string;
  tracks?: TracksProps[] | ITrackModel[];
  windowWidth?: number;
  customGenome?: any;
  showGenomeNavigator?: boolean;
  showNavBar?: boolean;
  showToolBar?: boolean;
}

export default function RootLayout(props: RootLayoutProps) {
  useBrowserInitialization();

  const dispatch = useAppDispatch();
  const sessionId = useAppSelector(selectCurrentSessionId);
  const currentSession = useAppSelector(selectCurrentSession);
  const navigationTab = useAppSelector(selectNavigationTab);
  const expandNavigationTab = useAppSelector(selectExpandNavigationTab);
  const sessionPanelOpen = useAppSelector(selectSessionPanelOpen);
  const darkTheme = useAppSelector(selectDarkTheme);
  const tool = useAppSelector(selectTool);
  const cookieConsentStatus = useAppSelector(selectCookieConsentStatus);
  const isNavigationTabEmpty = !sessionId || navigationTab === null;
  const isSmallScreen = useSmallScreen();
  const showRightTab = !isSmallScreen && !isNavigationTabEmpty;
  const showModal = isSmallScreen && !isNavigationTabEmpty;

  const handleGoHome = () => {
    dispatch(setCurrentSession(null));
  };

  // Keyboard handler for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showModal || expandNavigationTab || showRightTab) {
          // Close expanded navigation, modal, or right tab
          dispatch(setNavigationTab(null));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal, expandNavigationTab, showRightTab, dispatch]);

  return (
    <div
      className={`h-screen flex flex-col ${darkTheme ? "dark" : ""}`}
      data-theme={darkTheme ? "dark" : "light"}
    >
      {/* {import.meta.env.VITE_PACKAGE === "false" ?  */}
      <GoogleAnalytics />
      {/* : null} */}
      <motion.div
        className="flex flex-col h-full text-primary dark:text-white"
        animate={{
          scale: showModal ? 0.95 : 1,
          filter: showModal
            ? "blur(5px) brightness(0.7)"
            : "blur(0px) brightness(1)",
          borderRadius: showModal ? 15 : 0,
        }}
      >
        {/* {import.meta.env.VITE_PACKAGE === "false" || props.showNavBar ? ( */}
        <NavBar />
        {/* ) : null} */}
        <div className="flex flex-row flex-1 relative bg-black">
          <AnimatePresence mode="wait">
            {sessionPanelOpen && (
              <motion.div
                className="h-full overflow-hidden absolute top-0 left-0 z-10"
                key="navigation-tabs"
                style={{
                  width: "25vw",
                  borderTopRightRadius: CURL_RADIUS,
                  borderBottomRightRadius: CURL_RADIUS,
                }}
                initial={{
                  translateX: "-100%",
                }}
                animate={{
                  translateX: 0,
                }}
                exit={{
                  translateX: "-100%",
                }}
              >
                <div className="flex flex-col">
                  <SessionPanel />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MARK: - Main Content */}
          <motion.div
            className="flex flex-row flex-1 overflow-hidden bg-black"
            animate={{
              // scale: sessionPanelOpen ? 0.95 : 1,
              borderRadius: sessionPanelOpen ? 15 : 0,
              filter: sessionPanelOpen
                ? "blur(5px) brightness(0.7)"
                : "blur(0px) brightness(1)",
            }}
            onClick={
              sessionPanelOpen
                ? () => dispatch(setSessionPanelOpen(false))
                : undefined
            }
          >
            {/* MARK: - Genome View */}
            <motion.div
              className="h-full overflow-hidden bg-white dark:bg-dark-background"
              initial={{
                width: "100vw",
              }}
              animate={{
                borderTopRightRadius: !showRightTab ? 0 : CURL_RADIUS,
                borderBottomRightRadius: !showRightTab ? 0 : CURL_RADIUS,
                borderTopLeftRadius: expandNavigationTab ? CURL_RADIUS : 0,
                borderBottomLeftRadius: expandNavigationTab ? CURL_RADIUS : 0,
                // scale: expandNavigationTab ? 0.95 : 1,
                filter: expandNavigationTab
                  ? "brightness(0.85)"
                  : "brightness(1)",

                // filter: "blur(0px) brightness(1)",
                // translateX: expandNavigationTab ? 50 : 0,
                // width: !showRightTab ? "100vw" : "75vw",
              }}
              style={{
                pointerEvents: sessionPanelOpen ? "none" : "auto",
              }}
            >
              {/* Keep both components mounted, just hide/show them */}
              <motion.div
                className="flex flex-col w-screen pb-20"
                style={{
                  display: sessionId ? 'flex' : 'none'
                }}
                animate={{
                  opacity: sessionId ? 1 : 0
                }}
                transition={{ duration: 0.2 }}
              >
                <GenomeErrorBoundary onGoHome={handleGoHome}>
                  <GenomeView />
                </GenomeErrorBoundary>
              </motion.div>
              {!sessionId ? <motion.div
                className="h-full w-full"

                animate={{
                  opacity: 1
                }}
                transition={{ duration: 0.2 }}
              >
                <GenomePicker />
              </motion.div> : ""}

            </motion.div>

            {/* MARK: - Navigation Tabs */}
            <AnimatePresence>
              {showRightTab && (
                <motion.div
                  className="h-full overflow-hidden z-10"
                  key="navigation-tabs"
                  initial={{
                    width: 0,
                    marginLeft: 0,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                  }}
                  animate={{
                    width: expandNavigationTab ? "75vw" : "35vw",
                    marginLeft: 5,
                    borderTopLeftRadius: CURL_RADIUS,
                    borderBottomLeftRadius: CURL_RADIUS,
                  }}
                  exit={{
                    width: 0,
                    marginLeft: 0,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                  }}
                >
                  <div className="flex flex-col h-full">
                    {/* Tab Header with close button */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                      <h2 className="text-2xl  text-gray-800 dark:text-white capitalize">
                        {navigationTab}
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Press Esc to close
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ||
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
                              strokeWidth={1.5}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 relative overflow-hidden">
                      <div className="h-full">
                        {navigationTab === "tracks" && <TracksTab />}
                        {navigationTab === "apps" && <AppsTab />}
                        {navigationTab === "help" && <HelpTab />}
                        {navigationTab === "share" && <ShareTab />}
                        {navigationTab === "settings" && <SettingsTab />}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      {showModal && (
        <motion.div
          className="absolute top-12 left-0 w-screen h-screen bg-white"
          style={{ borderRadius: CURL_RADIUS }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
        >
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
          <div className="flex flex-col h-full">
            {navigationTab === "tracks" && <TracksTab />}
            {navigationTab === "apps" && <AppsTab />}
            {navigationTab === "help" && <HelpTab />}
            {navigationTab === "share" && <ShareTab />}
            {navigationTab === "settings" && <SettingsTab />}
          </div>
        </motion.div>
      )}

      {/* Mouse-following tool tooltip */}
      <MouseFollowingTooltip />
    </div>
  );
}
