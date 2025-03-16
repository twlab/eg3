import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";

import { useEffect, useState } from "react";
import ScreenshotUI from "@eg/tracks/src/components/GenomeView/TabComponents/ScreenshotUI";
import {
  selectScreenShotData,
  updateScreenShotOpen,
} from "@/lib/redux/slices/hubSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";

export default function Screenshot() {
  const screenShotData = useAppSelector(selectScreenShotData);
  const [showModal, setShowModal] = useState(false);
  const dispatch = useAppDispatch();
  function handleCloseModal() {
    setShowModal(false);
  }
  //   useEffect(() => {
  //     if (Object.keys(screenShotData).length > 0) {
  //       console.log(screenShotData);
  //     }
  //   }, [screenShotData]);

  useEffect(() => {
    dispatch(updateScreenShotOpen(true));
    setShowModal(true);
    return () => {
      dispatch(updateScreenShotOpen(false));
    };
  }, []);

  return Object.keys(screenShotData).length > 0 ? (
    <ScreenshotUI
      highlights={screenShotData.highlights}
      needClip={false}
      legendWidth={120}
      primaryView={screenShotData.primaryView}
      darkTheme={false}
      tracks={screenShotData.tracks}
      trackData={screenShotData.componentData}
      metadataTerms={[]}
      viewRegion={screenShotData.viewRegion}
      handleCloseModal={handleCloseModal}
      isOpen={showModal}
    />
  ) : (
    ""
  );
}
