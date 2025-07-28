import React, { FC } from "react";

import NavigationContext from "../../../models/NavigationContext";
// import GeneSearchBoxBase from "./GeneSearchBoxBase";
import Gene from "../../../models/Gene";
import GeneSearchBoxBase from "./GeneSearchBoxBase";

import Genome from "../../../models/Genome";

interface GeneSearchBoxProps {
  navContext: NavigationContext; // The current navigation context
  onRegionSelected: (
    newStart: number,
    newEnd: number,
    toolTitle: number | string,
    highlightSearch: boolean,
  ) => void;
  handleCloseModal: () => void;
  onNewHighlight?: (newStart: number, newEnd: number, geneName: string) => void;
  doHighlight: boolean;
  color: string;
  background: string;
  genomeConfig: Genome;
}

const GeneSearchBox: FC<GeneSearchBoxProps> = ({
  navContext,
  onRegionSelected,
  handleCloseModal,
  onNewHighlight,
  doHighlight,
  color,
  background,
  genomeConfig,
}) => {
  const setViewToGene = (gene: Gene) => {
    const interval = navContext.convertGenomeIntervalToBases(
      gene.getLocus()
    )[0];
    if (interval) {
      onRegionSelected(interval.start, interval.end, "isJump", doHighlight);
      handleCloseModal();
    } else {
      console.log(
        "Gene not available in current region set view",
        "error",
        2000
      );
    }
  };

  return (
    <GeneSearchBoxBase
      onGeneSelected={setViewToGene}
      simpleMode={false}
      voiceInput={true}
      color={color}
      background={background}
      genomeConfig={genomeConfig}
    />
  );
};

export default GeneSearchBox;
