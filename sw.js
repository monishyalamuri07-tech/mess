const CACHE = "mess-pass-v31";

const ASSETS = [
    "./",
    "./index.html",
    "./manifest.json",
    "./student.jpg",
    "./sounds/beep_sound_trimmed.mp3",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(k => k !== CACHE)
                    .map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    // For HTML navigation, ALWAYS use Network-First to ensure mobile devices get latest updates
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE).then(cache => cache.put(event.request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html")))
        );
        return;
    }

    // For other assets, serve cached or fetch & cache
    event.respondWith(
        caches.match(event.request).then(cached => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE).then(cache => cache.put(event.request, clone));
                }
                return networkResponse;
            }).catch(() => {});

            return cached || fetchPromise;
        })
    );
});
