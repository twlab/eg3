import Logo from "../../assets/logo.png";
import { useAppDispatch, useAppSelector } from "../../lib/redux/hooks";
import {
  selectNavigationTab,
  selectSessionPanelOpen,
  setNavigationTab,
  setSessionPanelOpen,
} from "../../lib/redux/slices/navigationSlice";
import Button from "../ui/button/Button";
import { motion, AnimatePresence } from "framer-motion";
import useSmallScreen from "../../lib/hooks/useSmallScreen";
import {
  selectCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
import InlineEditable from "../ui/input/InlineEditable";
import { versionToLogoUrl } from "../genome-picker/genome-list";
import classNames from "classnames";

export default function NavBar() {
  const isSmallScreen = useSmallScreen();

  const dispatch = useAppDispatch();
  const currentTab = useAppSelector(selectNavigationTab);
  const currentSession = useAppSelector(selectCurrentSession);
  const sessionPanelOpen = useAppSelector(selectSessionPanelOpen);

  const genome = useCurrentGenome();

  const genomeLogoUrl: string | null = genome?.name ? versionToLogoUrl[genome.name].croppedUrl ?? versionToLogoUrl[genome.name].logoUrl : null;
  // const genomeLogoUrl: string | null = null;

  return (
    <div className="w-screen flex flex-row justify-between items-center p-2 border-b border-gray-300 bg-white">
      <div className="flex flex-row items-center gap-4 relative">
        <img
          src={genomeLogoUrl ?? Logo}
          alt="logo"
          className={classNames(
            'z-10',
            'size-12',
            currentSession ? 'cursor-pointer' : 'cursor-default',
            sessionPanelOpen ? 'bg-secondary' : '',
            genomeLogoUrl ? 'rounded-full p-1 outline outline-gray-200' : 'rounded-md p-2'
          )}
          onClick={() => {
            if (currentSession) {
              dispatch(setSessionPanelOpen(!sessionPanelOpen));
            }
          }}
        />
        {!isSmallScreen &&
          (currentSession ? (
            <div className="flex flex-row items-center gap-2 z-10">
              {currentSession.title.length > 0 && genome?.name && (
                <>
                  <p className="text-2xl text-primary font-medium">
                    {genome?.name}
                  </p>
                  <p className="text-2xl text-primary font-light">/</p>
                </>
              )}
              <InlineEditable
                value={
                  currentSession.title.length > 0
                    ? currentSession.title
                    : genome?.name ?? "Untitled"
                }
                onChange={(value) =>
                  dispatch(updateCurrentSession({ title: value }))
                }
                style={`text-2xl text-primary font-light ${currentSession.title.length > 0 ? "" : "font-medium"
                  }`}
                tooltip={
                  currentSession.title.length > 0
                    ? "Click to edit"
                    : "Click to add title"
                }
              />
            </div>
          ) : (
            <h1 className="text-2xl text-primary font-light">
              <span className="font-medium">WashU </span> Epigenome Browser
            </h1>
          ))}
      </div>
      <AnimatePresence>
        {currentSession !== null ? (
          <motion.div
            className="flex flex-row items-center gap-4"
            style={{
              pointerEvents: sessionPanelOpen ? "none" : "auto",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: sessionPanelOpen ? 0 : 1,
              y: 0,
            }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={() =>
                dispatch(
                  setNavigationTab(currentTab === "tracks" ? null : "tracks")
                )
              }
              active={currentTab === "tracks"}
            >
              Tracks
            </Button>
            <Button
              onClick={() =>
                dispatch(
                  setNavigationTab(currentTab === "apps" ? null : "apps")
                )
              }
              active={currentTab === "apps"}
            >
              Apps
            </Button>
            <Button
              onClick={() =>
                dispatch(
                  setNavigationTab(currentTab === "share" ? null : "share")
                )
              }
              active={currentTab === "share"}
            >
              Share
            </Button>
            <Button
              onClick={() =>
                dispatch(
                  setNavigationTab(
                    currentTab === "settings" ? null : "settings"
                  )
                )
              }
              active={currentTab === "settings"}
            >
              Settings
            </Button>
            <Button
              onClick={() =>
                dispatch(
                  setNavigationTab(currentTab === "help" ? null : "help")
                )
              }
              active={currentTab === "help"}
            >
              Help
            </Button>
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-row items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={() =>
                window.open("https://epigenomegateway.wustl.edu/legacy/", "_blank")
              }
              active={currentTab === "tracks"}
            >
              Use EG2 Instead
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
