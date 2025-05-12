import { FC } from "react";
import TrackModel from "../../../../models/TrackModel";
export declare const COLORS: string[];
interface MetadataIndicatorProps {
    track: TrackModel;
    terms?: string[];
    onClick?: (event: string, term: string) => void;
    height: number;
}
declare const MetadataIndicator: FC<MetadataIndicatorProps>;
export default MetadataIndicator;
