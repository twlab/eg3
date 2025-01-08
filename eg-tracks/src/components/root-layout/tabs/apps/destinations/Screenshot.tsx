import { NavigationComponentProps } from "@/components/core-navigation/NavigationStack";
import { useGenome } from "@/lib/contexts/GenomeContext";
import { useEffect } from "react";
import ScreenshotUI from "@/components/GenomeView/TabComponents/ScreenshotUI";
export default function Screenshot({ params }: NavigationComponentProps) {
  const { setScreenshotOpen, screenshotData } = useGenome();

  useEffect(() => {
    if (Object.keys(screenshotData).length > 0) {
      console.log(screenshotData);
    }
  }, [screenshotData]);
  useEffect(() => {
    setScreenshotOpen(true);
    return () => {
      setScreenshotOpen(false);
    };
  }, []);
  return Object.keys(screenshotData).length > 0 ? (
    <ScreenshotUI
      highlights={screenshotData.highlights}
      needClip={false}
      legendWidth={120}
      primaryView={screenshotData.primaryView}
      darkTheme={false}
      tracks={screenshotData.tracks}
      trackData={screenshotData.componentData}
      metadataTerms={[]}
      viewRegion={screenshotData.viewRegion}
    />
  ) : (
    ""
  );
}
