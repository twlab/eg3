import Logo from '../../assets/logo.png'
import { useAppDispatch, useAppSelector } from '../../lib/redux/hooks';
import { selectNavigationTab, selectSessionPanelOpen, setNavigationTab, setSessionPanelOpen } from '../../lib/redux/slices/navigationSlice';
import Button from '../ui/button/Button';
import { motion, AnimatePresence } from 'framer-motion'
import useSmallScreen from '../../lib/hooks/useSmallScreen';
import { selectCurrentSessionId } from '@/lib/redux/slices/browserSlice';

export default function NavBar() {
    const isSmallScreen = useSmallScreen();

    const dispatch = useAppDispatch();
    const currentTab = useAppSelector(selectNavigationTab);
    const sessionId = useAppSelector(selectCurrentSessionId);
    const sessionPanelOpen = useAppSelector(selectSessionPanelOpen);

    return (
        <div className="w-screen flex flex-row justify-between items-center p-4 border-b border-gray-300 bg-white">
            <div className="flex flex-row items-center gap-4 cursor-pointer" onClick={() => dispatch(setSessionPanelOpen(!sessionPanelOpen))}>
                <img src={Logo} alt="logo" className="w-8 h-8" />
                {!isSmallScreen && (
                    <h1 className="text-2xl text-primary font-light">
                        <span className="font-medium">WashU </span>  Epigenome Browser
                    </h1>
                )}
            </div>
            <AnimatePresence>
                {sessionId !== null && (
                    <motion.div
                        className="flex flex-row items-center gap-4"
                        style={{
                            pointerEvents: sessionPanelOpen ? 'none' : 'auto'
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                            opacity: sessionPanelOpen ? 0 : 1,
                            y: 0,
                        }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Button onClick={() => dispatch(setNavigationTab(currentTab === 'tracks' ? null : 'tracks'))} active={currentTab === 'tracks'}>Tracks</Button>
                        <Button onClick={() => dispatch(setNavigationTab(currentTab === 'apps' ? null : 'apps'))} active={currentTab === 'apps'}>Apps</Button>
                        <Button onClick={() => dispatch(setNavigationTab(currentTab === 'help' ? null : 'help'))} active={currentTab === 'help'}>Help</Button>
                        <Button onClick={() => dispatch(setNavigationTab(currentTab === 'share' ? null : 'share'))} active={currentTab === 'share'}>Share</Button>
                        <Button onClick={() => dispatch(setNavigationTab(currentTab === 'settings' ? null : 'settings'))} active={currentTab === 'settings'}>Settings</Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
