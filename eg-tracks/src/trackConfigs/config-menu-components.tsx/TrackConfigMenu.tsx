import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  MenuTitle,
  RemoveOption,
  TrackMoreInfo,
  MatplotMenu,
  HicBinSizeNormOptionConfig,
} from "./TrackContextMenu";
import "./TrackContextMenu.css";

function ConfigMenuComponent(props: any) {
  const menuData = props.menuData;
  const darkTheme = props.darkTheme;
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  // Use mouse coordinates for positioning
  const mouseX = menuData.pageX || 0;
  const mouseY = menuData.pageY || 0;

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

  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = mouseX;
      let top = mouseY;

      // Check if menu would overflow right edge
      if (left + menuRect.width > viewportWidth) {
        left = viewportWidth - menuRect.width - 10; // 10px padding from edge
      }

      // Check if menu would overflow bottom edge
      if (top + menuRect.height > viewportHeight) {
        top = viewportHeight - menuRect.height - 10; // 10px padding from edge
      }

      // Check if menu would overflow left edge
      if (left < 0) {
        left = 10;
      }

      // Check if menu would overflow top edge
      if (top < 0) {
        top = 10;
      }

      setPosition({ left, top });
    }
  }, [mouseX, mouseY]);

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        left: position.left,
        top: position.top - 100,
        color: darkTheme ? "white" : "black",
        zIndex: 1000,
        pointerEvents: "auto",
      }}
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
          trackId={menuData.configOptions.map((item: any) => item.trackId)}
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
    </div>
  );
}

export default React.memo(ConfigMenuComponent);
