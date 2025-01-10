import React, { useState, useEffect } from "react";
import { StandaloneGeneAnnotation } from "./StandaloneGeneAnnotation";

import Gene from "@eg/core/src/eg-lib/models/Gene";
import Genome from "@eg/core/src/eg-lib/models/Genome";
import LinearDrawingModel from "@eg/core/src/eg-lib/models/LinearDrawingModel";
import DisplayedRegionModel from "@eg/core/src/eg-lib/models/DisplayedRegionModel";
import NavigationContext from "@eg/core/src/eg-lib/models/NavigationContext";
import { AWS_API } from "./GeneSearchBoxBase";

import "./IsoformSelection.css";

const DRAW_WIDTH = 200;

interface IsoformSelectionProps {
  genomeConfig: any;
  geneName: string;
  onGeneSelected: (gene: Gene) => void;
  simpleMode: boolean;
  color: string;
  background: string;
}

const IsoformSelection: React.FC<IsoformSelectionProps> = ({
  genomeConfig,
  geneName,
  onGeneSelected,
  simpleMode,
  color,
  background,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [genes, setGenes] = useState<Gene[]>([]);

  useEffect(() => {
    const getSuggestions = async (geneName: string) => {
      const genomeName = genomeConfig.genome.getName();
      const chrListObject = genomeConfig.navContext._featuresForChr;
      const params = {
        q: geneName,
        isExact: true,
      };
      const url = new URL(`${AWS_API}/${genomeName}/genes/queryName`);
      Object.keys(params).forEach((key) =>
        url.searchParams.append(key, params[key])
      );

      const response = await fetch(url.toString(), {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();
      // filter out genes in super contigs in case those are not in chrom list
      const recordsInFeatures = data.filter((record) =>
        chrListObject.hasOwnProperty(record.chrom)
      );
      const fetchedGenes = recordsInFeatures.map((record) => new Gene(record));

      setIsLoading(false);
      setGenes(fetchedGenes);
    };

    getSuggestions(geneName);
  }, [geneName, genomeConfig]);

  const renderSuggestions = () => {
    const navContext = genomeConfig.navContext;
    const contextIntervals = genes.map(
      (gene) => gene.computeNavContextCoordinates(navContext)[0]
    );
    const leftmostStart = Math.min(
      ...contextIntervals.map((location) => location.start)
    );
    const rightmostEnd = Math.max(
      ...contextIntervals.map((location) => location.end)
    );
    const viewRegion = new DisplayedRegionModel(
      navContext,
      leftmostStart,
      rightmostEnd
    );
    const drawModel = new LinearDrawingModel(viewRegion, DRAW_WIDTH);

    const renderOneSuggestion = (gene: Gene, i: number) => {
      return (
        <div
          key={gene.dbRecord._id}
          className="IsoformSelection-item"
          onClick={() => onGeneSelected(gene)}
          style={{
            color,
            background,
          }}
        >
          <div className="IsoformSelection-collection">{gene.collection}</div>
          <div>{gene.getLocus().toString()}</div>
          <div>
            <StandaloneGeneAnnotation
              gene={gene}
              contextLocation={contextIntervals[i]}
              xSpan={drawModel.baseSpanToXSpan(contextIntervals[i])}
              elementWidth={DRAW_WIDTH}
            />
          </div>
          <div className="IsoformSelection-description">{gene.description}</div>
        </div>
      );
    };

    return (
      <div className="IsoformSelection">{genes.map(renderOneSuggestion)}</div>
    );
  };

  const renderSuggestionsSimple = () => {
    const navContext = genomeConfig.navContext;

    const contextIntervals = genes.map(
      (gene) => gene.computeNavContextCoordinates(navContext)[0]
    );
    const leftmostStart = Math.min(
      ...contextIntervals.map((location) => location.start)
    );
    const rightmostEnd = Math.max(
      ...contextIntervals.map((location) => location.end)
    );
    const viewRegion = new DisplayedRegionModel(
      navContext,
      leftmostStart,
      rightmostEnd
    );
    const drawModel = new LinearDrawingModel(viewRegion, DRAW_WIDTH);

    const renderOneSuggestion = (gene: Gene, i: number) => {
      return (
        <div
          key={gene.dbRecord._id}
          className="IsoformSelection-item-simple"
          onClick={() => onGeneSelected(gene)}
          style={{
            color,
            background,
          }}
        >
          <div>{gene.getLocus().toString()}</div>
          <div>
            <StandaloneGeneAnnotation
              gene={gene}
              contextLocation={contextIntervals[i]}
              xSpan={drawModel.baseSpanToXSpan(contextIntervals[i])}
              elementWidth={DRAW_WIDTH}
            />
          </div>
        </div>
      );
    };

    return (
      <div className="IsoformSelection">{genes.map(renderOneSuggestion)}</div>
    );
  };

  if (isLoading) {
    return <div className="IsoformSelection-empty-msg">Loading...</div>;
  }

  if (genes.length === 0) {
    return (
      <div className="IsoformSelection-empty-msg">
        Could not find gene "{geneName}"
      </div>
    );
  }

  return simpleMode ? renderSuggestionsSimple() : renderSuggestions();
};

export default IsoformSelection;
