import React from "react";
import Gene from "../../../models/Gene";
export declare const AWS_API = "https://lambda.epigenomegateway.org/v3";
interface GeneSearchBoxBaseProps {
    genomeConfig: any;
    onGeneSelected: (gene: Gene) => void;
    voiceInput?: boolean;
    simpleMode?: boolean;
    color: string;
    background: string;
    transcript?: string;
    resetTranscript?: () => void;
    startListening?: () => void;
    stopListening?: () => void;
    browserSupportsSpeechRecognition?: boolean;
}
declare const GeneSearchBoxBase: React.FC<GeneSearchBoxBaseProps>;
export default GeneSearchBoxBase;
