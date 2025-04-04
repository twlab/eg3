import { Manager, Reference, Popper } from "react-popper";
import { MenuTitle, RemoveOption, TrackMoreInfo } from "./TrackContextMenu";
import "./TrackContextMenu.css";

import OutsideClickDetector from "../../components/GenomeView/TrackComponents/commonComponents/OutsideClickDetector";
import React from "react";

function ConfigMenuComponent(props: any) {
  let menuData = props.menuData;

  let blockPosData = menuData.blockRef.current.getBoundingClientRect();
  let leftMargin = blockPosData.left;

  // ReactDOM.createPortal(
  // need to set id matching the track component so it rememebers each specific
  // track config settings

  return (
    <Manager>
      <Reference>
        {({ ref }) => (
          <div
            ref={ref}
            style={{
              position: "absolute",
              left: menuData.pageX - leftMargin,
              // measured from bottom to top of the component
              top: menuData.pageY - blockPosData.height,
            }}
          >
            <Popper placement="right-end">
              {({ ref, style, placement, arrowProps }) => (
                <div
                  ref={ref}
                  style={{
                    ...style,

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
                        title={
                          menuData.selectCount > 1
                            ? menuData.selectCount + " tracks selected"
                            : menuData.trackModel.options.label
                              ? menuData.trackModel.options.label
                              : "(unnamed track)"
                        }
                        numTracks={menuData.selectCount}
                      />
                      {menuData.items.map(
                        (MenuComponent: any, index: number) => {
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
                        }
                      )}
                      <RemoveOption
                        onClick={menuData.handleDelete}
                        trackId={menuData.configOptions.map(
                          (item: any) => item.trackId
                        )}
                        numTracks={menuData.selectCount}
                      />
                      {menuData.trackModel ? (
                        <TrackMoreInfo track={menuData.trackModel} />
                      ) : (
                        ""
                      )}
                    </div>
                  </OutsideClickDetector>
                </div>
              )}
            </Popper>
          </div>
        )}
      </Reference>
    </Manager>
    // ,
    // menuData.blockRef.current
  );
}

export default ConfigMenuComponent;
