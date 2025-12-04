(function () {
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
})();
