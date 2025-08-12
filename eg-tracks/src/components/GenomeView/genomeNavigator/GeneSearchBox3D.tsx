import React from "react";
import PropTypes from "prop-types";
import GeneSearchBoxBase from "./GeneSearchBoxBase";
// import GeneSearchBoxBase from "./GeneSearchBoxBase";

/**
 * gene search box for 3d module.
 *
 * @author Daofeng Li
 */

interface GeneSearchBox3DProps {
  color?: any;
  background?: any;
  setGeneCallback?: any;
  genomeConfig?: any;
}
class GeneSearchBox3D extends React.PureComponent<GeneSearchBox3DProps> {
  static propTypes = {
    setGeneCallback: PropTypes.func.isRequired,
  };

  /**
   * @param {Gene} gene
   */
  setGene = (gene) => {
    this.props.setGeneCallback(gene);
  };

  render() {
    const { color, background, genomeConfig } = this.props;

    return (
      <GeneSearchBoxBase
        onGeneSelected={this.setGene}
        simpleMode={true}
        voiceInput={false}
        color={color}
        background={background}
        genomeConfig={genomeConfig}
      />
    );
  }
}

export default GeneSearchBox3D;
