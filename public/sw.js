/* Zuri service worker (one per site: the platform and each studio).
 * - Cache-first for Vite's fingerprinted /assets/* and the app icons.
 * - Network-first for page loads; offline, it falls back to the last app shell,
 *   so an installed app still opens.
 * - Never touches the API (another origin) or anything with a query string
 *   that isn't a page.
 * - Push: shows the notification and opens its link when tapped.
 * Bump VERSION to move every client onto a fresh cache.
 */
const VERSION = "zuri-v2";
const STATIC = `${VERSION}-static`;
const SHELL = `${VERSION}-shell`;
const PRECACHE = ["/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // API, S3, fonts: the browser handles them

  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === "navigate") {
    // Every route serves the same index.html, so one cached copy opens any page.
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(SHELL).then((c) => c.put("/", copy));
          }
          return res;
        })
        .catch(() => caches.match("/", { cacheName: SHELL }).then((hit) => hit || Response.error())),
    );
  }
});

/* ---------------------------------------------------------------- push
 * Payload from the API: { title, body, url, tag }. Tapping opens url in an
 * open window of this site when there is one.
 */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Zuri", body: event.data ? event.data.text() : "" };
  }
  const url = typeof data.url === "string" && data.url.startsWith("/") ? data.url : "/";
  // The number on the app's icon: this person's unread count, sent with the push.
  // Best-effort: not supported everywhere, and it never blocks the notification.
  const nav = self.navigator;
  const badge =
    typeof data.unread === "number" && nav && "setAppBadge" in nav
      ? (data.unread > 0 ? nav.setAppBadge(data.unread) : nav.clearAppBadge()).catch(() => undefined)
      : Promise.resolve();
  event.waitUntil(
    Promise.all([
      badge,
      self.registration.showNotification(data.title || "Zuri", {
        body: data.body || "",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: data.tag || undefined,
        renotify: Boolean(data.tag),
        data: { url },
      }),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (new URL(w.url).origin === self.location.origin && "focus" in w) {
          return w.focus().then(() => ("navigate" in w ? w.navigate(target) : undefined));
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});

// The browser rotated the subscription: hand the new one to the API. The page
// stored where the API lives when notifications were turned on.
self.addEventListener("pushsubscriptionchange", (event) => {
  const key = event.oldSubscription && event.oldSubscription.options && event.oldSubscription.options.applicationServerKey;
  if (!key) return;
  event.waitUntil(
    Promise.all([
      self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }),
      caches.open(`${VERSION}-meta`).then((c) => c.match("/push-endpoint")).then((r) => (r ? r.text() : null)),
    ]).then(([sub, saved]) => {
      if (!saved) return undefined;
      // { url, headers }: the API address and the headers the page sends (studio, client).
      const { url, headers } = JSON.parse(saved);
      return fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
    }),
  );
});
