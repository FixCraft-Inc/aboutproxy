importScripts('./uv/uv.bundle.js');
importScripts('./uv/uv.config.js');
importScripts('./uv/uv.sw.js');

const uv = new UVServiceWorker();

self.addEventListener('fetch', event => {
    event.respondWith(
        (async ()=>{
            if(event.request.url.startsWith(location.origin + __uv$config.prefix)) {
                return await uv.fetch(event);
            }
            return await fetch(event.request);
        })()
    );
});

self.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'fixcraft:sw:disable') {
        event.waitUntil(clearAndUnregister());
    }
});

async function clearAndUnregister() {
    try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
    } catch (err) {
        console.warn('[fixcraft-sw] cache clear failed', err);
    }
    try {
        await self.registration.unregister();
    } catch (err) {
        console.warn('[fixcraft-sw] unregister failed', err);
    }
}
