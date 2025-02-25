import { useAppDispatch, useAppSelector } from "../../lib/redux/hooks";
import {
  selectNavigationTab,
  setNavigationTab,
  selectSessionPanelOpen,
  selectExpandNavigationTab,
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
import { selectCurrentSessionId } from "@/lib/redux/slices/browserSlice";
import { useElementGeometry } from "@/lib/hooks/useElementGeometry";
import SessionPanel from "./session-panel/SessionPanel";
import { useState } from "react";

const CURL_RADIUS = 15;

export default function RootLayout() {
  const isSmallScreen = useSmallScreen();
  const [isGenomeViewLoaded, setIsGenomeViewLoaded] = useState(false);

  const dispatch = useAppDispatch();
  const sessionId = useAppSelector(selectCurrentSessionId);
  const navigationTab = useAppSelector(selectNavigationTab);
  const expandNavigationTab = useAppSelector(selectExpandNavigationTab);
  const sessionPanelOpen = useAppSelector(selectSessionPanelOpen);

  const isNavigationTabEmpty = navigationTab === null;

  const showRightTab = !isSmallScreen && !isNavigationTabEmpty;
  const showModal = isSmallScreen && !isNavigationTabEmpty;

  const {
    ref: contentRef,
    width: contentWidth,
    height: contentHeight,
  } = useElementGeometry();

  return (
    <div className="h-screen w-screen flex flex-col bg-black">
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
                className="h-full bg-white overflow-hidden absolute top-0 left-0 z-10"
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
                <div className="flex flex-col h-full">
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
            style={{
              pointerEvents: sessionPanelOpen ? "none" : "auto",
            }}
          >
            {/* MARK: - Genome View */}
            <motion.div
              className="h-full border-r bg-white overflow-hidden"
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
            >
              <motion.div
              // className="flex flex-col h-full w-screen overflow-auto"
              // key="genome-view"
              // initial={{ opacity: 0 }}
              // animate={{ opacity: 1 }}
              // exit={{ opacity: 0 }}
              // transition={{ duration: 0.3 }}
              // style={{ width: contentWidth, height: contentHeight }}
              >
                <GenomeView isGenomeViewLoaded={isGenomeViewLoaded} onLoadComplete={() => {
                  console.log("HUHUHUH tRIGGER")
                  setIsGenomeViewLoaded(true)
                }} />

              </motion.div>
              <AnimatePresence mode="wait">






                {!isGenomeViewLoaded ?
                  <motion.div
                    key="genome-picker"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GenomePicker />
                  </motion.div> : ""}



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
