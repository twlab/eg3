import React, { useState, useEffect } from "react";
import { TrackModel } from "@eg/core/src/eg-lib/models/TrackModel";
import TreeView from "./TreeView";

interface SchemaNode {
  [key: string]: any;
}

type AddedTracks = TrackModel[];

interface GenomeConfig {
  genome: { getName: () => string };
  annotationTracks: SchemaNode;
}

interface GroupedTrackSets {
  [key: string]: Set<string>;
}

interface AnnotationTrackSelectorProps {
  genomeConfig: GenomeConfig;
  addedTracks: AddedTracks;
  onTracksAdded?: any;
  addedTrackSets?: Set<TrackModel>;
  addGenomeLabel?: boolean;
  groupedTrackSets?: any;
}

const convertAnnotationJsonSchema = (schemaNode: any, nodeLabel: string) => {
  if (!schemaNode) {
    return {
      isExpanded: false,
      label: nodeLabel,
      children: [],
    };
  }

  const isLeaf = schemaNode.hasOwnProperty("name");
  if (isLeaf) {
    return new TrackModel(schemaNode);
  }

  let children: Array<any> = [];
  for (let propName of Object.getOwnPropertyNames(schemaNode)) {
    let propValue = schemaNode[propName];
    if (typeof propValue === "object") {
      children.push(convertAnnotationJsonSchema(propValue, propName));
    }
  }

  return {
    isExpanded: false,
    label: nodeLabel,
    children: children,
  };
};

const AnnotationTrackSelector: React.FC<AnnotationTrackSelectorProps> = ({
  genomeConfig,
  addedTracks,
  onTracksAdded = () => undefined,
  addedTrackSets,
  addGenomeLabel = false,
  groupedTrackSets,
}) => {
  const { genome, annotationTracks } = genomeConfig;
  const [data, setData] = useState<any>(() =>
    convertAnnotationJsonSchema(annotationTracks, genome.getName())
  );

  const nodeToggled = (node: any) => {
    node.isExpanded = !node.isExpanded;
    setData({ ...data });
  };

  const addLeafTrack = (trackModel: TrackModel) => {
    const genomeName = genome.getName();
    const label = addGenomeLabel
      ? `${trackModel.label} (${genomeName})`
      : trackModel.label;
    trackModel.label = label;
    trackModel.options = { ...trackModel.options, label };
    trackModel.metadata = { ...trackModel.metadata, genome: genomeName };
    onTracksAdded([trackModel]);
  };

  const renderLeaf = (trackModel: TrackModel) => {
    const genomeName = genome.getName();
    if (groupedTrackSets[genomeName]) {
      if (
        groupedTrackSets[genomeName].has(trackModel.name) ||
        groupedTrackSets[genomeName].has(trackModel.url)
      ) {
        return <div>{trackModel.label} (Added)</div>;
      }
    }
    if (addGenomeLabel && trackModel.querygenome) {
      return (
        <div>{trackModel.label} (Can only be added to primary genome)</div>
      );
    }
    return (
      <div>
        {trackModel.label}
        <button
          onClick={() => addLeafTrack(trackModel)}
          className="btn btn-sm btn-success dense-button"
        >
          Add
        </button>
      </div>
    );
  };

  return (
    <TreeView
      data={data}
      onNodeToggled={nodeToggled}
      leafRenderer={renderLeaf}
    />
  );
};

export default AnnotationTrackSelector;
