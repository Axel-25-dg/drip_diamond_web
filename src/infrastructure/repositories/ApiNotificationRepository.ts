import { httpClient, unwrap, type ApiEnvelope } from "@/infrastructure/http/httpClient";
import type { NotificationItem } from "@/domain/entities/User";
import type { NotificationRepositoryPort } from "@/domain/ports/NotificationRepositoryPort";

export class ApiNotificationRepository implements NotificationRepositoryPort {
  async getNotifications(): Promise<NotificationItem[]> {
    const { data } = await httpClient.get<ApiEnvelope<any>>("/notificaciones/");
    const payload = unwrap(data);
    const list = Array.isArray(payload) ? payload : payload?.results || [];

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
  }

  async markAsRead(id: number): Promise<NotificationItem> {
    const { data } = await httpClient.patch<ApiEnvelope<any>>(`/notificaciones/${id}/marcar_leida/`, {});
    const item = unwrap(data) || { id };
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
  }
}
