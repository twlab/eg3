import ReactDOM from "react-dom";
import { Manager, Reference, Popper } from "react-popper";
import { MenuTitle, RemoveOption } from "./TrackContextMenu";
import "./TrackContextMenu.css";
import getBigData from "../../getRemoteData/bigSource";
import getTabixData from "../../getRemoteData/tabixSource";
import OutsideClickDetector from "../../components/GenomeView/commonComponents/OutsideClickDetector";

const trackConfigMenu: { [key: string]: any } = {
  multi: function multiConfig(data: any) {
    data["selectType"] = "multi";
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },
  geneannotation: function refGeneConfigMenu(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },

  bed: function bedConfigMenu(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },
  bigbed: function bedConfigMenu(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },
  refbed: function refbedConfigMenu(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },
  bigwig: function bigConfigMenu(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },

  dynseq: function dynseqConfigMenu(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },
  methylc: function methylcConfigMenu(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },
  hic: function hicConfigMenu(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },
  categorical: function categoricalConfigMenu(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },
  longrange: function longrangeConfigMenu(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },

  biginteract: function biginteractConfigMenu(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },
  repeatmasker: function repeatmaskerConfigMenu(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },
  genomealign: function genomeAlignFetch(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },
  ruler: function rulerConfig(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },

  matplot: function matplotConfig(data: any) {
    return (
      <ConfigMenuComponent
        key={"TrackContextMenu" + `${data.id}`}
        menuData={data}
      />
    );
  },
};
function ConfigMenuComponent(props) {
  let menuData = props.menuData;
  console.log(menuData);
  let blockPosData = menuData.blockRef.current.getBoundingClientRect();
  let leftMargin = blockPosData.left;
  let topMargin = blockPosData.top;
  return ReactDOM.createPortal(
    // need to set id matching the track component so it rememebers each specific
    // track config settings
    <Manager>
      <Reference>
        {({ ref }) => (
          <div
            ref={ref}
            style={{
              position: "absolute",
              left: menuData.pageX - leftMargin,
              top: menuData.pageY - 300,
            }}
          >
            {" "}
            <Popper placement="right">
              {({ ref, style, placement, arrowProps }) => (
                <div
                  ref={ref}
                  style={{
                    ...style,
                    maxHeight: "calc(100vh - 20px)",
                    overflow: "auto",
                    zIndex: 1000,
                  }}
                >
                  <OutsideClickDetector
                    onOutsideClick={menuData.onCloseConfigMenu}
                  >
                    <div
                      className="TrackContextMenu-body"
                      style={{ backgroundColor: "white" }}
                    >
                      <MenuTitle
                        title={
                          menuData.selectType === "multi"
                            ? menuData.selectLen + " tracks selected"
                            : menuData.trackModel.getDisplayLabel()
                        }
                        numTracks={menuData.trackIdx}
                      />
                      {menuData.items.map((MenuComponent, index) => {
                        let defaultVal: any;
                        // if we don't give default option here the state of each
                        // will persist between displaymodes.
                        // a new defaultValue will create a new menu component with
                        // the new changed option set as new defaultvalue

                        if (MenuComponent.name === "LabelConfig") {
                          defaultVal =
                            menuData.selectType === "multi"
                              ? "multi"
                              : menuData.trackModel.name;
                        } else if (MenuComponent.name === "MaxRowsConfig") {
                          defaultVal = Number(menuData.configOptions.maxRows);
                        } else if (
                          MenuComponent.name === "AnnotationDisplayModeConfig"
                        ) {
                          defaultVal = menuData.configOptions.displayMode;
                        } else if (
                          MenuComponent.name === "HiddenPixelsConfig"
                        ) {
                          defaultVal = menuData.configOptions.hiddenPixels;
                        }

                        return (
                          <MenuComponent
                            key={index}
                            optionsObjects={
                              menuData.selectType === "multi"
                                ? menuData.configOptions
                                : [menuData.configOptions]
                            }
                            defaultValue={defaultVal}
                            onOptionSet={menuData.onConfigChange}
                          />
                        );
                      })}
                      <RemoveOption
                        onClick={menuData.handleDelete}
                        numTracks={menuData.trackIdx}
                      />
                    </div>
                  </OutsideClickDetector>
                </div>
              )}
            </Popper>
          </div>
        )}
      </Reference>
    </Manager>,
    menuData.blockRef.current
  );
}

export default trackConfigMenu;
