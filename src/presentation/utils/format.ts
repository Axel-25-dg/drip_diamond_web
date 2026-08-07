import type { OrderStatus } from "@/domain/entities/Order";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(value || 0);
}

export function formatDate(value?: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  CARRITO: "En carrito",
  PENDIENTE_DE_PAGO: "Pendiente de pago",
  COMPROBANTE_ENVIADO: "Comprobante enviado",
  PAGO_EN_REVISION: "Pago en revisión",
  PAGO_APROBADO: "Pago aprobado",
  PAGO_RECHAZADO: "Pago rechazado",
  PREPARANDO_PEDIDO: "Preparando pedido",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

const STATUS_TONES: Record<OrderStatus, "neutral" | "warning" | "success" | "danger" | "info"> = {
  CARRITO: "neutral",
  PENDIENTE_DE_PAGO: "warning",
  COMPROBANTE_ENVIADO: "info",
  PAGO_EN_REVISION: "info",
  PAGO_APROBADO: "success",
  PAGO_RECHAZADO: "danger",
  PREPARANDO_PEDIDO: "info",
  ENVIADO: "info",
  ENTREGADO: "success",
  CANCELADO: "danger",
};

export function orderStatusLabel(status: OrderStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function orderStatusTone(status: OrderStatus) {
  return STATUS_TONES[status] ?? "neutral";
}

export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  const value = String(path).trim();
  if (!value || value === "null" || value === "undefined") return null;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;

  const base = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000/api";
  const origin = base.replace(/\/api\/?$/, "");

  if (value.startsWith("/media/") || value.startsWith("media/") || value.startsWith("uploads/")) {
    return `${origin}/${value.replace(/^\/+/, "")}`;
  }

  if (value.startsWith("/")) return `${origin}${value}`;
  return `${origin}/${value}`;
}
