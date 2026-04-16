// ai to fix deleting cache when new version 
export default function registerServiceWorker() {
    if (typeof window === "undefined") return;
    if (!('serviceWorker' in navigator)) return;
    // Only register in production builds
    if (!import.meta.env.PROD) return;
    const doRegister = () => {
        // Use a relative path so registration works when the app is served from a subpath (e.g. /browser/)
        const swPath = './service-worker.js';
        navigator.serviceWorker
            .register(swPath)
            .then((registration) => {

                registration.addEventListener('updatefound', () => {
                    const installing = registration.installing;
                    installing?.addEventListener('statechange', () => {

                    });
                });
                // Listen for messages from the service worker (e.g., FORCE_RELOAD)
                navigator.serviceWorker.addEventListener('message', (evt) => {
                    try {
                        if (evt.data && evt.data.type === 'FORCE_RELOAD') {
                            console.log('Service worker requested reload — reloading page');
                            window.location.reload();
                        }
                    } catch (e) {
                        // ignore
                    }
                });
            })
            .catch((err) => {
                console.error('Service worker registration failed:', err);
            });
    };

    if (document.readyState === 'complete') {
        doRegister();
    } else {
        window.addEventListener('load', doRegister);
    }
}
