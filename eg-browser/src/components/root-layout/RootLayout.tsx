import { useAppDispatch, useAppSelector } from "../../lib/redux/hooks";
import {
  selectNavigationTab,
  setNavigationTab,
  selectSessionPanelOpen,
  selectExpandNavigationTab,
  setSessionPanelOpen,
} from "../../lib/redux/slices/navigationSlice";
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
  selectCurrentSessionId,
  setCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import { useElementGeometry } from "@/lib/hooks/useElementGeometry";
import SessionPanel from "../sessions/SessionPanel";
import GoogleAnalytics from "./GoogleAnalytics";
import useBrowserInitialization from "@/lib/hooks/useBrowserInitialization";
import GenomeErrorBoundary from "../genome-view/GenomeErrorBoundary";
const CURL_RADIUS = 15;
import * as firebase from "firebase/app";

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
export default function RootLayout() {
  useBrowserInitialization();

  const isSmallScreen = useSmallScreen();

  const dispatch = useAppDispatch();
  const sessionId = useAppSelector(selectCurrentSessionId);
  const navigationTab = useAppSelector(selectNavigationTab);
  const expandNavigationTab = useAppSelector(selectExpandNavigationTab);
  const sessionPanelOpen = useAppSelector(selectSessionPanelOpen);

  const isNavigationTabEmpty = !sessionId || navigationTab === null;

  const showRightTab = !isSmallScreen && !isNavigationTabEmpty;
  const showModal = isSmallScreen && !isNavigationTabEmpty;

  const {
    ref: contentRef,
    width: contentWidth,
    height: contentHeight,
  } = useElementGeometry();

  const handleGoHome = () => {
    dispatch(setCurrentSession(null));
  };

  return (
    <div
      className="h-screen w-screen flex flex-col bg-black"
      data-theme={"dark"}
    >
      <GoogleAnalytics />
      <motion.div
        className="flex flex-col h-full"
        animate={{
          scale: showModal ? 0.95 : 1,
          filter: showModal
            ? "blur(5px) brightness(0.7)"
            : "blur(0px) brightness(1)",
          borderRadius: showModal ? 15 : 0,
        }}
      >
        <NavBar />
        <div className="flex flex-row flex-1 relative" ref={contentRef}>
          <AnimatePresence mode="wait">
            {sessionPanelOpen && (
              <motion.div
                className="h-full overflow-hidden absolute top-0 left-0 z-10"
                key="navigation-tabs"
                style={{
                  width: "25vw",
                  borderTopRightRadius: CURL_RADIUS,
                  borderBottomRightRadius: CURL_RADIUS,
                  color: "var(--font-container-color)",
                  backgroundColor: "var(--bg-container-color)",
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
                <div
                  className="flex flex-col"
                  style={{ height: contentHeight }}
                >
                  <SessionPanel />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MARK: - Main Content */}
          <motion.div
            className="flex flex-row flex-1 overflow-hidden"
            animate={{
              scale: sessionPanelOpen ? 0.95 : 1,
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
              className="h-full border-r overflow-hidden"
              initial={{
                width: "100vw",
              }}
              animate={{
                borderTopRightRadius: !showRightTab ? 0 : CURL_RADIUS,
                borderBottomRightRadius: !showRightTab ? 0 : CURL_RADIUS,
                borderTopLeftRadius: expandNavigationTab ? CURL_RADIUS : 0,
                borderBottomLeftRadius: expandNavigationTab ? CURL_RADIUS : 0,
                scale: expandNavigationTab ? 0.95 : 1,
                filter: expandNavigationTab
                  ? "blur(5px) brightness(0.7)"
                  : "blur(0px) brightness(1)",
                translateX: expandNavigationTab ? 50 : 0,
                width: !showRightTab ? "100vw" : "75vw",
              }}
              style={{
                pointerEvents: sessionPanelOpen ? "none" : "auto",
                backgroundColor: "var(--bg-container-color)",
              }}
            >
              <AnimatePresence mode="wait">
                {sessionId !== null ? (
                  <motion.div
                    className="flex flex-col h-full w-screen overflow-auto pb-44"
                    key="genome-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ width: contentWidth, height: contentHeight }}
                  >
                    <GenomeErrorBoundary onGoHome={handleGoHome}>
                      <GenomeView />
                    </GenomeErrorBoundary>
                  </motion.div>
                ) : (
                  <motion.div
                    className="h-full"
                    key="genome-picker"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ width: contentWidth, height: contentHeight }}
                  >
                    <GenomePicker />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* MARK: - Navigation Tabs */}
            <AnimatePresence mode="wait">
              {showRightTab && (
                <motion.div
                  className="h-full bg-white overflow-hidden z-10"
                  key="navigation-tabs"
                  initial={{
                    width: 0,
                    marginLeft: 0,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                  }}
                  animate={{
                    width: expandNavigationTab ? "75vw" : "25vw",
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
                    <div className="flex-1 relative">
                      <div
                        className="h-full"
                        style={{
                          display:
                            navigationTab === "tracks" ? "block" : "none",
                        }}
                      >
                        <TracksTab />
                      </div>
                      <div
                        className="h-full"
                        style={{
                          display: navigationTab === "apps" ? "block" : "none",
                        }}
                      >
                        <AppsTab />
                      </div>
                      <div
                        className="h-full"
                        style={{
                          display: navigationTab === "help" ? "block" : "none",
                        }}
                      >
                        <HelpTab />
                      </div>
                      <div
                        className="h-full"
                        style={{
                          display: navigationTab === "share" ? "block" : "none",
                        }}
                      >
                        <ShareTab />
                      </div>
                      <div
                        className="h-full"
                        style={{
                          display:
                            navigationTab === "settings" ? "block" : "none",
                        }}
                      >
                        <SettingsTab />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {showModal && (
          <motion.div
            className="absolute top-12 left-0 w-screen h-screen bg-white"
            style={{ borderRadius: CURL_RADIUS }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
          >
            <div className="flex flex-col h-full">
              {navigationTab === "tracks" && <TracksTab />}
              {navigationTab === "apps" && <AppsTab />}
              {navigationTab === "help" && <HelpTab />}
              {navigationTab === "share" && <ShareTab />}
              {navigationTab === "settings" && <SettingsTab />}

              <button
                className="absolute top-4 right-4"
                onClick={() => dispatch(setNavigationTab(null))}
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
