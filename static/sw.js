importScripts('./uv/uv.bundle.js');
importScripts('./uv/uv.config.js');
importScripts('./uv/uv.sw.js');

const uv = new UVServiceWorker();

self.addEventListener('install', (event) => {
	// Claim immediately so the UV bootstrap never waits on a manual reload.
	event.waitUntil(self.skipWaiting());
});

async function notifyClientsReady() {
	const clients = await self.clients.matchAll({ type: 'window' });
	for (const client of clients) {
		try {
			client.postMessage({ type: 'uv-sw:ready' });
		} catch {
			// ignore postMessage errors
		}
	}
}

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			await self.clients.claim();
			await notifyClientsReady();
		})(),
	);
});

self.addEventListener('message', (event) => {
	if (event?.data?.type === 'fixcraft:uv-ping') {
		event.waitUntil(notifyClientsReady());
	}
});

self.addEventListener('fetch', event => {
	event.respondWith(
		(async () => {
			if (event.request.url.startsWith(location.origin + __uv$config.prefix)) {
				return uv.fetch(event);
			}
			return fetch(event.request);
		})(),
	);
});
