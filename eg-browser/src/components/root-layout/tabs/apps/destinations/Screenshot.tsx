import { useEffect, useState } from "react";
import ScreenshotUI from "@eg/tracks/src/components/GenomeView/TabComponents/ScreenshotUI";
import {
  selectScreenShotData,
  selectScreenShotOpen,
  updateScreenShotData,
  updateScreenShotOpen,
} from "@/lib/redux/slices/hubSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";

export default function Screenshot() {
  const screenShotData = useAppSelector(selectScreenShotData);
  const isOpen = useAppSelector(selectScreenShotOpen);
  const [showModal, setShowModal] = useState(false);
  const dispatch = useAppDispatch();

  function handleCloseModal() {
    // dispatch(updateScreenShotOpen(false));
    dispatch(updateScreenShotData({}));
    dispatch(updateScreenShotOpen(false));
  }

  useEffect(() => {
    dispatch(updateScreenShotOpen(true));
    setShowModal(true);
  }, []);

  return Object.keys(screenShotData).length > 0 ? (
    <ScreenshotUI
      highlights={screenShotData.highlights}
      needClip={false}
      legendWidth={120}
      primaryView={screenShotData.primaryView}
      darkTheme={false}
      tracks={screenShotData.tracks}
      trackData={screenShotData.trackData}
      metadataTerms={[]}
      // viewRegion={screenShotData.viewRegion}
      handleCloseModal={handleCloseModal}
      isOpen={showModal}
      windowWidth={screenShotData.windowWidth}
    />
  ) : (
    ""
  );
}
