import TrackRegionController from "../../genomeNavigator/TrackRegionController";
import ButtonGroup from "./ButtonGroup";
import { HighlightMenu } from "./HighlightMenu";
import MetadataHeader from "./MetadataHeader";
import ReorderMany from "./ReorderMany";
import { ToolButtons, Tools } from "./Tools";
import UndoRedo from "./UndoRedo";
import ZoomButtons from "./ZoomButtons";
import "./TrackContainer.css";
function SubToolButtons(props) {
  const panLeftButton = (
    <button
      className="btn btn-outline-secondary"
      title="Pan left
(Alt+Z)"
      style={{ fontFamily: "monospace" }}
      // onClick={() => this.panLeftOrRight(true)}
    >
      ◀
    </button>
  );
  const panRightButton = (
    <button
      className="btn btn-outline-secondary"
      title="Pan right
(Alt+X)"
      style={{ fontFamily: "monospace" }}
      // onClick={() => this.panLeftOrRight(false)}
    >
      ▶
    </button>
  );
  return (
    <div className="tool-container">
      <div className="tool-panel">
        <ToolButtons allTools={Tools} onToolClicked={props.onToolClicked} />
        {/* {this.props.embeddingMode && (
          <TrackRegionController
            selectedRegion={viewRegion}
            onRegionSelected={onNewRegion}
            onToggleHighlight={onToggleHighlight}
            onNewHighlight={onNewHighlight}
          />
        )} */}
        <div
          className="tool-element"
          style={{ display: "flex", alignItems: "center" }}
        >
          {/* <ReorderMany
            onOpenReorderManyModal={this.openReorderManyModal}
            onCloseReorderManyModal={this.closeReorderManyModal}
            showReorderManyModal={this.state.showReorderManyModal}
          /> */}
        </div>

        <ButtonGroup buttons={panLeftButton} />
        <ZoomButtons />
        <ButtonGroup buttons={panRightButton} />

        <div
          className="tool-element"
          style={{ display: "flex", alignItems: "center" }}
        >
          {/* <UndoRedo /> */}
        </div>
        <div
          className="tool-element"
          style={{ display: "flex", alignItems: "center" }}
        >
          {/* <History /> */}
        </div>
        {/* <div
          className="tool-element"
          style={{ display: "flex", alignItems: "center" }}
        >
          <HighlightMenu
            onSetHighlights={onSetHighlights}
            onOpenHighlightMenuModal={this.openHighlightMenuModal}
            onCloseHighlightMenuModal={this.closeHighlightMenuModal}
            showHighlightMenuModal={this.state.showHighlightMenuModal}
            highlights={highlights}
            viewRegion={viewRegion}
            onNewRegion={onNewRegion}
          />
        </div>
        <div
          className="tool-element"
          style={{ minWidth: "200px", alignSelf: "center" }}
        >
          <PixelInfo
            basesPerPixel={this.props.basesPerPixel}
            viewRegion={viewRegion}
            primaryView={primaryView}
          />
        </div>
        <MetadataHeader
          terms={metadataTerms}
          onNewTerms={onMetadataTermsChanged}
          suggestedMetaSets={suggestedMetaSets}
        /> */}
      </div>
    </div>
  );
}

export default SubToolButtons;
