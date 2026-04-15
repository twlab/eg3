import React, { useMemo, useRef, useEffect, useState, useContext } from "react";
import ReactDOM from "react-dom";
import PortalContext from "../../lib/PortalContext";
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
  const [position, setPosition] = useState({ left: -9999, top: -9999 });
  const portalTarget = useContext(PortalContext);

  const viewportX = menuData.viewportX || 0;
  const viewportY = menuData.viewportY || 0;

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
    ],
  );

  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // When rendered inside a container, offset by the container's bounding rect
      const containerRect = portalTarget
        ? portalTarget.getBoundingClientRect()
        : { left: 0, top: 0 };

      let left = viewportX - containerRect.left;
      let top = viewportY - containerRect.top;

      // Prevent right edge overflow
      if (viewportX + menuRect.width > viewportWidth) {
        left = viewportX - menuRect.width - containerRect.left;
      }

      // Prevent bottom edge overflow
      if (viewportY + menuRect.height > viewportHeight) {
        top = viewportY - menuRect.height - containerRect.top;
        if (top < 0) top = 0;
      }

      setPosition({ left, top });
    }
  }, [viewportX, viewportY, portalTarget]);

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        left: position.left,
        top: position.top,
        color: darkTheme ? "white" : "black",
        zIndex: 9999,
        pointerEvents: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="TrackContextMenu-body"
        style={{ backgroundColor: darkTheme ? "black" : "white" }}
        // onContextMenu={(e) => e.preventDefault()}
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
    </div>,
    portalTarget ?? document.body,
  );
}

export default React.memo(ConfigMenuComponent);
