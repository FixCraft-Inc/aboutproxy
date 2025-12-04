(function () {
	const ALLOWED_HOST_RE =
		/(?:^|\\.)(fixcraft\\.org|fixcraft\\.jp|iridium\\.hostforever\\.org|localhost|127\\.0\\.0\\.1)(?::\\d+)?$/i;
	if (!ALLOWED_HOST_RE.test(location.hostname)) {
		// Prevent execution on untrusted origins.
		return;
	}

	disableServiceWorkers();

	const ENDPOINT = "/fixcraft/account-link";

	async function syncFromServer() {
		try {
			const response = await fetch(ENDPOINT, { credentials: "include" });
			if (!response.ok) {
				return;
			}
			const payload = await response.json();
			if (!payload?.linked || !payload.token) {
				return;
			}
			const record = {
				token: payload.token,
				email: payload.email || null,
				username: payload.username || null,
				displayName: payload.displayName || payload.username || payload.email || null,
				plan: payload.plan || null,
				avatarUrl: payload.avatarUrl || null,
				lastSync: payload.updatedAt || Date.now(),
			};
			try {
				localStorage.setItem("fixcraft-account", JSON.stringify(record));
			} catch {
				// ignore storage errors
			}
			window.dispatchEvent(
				new CustomEvent("fixcraft-account:linked", { detail: record }),
			);
		} catch {
			// ignore network errors
		}
	}

	if (document.readyState === "complete") {
		syncFromServer();
	} else {
		window.addEventListener("load", () => syncFromServer(), { once: true });
	}
	window.addEventListener("focus", () => {
		syncFromServer();
	});
	window.addEventListener("fixcraft-account:signout", () => {
		try {
			localStorage.removeItem("fixcraft-account");
		} catch {
			// ignore storage errors
		}
		callRemoteClear();
		if (window.caches?.keys) {
			caches
				.keys()
				.then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
				.catch(() => {});
		}
		if (navigator.serviceWorker?.getRegistrations) {
			navigator.serviceWorker
				.getRegistrations()
				.then((regs) => regs.forEach((reg) => reg.unregister()))
				.catch(() => {});
		}
	});

	window.addEventListener("message", (event) => {
		if (!event?.origin || event.origin !== location.origin) return;
		if (!event.data || typeof event.data !== "object") return;
		if (event.data.type === "fixcraft-account:signout") {
			window.dispatchEvent(new CustomEvent("fixcraft-account:signout"));
		}
	});

	function disableServiceWorkers() {
		if (!navigator.serviceWorker) return;
		try {
			navigator.serviceWorker.register = () =>
				Promise.reject(new Error("Service workers disabled in FixCraft extension context"));
		} catch {
			// ignore
		}
		if (navigator.serviceWorker.getRegistrations) {
			navigator.serviceWorker
				.getRegistrations()
				.then((regs) => Promise.all(regs.map((reg) => reg.unregister())))
				.catch(() => {});
		}
		if (window.caches?.keys) {
			caches
				.keys()
				.then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
				.catch(() => {});
		}
	}

	function callRemoteClear() {
		try {
			fetch("https://iridium.hostforever.org/clear", {
				mode: "no-cors",
				credentials: "include",
				cache: "no-store",
			}).catch(() => {});
		} catch {
			// ignore
		}
	}
})();
