import { useEffect, useState } from "react";
import ScreenshotUI from "@eg/tracks/src/components/GenomeView/TabComponents/ScreenshotUI";
import {
  selectScreenShotData,
  selectScreenShotOpen,
  updateScreenShotData,
  updateScreenShotOpen,
} from "@/lib/redux/slices/hubSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import useExpandedNavigationTab from "../../../../../lib/hooks/useExpandedNavigationTab";

export default function Screenshot() {
  useExpandedNavigationTab();
  const screenShotData = useAppSelector(selectScreenShotData);
  const isOpen = useAppSelector(selectScreenShotOpen);
  const [showModal, setShowModal] = useState(false);
  const dispatch = useAppDispatch();

  function handleCloseModal() {
    dispatch(updateScreenShotData({}));
    dispatch(updateScreenShotOpen(false));
  }

  useEffect(() => {
    dispatch(updateScreenShotOpen(true));
    setShowModal(true);
    return () => {
      dispatch(updateScreenShotOpen(false));
      dispatch(updateScreenShotData({}));
    };
  }, []);

  return Object.keys(screenShotData).length > 0 && isOpen ? (
    <div   >
      <ScreenshotUI
        highlights={screenShotData.highlights}
        needClip={false}
        legendWidth={120}
        primaryView={screenShotData.primaryView}
        darkTheme={true}
        tracks={screenShotData.tracks}
        trackData={screenShotData.trackData}
        metadataTerms={[]}
        // viewRegion={screenShotData.viewRegion}
        handleCloseModal={handleCloseModal}
        isOpen={showModal}
        windowWidth={screenShotData.windowWidth}
      />
    </div>
  ) : (
    ""
  );
}
