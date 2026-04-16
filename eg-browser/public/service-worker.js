self.addEventListener('install', function (event) {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
    event.waitUntil((async () => {
        // Optional: clear old caches if your app uses them.
        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        } catch (e) {
            // ignore cache cleanup failures
        }

        if (self.clients && self.clients.claim) {
            await self.clients.claim();
        }
        // Notify open window clients that a new version is active and they should reload
        try {
            const clients = await self.clients.matchAll({ type: 'window' });
            for (const client of clients) {
                client.postMessage({ type: 'FORCE_RELOAD' });
            }
        } catch (e) {
            // ignore message failures
        }
    })());
});


self.addEventListener('fetch', function (event) {

});
