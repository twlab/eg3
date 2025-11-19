import React, { useMemo } from "react";
import { Manager, Reference, Popper } from "react-popper";
import {
  MenuTitle,
  RemoveOption,
  TrackMoreInfo,
  MatplotMenu,
  HicBinSizeNormOptionConfig,
} from "./TrackContextMenu";
import "./TrackContextMenu.css";
import OutsideClickDetector from "../../components/GenomeView/TrackComponents/commonComponents/OutsideClickDetector";
import ReactDOM from "react-dom";

function ConfigMenuComponent(pro  ps: any) {
  const menuData = props.menuData;
  const darkTheme = props.darkTheme;
  // Use mouse coordinates for positioning
  const left = menuData.pageX || 0;
  const top = menuData.pageY || 0;

  // Memoize menu items to avoid unnecessary re-renders
  const menuItems = useMemo(
    () =>
      menuData.items.map((MenuComponent: any, index: number) => {
        let defaultVal: any;
        return (
          <MenuComponent
            key={index}
            optionsObjects={menuData.configOptions}
            defaultValue={defaultVal}
            onOptionSet={menuData.onConfigChange}
            trackId={menuData.trackId}
          />
        );
      }),
    [
      menuData.items,
      menuData.configOptions,
      menuData.onConfigChange,
      menuData.trackId,
    ]
  );
  // left: menuData.pageX - leftMargin,
  // top: menuData.pageY - blockPosData.height,
  return ReactDOM.createPortal(
    <Manager>
      <Reference>
        {({ ref }) => (
          <div
            ref={ref}
            style={{
              position: "absolute",
              left: Math.abs(left), // slight offset to avoid default right click menu
              top: top + 2,
              color: darkTheme ? "white" : "black",
              zIndex: 1000,
            }}
          >
            <Popper
            // placement="top-start"
            // modifiers={[{ name: "flip", enabled: false }]}
            >
              {({ ref, style }) => (
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
                      style={{ backgroundColor: darkTheme ? "black" : "white" }}
                    >
                      <MenuTitle
                        title={
                          menuData.selectCount > 1
                            ? menuData.selectCount + " tracks selected"
                            : menuData.selectCount === 1 &&
                              menuData.tracks &&
                              menuData.tracks[0] &&
                              menuData.tracks[0].options &&
                              menuData.tracks[0].options.label
                            ? menuData.tracks[0].options.label
                            : "(unnamed track)"
                        }
                        numTracks={menuData.selectCount}
                      />
                      <HicBinSizeNormOptionConfig
                        tracks={menuData.tracks}
                        fileInfos={menuData.fileInfos}
                        onOptionSet={menuData.onConfigChange}
                      />
                      {menuItems}
                      <RemoveOption
                        onClick={menuData.handleDelete}
                        trackId={menuData.configOptions.map(
                          (item: any) => item.trackId
                        )}
                        numTracks={menuData.selectCount}
                      />
                      <MatplotMenu
                        tracks={menuData.tracks}
                        onApplyMatplot={menuData.handleAdd}
                      />
                      {menuData.tracks.length === 1 ? (
                        <TrackMoreInfo track={menuData.tracks[0]} />
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
    </Manager>,
    document.body
  );
}

export default React.memo(ConfigMenuComponent);
