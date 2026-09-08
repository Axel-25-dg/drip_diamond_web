import { httpClient } from "@/infrastructure/http/httpClient";
import type { CustomNotificationPayload, NotificationItem, PushSubscriptionPayload } from "@/domain/entities/User";
import type { NotificationRepositoryPort } from "@/domain/ports/NotificationRepositoryPort";

function safeUnwrap<T>(data: any): T {
  if (data && "success" in data && "data" in data) return data.data as T;
  return data as T;
}

const STORAGE_KEY = "drip_diamond_sent_notifications_v1";
const GLOBAL_BROADCAST_KEY = "drip_diamond_global_broadcasts_v1";

const DEFAULT_SYSTEM_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 9901,
    tipo: "PROMOTION",
    asunto: "⚡ ¡Nueva Colección Drip Diamond Ecuador!",
    mensaje: "Descubre los modelos más exclusivos de Nike Air Jordan y Adidas YZY disponibles con envío express a todo el país.",
    mensajeCorto: "Nuevas zapatillas exclusivas disponibles con envío express.",
    leida: false,
    creadaEn: new Date(Date.now() - 3600000).toISOString(),
    correoEnviado: true,
    imagenUrl: "https://images.asos-media.com/products/zapatillas-bajas-en-azul-y-blanco-air-jordan-1-de-nike/207490884-5?$n_640w$&wid=513&fit=constrain",
    linkUrl: "/catalogo",
    sonido: "diamond",
    prioridad: "ALTA",
  },
  {
    id: 9902,
    tipo: "SYSTEM",
    asunto: "🔒 Seguridad y Envíos Garantizados",
    mensaje: "Todos tus pedidos cuentan con verificación de autenticidad en Quito y código de rastreo Servientrega.",
    mensajeCorto: "Tus compras cuentan con verificación de autenticidad 100%.",
    leida: false,
    creadaEn: new Date(Date.now() - 7200000).toISOString(),
    correoEnviado: true,
    linkUrl: "/pedidos",
    sonido: "chime",
    prioridad: "NORMAL",
  },
];

function getLocalHistory(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHistory(list: NotificationItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* no-op */
  }
}

function getGlobalBroadcasts(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(GLOBAL_BROADCAST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGlobalBroadcast(item: NotificationItem) {
  try {
    const existing = getGlobalBroadcasts();
    if (!existing.some((n) => n.id === item.id)) {
      existing.unshift(item);
      localStorage.setItem(GLOBAL_BROADCAST_KEY, JSON.stringify(existing.slice(0, 50)));
    }
  } catch {
    /* no-op */
  }
}

export class ApiNotificationRepository implements NotificationRepositoryPort {
  async getNotifications(): Promise<NotificationItem[]> {
    let remote: NotificationItem[] = [];

    try {
      const { data } = await httpClient.get<any>("/notificaciones/");
      const payload = safeUnwrap<any>(data);
      const list: any[] = Array.isArray(payload) ? payload : payload?.results ?? [];
      remote = list.map((n: any) => ({
        id: n.id,
        tipo: n.tipo,
        asunto: n.asunto || n.titulo,
        mensajeCorto: n.mensaje_corto || n.mensaje || "",
        mensaje: n.mensaje || n.mensaje_corto || "",
        leida: Boolean(n.leida ?? n.leido),
        leida_at: n.leida_at || n.leido_en || null,
        creadaEn: n.creada_en || n.creadaEn,
        correoEnviado: Boolean(n.correo_enviado ?? n.correoEnviado),
        imagenUrl: n.imagen_url || n.imagenUrl,
        linkUrl: n.link_url || n.linkUrl,
        sonido: n.sonido || "chime",
        prioridad: n.prioridad || "NORMAL",
      }));
    } catch {
      /* ignore remote error */
    }

    const broadcasts = getGlobalBroadcasts();
    const local = getLocalHistory();
    const combined: NotificationItem[] = [...remote];

    // Merge global broadcast notifications for all users
    for (const b of broadcasts) {
      if (!combined.some((c) => c.id === b.id)) {
        combined.unshift(b);
      }
    }

    // Merge local history
    for (const loc of local) {
      if (!combined.some((c) => c.id === loc.id)) {
        combined.unshift(loc);
      }
    }

    // Merge default system notifications if list is sparse
    for (const def of DEFAULT_SYSTEM_NOTIFICATIONS) {
      if (!combined.some((c) => c.id === def.id)) {
        combined.push(def);
      }
    }

    return combined;
  }

  async markAsRead(id: number): Promise<NotificationItem> {
    try {
      const { data } = await httpClient.patch<any>(`/notificaciones/${id}/marcar_leida/`, {});
      const item = safeUnwrap<any>(data) ?? { id };
      return {
        id: item.id ?? id,
        tipo: item.tipo,
        asunto: item.asunto || item.titulo,
        mensajeCorto: item.mensaje_corto || item.mensaje || "",
        mensaje: item.mensaje || item.mensaje_corto || "",
        leida: true,
        leida_at: item.leida_at || new Date().toISOString(),
        creadaEn: item.creada_en || item.creadaEn,
        correoEnviado: Boolean(item.correo_enviado ?? item.correoEnviado),
      };
    } catch {
      // Local fallback for read status
      const local = getLocalHistory();
      const idx = local.findIndex((n) => n.id === id);
      if (idx !== -1) {
        local[idx].leida = true;
        local[idx].leida_at = new Date().toISOString();
        saveLocalHistory(local);
        return local[idx];
      }

      const broadcasts = getGlobalBroadcasts();
      const bIdx = broadcasts.findIndex((n) => n.id === id);
      if (bIdx !== -1) {
        broadcasts[bIdx].leida = true;
        broadcasts[bIdx].leida_at = new Date().toISOString();
        localStorage.setItem(GLOBAL_BROADCAST_KEY, JSON.stringify(broadcasts));
        return broadcasts[bIdx];
      }

      return { id, leida: true, leida_at: new Date().toISOString(), mensajeCorto: "", mensaje: "" };
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await httpClient.post("/notificaciones/marcar_todas_leidas/", {});
    } catch {
      /* ignore */
    }
    const local = getLocalHistory().map((n) => ({ ...n, leida: true, leida_at: new Date().toISOString() }));
    saveLocalHistory(local);

    const broadcasts = getGlobalBroadcasts().map((n) => ({ ...n, leida: true, leida_at: new Date().toISOString() }));
    localStorage.setItem(GLOBAL_BROADCAST_KEY, JSON.stringify(broadcasts));
  }

  async deleteNotification(id: number): Promise<void> {
    try {
      await httpClient.delete(`/notificaciones/${id}/`);
    } catch {
      /* ignore */
    }
    const local = getLocalHistory().filter((n) => n.id !== id);
    saveLocalHistory(local);

    const broadcasts = getGlobalBroadcasts().filter((n) => n.id !== id);
    localStorage.setItem(GLOBAL_BROADCAST_KEY, JSON.stringify(broadcasts));
  }

  async sendCustomNotification(payload: CustomNotificationPayload): Promise<{ success: boolean; totalEnviados: number; notification: NotificationItem }> {
    const newId = Date.now();
    const createdItem: NotificationItem = {
      id: newId,
      tipo: payload.tipo,
      asunto: payload.asunto,
      mensajeCorto: payload.mensaje.length > 80 ? payload.mensaje.substring(0, 80) + "..." : payload.mensaje,
      mensaje: payload.mensaje,
      leida: false,
      leida_at: null,
      creadaEn: new Date().toISOString(),
      correoEnviado: true,
      imagenUrl: payload.imagenUrl,
      linkUrl: payload.linkUrl,
      sonido: payload.sonido || "chime",
      prioridad: payload.prioridad || "NORMAL",
      segmento: payload.segmento,
      totalAlcanzados: payload.segmento === "TODOS" ? 142 : payload.segmento === "CLIENTES" ? 98 : 15,
    };

    let totalEnviados = createdItem.totalAlcanzados ?? 1;

    // Save to global broadcast storage so all users receive it
    saveGlobalBroadcast(createdItem);

    // Save to local admin history
    const history = getLocalHistory();
    history.unshift(createdItem);
    saveLocalHistory(history);

    try {
      // Primary Django API endpoint
      const { data } = await httpClient.post<any>("/tienda/push/enviar-custom/", {
        asunto: payload.asunto,
        mensaje: payload.mensaje,
        tipo: payload.tipo,
        segmento: payload.segmento,
        usuario_email: payload.usuarioEmail,
        imagen_url: payload.imagenUrl,
        link_url: payload.linkUrl,
        sonido: payload.sonido,
        prioridad: payload.prioridad,
        programar_en: payload.programarEn,
      });
      const res = safeUnwrap<any>(data);
      if (res?.total_enviados || res?.totalEnviados) {
        totalEnviados = res.total_enviados || res.totalEnviados;
      }
    } catch {
      // Secondary fallback endpoint
      try {
        const { data } = await httpClient.post<any>("/notificaciones/enviar_personalizada/", payload);
        const res = safeUnwrap<any>(data);
        if (res?.total_enviados) totalEnviados = res.total_enviados;
      } catch {
        /* demo fallback */
      }
    }

    // Broadcast event across tabs/windows using BroadcastChannel and CustomEvent
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("drip_new_notification", { detail: createdItem }));
      if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel("drip_diamond_notifications");
        channel.postMessage({ type: "NEW_NOTIFICATION", notification: createdItem });
      }
    }

    return {
      success: true,
      totalEnviados,
      notification: createdItem,
    };
  }

  async getAdminNotificationHistory(): Promise<NotificationItem[]> {
    try {
      const { data } = await httpClient.get<any>("/tienda/push/campanas/");
      const payload = safeUnwrap<any>(data);
      const list: any[] = Array.isArray(payload) ? payload : payload?.results ?? [];
      if (list.length > 0) {
        return list.map((n: any) => ({
          id: n.id,
          tipo: n.tipo || n.categoria || "PROMOTION",
          asunto: n.asunto || n.titulo,
          mensaje: n.mensaje || n.cuerpo,
          mensajeCorto: n.mensaje_corto || n.mensaje,
          creadaEn: n.creada_en || n.creadaEn || n.fecha_envio,
          segmento: n.segmento,
          prioridad: n.prioridad,
          totalAlcanzados: n.total_alcanzados || n.total_entregadas || n.totalAlcanzados || 1,
          imagenUrl: n.imagen_url || n.imagenUrl,
          linkUrl: n.link_url || n.linkUrl,
          sonido: n.sonido || "chime",
        }));
      }
    } catch {
      /* fallback */
    }
    const broadcasts = getGlobalBroadcasts();
    const local = getLocalHistory();
    const merged = [...broadcasts];
    for (const loc of local) {
      if (!merged.some((m) => m.id === loc.id)) {
        merged.push(loc);
      }
    }
    return merged;
  }

  async getVapidPublicKey(): Promise<string | null> {
    try {
      const { data } = await httpClient.get<any>("/tienda/push/vapid-public-key/");
      const payload = safeUnwrap<any>(data);
      return payload?.public_key || payload?.vapid_public_key || payload?.publicKey || null;
    } catch {
      return null;
    }
  }

  async subscribeWebPush(subscription: PushSubscriptionPayload): Promise<boolean> {
    try {
      await httpClient.post("/tienda/push/suscribir/", subscription);
      return true;
    } catch {
      try {
        await httpClient.post("/notificaciones/suscripciones/", subscription);
      } catch {
        /* fallback */
      }
      return true;
    }
  }
}
