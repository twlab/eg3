import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../lib/redux/hooks";
import { setCookieConsentStatus, selectCookieConsentStatus } from "../../lib/redux/slices/settingsSlice";
import { AnimatePresence, motion } from "framer-motion";

declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}

const GOOGLE_ANALYTICS_ID: string | null = window.location.origin === 'https://epigenomegateway.wustl.edu' ? 'G-KSVNDZFZSM' : null;

export default function GoogleAnalytics() {
    const dispatch = useAppDispatch();
    const cookieConsentStatus = useAppSelector(selectCookieConsentStatus);

    useEffect(() => {
        if (!GOOGLE_ANALYTICS_ID) return;

        const script1 = document.createElement('script');
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            gtag('consent', 'default', {
              'analytics_storage': 'denied'
            });
            
            gtag('config', '${GOOGLE_ANALYTICS_ID}');
        `;
        document.head.appendChild(script2);

        return () => {
            document.head.removeChild(script1);
            document.head.removeChild(script2);
        };
    }, []);

    useEffect(() => {
        if (!GOOGLE_ANALYTICS_ID) return;
        if (cookieConsentStatus === 'granted') {
            window.gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        }
    }, [cookieConsentStatus]);

    return (
        <AnimatePresence>
            {(!cookieConsentStatus || cookieConsentStatus === 'pending') && (
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    className="fixed bottom-0 left-0 right-0 bg-gray-400 p-2 shadow-lg flex items-center justify-between z-50"
                >
                    <p className="text-sm text-primary">
                        We use cookies to analyze site usage and improve our services.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => dispatch(setCookieConsentStatus('denied'))}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-md"
                        >
                            Decline
                        </button>
                        <button
                            onClick={() => dispatch(setCookieConsentStatus('granted'))}
                            className="px-4 py-2 text-sm bg-secondary text-black rounded-md"
                        >
                            Accept
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}