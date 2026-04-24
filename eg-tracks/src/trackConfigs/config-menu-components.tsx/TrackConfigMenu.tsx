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
  const [visible, setVisible] = useState(false);

  // Use mouse coordinates for positioning (page coordinates)
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
    if (!menuRef.current) return;

    setVisible(false);

    const adjust = () => {
      const menuRect = menuRef.current!.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // cur viewport coords
      const viewportX = mouseX - window.scrollX;
      const viewportY = mouseY - window.scrollY;

      let left = viewportX;
      let top = viewportY;

      // overflow right viewport edge
      if (left + menuRect.width > viewportWidth) {
        left = Math.max(8, viewportWidth - menuRect.width - 8);
      }

      // overflow bottom viewport edge
      if (top + menuRect.height > viewportHeight) {
        top = Math.max(8, viewportHeight - menuRect.height);
      }

      // not off the left/top edges
      left = Math.max(8, left);
      top = Math.max(8, top );

      setPosition({ left, top });
      setVisible(true);
    };

    // Run adjustment after render to measure size
    const id = window.requestAnimationFrame(adjust);
    return () => window.cancelAnimationFrame(id);
  }, [mouseX, mouseY, menuData.items, menuData.tracks]);

  const configMenu = (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        left: position.left,
        top: position.top,
        color: darkTheme ? "white" : "black",
        zIndex: 99999,
        pointerEvents: visible ? "auto" : "none",
        opacity: visible ? 1 : 0,
        maxHeight: "90vh",
        overflowY: "auto",
        overflowX: "hidden",
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

  return configMenu;
}

export default React.memo(ConfigMenuComponent);
