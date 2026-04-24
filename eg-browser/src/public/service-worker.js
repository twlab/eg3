self.addEventListener('install', function (event) {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
    event.waitUntil((async function () {
        const META_CACHE = 'sw-meta';
        const CLEANED_KEY = 'cleanup-done';

        // If we haven't run the one-time cleanup on this origin, do it and then unregister.
        // We store a marker in a small meta cache so the cleanup only runs once.
        const meta = await caches.open(META_CACHE);
        const cleaned = await meta.match(CLEANED_KEY);
        if (!cleaned) {
            // Delete all caches except the meta cache so we don't lose the marker.
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(function (cacheName) {
                if (cacheName === META_CACHE) return Promise.resolve();
                return caches.delete(cacheName);
            }));

            // mark that we've cleaned up once
            await meta.put(CLEANED_KEY, new Response('1'));

            // Unregister so the service worker only performed this one-time check
            await self.registration.unregister();
            return;
        }

        // Normal activation for subsequent installs: take control and refresh pages
        await self.clients.claim();

        const windowClients = await self.clients.matchAll({ type: 'window' });
        for (const client of windowClients) {
            if (typeof client.navigate === 'function') {
                try {
                    await client.navigate(client.url);
                } catch (e) {
                    client.postMessage({ type: 'SERVICE_WORKER_UPDATE' });
                }
            } else {
                client.postMessage({ type: 'SERVICE_WORKER_UPDATE' });
            }
        }
    })());
});

// Optional: simple fetch handler that falls back to network for navigations
self.addEventListener('fetch', function (event) {
    const req = event.request;
    if (req.mode === 'navigate') {
        // Network-first for navigation requests so the shell is up-to-date
        event.respondWith((async function () {
            try {
                const res = await fetch(req);
                return res;
            } catch (err) {
                // If network fails, let the browser handle it (no cached shell)
                return fetch(req.clone()).catch(() => new Response('', { status: 503 }));
            }
        })());
    }
});
