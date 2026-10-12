/* MUZIK service worker */
const VERSION = "muzik-v9";
const SHELL = ["./", "./studio.html", "./index.html", "./onboarding.js", "./install.js", "./playground.html", "./audio.js", "./visualizer.html",
  "./manifest.webmanifest", "./favicon.svg", "./apple-touch-icon.png",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("muzik-") && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (isHTML) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then(ca => ca.put(req, c)); } return r; })
      .catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match("./studio.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && r.type === "basic") { const c = r.clone(); caches.open(VERSION).then(ca => ca.put(req, c)); }
    return r;
  })));
});
