import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { PangenomeModel } from "./pangenomeModel";

/* ══════════════════════════════════════════════════════════════════════════
   The toolbar, the legend and the detail bar are chrome for the whole view,
   not for one window of it, so they are mounted once by VisualManager while
   the drawings themselves are mounted once per fetched window.  This holds
   the state both halves share, plus the model the chrome reads: whichever
   VisualizationContainer is the primary (centre) window publishes its model
   here for the chrome to describe.
   ══════════════════════════════════════════════════════════════════════════ */

export type ViewMode = "linear" | "tube" | "graph" | "variants";

/** Base-level detail starts here, in pixels a base: below it the letters
    are unreadable. */
export const SEQUENCE_ZOOM = 7;

/** Gaps offered between nodes, in pixels - chosen like a font size. */
export const NODE_GAPS = [0, 4, 8, 14, 20, 28, 40];
export const DEFAULT_NODE_GAP = 14;

/** Gaps offered between one row of nodes and the next, in pixels. */
export const ROW_GAPS = [20, 24, 28, 36, 48, 64];
export const DEFAULT_ROW_GAP = 28;

/** How much wider than their own size the tube map draws its gaps, to start. */
export const DEFAULT_GAP_SCALE = 0.5;


/* How long the drawing stands in for data that has not been fetched. */
export const ZOOM_SETTLE_MS = 1000;

/** Below this a span is not worth fetching, and rounds away to nothing. */
const MIN_REGION_BP = 2;

export interface PangenomeViewState {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  /** Fixed room between one node and the next, the same at every boundary. */
  nodeGap: number;
  setNodeGap: React.Dispatch<React.SetStateAction<number>>;
  /** Room between one row of nodes and the next. */
  rowGap: number;
  setRowGap: React.Dispatch<React.SetStateAction<number>>;
  /** How much wider than their own size the tube map draws its gaps. */
  gapScale: number;
  setGapScale: React.Dispatch<React.SetStateAction<number>>;
  /** Colours the reader has chosen, by lane key; the palette fills the rest. */
  laneColors: Record<string, string>;
  setLaneColor: (key: string, color: string) => void;
  resetLaneColors: () => void;
  highlight: string | null;
  setHighlight: React.Dispatch<React.SetStateAction<string | null>>;
  selectedNode: string | null;
  setSelectedNode: React.Dispatch<React.SetStateAction<string | null>>;
  expandEdges: boolean;
  setExpandEdges: React.Dispatch<React.SetStateAction<boolean>>;
  /** How the variants view groups bubbles into sites: the shortest shared
      stretch that separates two, in bases - 1 is every bubble alone - or 0
      for auto, which picks one that fits the zoom. */
  variantGrouping: number;
  setVariantGrouping: React.Dispatch<React.SetStateAction<number>>;
  /** The same for the tube map, which draws its tubes through the sites'
      walks; -1 draws every node as it is. */
  tubeGrouping: number;
  setTubeGrouping: React.Dispatch<React.SetStateAction<number>>;

  /** Adopt a span of the reference as the region; null when nothing can. */
  commitRegion: ((start: number, end: number) => void) | null;
  /** The primary window's model, or null before the first one draws. */
  model: PangenomeModel | null;
  publishModel: (model: PangenomeModel | null) => void;
}

const PangenomeViewContext = createContext<PangenomeViewState | null>(null);

export function usePangenomeView(): PangenomeViewState | null {
  return useContext(PangenomeViewContext);
}

export interface PangenomeViewProviderProps {
  children: ReactNode;
  windowWidth?: number;
  /** Adopt a span of the reference as the region. */
  onCommitRegion?: (start: number, end: number) => void;
  /** The view, when whoever mounts this holds it - eg3's TrackManager,
      whose toolbar switches it and whose tracks are laid out by it. */
  mode?: ViewMode;
  onModeChange?: (mode: ViewMode) => void;
  /** The groupings, when whoever mounts this holds them too: the tube map's
      decides the room the band is laid out with. */
  tubeGrouping?: number;
  setTubeGrouping?: React.Dispatch<React.SetStateAction<number>>;
  variantGrouping?: number;
  setVariantGrouping?: React.Dispatch<React.SetStateAction<number>>;
}

export function PangenomeViewProvider({
  children,
  windowWidth = 0,
  onCommitRegion,
  mode: heldMode,
  onModeChange,
  tubeGrouping: heldTubeGrouping,
  setTubeGrouping: setHeldTubeGrouping,
  variantGrouping: heldVariantGrouping,
  setVariantGrouping: setHeldVariantGrouping,
}: PangenomeViewProviderProps) {
  const [ownMode, setOwnMode] = useState<ViewMode>("linear");
  const mode = heldMode ?? ownMode;
  const setMode = useCallback(
    (next: ViewMode) => {
      setOwnMode(next);
      onModeChange?.(next);
    },
    [onModeChange],
  );
  const [nodeGap, setNodeGap] = useState(DEFAULT_NODE_GAP);
  const [rowGap, setRowGap] = useState(DEFAULT_ROW_GAP);
  const [gapScale, setGapScale] = useState(DEFAULT_GAP_SCALE);
  const [laneColors, setLaneColors] = useState<Record<string, string>>({});

  const setLaneColor = useCallback((key: string, color: string) => {
    setLaneColors((current) => ({ ...current, [key]: color }));
  }, []);
  const resetLaneColors = useCallback(() => setLaneColors({}), []);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expandEdges, setExpandEdges] = useState(false);
  /* Auto, so the variants view draws no more sites than there is room for. */
  const [ownVariantGrouping, setOwnVariantGrouping] = useState(0);
  const [ownTubeGrouping, setOwnTubeGrouping] = useState(0);
  const variantGrouping = heldVariantGrouping ?? ownVariantGrouping;
  const setVariantGrouping = setHeldVariantGrouping ?? setOwnVariantGrouping;
  const tubeGrouping = heldTubeGrouping ?? ownTubeGrouping;
  const setTubeGrouping = setHeldTubeGrouping ?? setOwnTubeGrouping;
  const [model, publishModel] = useState<PangenomeModel | null>(null);
  /* Adopt a span of the reference as the region. Nothing reaches for this
     now that the wheel no longer zooms - a pan is the only thing that
     moves the region - but it is what a caller would use to. */
  const commitRegion = useMemo(() => {
    if (!onCommitRegion) return null;
    return (start: number, end: number) => {
      if (!Number.isFinite(start) || !Number.isFinite(end)) return;
      if (end - start < MIN_REGION_BP) return;
      onCommitRegion(Math.max(0, Math.round(start)), Math.round(end));
    };
  }, [onCommitRegion]);

  /* A highlighted haplotype that is not in the next window would stay stuck
     on, dimming everything, so drop it when the data changes under us. */
  useEffect(() => {
    setHighlight((current) =>
      current && model?.lanes.some((l) => l.key === current) ? current : null,
    );
    setSelectedNode((current) =>
      current && model?.nodeById.has(current) ? current : null,
    );
  }, [model]);

  const value = useMemo<PangenomeViewState>(
    () => ({
      mode,
      setMode,
      nodeGap,
      setNodeGap,
      rowGap,
      setRowGap,
      gapScale,
      setGapScale,
      laneColors,
      setLaneColor,
      resetLaneColors,
      highlight,
      setHighlight,
      selectedNode,
      setSelectedNode,
      expandEdges,
      setExpandEdges,
      variantGrouping,
      setVariantGrouping,
      tubeGrouping,
      setTubeGrouping,
      windowWidth,
      commitRegion,
      model,
      publishModel,
    }),
    [
      mode,
      nodeGap,
      rowGap,
      gapScale,
      laneColors,
      highlight,
      selectedNode,
      expandEdges,
      variantGrouping,
      tubeGrouping,
      model,
      windowWidth,
      commitRegion,
    ],
  );

  return (
    <PangenomeViewContext.Provider value={value}>
      {children}
    </PangenomeViewContext.Provider>
  );
}
