import { useEffect, useRef, useState } from "react";
import ScreenshotUI from "@eg/tracks/src/components/GenomeView/TabComponents/ScreenshotUI";
import {
  selectScreenShotData,
  selectScreenShotOpen,
  updateScreenShotData,
  updateScreenShotOpen,
} from "@/lib/redux/slices/hubSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import useExpandedNavigationTab from "../../../../../lib/hooks/useExpandedNavigationTab";
import { selectDarkTheme } from "@/lib/redux/slices/settingsSlice";

export default function Screenshot() {
  useExpandedNavigationTab();
  const darkTheme = useAppSelector(selectDarkTheme);
  const screenShotData = useAppSelector(selectScreenShotData);
  const isOpen = useAppSelector(selectScreenShotOpen);
  const isRetakeScreenshot = useRef<boolean>(false);
  const dispatch = useAppDispatch();

  function retakeScreenshot() {
    dispatch(updateScreenShotData({}));
    dispatch(updateScreenShotOpen(false));
    isRetakeScreenshot.current = true;
  }

  useEffect(() => {
    if (
      screenShotData &&
      Object.keys(screenShotData).length === 0 &&
      isRetakeScreenshot.current
    ) {
      dispatch(updateScreenShotOpen(true));
      isRetakeScreenshot.current = false;
    }
  }, [screenShotData]);

  useEffect(() => {
    dispatch(updateScreenShotOpen(true));

    return () => {
      dispatch(updateScreenShotOpen(false));
      dispatch(updateScreenShotData({}));
    };
  }, []);

  return Object.keys(screenShotData).length > 0 && isOpen ? (
    <div>
      <ScreenshotUI
        highlights={screenShotData.highlights}
        needClip={false}
        legendWidth={120}
        primaryView={screenShotData.primaryView}
        darkTheme={
          darkTheme !== null || darkTheme !== undefined ? darkTheme : false
        }
        tracks={screenShotData.tracks}
        trackData={screenShotData.trackData}
        metadataTerms={[]}
        retakeScreenshot={retakeScreenshot}
        windowWidth={screenShotData.windowWidth}
      />
    </div>
  ) : (
    <div> No tracks in view </div>
  );
}
