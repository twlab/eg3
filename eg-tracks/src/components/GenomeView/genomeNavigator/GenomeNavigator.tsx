import React from "react";

export const MIN_VIEW_REGION_SIZE = 5;
import MainPane from "./MainPane";
import DisplayedRegionModel from "../../../models/DisplayedRegionModel";
//import './GenomeNavigator.css';

/**
 * A navigator that allows users to scroll around the genome and select what region for tracks to display.
 *
 * @author Silas Hsu
 */
interface GenomeNavigatorProps {
  selectedRegion: DisplayedRegionModel;
  windowWidth: number;
  /**
   * Called when the user selects a new region to display.  Has the signature
   *     (newStart: number, newEnd: number): void
   *         `newStart`: the nav context coordinate of the start of the selected interval
   *         `newEnd`: the nav context coordinate of the end of the selected interval
   */
  onRegionSelected: any;
  genomeConfig: any;
}
interface GenomeNavigatorState {
  viewRegion?: any;
}
class GenomeNavigator extends React.Component<
  GenomeNavigatorProps,
  GenomeNavigatorState
> {
  static defaultProps = {
    onRegionSelected: () => undefined,
  };

  /**
   * Binds functions, and also forks that view region that was passed via props.
   */
  constructor(props: GenomeNavigatorProps) {
    super(props);
    this.state = {
      viewRegion: this._setInitialView(props.selectedRegion),
    };

    this.zoom = this.zoom.bind(this);
    this.setNewView = this.setNewView.bind(this);
    this.zoomSliderDragged = this.zoomSliderDragged.bind(this);
  }

  /**
   * Sets the default region for MainPane to cover whole chromosomes/features that are in `selectedRegion`
   *
   * @param {DisplayedRegionModel} selectedRegion - the currently selected region
   * @return {DisplayedRegionModel} the default view region for the genome navigator
   */
  _setInitialView(selectedRegion: {
    getNavigationContext: () => any;
    getFeatureSegments: () => any[];
  }) {
    const navContext = selectedRegion.getNavigationContext();
    const features = selectedRegion
      .getFeatureSegments()
      .map((segment: { feature: any }) => segment.feature);

    const firstFeature = features[0];
    const lastFeature = features[features.length - 1];

    const startBase = navContext.getFeatureStart(firstFeature);
    const endBase =
      navContext.getFeatureStart(lastFeature) + lastFeature.getLength();
    return new DisplayedRegionModel(navContext, startBase, endBase);
  }

  /**
   * Resets the view region if a new one is received.
   *
   * @param {any} nextProps - new props that this component will receive
   * @override
   */

  //commented out because cause zoom glitch with new GenomeContext update
  UNSAFE_componentWillReceiveProps(nextProps) {
    // const thisNavContext = this.state.viewRegion.getNavigationContext();
    // const nextNavContext = nextProps.selectedRegion.getNavigationContext();

    // if (thisNavContext !== nextNavContext) {
    //   this.setState({ viewRegion: new DisplayedRegionModel(nextNavContext) });
    // }
    if (
      this.props.selectedRegion.getGenomeIntervals()[0].chr !==
      nextProps.selectedRegion.getGenomeIntervals()[0].chr
    ) {
      this.setState({
        viewRegion: this._setInitialView(nextProps.selectedRegion),
      });
    }
  }

  /**
   * Copies this.state.viewRegion, mutates it by calling `methodName` with `args`, and then calls this.setState().
   *
   * @param {string} methodName - the method to call on the model
   * @param {any[]} args - arguments to provide to the method
   */
  _setModelState(methodName: string, args: any[]) {
    let regionCopy = this.state.viewRegion.clone();
    regionCopy[methodName].apply(regionCopy, args);
    if (regionCopy.getWidth() < MIN_VIEW_REGION_SIZE) {
      return;
    }
    this.setState({ viewRegion: regionCopy });
  }

  /**
   * Wrapper for calling zoom() on the view model.
   *
   * @param {number} amount - amount to zoom
   * @param {number} [focusPoint] - focal point of the zoom
   * @see DisplayedRegionModel#zoom
   */
  zoom(amount: any, focusPoint: any) {
    this._setModelState("zoom", [amount, focusPoint]);
  }

  /**
   * Wrapper for calling setRegion() on the view model
   *
   * @param {number} newStart - start nav context coordinate
   * @param {number} newEnd - end nav context coordinate
   * @see DisplayedRegionModel#setRegion
   */
  setNewView(newStart: any, newEnd: any) {
    this._setModelState("setRegion", [newStart, newEnd]);
  }

  /**
   * Zooms the view to the right level when the zoom slider is dragged.
   *
   * @param {React.SyntheticEvent} event - the event that react fired when the zoom slider was changed
   */
  zoomSliderDragged(event: { target: { value: number } }) {
    let targetRegionSize = Math.exp(event.target.value);
    let proportion = targetRegionSize / this.state.viewRegion.getWidth();
    this._setModelState("zoom", [proportion]);
  }

  /**
   * @inheritdoc
   */
  render() {
    return (
      <div>
        <MainPane
          viewRegion={this.state.viewRegion}
          selectedRegion={this.props.selectedRegion}
          onRegionSelected={this.props.onRegionSelected}
          onNewViewRequested={this.setNewView}
          onZoom={this.zoom}
          containerWidth={this.props.windowWidth}
          genomeConfig={this.props.genomeConfig}
        />
      </div>
    );
  }
}

export default GenomeNavigator;
