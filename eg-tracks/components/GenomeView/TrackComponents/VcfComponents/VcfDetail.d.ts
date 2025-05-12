import React from "react";
import Vcf from "./Vcf";
/**
 * Box that contains details when a VCF is clicked.
 *
 * @author Daofeng Li
 */
interface VcfDetailProps {
    vcf: Vcf;
}
declare class VcfDetail extends React.PureComponent<VcfDetailProps> {
    render(): import("react/jsx-runtime").JSX.Element;
}
export default VcfDetail;
