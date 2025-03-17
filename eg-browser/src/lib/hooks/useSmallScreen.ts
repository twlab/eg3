import { useState } from "react";
import { useEffect } from "react";

const SMALL_SCREEN_WIDTH = 800;

export default function useSmallScreen() {
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < SMALL_SCREEN_WIDTH);

    useEffect(() => {
        const handleResize = () => {
            setIsSmallScreen(window.innerWidth < SMALL_SCREEN_WIDTH);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return isSmallScreen;
}
