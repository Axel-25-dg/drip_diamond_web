// Drip Diamond Web Push Service Worker
const CACHE_NAME = "drip-diamond-push-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Receiver for Web Push messages from server or local dispatch
self.addEventListener("push", (event) => {
  let data = {
    title: "Drip Diamond",
    body: "Tienes una nueva notificación.",
    icon: "/logo_drip.png",
    badge: "/logo_drip.png",
    image: null,
    data: { url: "/catalogo" },
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/logo_drip.png",
    badge: data.badge || "/logo_drip.png",
    image: data.image || undefined,
    data: data.data || { url: "/catalogo" },
    vibrate: [100, 50, 100],
    tag: "drip-diamond-notification-" + Date.now(),
    renotify: true,
    actions: data.actions || [
      { action: "explore", title: "Ver Detalle" },
      { action: "close", title: "Cerrar" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Click event handler for OS notification banners
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const targetUrl = event.notification.data?.url || "/catalogo";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
