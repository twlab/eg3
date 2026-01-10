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

      // Use page coordinates directly for position: absolute
      let left = mouseX;
      let top = mouseY - 200;

      // Convert to viewport coordinates to check overflow
      const viewportX = mouseX - window.scrollX;
      const viewportY = mouseY - window.scrollY;

      // Check if menu would overflow right edge of viewport
      if (viewportX + menuRect.width > viewportWidth) {
        left = mouseX - menuRect.width;
      }

      // Check if menu would overflow bottom edge of viewport
      if (viewportY + menuRect.height > viewportHeight) {
        top = mouseY - menuRect.height;
      }

      // Ensure menu doesn't go off left edge
      if (left - window.scrollX < 0) {
        left = window.scrollX + 10;
      }

      // Ensure menu doesn't go off top edge
      if (top - window.scrollY < 0) {
        top = window.scrollY + 10;
      }

      setPosition({ left, top });
    }
  }, [mouseX, mouseY]);

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        left: position.left,
        top: position.top,
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
