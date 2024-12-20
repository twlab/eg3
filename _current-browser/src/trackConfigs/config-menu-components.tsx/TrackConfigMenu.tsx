import ReactDOM from "react-dom";
import { Manager, Reference, Popper } from "react-popper";
import { MenuTitle, RemoveOption } from "./TrackContextMenu";
import "./TrackContextMenu.css";

import OutsideClickDetector from "../../components/GenomeView/TrackComponents/commonComponents/OutsideClickDetector";

function ConfigMenuComponent(props) {
  let menuData = props.menuData;

  let blockPosData = menuData.blockRef.current.getBoundingClientRect();
  let leftMargin = blockPosData.left;

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
                    onOutsideClick={menuData.onConfigMenuClose}
                  >
                    <div
                      className="TrackContextMenu-body"
                      style={{ backgroundColor: "white" }}
                    >
                      <MenuTitle
                        title={menuData.selectLen + " tracks selected"}
                        numTracks={menuData.trackIdx}
                      />
                      {menuData.items.map((MenuComponent, index) => {
                        let defaultVal: any;
                        // if we don't give default option here the state of each
                        // will persist between displaymodes.
                        // a new defaultValue will create a new menu component with
                        // the new changed option set as new defaultvalue

                        return (
                          <MenuComponent
                            key={index}
                            optionsObjects={menuData.configOptions}
                            defaultValue={defaultVal}
                            onOptionSet={menuData.onConfigChange}
                          />
                        );
                      })}
                      <RemoveOption
                        onClick={menuData.handleDelete}
                        trackId={menuData.configOptions.map(
                          (item, index) => item.trackId
                        )}
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

export default ConfigMenuComponent;
