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
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import classNames from "clsx";
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
  selectNavSearchOpen,
  setNavSearchOpen,
} from "../../lib/redux/slices/navigationSlice";
import { getSpeciesInfo } from "../genome-picker/genome-list";
import TabGenomePicker from "./TabGenomePicker";
import Button from "../ui/button/Button";
import ResizablePanel from "../ui/panel/ResizablePanel";
import IconButton from "../ui/button/IconButton";
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
  GenomeSerializer,
  DisplayedRegionModel,
  RegionSet,
} from "wuepgg3-track";
import RegionsPanel from "./RegionsPanel";
import type { GenomeCoordinate } from "wuepgg3-track";

import SearchBar from "../genome-view/toolbar/SearchBar";


export default function NavBar() {


  const isSmallScreen = useSmallScreen();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const tabButtonsRef = useRef<HTMLDivElement | null>(null);
  const [tabAnchorLeft, setTabAnchorLeft] = useState<number | null>(null);

  const dispatch = useAppDispatch();
  const currentTab = useAppSelector(selectNavigationTab);
  const currentSession: BrowserSession | null =
    useAppSelector(selectCurrentSession);

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
  const isSearchFocused = useAppSelector(selectNavSearchOpen);
  const setIsSearchFocused = useCallback((v: boolean) => dispatch(setNavSearchOpen(v)), [dispatch]);

  // Reset search when switching to mobile so the expanded bar doesn't bleed over
  useEffect(() => { if (isSmallScreen) dispatch(setNavSearchOpen(false)); }, [isSmallScreen, dispatch]);
  const genomeConfig = useMemo(() => {
    return genome ? GenomeSerializer.deserialize(genome) : null;
  }, [genome]);
  useEffect(() => {

    if (!currentSession) {
      dispatch(setNavigationTab(null))

    }
  }, [currentSession]);
  useEffect(() => {
    setNavigationPath([]);
  }, [currentTab]);

  const currentDisplayRegionModel = useMemo(() => {
    if (currentSession && genomeConfig) {
      let newViewRegion;
      try {
        const userViewRegion = currentSession?.userViewRegion;
        const selectedRegionSet: any = currentSession?.selectedRegionSet;
        const overrideViewRegion = currentSession?.overrideViewRegion;
        if (userViewRegion) {
          if (selectedRegionSet) {
            let setNavContext;
            if (typeof selectedRegionSet === "object") {
              const newRegionSet = RegionSet.deserialize(selectedRegionSet);
              setNavContext = newRegionSet.makeNavContext();
            } else {
              setNavContext = selectedRegionSet.makeNavContext();
            }
            setNavContext._isRegionSet = true;

            const contextCoord = setNavContext.parse(
              userViewRegion as GenomeCoordinate,
            );

            return new DisplayedRegionModel(setNavContext, ...contextCoord);
          } else {
            newViewRegion = genomeConfig.navContext.parse(
              userViewRegion as GenomeCoordinate,
            );
          }
        } else if (overrideViewRegion) {
          newViewRegion = genomeConfig.navContext.parse(
            overrideViewRegion as GenomeCoordinate,
          );
        } else {
          newViewRegion = genomeConfig.navContext.parse(
            genomeConfig.defaultRegion,
          );
        }

        if (newViewRegion) {
          return new DisplayedRegionModel(
            genomeConfig.navContext,
            ...newViewRegion,
          );
        }
      } catch (e) {
        return new DisplayedRegionModel(genomeConfig.navContext);
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
      dispatch(setNavSearchOpen(false));
      dispatch(setNavigationTab(tab as NavigationRoute));
    }
  };

  const genomeLogoUrl: { name: string; logo: string } | null = genome?.name
    ? getSpeciesInfo(genome.name)
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
      {/* Single full-width navbar row */}
      <div
        ref={navRef}
        className="flex flex-row pt-1 pb-1 items-center outline outline-gray-300 bg-white dark:bg-dark-background border-b border-gray-300 dark:border-gray-600  relative  px-2 gap-1"
      >
        {/* Back button */}
        {currentSession ? (
          <BackspaceIcon
            className="size-5 flex-shrink-0 text-gray-600 dark:text-dark-primary cursor-pointer transition-colors duration-150 hover:text-red-500 dark:hover:text-red-400"
            onClick={() => {
              dispatch(setSessionPanelOpen(false));
              dispatch(setCurrentSession(null));
            }}
          />
        ) : (
          <div className="size-5 flex-shrink-0" />
        )}

        {/* Logo */}
        <div
          className={classNames(
            "z-10",
            "h-8",
            "w-12",
            "flex-shrink-0",
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
              <div className="absolute top-0 left-0 right-0 flex items-center justify-center bg-white/50 dark:bg-dark-background/50 py-0.5">
                <span
                  className="text-red-500 font-mono leading-none"
                  style={{ fontSize: "10px" }}
                >
                  v{version}
                </span>
              </div>
            )}
        </div>

        {/* Tab buttons / mobile controls — takes remaining space */}
        <div className="flex-1 flex items-center min-w-0">
          {isSmallScreen ? (
            <>
              <div
                className="flex flex-row flex-wrap items-center gap-1"
                style={{
                  opacity: isSearchFocused ? 0 : 1,
                  pointerEvents: isSearchFocused ? "none" : "auto",
                  transition: "opacity 0.15s ease",
                }}
              >
                {currentSession && genome?.name && (
                  <Button
                    onClick={(e) => openTab("tab-genome-picker", e)}
                    active={currentTab === "tab-genome-picker"}
                    style={{
                      backgroundColor: sessionPanelOpen ? "#e6eef9" : "#f3f4f6",
                      color: "#0f172a",
                      width: "60px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div className="relative flex-shrink-0">
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
                          width: 60,
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
                          "z-10", "h-8", "rounded-xs", "flex-shrink-0",
                          "transition-opacity", "relative", "overflow-hidden", "cursor-pointer",
                          sessionPanelOpen ? "bg-secondary dark:bg-dark-secondary" : "",
                          genomeLogoUrl && !sessionPanelOpen ? "outline outline-gray-200" : "",
                        )}
                      >
                        {currentSession.title.length > 0 && genome?.name && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span
                              className="leading-tight text-center break-words w-full"
                              style={{ color: genomeLogoUrl ? "white" : undefined, fontSize: "10px" }}
                            >
                              <span className={genomeLogoUrl ? "" : "text-gray-700 dark:text-dark-primary"}>
                                {genomeLogoUrl?.name ? (
                                  <>{genomeLogoUrl.name}/<i>{genome.name}</i></>
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
                {currentDisplayRegionModel && genomeConfig ? (
                  <Button
                    onClick={(e) => openTab("regions", e)}
                    active={currentTab === "regions"}
                    style={{ backgroundColor: "#1f2e46", color: "white", width: "100px", fontSize: "10px" }}
                  >
                    {currentDisplayRegionModel.currentRegionAsString()}
                  </Button>
                ) : ""}
                {currentSession ? (
                  <><IconButton onClick={() => { setMobileMenuOpen(!mobileMenuOpen); dispatch(setNavigationTab(null)); }} title="Menu">
                    {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                  </IconButton><>


                      <div className="relative group flex-shrink-0 ml-1">
                        <button
                          onClick={() => {
                            dispatch(setNavigationTab(null));
                            dispatch(setNavSearchOpen(true));
                          }}
                          aria-label="Open search"
                          className="group flex items-center justify-center w-9 h-8 rounded-full bg-gray-100 hover:bg-blue-100 dark:bg-gray-700 dark:hover:bg-blue-900 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:scale-110" />
                        </button>
                        {/* Hover tooltip */}
                        <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-max opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-300 z-50">
                          {/* Arrow pointing up toward button */}
                          <div className="flex justify-center">
                            <div className="w-2.5 h-2.5 bg-gray-900 dark:bg-gray-700 rotate-45 -mb-1.5 relative z-10" />
                          </div>
                          <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-lg">
                            <p className="font-semibold mb-1 text-blue-300">Search for</p>
                            <ul className="space-y-0.5 text-gray-200">
                              <li className="flex items-center gap-1"><span className="text-green-400">›</span> Regions <span className="text-gray-400 ml-1">e.g. chr1:100-200</span></li>
                              <li className="flex items-center gap-1"><span className="text-green-400">›</span> Genes <span className="text-gray-400 ml-1">e.g. BRCA1</span></li>
                              <li className="flex items-center gap-1"><span className="text-green-400">›</span> SNPs <span className="text-gray-400 ml-1">e.g. rs123456</span></li>
                            </ul>
                          </div>
                        </div>
                      </div>


                    </>

                  </>
                ) : ""}
              </div>          {isSearchFocused ? (
                <div
                  style={{
                    position: "absolute",
                    left: "20%",
                    width: "calc(60%)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 100,
                    minWidth: 150,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <SearchBar
                      isSearchFocused={isSearchFocused}
                      onSearchFocusChange={setIsSearchFocused}
                      onNewRegionSelect={handleNewRegionSelect}
                      windowWidth={window.innerWidth}
                      fontSize={16}
                      buttonPadding={6} />
                  </div>
                  <button
                    onClick={() => dispatch(setNavSearchOpen(false))}
                    onMouseDown={(e) => e.stopPropagation()}
                    aria-label="Close search"
                    title="Close search"
                    className="p-1 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-700 transition-colors duration-150 flex-shrink-0"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : ""}
            </>
          ) : (
            <>
              {currentSession !== null ? (
                <div className="flex flex-row flex-wrap items-center gap-1 flex-1 min-w-0">
                  {/* Fading tab buttons */}
                  <div
                    ref={tabButtonsRef}
                    className="flex flex-row flex-wrap items-center gap-1"
                    style={{
                      opacity: isSearchFocused ? 0 : 1,
                      pointerEvents: isSearchFocused ? "none" : "auto",
                      transition: "opacity 0.15s ease",
                    }}
                  >
                    {genome?.name && (
                      <Button
                        onClick={(e) => openTab("tab-genome-picker", e)}
                        active={currentTab === "tab-genome-picker"}
                        style={{
                          backgroundColor: sessionPanelOpen ? "#e6eef9" : "#f3f4f6",
                          color: "#0f172a",
                          width: "100px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <div className="relative flex-shrink-0">
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
                              width: 100,
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
                              "z-10", "h-8", "rounded-xs", "flex-shrink-0",
                              "transition-opacity", "relative", "overflow-hidden", "cursor-pointer",
                              sessionPanelOpen ? "bg-secondary dark:bg-dark-secondary" : "",
                              genomeLogoUrl && !sessionPanelOpen ? "outline outline-gray-200" : "",
                            )}
                          >
                            {currentSession.title.length > 0 && genome?.name && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span
                                  className="leading-tight text-center break-words w-full"
                                  style={{ color: genomeLogoUrl ? "white" : undefined, fontSize: "16px" }}
                                >
                                  <span className={genomeLogoUrl ? "" : "text-gray-700 dark:text-dark-primary"}>
                                    {genomeLogoUrl?.name ? (
                                      <>{genomeLogoUrl.name}/<i>{genome.name}</i></>
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
                    {currentDisplayRegionModel && genomeConfig && (
                      <Button
                        onClick={(e) => openTab("regions", e)}
                        active={currentTab === "regions"}
                        style={{ backgroundColor: "#1f2e46", color: "white", width: "fit-content", padding: "4px 6px" }}
                      >
                        {currentDisplayRegionModel.currentRegionAsString()}
                      </Button>
                    )}
                    <Button
                      onClick={(e) => openTab("tracks", e)}
                      active={currentTab === "tracks"}
                      style={{ backgroundColor: "#dbe0ff", color: "#1e1b4b", width: "fit-content", padding: "4px 6px", fontWeight: 600 }}
                    >
                      Tracks
                    </Button>
                    <Button
                      onClick={(e) => openTab("apps", e)}
                      active={currentTab === "apps"}
                      style={{ backgroundColor: "#dafdf7", color: "#064e3b", width: "fit-content", padding: "4px 6px", fontWeight: 600 }}
                    >
                      Apps
                    </Button>
                    <Button
                      onClick={(e) => openTab("share", e)}
                      active={currentTab === "share"}
                      style={{ backgroundColor: "#e6f9d2", color: "#14532d", width: "fit-content", padding: "4px 6px", fontWeight: 600 }}
                    >
                      Share
                    </Button>
                    <Button
                      onClick={(e) => openTab("settings", e)}
                      active={currentTab === "settings"}
                      style={{ backgroundColor: "#ffc4c4", color: "#7f1d1d", width: "fit-content", padding: "4px 6px", fontWeight: 600 }}
                    >
                      Settings
                    </Button>
                    <Button
                      onClick={(e) => openTab("help", e)}
                      active={currentTab === "help"}
                      style={{ backgroundColor: "#fff1be", color: "#713f12", width: "fit-content", padding: "4px 6px", fontWeight: 600 }}
                    >
                      Help
                    </Button>
                    <div className="h-8 flex flex-row items-center flex-shrink-0">
                      <Switch
                        checked={darkTheme}
                        onChange={(checked) => dispatch(setDarkTheme(checked))}
                        checkedIcon={<MoonIcon className="w-4 h-4 text-gray-400" />}
                        uncheckedIcon={<SunIcon className="w-4 h-4 text-white" />}
                      />
                    </div>
                    {/* SearchBar: pill button when closed, absolute+expanded when open */}

                    <div className="relative group flex-shrink-0 ml-4">
                      <button
                        onClick={() => {
                          dispatch(setNavigationTab(null));
                          dispatch(setNavSearchOpen(true));
                        }}
                        aria-label="Open search"
                        className="group flex items-center justify-center w-9 h-8 rounded-full bg-[#44ACFF] hover:bg-[#1a96ff] dark:bg-[#44ACFF] dark:hover:bg-[#1a96ff] shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <MagnifyingGlassIcon className="w-5 h-5 text-white transition-all duration-200 group-hover:scale-110" />
                      </button>
                      {/* Hover tooltip */}
                      <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-max opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-300 z-50">
                        {/* Arrow pointing up toward button */}
                        <div className="flex justify-center">
                          <div className="w-2.5 h-2.5 bg-gray-900 dark:bg-gray-700 rotate-45 -mb-1.5 relative z-10" />
                        </div>
                        <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-lg">
                          <p className="font-semibold mb-1 text-blue-300">Search for</p>
                          <ul className="space-y-0.5 text-gray-200">
                            <li className="flex items-center gap-1"><span className="text-green-400">›</span> Regions <span className="text-gray-400 ml-1">e.g. chr1:100-200</span></li>
                            <li className="flex items-center gap-1"><span className="text-green-400">›</span> Genes <span className="text-gray-400 ml-1">e.g. BRCA1</span></li>
                            <li className="flex items-center gap-1"><span className="text-green-400">›</span> SNPs <span className="text-gray-400 ml-1">e.g. rs123456</span></li>
                          </ul>
                        </div>
                      </div>
                    </div>




                  </div>

                  {isSearchFocused ? <div
                    style={{
                      position: "absolute",
                      left: "20%",
                      width: "calc(60%)",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 100,
                      minWidth: 150,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <SearchBar
                        isSearchFocused={isSearchFocused}
                        onSearchFocusChange={setIsSearchFocused}
                        onNewRegionSelect={handleNewRegionSelect}
                        windowWidth={window.innerWidth}
                        fontSize={16}
                        buttonPadding={6}
                      />
                    </div>
                    <button
                      onClick={() => dispatch(setNavSearchOpen(false))}
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label="Close search"
                      title="Close search"
                      className="p-1 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-700 transition-colors duration-150 flex-shrink-0"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div> : ""}



                </div>
              ) : (
                <>
                  {!currentSession && (
                    <div style={{ fontSize: 24 }}>
                      <span>WashU </span> Epigenome Browser
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>


        {/* Right side: dark mode + previous version (no session) */}
        {!currentSession && (
          <div className="flex flex-row items-center gap-2 ml-auto flex-shrink-0">

            <div className="h-8 flex flex-row items-center flex-shrink-0">
              <Switch
                checked={darkTheme}
                onChange={(checked) => dispatch(setDarkTheme(checked))}
                checkedIcon={<MoonIcon className="w-4 h-4 text-gray-400" />}
                uncheckedIcon={<SunIcon className="w-4 h-4 text-white" />}
              />
            </div>
            <Button
              style={{
                backgroundColor: "rgb(232 222 248 / var(--tw-bg-opacity, 1))",
                padding: "4px 8px",
                color: "black",
                width: "145px",
                height: "32px",
                borderRadius: "15px",
              }}

              onClick={() =>
                window.open("https://epigenomegateway.wustl.edu/browser2022/", "_blank")
              }

            >
              Previous Version
            </Button>

          </div>
        )}


        <AnimatePresence>
          {isSmallScreen && mobileMenuOpen && (
            <motion.div
              className="absolute top-full left-0 right-0 bg-white dark:bg-dark-background border-b border-gray-300 shadow-lg  z-50"
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
                      style={{ width: "100%", justifyContent: "center" }}
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
                      style={{ width: "100%", justifyContent: "center" }}
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
                      style={{ width: "100%", justifyContent: "center" }}
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
                      style={{ width: "100%", justifyContent: "center" }}
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
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      Help
                    </Button>
                    <div className="h-8 flex flex-row justify-center flex-shrink-0">
                      <Switch
                        checked={darkTheme}
                        onChange={(checked) => dispatch(setDarkTheme(checked))}
                        checkedIcon={<MoonIcon className="w-4 h-4 text-gray-400" />}
                        uncheckedIcon={<SunIcon className="w-4 h-4 text-white" />}
                      />
                    </div>
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
                  ? ({ left: `${tabAnchorLeft}px`, right: "auto", pointerEvents: "none" } as any)
                  : ({ pointerEvents: "none" } as any)
              }
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.1 }}
            >
              <ResizablePanel
                title={currentTab || undefined}
                initialWidth={250}
                initialHeight={300}
                onClose={() => dispatch(setNavigationTab(null))}
                onIncrement={incrementPanelCounter}
                navigationPath={navigationPath}
                header={true}
                excludeRefs={tabButtonsRef.current ? [tabButtonsRef] : []}
              >
                {currentTab === "regions" &&
                  currentDisplayRegionModel &&
                  genomeConfig && (
                    <RegionsPanel
                      selectedRegion={currentDisplayRegionModel}
                      onRegionSelected={handleNewRegionSelect}
                      contentColorSetup={{
                        background: darkTheme ? "#1e2a3a" : "#F8FAFC",
                        color: darkTheme ? "#e2e8f0" : "#222",
                      }}
                      genomeConfig={genomeConfig as any}
                      onClose={() => dispatch(setNavigationTab(null))}
                    />
                  )}
                {currentTab === "tab-genome-picker" && (
                  <TabGenomePicker
                    onClose={() => dispatch(setNavigationTab(null))}
                  />
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
    </>
  );
}
