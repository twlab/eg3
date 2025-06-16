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

function ConfigMenuComponent(props: any) {
  const menuData = props.menuData;

  // Memoize block position data to avoid recalculating unless ref changes
  const blockPosData = useMemo(
    () => menuData.blockRef.current.getBoundingClientRect(),
    [menuData.blockRef]
  );
  const leftMargin = blockPosData.left;

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

  return (
    <Manager>
      <Reference>
        {({ ref }) => (
          <div
            ref={ref}
            style={{
              position: "absolute",
              left: menuData.pageX - leftMargin,
              top: menuData.pageY - blockPosData.height,
              backgroundColor: "var(--bg-container-color)",
              color: "var(--font-color)",
            }}
          >
            <Popper placement="right-end">
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
                      style={{ backgroundColor: "var(--bg-container-color)" }}
                    >
                      <MenuTitle
                        title={
                          menuData.selectCount > 1
                            ? menuData.selectCount + " tracks selected"
                            : menuData.selectCount === 1 &&
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
    </Manager>
  );
}

export default React.memo(ConfigMenuComponent);
