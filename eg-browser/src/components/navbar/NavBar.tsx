import useCurrentGenome from "@/lib/hooks/useCurrentGenome";
import {
  BrowserSession,
  createSession,
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
import { GENOME_LIST, versionToLogoUrl } from "../genome-picker/genome-list";
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
  getSpeciesInfo,
  getGenomeConfig,
} from "wuepgg3-track";
import RegionsPanel from "./RegionsPanel";
import type { GenomeCoordinate } from "wuepgg3-track";

import { selectBundle, updateBundle } from "@/lib/redux/slices/hubSlice";
import { getDatabase, ref, set } from "firebase/database";
import SearchBar from "../genome-view/toolbar/SearchBar";


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
      if (currentSession.userViewRegion) {
        const parsed = genomeConfig.navContext.parse(
          currentSession.userViewRegion as GenomeCoordinate

        )
        if (parsed)
          return new DisplayedRegionModel(genomeConfig.navContext, ...parsed);

      }
      else if (currentSession.viewRegion) {
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

  const genomeLogoUrl: string | null = genome?.name
    ? ((getSpeciesInfo(genome.name)?.logo || null) ??
      (versionToLogoUrl[genome.name]?.croppedUrl || null) ??
      (versionToLogoUrl[genome.name]?.logoUrl || null))
    : null;
  // const genomeLogoUrl: string | null = null;

  const [genomePickerOpen, setGenomePickerOpen] = useState(false);
  const [genomeSearchQuery, setGenomeSearchQuery] = useState("");
  const genomePickerRef = useRef<HTMLDivElement>(null);

  const filteredGenomes = useMemo(
    () =>
      GENOME_LIST.filter(
        (g) =>
          !genomeSearchQuery ||
          g.name.toLowerCase().includes(genomeSearchQuery.toLowerCase()) ||
          g.versions.some((v) =>
            v.toLowerCase().includes(genomeSearchQuery.toLowerCase()),
          ),
      ),
    [genomeSearchQuery],
  );

  const handlePickGenome = (assemblyName: string) => {
    const config = getGenomeConfig(assemblyName);
    if (config) {
      dispatch(createSession({ genome: GenomeSerializer.serialize(config) }));
    }
    setGenomePickerOpen(false);
    setGenomeSearchQuery("");
  };

  useEffect(() => {
    if (!genomePickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        genomePickerRef.current &&
        !genomePickerRef.current.contains(e.target as Node)
      ) {
        setGenomePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [genomePickerOpen]);

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
        <div className="flex flex-row justify-between items-center outline outline-gray-300 bg-white dark:bg-dark-background relative">
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
                "w-20",
                "rounded-sm",

                "relative",
                "overflow-hidden",
                currentSession ? "cursor-pointer" : "cursor-default",
              )}
              style={{ marginLeft: -10 }}
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
                        style={{ fontSize: "12px" }}
                      >
                        {" "}
                        v{version}
                      </span>
                    </div>
                  </>
                )}
            </div>
            {currentSession && (
              <div className="relative flex-shrink-0" ref={genomePickerRef}>
                <div
                  style={{
                    backgroundImage: `url(${genomeLogoUrl
                      ? genomeLogoUrl.startsWith("http")
                        ? genomeLogoUrl
                        : import.meta.env.BASE_URL + genomeLogoUrl
                      : ""
                      })`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    opacity: genomeLogoUrl ? 0.8 : 1,
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
                    "w-45",
                    "rounded-xs",
                    "flex-shrink-0",
                    "transition-opacity",
                    "relative",
                    "overflow-hidden",
                    "cursor-pointer",
                    genomePickerOpen ? "ring-2 ring-blue-400" : "",
                    sessionPanelOpen
                      ? "bg-secondary dark:bg-dark-secondary"
                      : "",
                    genomeLogoUrl && !sessionPanelOpen
                      ? "outline outline-gray-200"
                      : "",
                  )}
                  onClick={() => {
                    setGenomeSearchQuery("");
                    setGenomePickerOpen((v) => !v);
                  }}
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
                          {versionToLogoUrl[genome.name]?.name ? (
                            <>
                              {versionToLogoUrl[genome.name].name} -{" "}
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
                {genomePickerOpen && (
                  <div className="absolute top-full left-0 mt-1 w-[32rem] bg-white dark:bg-dark-background border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                      <input
                        type="text"
                        value={genomeSearchQuery}
                        onChange={(e) => setGenomeSearchQuery(e.target.value)}
                        placeholder="Search genomes..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-dark-background text-gray-800 dark:text-dark-primary outline-none focus:border-blue-400"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2">
                      <div className="grid grid-cols-3 gap-2">
                        {filteredGenomes.map((g) => (
                          <div key={g.name} className="flex flex-col gap-1">
                            <div className="text-xs text-gray-400 dark:text-gray-500 uppercase font-semibold tracking-wide text-center pb-0.5 border-b border-gray-200 dark:border-gray-600">
                              {g.name}
                            </div>
                            {g.versions.map((v) => (
                              <button
                                key={v}
                                onClick={() => handlePickGenome(v)}
                                className="text-center px-1 py-1.5 text-xs italic text-gray-700 dark:text-dark-primary bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-dark-secondary border border-gray-200 dark:border-gray-600 rounded transition-colors truncate"
                                title={v}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center">
              {isSmallScreen ? (
                <IconButton
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  title="Menu"
                >
                  {mobileMenuOpen ? (
                    <XMarkIcon className="h-6 w-6" />
                  ) : (
                    <Bars3Icon className="h-6 w-6" />
                  )}
                </IconButton>
              ) : (
                <div>
                  {currentSession !== null ? (
                    <div
                      className="flex flex-row items-center gap-1"
                    // style={{
                    //   pointerEvents: sessionPanelOpen ? "none" : "auto",
                    // }}
                    >

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
                        gapSize={8}
                      />
                    </div>
                  ) : (
                    ""
                  )}

                  {!currentSession && (
                    <div style={{ fontSize: 24 }}>
                      <span>WashU </span> Epigenome Browser
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {!isSmallScreen &&
            (currentSession ? (
              <div
                className="h-9 flex flex-row items-center gap-2 z-10"
                style={{ marginRight: 15 }}
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
                  style={`text-xl font-light border border-blue-500 px-2 ${currentSession.title.length > 0 ? "" : "font-medium"
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
              <div
                className="flex flex-row items-center gap-2 z-10"
                style={{ marginRight: 15 }}
              >
                <Button
                  style={{
                    backgroundColor:
                      "rgb(232 222 248 / var(--tw-bg-opacity, 1))",
                    padding: "4px 8px",
                    color: "black",
                    width: "150px",
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
                />
              </div>
            ))}

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
