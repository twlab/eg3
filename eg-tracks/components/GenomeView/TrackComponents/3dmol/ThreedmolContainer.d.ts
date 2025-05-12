import React from "react";
import TrackModel from "../../../../models/TrackModel";
import DisplayedRegionModel from "../../../../models/DisplayedRegionModel";
/**
 * the container for holding 3D structure rendered by 3Dmol.js
 * @author Daofeng Li
 */
interface ComponentState {
    placement: any;
    childShow: boolean;
    width: any;
    height: any;
    menuFlexDirection: any;
    layout: string;
    legendMin: number;
    legendMax: number;
    legendMinColor: any;
    legendMaxColor: any;
    colorScale: any;
    chrom: string;
    start: number;
    end: number;
    thumbStyle: string;
    hoveringAtom: any;
    hoveringX: number;
    hoveringY: number;
    paintMethod: string;
    paintRegion: string;
    paintAnnotationRegion: string;
    A: string;
    B: string;
    A1: string;
    A2: string;
    B1: string;
    B2: string;
    B3: string;
    B4: string;
    NA: string;
    compFormat: string;
    resolutions: any[];
    resolution: number;
    message: string;
    modelDisplayConfig: {
        [key: string]: boolean;
    } | null;
    highlightingOn: boolean;
    highlightingColor: string;
    highlightingColorChanged: boolean;
    highlightingChromColor: string;
    mainBoxWidth: number | undefined;
    mainBoxHeight: number | undefined;
    thumbBoxWidth: number | undefined;
    thumbBoxHeight: number | undefined;
    useExistingBigwig: boolean;
    bigWigUrl: string;
    bigWigInputUrl: string;
    uploadCompartmentFile: boolean;
    compartmentFileUrl: string;
    compartmentFileObject: any;
    annotationFileObject: any;
    numFileObject: any;
    newG3dUrl: string;
    animateMode: boolean;
    frameAtoms: any[];
    frameLabels: any[];
    currentFrame: number;
    myShapes: Record<string, any>;
    myShapeLabel: string;
    myShapeRegion: string;
    lineOpacity: number;
    cartoonThickness: number;
    highlightStyle: string;
    useLegengMin: number;
    useLegengMax: number;
    autoLegendScale: boolean;
    myArrows: Record<string, any>;
    labelStyle: string;
    annoFormat: string;
    annoUsePromoter: boolean;
    gene: string;
    promoter: string;
    categories: any;
    staticCategories: any;
    numFormat: string;
    envelopCenter: any;
    envelopRadius: number;
    showEnvelop: boolean;
    envelopColor: string;
    envelopOpacity: string;
    spinning: boolean;
    spinDirection: string;
    spinSpeed: number;
    spinReverse: boolean;
}
interface ComponentProps {
    handleDelete: any;
    onToggleSync3d?: any;
    sync3d?: any;
    tracks: TrackModel[];
    g3dtrack: TrackModel;
    viewRegion: DisplayedRegionModel;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    imageInfo?: any;
    genomeConfig?: any;
    geneFor3d?: any;
    onSetSelected?: any;
    selectedSet?: any;
    onNewViewRegion?: any;
    anchors3d?: any;
    darkTheme?: any;
    onGetViewer3dAndNumFrames?: any;
}
declare class ThreedmolContainer extends React.Component<ComponentProps, ComponentState> {
    mol: any;
    viewer: any;
    viewer2: any;
    model: {};
    model2: {};
    arrows: Array<any>;
    spheres: Array<any>;
    sphereLabels: Array<any>;
    shapes: Array<any>;
    shapeLabels: Array<any>;
    imageLabels: Array<any>;
    g3dFile: any;
    bwData: {};
    compData: {};
    annoData: {};
    expData: {};
    cytobandData: {};
    atomData: {};
    atomStartsByChrom: {};
    newAtoms: {};
    atomKeeper: {};
    envelop: any;
    bedLegend: {};
    chromHash: {};
    myRef: React.RefObject<any>;
    myRef2: React.RefObject<any>;
    modalfg: string;
    modalbg: string;
    constructor(props: any);
    componentDidMount(): Promise<void>;
    componentDidUpdate(prevProps: any, prevState: any): Promise<void>;
    componentWillUnmount(): void;
    onSwitch: () => void;
    removeHover: () => void;
    drawImageLabel: (displayConfig: any) => void;
    removeImageLabel: () => void;
    drawMyShapes: (displayConfig: any) => void;
    removeMyShapes: (updateRender?: boolean) => void;
    prepareAtomKeeper: () => void;
    getDisplayedModelKeys: (displayConfig: any) => string[];
    drawAnchors3d: (displayConfig: any) => void;
    removeAnchors3d: (updateRender?: boolean) => void;
    /**
     * build an atom keeper object for quick search atoms given region
     */
    buildAtomKeeper: () => void;
    viewRegionToChroms: () => any;
    viewRegionToRegions: () => any;
    onMenuPositionChange: (e: any) => void;
    setAtomClickable: (at: any) => void;
    clearScene: () => void;
    prepareAtomData: () => Promise<void>;
    toggleUseBigWig: () => void;
    toggleUsePromoter: () => void;
    toggleUseCompartment: () => void;
    handleNewG3dUrlChange: (e: any) => void;
    handleBigWigUrlChange: (e: any) => void;
    handleAnnoFormatChange: (e: any) => void;
    handleNumFormatChange: (e: any) => void;
    handleBigWigInputUrlChange: (e: any) => void;
    handleCompartmentFileUrlChange: (e: any) => void;
    handleCompartmentFileUpload: (e: any) => void;
    handleAnnotationFileUpload: (e: any) => void;
    handleNumFileUpload: (e: any) => void;
    setSpinDirection: (e: any) => void;
    setSpinSpeed: (e: any) => void;
    initEnvelop: () => void;
    displayEnvelop: () => void;
    updateEnvelop: (needRender?: boolean) => void;
    removeEnvelop: (p0: boolean) => void;
    toggleDisplayEnvelop: () => void;
    toggleSpin: () => void;
    toggleSpinReverse: () => void;
    toggleModelDisplay: (hap: any) => void;
    updateLegendColor: (k: any, color: any) => void;
    updateResolution: (resolution: any) => void;
    highlightRegions: (tmpModelDisplayConfig?: any) => void;
    removeHighlightRegions: () => void;
    removeHighlightChrom: (chroms: any) => void;
    /**
     * get min and max value of a keeps object for scale and legend
     * @param {*} keepers keeper object, {chrom: {binkey: [list of bw items]}}
     * @param {*} regions list of regions or chroms
     * @param {*} regionMode true or false, indicate if paint region or not
     */
    minMaxOfKeepers: (keepers: any, regions: any, regionMode: any) => any;
    paintWithBigwig: any;
    getGeneexpData: () => Promise<any>;
    removePaint: () => void;
    paintBigwig: (chooseRegion: any) => Promise<void>;
    /**
     * fetch whole chrom data from bigwig, bwurl-resolution as data cache key
     * @param {*} bwUrl bigwig url
     * @param {*} resolution resolution in number
     * @param {*} chrom chrom string
     */
    fetchBwData: (bwUrl: any, resolution: any, chrom: any) => Promise<{} | undefined>;
    parseRemoteFileData: (url: any) => Promise<any>;
    parseUploadedFile: (fileobj: any) => Promise<any>;
    getCompartmentData: () => Promise<any>;
    formatCytoband: () => void;
    getAnnotationData: () => Promise<any>;
    paintAnnotation: (chooseRegion: any) => Promise<void>;
    paintWithAnnotation: (anndata: any, regions: any, chooseRegion: any) => void;
    removeAnnotationPaint: () => void;
    set4DNExampleURL: () => void;
    onLayoutChange: (e: any) => void;
    handleThumbStyleChange: (e: any) => void;
    clearMessage: () => void;
    addNewG3D: (url: any, key: any, resolution: any) => Promise<{} | undefined>;
    prepareModelFrames: () => Promise<void>;
    updateModelFrames: () => void;
    animate: () => Promise<void>;
    stopAnimate: () => void;
    resetAnimate: () => void;
    syncHic: () => void;
    stopSync: () => void;
    saveImage: (viewer: any) => void;
    setUseLegendMax: (e: any) => void;
    setUseLegendMin: (e: any) => void;
    handleAutoLegendScaleChange: () => void;
    setLabelStyle: (e: any) => void;
    handleMyShapeLabelChange: (e: any) => void;
    handleMyShapeRegionChange: (e: any) => void;
    handleEnvelopOpacityChange: (e: any) => void;
    handleEnvelopColorChange: (e: any) => void;
    addAnchors3dToMyArrows: (anchors: any, asShape?: boolean) => void;
    addRegionToMyShapes: () => void;
    addGeneToMyShapes: (gene: any) => void;
    handleLoopFileUpload: (e: any) => Promise<void>;
    handleRegionFileUpload: (e: any) => Promise<void>;
    parseUploadedRegionFile: (fileobj: any) => Promise<any[] | undefined>;
    updateMyShapes: (shapeKey: any, shape: any) => void;
    deleteShapeByKey: (shapekey: any) => void;
    updateMyArrows: (arrowKey: any, arrow: any) => void;
    deleteArrowByKey: (arrowkey: any) => void;
    setMessage: (message: any) => void;
    deleteTrack: (id: any) => void;
    render(): import("react/jsx-runtime").JSX.Element;
}
export default ThreedmolContainer;
