import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
import {
  selectCurrentSession,
  setCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  SunIcon,
  MoonIcon,
  BackspaceIcon,
} from "@heroicons/react/24/outline";
import classNames from "classnames";
import { AnimatePresence, motion } from "framer-motion";

import Logo from "../../assets/logo.png";
import useSmallScreen from "../../lib/hooks/useSmallScreen";
import {
  useAppDispatch,
  useAppSelector,
  useUndoRedo,
} from "../../lib/redux/hooks";
import {
  selectNavigationTab,
  selectSessionPanelOpen,
  setNavigationTab,
  setSessionPanelOpen,
} from "../../lib/redux/slices/navigationSlice";
import { versionToLogoUrl } from "../genome-picker/genome-list";
import Button from "../ui/button/Button";
import IconButton from "../ui/button/IconButton";
import InlineEditable from "../ui/input/InlineEditable";
import Switch from "../ui/switch/Switch";
import {
  selectDarkTheme,
  setDarkTheme,
} from "@/lib/redux/slices/settingsSlice";

export default function NavBar() {
  const isSmallScreen = useSmallScreen();

  const dispatch = useAppDispatch();
  const currentTab = useAppSelector(selectNavigationTab);
  const currentSession = useAppSelector(selectCurrentSession);
  const sessionPanelOpen = useAppSelector(selectSessionPanelOpen);
  const darkTheme = useAppSelector(selectDarkTheme);
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  const genome = useCurrentGenome();

  const genomeLogoUrl: string | null = genome?.name
    ? versionToLogoUrl[genome.name]?.croppedUrl ??
    versionToLogoUrl[genome.name]?.logoUrl
    : null;
  // const genomeLogoUrl: string | null = null;

  return (
    <div
      className="w-screen flex flex-row justify-between items-center p-2 border-b border-gray-300 bg-white dark:bg-dark-background"
    >
      <div className="flex flex-row items-center gap-3 relative">
        {currentSession && (
          <BackspaceIcon
            className="size-5 text-gray-600 dark:text-dark-primary cursor-pointer"
            onClick={() => {
              dispatch(setSessionPanelOpen(false));
              dispatch(setCurrentSession(null));
            }}
          />
        )}
        <img
          src={genomeLogoUrl ? import.meta.env.BASE_URL + genomeLogoUrl : Logo}
          alt="logo"
          className={classNames(
            "z-10",
            "size-12",
            currentSession ? "cursor-pointer" : "cursor-default",
            sessionPanelOpen ? "bg-secondary dark:bg-dark-secondary" : "",
            genomeLogoUrl ? "rounded-full p-1" : "rounded-md p-2",
            genomeLogoUrl && !sessionPanelOpen ? "outline outline-gray-200" : ""
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
                //replaced text-primary with var font color
                <>
                  <p className="text-2xl  font-medium">
                    {genome?.name}
                  </p>

                  <p className="text-2xl font-light">
                    /
                  </p>
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
                style={`text-2xl font-light border border-blue-500 px-2 ${currentSession.title.length > 0 ? "" : "font-medium"
                  }`}
                tooltip={
                  currentSession.title.length > 0
                    ? "Click to edit"
                    : "Click to add title"
                }
              />
            </div>
          ) : (
            <h1
              className="text-2xl font-light"
            >
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
            <IconButton
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
              className={!canUndo ? "opacity-50 cursor-not-allowed" : ""}
            >
              <ArrowUturnLeftIcon className="h-5 w-5" />
            </IconButton>
            <IconButton
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
              className={!canRedo ? "opacity-50 cursor-not-allowed" : ""}
            >
              <ArrowUturnRightIcon className="h-5 w-5" />
            </IconButton>

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
            <Switch
              checked={darkTheme}
              onChange={(checked) => dispatch(setDarkTheme(checked))}
              checkedIcon={<MoonIcon className="w-4 h-4 text-gray-400" />}
              uncheckedIcon={<SunIcon className="w-4 h-4 text-white" />}
            />
            <Button
              style={{
                backgroundColor: "rgb(232 222 248 / var(--tw-bg-opacity, 1))",
                padding: "4px 8px",
                color: "black",
              }}
              onClick={() =>
                window.open(
                  "https://epigenomegateway.wustl.edu/browser2022/",
                  "_blank"
                )
              }
              active={currentTab === "tracks"}
            >
              Use Previous Version
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
