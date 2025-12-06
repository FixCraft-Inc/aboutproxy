const CLIENT_SCOPE = "/fixcraft/";

self.addEventListener("install", (event) => {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
	if (!event.data) return;
	let payload = {};
	try {
		payload = event.data.json();
	} catch {
		payload = { body: event.data.text() };
	}
	const title = payload.title || "FixCraft notification";
	const body = payload.body || "";
	const data = payload.data || payload;
	const options = {
		body,
		icon: payload.icon || "/favicon.ico",
		badge: payload.badge || payload.icon || "/favicon.ico",
		data,
	};
	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
	const targetUrl = event.notification?.data?.url || event.notification?.data?.href || "/fixcraft/account.html";
	event.notification.close();
	event.waitUntil(
		self.clients
			.matchAll({ type: "window", includeUncontrolled: true })
			.then((clients) => {
				for (const client of clients) {
					if (client.url.includes(CLIENT_SCOPE) && "focus" in client) {
						client.postMessage({ type: "fixcraft:notification-click", data: event.notification.data });
						return client.focus();
					}
				}
				if (self.clients.openWindow) {
					return self.clients.openWindow(targetUrl);
				}
				return null;
			})
			.catch(() => {}),
	);
});

self.addEventListener("message", (event) => {
	const type = event?.data?.type;
	if (type === "fixcraft:notifications:clear") {
		event.waitUntil(clearSubscription(true));
		return;
	}
	if (type === "fixcraft:sw:disable") {
		event.waitUntil(clearSubscription(false));
	}
});

async function clearSubscription(shouldUnregister) {
	try {
		const existing = await self.registration.pushManager.getSubscription();
		if (existing) {
			await existing.unsubscribe();
		}
	} catch {
		// ignore
	}
	if (shouldUnregister) {
		try {
			await self.registration.unregister();
		} catch {
			// ignore
		}
	}
}
