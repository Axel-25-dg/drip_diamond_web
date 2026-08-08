import { httpClient } from "@/infrastructure/http/httpClient";
import type { NotificationItem } from "@/domain/entities/User";
import type { NotificationRepositoryPort } from "@/domain/ports/NotificationRepositoryPort";

function safeUnwrap<T>(data: any): T {
  if (data && "success" in data && "data" in data) return data.data as T;
  return data as T;
}

export class ApiNotificationRepository implements NotificationRepositoryPort {
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const { data } = await httpClient.get<any>("/notificaciones/");
      const payload = safeUnwrap<any>(data);
      const list: any[] = Array.isArray(payload) ? payload : payload?.results ?? [];
      return list.map((n: any) => ({
        id: n.id,
        tipo: n.tipo,
        asunto: n.asunto || n.titulo,
        mensajeCorto: n.mensaje_corto || n.mensaje || "",
        mensaje: n.mensaje || n.mensaje_corto || "",
        leida: Boolean(n.leida ?? n.leido),
        leida_at: n.leida_at || n.leido_en || null,
        creadaEn: n.creada_en || n.creadaEn,
        correoEnviado: Boolean(n.correo_enviado ?? n.correoEnviado),
      }));
    } catch {
      return [];
    }
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
      return { id, leida: true, leida_at: new Date().toISOString(), mensajeCorto: "", mensaje: "" };
    }
  }
}
