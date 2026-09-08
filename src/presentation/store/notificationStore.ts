import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NotificationItem, CustomNotificationPayload } from "@/domain/entities/User";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import { playNotificationSound, SoundType } from "@/presentation/utils/notificationSound";
import { urlBase64ToUint8Array } from "@/presentation/utils/vapidHelper";

export type PermissionState = "default" | "granted" | "denied" | "unsupported";

interface NotificationToast {
  id: number;
  asunto: string;
  mensaje: string;
  tipo?: string;
  imagenUrl?: string;
  linkUrl?: string;
  prioridad?: string;
}

interface NotificationState {
  permissionState: PermissionState;
  isSubscribed: boolean;
  notifications: NotificationItem[];
  activeToast: NotificationToast | null;
  soundEnabled: boolean;

  initNotifications: () => Promise<void>;
  requestPermissionAndSubscribe: () => Promise<boolean>;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  receiveNotification: (item: NotificationItem, triggerNativeOS?: boolean) => void;
  sendBroadcast: (payload: CustomNotificationPayload) => Promise<{ success: boolean; totalEnviados: number; notification: NotificationItem }>;
  closeToast: () => void;
  toggleSound: () => void;
  testNativeOSPush: (title: string, body: string, image?: string, link?: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      permissionState: typeof window !== "undefined" && "Notification" in window ? (Notification.permission as PermissionState) : "unsupported",
      isSubscribed: false,
      notifications: [],
      activeToast: null,
      soundEnabled: true,

      initNotifications: async () => {
        if (typeof window === "undefined") return;

        // Sync permission state
        if ("Notification" in window) {
          set({ permissionState: Notification.permission as PermissionState });
        }

        // Register Service Worker
        if ("serviceWorker" in navigator) {
          try {
            const reg = await navigator.serviceWorker.register("/sw.js");
            if (reg.active) {
              set({ isSubscribed: true });
            }
          } catch {
            /* ignore sw registration error in non-supported envs */
          }
        }

        // Listen to BroadcastChannel, CustomEvent, and storage events for real-time notifications
        if ("BroadcastChannel" in window) {
          const channel = new BroadcastChannel("drip_diamond_notifications");
          channel.onmessage = (event) => {
            if (event.data?.type === "NEW_NOTIFICATION" && event.data.notification) {
              get().receiveNotification(event.data.notification, true);
            }
          };
        }

        window.addEventListener("drip_new_notification", (event: any) => {
          if (event.detail) {
            get().receiveNotification(event.detail, true);
          }
        });

        window.addEventListener("storage", (e) => {
          if (e.key === "drip_diamond_global_broadcasts_v1") {
            get().fetchNotifications();
          }
        });

        await get().fetchNotifications();
      },

      requestPermissionAndSubscribe: async () => {
        if (typeof window === "undefined" || !("Notification" in window)) {
          set({ permissionState: "unsupported" });
          return false;
        }

        try {
          const result = await Notification.requestPermission();
          set({ permissionState: result as PermissionState });

          if (result === "granted") {
            if ("serviceWorker" in navigator) {
              const reg = await navigator.serviceWorker.ready;
              set({ isSubscribed: true });

              try {
                const vapidKey = await useCases.getVapidPublicKey.execute();
                const applicationServerKey = vapidKey ? (urlBase64ToUint8Array(vapidKey) as any) : undefined;
                const sub = await reg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey,
                });
                await useCases.subscribeWebPush.execute(sub.toJSON() as any);
              } catch {
                /* fallback to browser native */
              }
            }

            // Fire welcome notification
            get().receiveNotification(
              {
                id: Date.now(),
                asunto: "Notificaciones de Sistema Activadas",
                mensaje: "Recibirás alertas nativas en tu pantalla con ofertas exclusivas y estado de tus pedidos.",
                tipo: "SYSTEM",
                creadaEn: new Date().toISOString(),
                leida: false,
                sonido: "diamond",
              },
              true
            );

            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      fetchNotifications: async () => {
        try {
          const list = await useCases.getNotifications.execute();
          set({ notifications: list });
        } catch {
          /* ignore */
        }
      },

      markAsRead: async (id: number) => {
        try {
          await useCases.markNotificationRead.execute(id);
          set((s) => ({
            notifications: s.notifications.map((n) =>
              n.id === id ? { ...n, leida: true, leida_at: new Date().toISOString() } : n
            ),
          }));
        } catch {
          /* ignore */
        }
      },

      receiveNotification: (item: NotificationItem, triggerNativeOS: boolean = true) => {
        const sound = (item.sonido || "chime") as SoundType;
        if (get().soundEnabled && sound !== "silent") {
          playNotificationSound(sound);
        }

        // Add to state list
        set((s) => {
          const exists = s.notifications.some((n) => n.id === item.id);
          const updated = exists ? s.notifications : [item, ...s.notifications];
          return {
            notifications: updated,
            activeToast: {
              id: item.id,
              asunto: item.asunto || "Nueva Notificación",
              mensaje: item.mensaje || item.mensajeCorto || "",
              tipo: item.tipo,
              imagenUrl: item.imagenUrl,
              linkUrl: item.linkUrl,
              prioridad: item.prioridad,
            },
          };
        });

        // Trigger OS Native Web Push Notification if permission granted
        if (triggerNativeOS && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          const title = item.asunto || "Drip Diamond";
          const options = {
            body: item.mensaje || item.mensajeCorto || "",
            icon: "/logo_drip.png",
            badge: "/logo_drip.png",
            image: item.imagenUrl || undefined,
            vibrate: [200, 100, 200],
            data: { url: item.linkUrl || "/catalogo" },
            tag: "drip-notification-" + item.id,
            renotify: true,
          };

          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready
              .then((reg) => {
                reg.showNotification(title, options as any);
              })
              .catch(() => {
                try {
                  new Notification(title, options as any);
                } catch {
                  /* mobile fallback */
                }
              });
          } else {
            try {
              new Notification(title, options as any);
            } catch {
              /* ignore constructor errors on mobile */
            }
          }
        }
      },

      sendBroadcast: async (payload: CustomNotificationPayload) => {
        const res = await useCases.sendCustomNotification.execute(payload);
        if (res.success) {
          get().receiveNotification(res.notification, true);
        }
        return res;
      },

      testNativeOSPush: async (title: string, body: string, image?: string, link?: string) => {
        const sound: SoundType = "chime";
        if (get().soundEnabled) playNotificationSound(sound);

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          const options = {
            body,
            icon: "/logo_drip.png",
            badge: "/logo_drip.png",
            image: image || undefined,
            vibrate: [200, 100, 200],
            data: { url: link || "/catalogo" },
            tag: "system-push-" + Date.now(),
            renotify: true,
          };

          if ("serviceWorker" in navigator) {
            try {
              const reg = await navigator.serviceWorker.ready;
              await reg.showNotification(title, options as any);
              return;
            } catch {
              /* fallback */
            }
          }
          try {
            new Notification(title, options as any);
          } catch {
            /* ignore constructor errors on mobile */
          }
        }
      },

      closeToast: () => set({ activeToast: null }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
    }),
    {
      name: "drip_diamond_notifications_store",
      partialize: (state) => ({ soundEnabled: state.soundEnabled }),
    }
  )
);
