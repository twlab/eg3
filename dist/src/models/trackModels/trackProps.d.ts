import { ViewExpansion } from '../RegionExpander';
export interface TrackProps {
    id: String;
    trackIdx: number;
    bpRegionSize: number;
    bpToPx: number;
    side: string;
    windowWidth: number;
    handleDelete: (trackIndex: number) => void;
    trackData?: {
        [key: string]: any;
    };
    dragXDist?: number;
    genomeName?: string;
    visData?: ViewExpansion;
    trackManagerId: string;
    trackComponents: any;
    genomeArr?: Array<any>;
    genomeIdx?: number;
    trackModel?: any;
    dataIdx?: number;
    getConfigMenu: any;
    onCloseConfigMenu: () => void;
    useFineModeNav: boolean;
    trackManagerRef: any;
    setShow3dGene: any;
    isThereG3dTrack: boolean;
    legendRef: any;
    onTrackConfigChange: any;
    selectConfigChange: any;
}
