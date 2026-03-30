import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
import {
  BrowserSession,
  selectCurrentSession,
  setCurrentSession,
  updateCurrentSession,
} from "@/lib/redux/slices/browserSlice";
import {
  SunIcon,
  MoonIcon,
  BackspaceIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import classNames from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";

import Logo from "../../assets/logo.png";
import useSmallScreen from "../../lib/hooks/useSmallScreen";
import { useAppDispatch, useAppSelector } from "../../lib/redux/hooks";
import {
  NavigationRoute,
  selectNavigationTab,
  selectSessionPanelOpen,
  setNavigationTab,
  setSessionPanelOpen,
} from "../../lib/redux/slices/navigationSlice";
import { getSpeciesInfo } from "../genome-picker/genome-list";
import TabGenomePicker from "./TabGenomePicker";
import Button from "../ui/button/Button";
import ResizablePanel from "../ui/panel/ResizablePanel";
import IconButton from "../ui/button/IconButton";
import InlineEditable from "../ui/input/InlineEditable";
import Switch from "../ui/switch/Switch";
import {
  selectDarkTheme,
  setDarkTheme,
} from "@/lib/redux/slices/settingsSlice";
import { version } from "../../../package.json";
import TracksTab from "../root-layout/tabs/tracks/TracksTab";
import AppsTab from "../root-layout/tabs/apps/AppsTab";
import HelpTab from "../root-layout/tabs/HelpTab";
import ShareTab from "../root-layout/tabs/ShareTab";
import SettingsTab from "../root-layout/tabs/SettingsTab";
import type { NavigationPath } from "../core-navigation/NavigationStack";
import {
  OutsideClickDetector,
  GenomeSerializer,
  DisplayedRegionModel,
  RegionSet,


} from "wuepgg3-track";
import RegionsPanel from "./RegionsPanel";
import type { GenomeCoordinate } from "wuepgg3-track";

import { selectBundle, updateBundle } from "@/lib/redux/slices/hubSlice";
import { getDatabase, ref, set } from "firebase/database";
import SearchBar from "../genome-view/toolbar/SearchBar";
import { current } from "@reduxjs/toolkit";


export default function NavBar() {
  const bundle = useAppSelector(selectBundle);

  const isSmallScreen = useSmallScreen();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const [tabAnchorLeft, setTabAnchorLeft] = useState<number | null>(null);

  const dispatch = useAppDispatch();
  const currentTab = useAppSelector(selectNavigationTab);
  const currentSession: BrowserSession | null = useAppSelector(selectCurrentSession);

  const [panelCounter, setPanelCounter] = useState(0);
  const incrementPanelCounter = useCallback(() => {
    setPanelCounter((c) => c + 1);
  }, []);

  const [navigationPath, setNavigationPath] = useState<NavigationPath>([]);
  const handleNavigationPathChange = useCallback((p: NavigationPath) => {
    setNavigationPath(p);
  }, []);


  const sessionPanelOpen = useAppSelector(selectSessionPanelOpen);
  const darkTheme = useAppSelector(selectDarkTheme);

  const genome = useCurrentGenome();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const genomeConfig = useMemo(() => {
    return genome ? GenomeSerializer.deserialize(genome) : null;
  }, [genome]);

  useEffect(() => {

    setNavigationPath([])

  }, [currentTab]);

  const currentDisplayRegionModel = useMemo(() => {

    if (currentSession && genomeConfig) {
      try {
        if (currentSession.userViewRegion) {
          const parsed = genomeConfig.navContext.parse(
            currentSession.userViewRegion as GenomeCoordinate

          )
          if (parsed)
            return new DisplayedRegionModel(genomeConfig.navContext, ...parsed);

        }
        else if (currentSession.viewRegion && typeof currentSession.viewRegion !== "object") {
          const parsed = genomeConfig.navContext.parse(
            currentSession.viewRegion as GenomeCoordinate
          );
          if (parsed)
            return new DisplayedRegionModel(genomeConfig.navContext, ...parsed);

        }
        else {

          return new DisplayedRegionModel(genomeConfig.navContext)

        }
      }
      catch (e) {
        return new DisplayedRegionModel(genomeConfig.navContext)
      }
    }

  }, [currentSession?.userViewRegion, genomeConfig]);

  const handleNewRegionSelect = useCallback(
    (
      coordinate: GenomeCoordinate | string,
      highlightSearch?: boolean | undefined,
    ) => {
      if (!genomeConfig || !coordinate) return;
      if (highlightSearch && currentSession) {
        let contextCoord: any;
        if (currentSession.selectedRegionSet) {
          let setNavContext: any;
          if (typeof currentSession.selectedRegionSet === "object") {
            const newRegionSet = RegionSet.deserialize(
              currentSession.selectedRegionSet,
            );
            setNavContext = newRegionSet.makeNavContext();
          } else {
            setNavContext = (
              currentSession.selectedRegionSet as RegionSet
            ).makeNavContext();
          }
          contextCoord = setNavContext.parse(coordinate as GenomeCoordinate);
        } else {
          contextCoord = genomeConfig.navContext.parse(coordinate);
        }

        const newHightlight = {
          start: contextCoord.start,
          end: contextCoord.end,
          display: true,
          color: "rgba(0, 123, 255, 0.25)",
          tag: "",
        };
        const tmpHighlight = [...currentSession.highlights, newHightlight];
        dispatch(updateCurrentSession({ highlights: tmpHighlight }));
      }

      dispatch(
        updateCurrentSession({
          viewRegion: coordinate as GenomeCoordinate,
          userViewRegion: coordinate as GenomeCoordinate,
        }),
      );
    },
    [genomeConfig, dispatch],
  );

  const openTab = (tab: string | null, e?: React.MouseEvent) => {
    if (e && navRef.current) {
      const btnRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const navRect = navRef.current.getBoundingClientRect();
      setTabAnchorLeft(btnRect.left - navRect.left);
    }

    if (currentTab === tab) {
      setTabAnchorLeft(null);
      dispatch(setNavigationTab(null));
    } else {
      dispatch(setNavigationTab(tab as NavigationRoute));
    }
  };

  const genomeLogoUrl: { name: string; logo: string } | null = genome?.name
    ? (getSpeciesInfo(genome.name))

    : null;

  // const genomeLogoUrl: string | null = null;

  // Genome picker is now a tabbed panel component (TabGenomePicker).

  // Monitor localStorage quota errors
  useEffect(() => {
    const handleStorageError = (e: ErrorEvent) => {
      if (e.error?.name === "QuotaExceededError") {
        console.error("Error storing data", e.error);
        setStorageError(
          "Storage limit reached. Some changes may not be saved.",
        );
      }
    };

    window.addEventListener("error", handleStorageError);
    return () => window.removeEventListener("error", handleStorageError);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && currentTab !== null) {
        dispatch(setNavigationTab(null));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTab, dispatch]);

  return (
    <>
      {storageError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 text-sm flex justify-between items-center ">
          <span>{storageError}</span>
          <button
            onClick={() => {
              if (
                confirm(
                  "Clear all local sessions to free up space? This cannot be undone.",
                )
              ) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="ml-4 underline font-semibold"
          >
            Clear Storage
          </button>
        </div>
      )}
      <OutsideClickDetector
        onOutsideClick={() => dispatch(setNavigationTab(null))}
      >
        <div className="flex flex-row justify-between items-center outline outline-gray-300 bg-white dark:bg-dark-background relative pb-1 pt-1">
          <div
            ref={navRef}
            className="flex flex-row items-center  relative gap-1"
          >
            {currentSession ? (
              <BackspaceIcon
                className="size-5 text-gray-600 dark:text-dark-primary cursor-pointer"
                onClick={() => {
                  dispatch(setSessionPanelOpen(false));
                  dispatch(setCurrentSession(null));
                }}
              />
            ) : (
              <div className="size-5 flex-shrink-0" />
            )}

            <div
              className={classNames(
                "z-10",
                "h-9",
                "w-12",
                "rounded-sm",

                "relative",
                "overflow-hidden",
                currentSession ? "cursor-pointer" : "cursor-default",
              )}

              onClick={() => {
                dispatch(setSessionPanelOpen(false));
                dispatch(setCurrentSession(null));
              }}
            >
              <img
                src={Logo}
                alt=""
                className="absolute inset-0 w-full h-full object-contain"
              />
              {currentSession &&
                currentSession.title.length > 0 &&
                genome?.name && (
                  <>
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-center bg-white/50 dark:bg-dark-background/50 py-0.5">
                      <span
                        className="text-red-500 blue-100 font-mono leading-none"
                        style={{ fontSize: "10px" }}
                      >
                        {" "}
                        v{version}
                      </span>
                    </div>
                  </>
                )}
            </div>
            {/* Genome selector moved to a tabbed panel. A compact genome Button appears in the button row below. */}

            <div className="flex items-center">
              {isSmallScreen ? (
                <>
                  {currentSession && genome?.name && (
                    <Button
                      onClick={(e) => openTab("tabgenomepicker", e)}
                      active={currentTab === "tabgenomepicker"}
                      style={{
                        backgroundColor: sessionPanelOpen ? "#e6eef9" : "#f3f4f6",
                        color: "#0f172a",
                        width: "60px",
                        display: "flex",
                        alignItems: "center",

                      }}
                    >

                      <div className="relative flex-shrink-0" >
                        <div
                          style={{
                            backgroundImage: `url(${genomeLogoUrl?.logo
                              ? genomeLogoUrl.logo.startsWith("http")
                                ? genomeLogoUrl.logo
                                : import.meta.env.BASE_URL + genomeLogoUrl.logo
                              : ""
                              })`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            opacity: genomeLogoUrl?.logo ? 0.8 : 1,
                            width: 60
                          }}
                          onMouseEnter={(e) => {
                            if (genomeLogoUrl)
                              (e.currentTarget as HTMLElement).style.opacity = "1";
                          }}
                          onMouseLeave={(e) => {
                            if (genomeLogoUrl)
                              (e.currentTarget as HTMLElement).style.opacity = "0.8";
                          }}
                          className={classNames(
                            "z-10",
                            "h-9",

                            "rounded-xs",
                            "flex-shrink-0",
                            "transition-opacity",
                            "relative",
                            "overflow-hidden",
                            "cursor-pointer",

                            sessionPanelOpen
                              ? "bg-secondary dark:bg-dark-secondary"
                              : "",
                            genomeLogoUrl && !sessionPanelOpen
                              ? "outline outline-gray-200"
                              : "",
                          )}

                        >
                          {currentSession.title.length > 0 && genome?.name && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span
                                className="leading-tight text-center break-words w-full"
                                style={{
                                  color: genomeLogoUrl ? "white" : undefined,
                                  fontSize: "10px",
                                }}
                              >
                                <span
                                  className={
                                    genomeLogoUrl
                                      ? ""
                                      : "text-gray-700 dark:text-dark-primary"
                                  }
                                >
                                  {genomeLogoUrl?.name ? (
                                    <>
                                      {genomeLogoUrl.name}/
                                      <i>{genome.name}</i>
                                    </>
                                  ) : (
                                    <i>{genome.name}</i>
                                  )}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>

                      </div>

                    </Button>
                  )}
                  {currentDisplayRegionModel && genomeConfig ?
                    <Button
                      onClick={(e) => openTab("regions", e)}
                      active={currentTab === "regions"}
                      style={{ backgroundColor: "#1f2e46", color: "white", width: "100px", fontSize: "10px" }}
                    >
                      {currentDisplayRegionModel.currentRegionAsString()}
                    </Button> : ""}

                  {currentSession ? <IconButton
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    title="Menu"
                  >
                    {mobileMenuOpen ? (
                      <XMarkIcon className="h-6 w-6" />
                    ) : (
                      <Bars3Icon className="h-6 w-6" />
                    )}
                  </IconButton> : ""}
                </>
              ) : (
                <div>
                  {currentSession !== null ? (
                    <div
                      className="flex flex-row items-center gap-1"
                    // style={{
                    //   pointerEvents: sessionPanelOpen ? "none" : "auto",
                    // }}
                    >


                      {genome?.name && (
                        <Button
                          onClick={(e) => openTab("tabgenomepicker", e)}
                          active={currentTab === "tabgenomepicker"}
                          style={{
                            backgroundColor: sessionPanelOpen ? "#e6eef9" : "#f3f4f6",
                            color: "#0f172a",
                            width: "100px",
                            display: "flex",
                            alignItems: "center",

                          }}
                        >

                          <div className="relative flex-shrink-0" >
                            <div
                              style={{
                                backgroundImage: `url(${genomeLogoUrl?.logo
                                  ? genomeLogoUrl.logo.startsWith("http")
                                    ? genomeLogoUrl.logo
                                    : import.meta.env.BASE_URL + genomeLogoUrl.logo
                                  : ""
                                  })`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                backgroundRepeat: "no-repeat",
                                opacity: genomeLogoUrl?.logo ? 0.8 : 1,
                                width: 100
                              }}
                              onMouseEnter={(e) => {
                                if (genomeLogoUrl)
                                  (e.currentTarget as HTMLElement).style.opacity = "1";
                              }}
                              onMouseLeave={(e) => {
                                if (genomeLogoUrl)
                                  (e.currentTarget as HTMLElement).style.opacity = "0.8";
                              }}
                              className={classNames(
                                "z-10",
                                "h-9",

                                "rounded-xs",
                                "flex-shrink-0",
                                "transition-opacity",
                                "relative",
                                "overflow-hidden",
                                "cursor-pointer",

                                sessionPanelOpen
                                  ? "bg-secondary dark:bg-dark-secondary"
                                  : "",
                                genomeLogoUrl && !sessionPanelOpen
                                  ? "outline outline-gray-200"
                                  : "",
                              )}

                            >
                              {currentSession.title.length > 0 && genome?.name && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span
                                    className="leading-tight text-center break-words w-full"
                                    style={{
                                      color: genomeLogoUrl ? "white" : undefined,
                                      fontSize: "16px",
                                    }}
                                  >
                                    <span
                                      className={
                                        genomeLogoUrl
                                          ? ""
                                          : "text-gray-700 dark:text-dark-primary"
                                      }
                                    >
                                      {genomeLogoUrl?.name ? (
                                        <>
                                          {genomeLogoUrl.name}/
                                          <i>{genome.name}</i>
                                        </>
                                      ) : (
                                        <i>{genome.name}</i>
                                      )}
                                    </span>
                                  </span>
                                </div>
                              )}
                            </div>

                          </div>

                        </Button>
                      )}

                      {currentDisplayRegionModel && genomeConfig &&
                        <Button
                          onClick={(e) => openTab("regions", e)}
                          active={currentTab === "regions"}
                          style={{ backgroundColor: "#1f2e46", color: "white", width: "225px" }}
                        >
                          {currentDisplayRegionModel.currentRegionAsString()}
                        </Button>}
                      <Button
                        onClick={(e) => openTab("tracks", e)}
                        active={currentTab === "tracks"}
                        style={{ backgroundColor: "#bec6fb", color: "black" }}
                      >
                        Tracks
                      </Button>
                      <Button
                        onClick={(e) => openTab("apps", e)}
                        active={currentTab === "apps"}
                        style={{ backgroundColor: "#95E1D3", color: "#0f172a" }}
                      >
                        Apps
                      </Button>
                      <Button
                        onClick={(e) => openTab("share", e)}
                        active={currentTab === "share"}
                        style={{ backgroundColor: "#EAFFD0", color: "#0f172a" }}
                      >
                        Share
                      </Button>
                      <Button
                        onClick={(e) => openTab("settings", e)}
                        active={currentTab === "settings"}
                        style={{ backgroundColor: "#ffbebe", color: "black" }}
                      >
                        Settings
                      </Button>
                      <Button
                        onClick={(e) => openTab("help", e)}
                        active={currentTab === "help"}
                        style={{ backgroundColor: "#FCE38A", color: "#0f172a" }}
                      >
                        Help
                      </Button>
                      <SearchBar
                        isSearchFocused={isSearchFocused}
                        onSearchFocusChange={setIsSearchFocused}
                        onNewRegionSelect={handleNewRegionSelect}
                        windowWidth={window.innerWidth}
                        fontSize={16}
                        buttonPadding={6}

                      />
                    </div>
                  ) : (
                    ""
                  )}


                </div>
              )}
            </div>
            {!currentSession && (
              <div style={{ fontSize: 24 }}>
                <span>WashU </span> Epigenome Browser
              </div>


            )}
          </div>

          {!currentSession && (<div
            className="flex flex-row items-center gap-2 z-10"
            style={{ marginRight: 15 }}
          >
            <Button
              style={{
                backgroundColor:
                  "rgb(232 222 248 / var(--tw-bg-opacity, 1))",
                padding: "4px 8px",
                color: "black",
                width: "145px",
                height: "24px",

              }}
              onClick={() =>
                window.open(
                  "https://epigenomegateway.wustl.edu/browser2022/",
                  "_blank",
                )
              }
              active={currentTab === "tracks"}
            >
              Previous Version
            </Button>
            <Switch
              checked={darkTheme}
              onChange={(checked) => dispatch(setDarkTheme(checked))}
              checkedIcon={<MoonIcon className="w-4 h-4 text-gray-400" />}
              uncheckedIcon={<SunIcon className="w-4 h-4 text-white" />}
            /> </div>)}
          {!isSmallScreen &&
            (currentSession ? (
              <div
                className="h-9 flex flex-row items-center gap-1 z-10"

              >
                <InlineEditable
                  value={
                    currentSession.title.length > 0
                      ? currentSession.title
                      : "Untitled Session"
                  }
                  onChange={async (value) => {
                    try {
                      if (
                        bundle &&
                        bundle.bundleId &&
                        bundle.currentId &&
                        bundle.sessionsInBundle &&
                        bundle.sessionsInBundle[`${bundle.currentId}`]
                      ) {
                        const newSessionObj = {
                          ...bundle.sessionsInBundle[`${bundle.currentId}`],
                          label: value,
                        };

                        const newBundle = {
                          ...bundle,
                          sessionsInBundle: {
                            ...bundle.sessionsInBundle,
                            [bundle.currentId]: newSessionObj,
                          },
                        };

                        dispatch(updateBundle(newBundle));

                        const db = getDatabase();
                        try {
                          await set(
                            ref(db, `sessions/${bundle.bundleId}`),
                            JSON.parse(JSON.stringify(newBundle)),
                          );

                          console.log("Session saved!", "success", 2000);
                        } catch (error) {
                          console.error(error);
                          console.log(
                            "Error while saving session",
                            "error",
                            2000,
                          );
                        }
                      }

                      dispatch(updateCurrentSession({ title: value }));
                    } catch (error: any) {
                      if (error?.name === "QuotaExceededError") {
                        setStorageError(
                          "Storage limit reached. Unable to save changes.",
                        );
                      }
                      console.error("Error updating session:", error);
                    }
                  }}
                  style={`text-md font-light border border-blue-500 px-1 ${currentSession.title.length > 0 ? "" : "font-medium"
                    }`}
                  tooltip={
                    currentSession.title.length > 0
                      ? "Click to edit"
                      : "Click to add title"
                  }
                />

                <Switch
                  checked={darkTheme}
                  onChange={(checked) => dispatch(setDarkTheme(checked))}
                  checkedIcon={<MoonIcon className="w-4 h-4 text-gray-400" />}
                  uncheckedIcon={<SunIcon className="w-4 h-4 text-white" />}
                />
              </div>
            ) : (
              ""
            ))
          }





          <AnimatePresence>

            {isSmallScreen && mobileMenuOpen && (
              <motion.div
                className="absolute top-full left-0 right-0 bg-white dark:bg-dark-background border-b border-gray-300 shadow-lg z-50"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >


                <div className="flex flex-col p-4 gap-2">

                  {currentSession !== null ? (
                    <>
                      <Button
                        onClick={() => {
                          dispatch(
                            setNavigationTab(
                              currentTab === "tracks" ? null : "tracks",
                            ),
                          );
                          setMobileMenuOpen(false);
                        }}
                        active={currentTab === "tracks"}
                        style={{ width: "100%", justifyContent: "flex-start" }}
                      >
                        Tracks
                      </Button>
                      <Button
                        onClick={() => {
                          dispatch(
                            setNavigationTab(
                              currentTab === "apps" ? null : "apps",
                            ),
                          );
                          setMobileMenuOpen(false);
                        }}
                        active={currentTab === "apps"}
                        style={{ width: "100%", justifyContent: "flex-start" }}
                      >
                        Apps
                      </Button>
                      <Button
                        onClick={() => {
                          dispatch(
                            setNavigationTab(
                              currentTab === "share" ? null : "share",
                            ),
                          );
                          setMobileMenuOpen(false);
                        }}
                        active={currentTab === "share"}
                        style={{ width: "100%", justifyContent: "flex-start" }}
                      >
                        Share
                      </Button>
                      <Button
                        onClick={() => {
                          dispatch(
                            setNavigationTab(
                              currentTab === "settings" ? null : "settings",
                            ),
                          );
                          setMobileMenuOpen(false);
                        }}
                        active={currentTab === "settings"}
                        style={{ width: "100%", justifyContent: "flex-start" }}
                      >
                        Settings
                      </Button>
                      <Button
                        onClick={() => {
                          dispatch(
                            setNavigationTab(
                              currentTab === "help" ? null : "help",
                            ),
                          );
                          setMobileMenuOpen(false);
                        }}
                        active={currentTab === "help"}
                        style={{ width: "100%", justifyContent: "flex-start" }}
                      >
                        Help
                      </Button>
                    </>
                  ) : (
                    ""
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab content dropdown */}
          <AnimatePresence>
            {currentTab !== null && currentSession !== null && (
              <motion.div
                className={`absolute top-full ${isSmallScreen ? "left-0 right-0" : ""} bg-transparent z-50`}
                style={
                  !isSmallScreen && tabAnchorLeft != null
                    ? ({ left: `${tabAnchorLeft}px`, right: "auto" } as any)
                    : ({} as any)


                }
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ResizablePanel
                  title={currentTab || undefined}
                  initialWidth={250}
                  initialHeight={300}
                  onClose={() => dispatch(setNavigationTab(null))}
                  onIncrement={incrementPanelCounter}
                  navigationPath={navigationPath}
                >

                  {currentTab === 'regions' && currentDisplayRegionModel && genomeConfig && (
                    <RegionsPanel
                      selectedRegion={currentDisplayRegionModel}
                      onRegionSelected={handleNewRegionSelect}
                      contentColorSetup={{ background: "#F8FAFC", color: "#222" }}
                      genomeConfig={genomeConfig as any}
                      onClose={() => dispatch(setNavigationTab(null))}
                    />
                  )}
                  {currentTab === "tabgenomepicker" && (
                    <TabGenomePicker onClose={() => dispatch(setNavigationTab(null))} />
                  )}
                  {currentTab === "tracks" && (
                    <TracksTab
                      panelCounter={panelCounter}
                      onNavigationPathChange={handleNavigationPathChange}
                    />
                  )}
                  {currentTab === "apps" && (
                    <AppsTab
                      panelCounter={panelCounter}
                      onNavigationPathChange={handleNavigationPathChange}
                    />
                  )}
                  {currentTab === "help" && (
                    <HelpTab
                      panelCounter={panelCounter}
                      onNavigationPathChange={handleNavigationPathChange}
                    />
                  )}
                  {currentTab === "share" && (
                    <ShareTab
                      panelCounter={panelCounter}
                      onNavigationPathChange={handleNavigationPathChange}
                    />
                  )}
                  {currentTab === "settings" && (
                    <SettingsTab
                      panelCounter={panelCounter}
                      onNavigationPathChange={handleNavigationPathChange}
                    />
                  )}
                </ResizablePanel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </OutsideClickDetector >
    </>
  );
}
