import Logo from "../../../assets/images/icon.png";
import { useAppDispatch, useAppSelector } from "../../../lib/redux/hooks";
import {
  selectNavigationTab,
  setNavigationTab,
} from "../../../lib/redux/slices/navigationSlice";
import Button from "../../ui/button/Button";
import { motion, AnimatePresence } from "framer-motion";
import useSmallScreen from "../../../lib/hooks/useSmallScreen";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useGenome } from "../../../lib/contexts/GenomeContext";

export default function Toolbar({
  showMenuButtons,
}: {
  showMenuButtons?: boolean;
}) {
  const isSmallScreen = useSmallScreen();
  const dispatch = useAppDispatch();
  const currentTab = useAppSelector(selectNavigationTab);
  const { selectedGenome, setSelectedGenome, resetStatesToDefault } =
    useGenome();

  return (
    <div className="w-screen flex flex-row justify-between items-center p-4 border-b border-primary bg-white">
      <div className="flex flex-row items-center gap-4">
        {selectedGenome.length > 0 && (
          <button
            onClick={() => resetStatesToDefault()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-primary" />
          </button>
        )}
        <img src={Logo} alt="logo" className="w-8 h-8" />
        {!isSmallScreen && (
          <h1 className="text-2xl text-primary font-light">
            <span className="font-medium">WashU </span> Epigenome Browser
          </h1>
        )}
      </div>
      <AnimatePresence>
        {showMenuButtons && (
          <motion.div
            className="flex flex-row items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={() =>
                dispatch(
                  setNavigationTab(currentTab === "tracks" ? null : "tracks")
                )
              }
              active={currentTab === "tracks"}
            >
              Tracks
            </Button>
            <Button
              onClick={() =>
                dispatch(
                  setNavigationTab(currentTab === "apps" ? null : "apps")
                )
              }
              active={currentTab === "apps"}
            >
              Apps
            </Button>
            <Button
              onClick={() =>
                dispatch(
                  setNavigationTab(currentTab === "help" ? null : "help")
                )
              }
              active={currentTab === "help"}
            >
              Help
            </Button>
            <Button
              onClick={() =>
                dispatch(
                  setNavigationTab(currentTab === "share" ? null : "share")
                )
              }
              active={currentTab === "share"}
            >
              Share
            </Button>
            <Button
              onClick={() =>
                dispatch(
                  setNavigationTab(
                    currentTab === "settings" ? null : "settings"
                  )
                )
              }
              active={currentTab === "settings"}
            >
              Settings
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
