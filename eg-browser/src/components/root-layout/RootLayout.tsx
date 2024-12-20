import { useAppDispatch, useAppSelector } from "../../lib/redux/hooks";
import { selectGenome } from "../../lib/redux/slices/genomeSlice";
import { selectNavigationTab, setNavigationTab } from "../../lib/redux/slices/navigationSlice";
import GenomePicker from "../genome-picker/GenomePicker";
import GenomeView from "../genome-view/GenomeView";
import Toolbar from "../toolbar/Toolbar";
import { AnimatePresence, motion } from "framer-motion";
import TracksTab from './tabs/tracks/TracksTab';
import AppsTab from './tabs/AppsTab';
import HelpTab from './tabs/HelpTab';
import ShareTab from './tabs/ShareTab';
import SettingsTab from './tabs/SettingsTab';
import useSmallScreen from "../../lib/hooks/useSmallScreen";

const CURL_RADIUS = 15;

export default function RootLayout() {
    const isSmallScreen = useSmallScreen();

    const dispatch = useAppDispatch();
    const genome = useAppSelector(selectGenome);
    const navigationTab = useAppSelector(selectNavigationTab);

    const isNavigationTabEmpty = navigationTab === null;

    const showRightTab = !isSmallScreen && !isNavigationTabEmpty;
    const showModal = isSmallScreen && !isNavigationTabEmpty;

    return (
        <div className="h-screen w-screen flex flex-col bg-black">
            <motion.div
                className="flex flex-col h-full"
                animate={{
                    scale: showModal ? 0.95 : 1,
                    filter: showModal ? 'blur(5px) brightness(0.7)' : 'blur(0px) brightness(1)',
                    borderRadius: showModal ? 15 : 0
                }}
            >
                <Toolbar showMenuButtons={genome !== null} />
                <div className="flex flex-row h-full">
                    <motion.div
                        className="h-full border-r bg-white overflow-hidden"
                        initial={{
                            width: '100vw'
                        }}
                        animate={{
                            borderTopRightRadius: !showRightTab ? 0 : CURL_RADIUS,
                            borderBottomRightRadius: !showRightTab ? 0 : CURL_RADIUS,
                            width: !showRightTab ? '100vw' : '75vw'
                        }}
                    >
                        <AnimatePresence mode="wait">
                            {genome !== null ? (
                                <motion.div
                                    key="genome-view"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <GenomeView genome={genome} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="genome-picker"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <GenomePicker />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {showRightTab && (
                            <motion.div
                                className="h-full bg-white overflow-hidden"
                                key="navigation-tabs"
                                initial={{
                                    width: 0,
                                    marginLeft: 0,
                                    borderTopLeftRadius: 0,
                                    borderBottomLeftRadius: 0
                                }}
                                animate={{
                                    width: '25vw',
                                    marginLeft: 5,
                                    borderTopLeftRadius: CURL_RADIUS,
                                    borderBottomLeftRadius: CURL_RADIUS
                                }}
                                exit={{
                                    width: 0,
                                    marginLeft: 0,
                                    borderTopLeftRadius: 0,
                                    borderBottomLeftRadius: 0
                                }}
                            >
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 relative">
                                        <div className="h-full" style={{ display: navigationTab === 'tracks' ? 'block' : 'none' }}>
                                            <TracksTab />
                                        </div>
                                        <div className="h-full" style={{ display: navigationTab === 'apps' ? 'block' : 'none' }}>
                                            <AppsTab />
                                        </div>
                                        <div className="h-full" style={{ display: navigationTab === 'help' ? 'block' : 'none' }}>
                                            <HelpTab />
                                        </div>
                                        <div className="h-full" style={{ display: navigationTab === 'share' ? 'block' : 'none' }}>
                                            <ShareTab />
                                        </div>
                                        <div className="h-full" style={{ display: navigationTab === 'settings' ? 'block' : 'none' }}>
                                            <SettingsTab />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {showModal && (
                    <motion.div
                        className="absolute top-12 left-0 w-screen h-screen bg-white"
                        style={{ borderRadius: CURL_RADIUS }}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                    >
                        <div className="flex flex-col h-full">
                            {navigationTab === 'tracks' && <TracksTab />} 
                            {navigationTab === 'apps' && <AppsTab />}
                            {navigationTab === 'help' && <HelpTab />}
                            {navigationTab === 'share' && <ShareTab />}
                            {navigationTab === 'settings' && <SettingsTab />}

                            <button className="absolute top-4 right-4" onClick={() => dispatch(setNavigationTab(null))}>Done</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
