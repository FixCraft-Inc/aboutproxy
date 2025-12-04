function proxyUsing(url, proxy, callback) {
    if (proxy === "UV") {
        proxyUsingUV(url, callback);
    } else {
        console.error("Invalid proxy!");
    }
}

function baseUrlFor(proxy) {
    if (proxy === "UV") {
        return __uv$config.prefix;
    } else {
        console.error("Invalid proxy!");
    }
}

function decodeUrl(url, proxy) {
    if (proxy === "UV") {
        return __uv$config.decodeUrl(url);
    } else {
        console.error("Invalid proxy!");
    }
}

function encodeUrl(url, proxy) {
    if (proxy === "UV") {
        return __uv$config.encodeUrl(url);
    } else {
        console.error("Invalid proxy!");
    }
}

let uvSwReadyPromise = null;

function normalizeScope(prefix) {
    if (typeof prefix !== "string" || !prefix.length) {
        return "/service/";
    }
    const base = prefix.startsWith("/") ? prefix : `/${prefix}`;
    return base.endsWith("/") ? base : `${base}/`;
}

function waitForActiveWorker(registration) {
    if (!registration) {
        return Promise.resolve(null);
    }
    if (registration.active) {
        return Promise.resolve(registration);
    }
    const worker = registration.installing || registration.waiting;
    if (!worker) {
        return Promise.resolve(registration);
    }
    return new Promise((resolve) => {
        const cleanup = () => worker.removeEventListener("statechange", handle);
        function handle() {
            if (worker.state === "activated" || worker.state === "redundant") {
                cleanup();
                resolve(registration);
            }
        }
        worker.addEventListener("statechange", handle);
    });
}

function ensureUvServiceWorker() {
    if (typeof navigator === "undefined" || !navigator.serviceWorker) {
        return null;
    }
    if (uvSwReadyPromise) {
        return uvSwReadyPromise;
    }
    const scope = normalizeScope(
        (__uv$config && __uv$config.prefix) || "/service/",
    );
    uvSwReadyPromise = navigator.serviceWorker
        .getRegistration(scope)
        .then((existing) => {
            if (existing) {
                return existing;
            }
            return navigator.serviceWorker.register("/sw.js", { scope });
        })
        .then((registration) => waitForActiveWorker(registration))
        .catch((error) => {
            console.warn("[uv] service worker registration failed:", error);
            return null;
        });
    return uvSwReadyPromise;
}

function proxyUsingUV(url, callback) {
    const proxied = baseUrlFor("UV") + encodeUrl(url, "UV");
    const ready = ensureUvServiceWorker();
    if (ready && typeof ready.then === "function") {
        ready.finally(() => callback(proxied));
        return;
    }
    callback(proxied);
}
