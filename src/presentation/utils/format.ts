import type { OrderStatus } from "@/domain/entities/Order";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(value || 0);
}

export function formatDate(value?: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

const COORD_REGEX = /\s*[\(\[]-?\d+\.\d+,\s*-?\d+\.\d+[\)\]]/g;

export function formatAddressForDisplay(value: unknown): string {
  if (value == null || value === "") return "";

  let raw = "";

  if (typeof value === "string") {
    raw = value.trim();
  } else if (Array.isArray(value)) {
    raw = value
      .filter((item) => item != null && item !== "")
      .map((item) => String(item).trim())
      .join(" · ");
  } else if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const parts = [
      record.direccion_formateada,
      record.direccion,
      record.calle,
      record.referencia_adicional,
      record.referencia,
      record.ciudad,
      record.provincia,
    ]
      .filter((item): item is string => typeof item === "string" && item.trim() !== "")
      .map((item) => item.trim());

    if (parts.length > 0) raw = parts.join(" · ");
    else raw = JSON.stringify(record);
  } else {
    raw = String(value).trim();
  }

  return raw.replace(COORD_REGEX, "").trim();
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

export function resolveMediaUrl(path: any): string | null {
  if (!path) return null;
  let raw: string | null = null;
  if (typeof path === "string") {
    raw = path;
  } else if (typeof path === "object") {
    raw = path.url ?? path.imagen ?? path.archivo ?? path.path ?? null;
  }
  if (!raw) return null;

  const value = String(raw).trim();
  if (!value || value === "null" || value === "undefined" || value === "[object Object]") return null;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;

  const base = (import.meta.env.VITE_API_URL as string) || "https://dripdiamond.store/api";
  const origin = base.replace(/\/api\/?$/, "");

  if (value.startsWith("/media/") || value.startsWith("media/") || value.startsWith("uploads/")) {
    return `${origin}/${value.replace(/^\/+/, "")}`;
  }

  if (value.startsWith("/")) return `${origin}${value}`;
  return `${origin}/${value}`;
}
