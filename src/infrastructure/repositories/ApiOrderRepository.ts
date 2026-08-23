import axios from "axios";
import { env } from "@/infrastructure/config/env";
import { httpClient } from "@/infrastructure/http/httpClient";
import type { OrderRepositoryPort } from "@/domain/ports/OrderRepositoryPort";
import type { CreateOrderPayload, Order, ShippingZone, UploadComprobanteMetadata } from "@/domain/entities/Order";
import { normalizeUserRole, type Seller } from "@/domain/entities/User";
import { toOrder, toShippingZone } from "@/infrastructure/adapters/order.adapter";
import { toSeller } from "@/infrastructure/adapters/auth.adapter";

function safeUnwrap<T>(data: any): T {
  if (data && "success" in data && "data" in data) return data.data as T;
  return data as T;
}

function toList<T>(payload: any): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.results)) return payload.results as T[];
  if (Array.isArray(payload?.data)) return toList<T>(payload.data);
  if (Array.isArray(payload?.items)) return payload.items as T[];
  if (Array.isArray(payload?.usuarios)) return payload.usuarios as T[];
  if (Array.isArray(payload?.vendedores)) return payload.vendedores as T[];
  if (Array.isArray(payload?.vendedores_activos)) return payload.vendedores_activos as T[];
  if (Array.isArray(payload?.vendedoresActivos)) return payload.vendedoresActivos as T[];
  if (Array.isArray(payload?.active_sellers)) return payload.active_sellers as T[];
  if (Array.isArray(payload?.sellers)) return payload.sellers as T[];

  if (typeof payload === "object") {
    for (const val of Object.values(payload)) {
      if (Array.isArray(val) && val.length > 0) {
        return val as T[];
      }
    }
  }

  return [] as T[];
}

function isSellerItem(item: any): boolean {
  if (!item || typeof item !== "object") return false;

  const role = normalizeUserRole(
    item?.rol ?? item?.role ?? item?.tipo ?? item?.usuario?.rol ?? item?.usuario?.role ?? item?.user?.rol ?? item?.user?.role
  );

  const rawRol = String(
    item?.rol || item?.role || item?.tipo || item?.usuario?.rol || item?.user?.rol || ""
  ).toLowerCase();

  const hasSellerShape = Boolean(
    item?.perfil_vendedor ||
    item?.perfilVendedor ||
    item?.es_vendedor ||
    item?.is_vendedor ||
    item?.codigo_referido ||
    item?.codigoReferido ||
    item?.vendedor_id ||
    item?.vendedor_nombre ||
    rawRol.includes("vendedor") ||
    rawRol.includes("vender") ||
    rawRol === "seller"
  );

  return role === "vendedor" || hasSellerShape;
}

function normalizeSellerItem(item: any, isVendorEndpoint = false): Seller | null {
  if (!item || typeof item !== "object") return null;

  // Extract ID (prefer User ID or Vendedor ID over raw record ID)
  const id =
    item.vendedor_id ??
    item.usuario_id ??
    item.user_id ??
    item.vendedor?.id ??
    item.usuario?.id ??
    item.user?.id ??
    (typeof item.usuario === "number" ? item.usuario : null) ??
    (typeof item.vendedor === "number" ? item.vendedor : null) ??
    item.id ??
    null;

  if (!id || Number(id) <= 0) return null;

  // If fetched from a general user list (like /usuarios/), verify seller role
  if (!isVendorEndpoint && !isSellerItem(item)) {
    return null;
  }

  const rawFullName =
    item.vendedor_nombre ||
    item.usuario_nombre ||
    item.nombre_completo ||
    item.nombre_vendedor ||
    item.usuario?.nombre_completo ||
    item.vendedor?.nombre_completo ||
    "";

  let nombre =
    item.nombre ||
    item.primer_nombre ||
    item.first_name ||
    item.usuario?.nombre ||
    item.user?.nombre ||
    item.usuario?.primer_nombre ||
    item.user?.primer_nombre ||
    item.vendedor?.nombre ||
    item.vendedor?.primer_nombre ||
    "";

  let apellido =
    item.apellido ||
    item.primer_apellido ||
    item.last_name ||
    item.usuario?.apellido ||
    item.user?.apellido ||
    item.usuario?.primer_apellido ||
    item.user?.primer_apellido ||
    item.vendedor?.apellido ||
    item.vendedor?.primer_apellido ||
    "";

  if (!nombre && rawFullName) {
    const parts = rawFullName.trim().split(" ");
    nombre = parts[0] || "";
    apellido = parts.slice(1).join(" ") || "";
  }

  if (!nombre && (item.username || item.usuario?.username || item.vendedor?.username)) {
    nombre = item.username || item.usuario?.username || item.vendedor?.username;
  }

  const correo =
    item.correo ||
    item.email ||
    item.vendedor_email ||
    item.usuario_email ||
    item.usuario?.correo ||
    item.user?.correo ||
    item.usuario?.email ||
    item.user?.email ||
    item.vendedor?.correo ||
    item.vendedor?.email ||
    "";

  return {
    id: Number(id),
    nombre: String(nombre || "Vendedor").trim(),
    apellido: String(apellido || "").trim(),
    correo: correo ? String(correo).trim() : undefined,
  };
}

export class ApiOrderRepository implements OrderRepositoryPort {
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const body: Record<string, any> = {
      vendedor_id: payload.vendedorId ?? null,
      tipo_entrega: payload.tipoEntrega ?? "DOMICILIO",
      direccion_envio: payload.direccionEnvio,
      direccion_formateada: payload.direccionFormateada ?? payload.direccionEnvio,
      referencia_adicional: payload.referenciaAdicional ?? payload.notas ?? "",
      ciudad: payload.ciudad,
      provincia: payload.provincia || "Pichincha",
      telefono_contacto: payload.telefonoContacto || "",
    };

    const { data } = await httpClient.post<any>("/pedidos/", body);
    return toOrder(safeUnwrap(data));
  }

  async getOrders(): Promise<Order[]> {
    const { data } = await httpClient.get<any>("/pedidos/");
    return toList<any>(safeUnwrap(data)).map(toOrder);
  }

  async getOrderById(id: number): Promise<Order> {
    const { data } = await httpClient.get<any>(`/pedidos/${id}/`);
    return toOrder(safeUnwrap(data));
  }

  async uploadComprobante(pedidoId: number, archivo: File, metadata?: UploadComprobanteMetadata): Promise<Order> {
    const formData = new FormData();
    formData.append("archivo", archivo);
    formData.append("banco_origen", metadata?.bancoOrigen?.trim() || "");
    formData.append("numero_referencia", metadata?.numeroReferencia?.trim() || "");
    formData.append("monto_declarado", metadata?.montoDeclarado != null ? String(metadata.montoDeclarado) : "0");
    const { data } = await httpClient.post<any>(`/pedidos/${pedidoId}/subir-comprobante/`, formData);
    return toOrder(safeUnwrap(data));
  }

  async getActiveSellers(): Promise<Seller[]> {
    const rawItems: Array<{ item: any; isVendorEp: boolean }> = [];
    const endpoints = [
      { url: "/usuarios/vendedores_activos/", isVendorEp: true },
      { url: "/usuarios/vendedores-activos/", isVendorEp: true },
      { url: "/usuarios/vendedores/activos/", isVendorEp: true },
      { url: "/usuarios/vendedores/", isVendorEp: true },
      { url: "/usuarios/activos/", isVendorEp: true },
      { url: "/usuarios/listar_vendedores/", isVendorEp: true },
      { url: "/usuarios/listar-vendedores/", isVendorEp: true },
      { url: "/vendedores_activos/", isVendorEp: true },
      { url: "/vendedores-activos/", isVendorEp: true },
      { url: "/vendedores/activos/", isVendorEp: true },
      { url: "/vendedores/", isVendorEp: true },
      { url: "/liquidaciones/resumen-global/", isVendorEp: true },
      { url: "/comisiones/", isVendorEp: true },
      { url: "/usuarios/?rol=vendedor", isVendorEp: true },
      { url: "/usuarios/?rol=VENDEDOR", isVendorEp: true },
      { url: "/usuarios/?role=vendedor", isVendorEp: true },
      { url: "/usuarios/?tipo=vendedor", isVendorEp: true },
      { url: "/usuarios/", isVendorEp: false },
    ];

    for (const ep of endpoints) {
      // 1. Try authenticated with httpClient
      try {
        const { data } = await httpClient.get<any>(ep.url, { params: { _t: Date.now() } });
        const payload = safeUnwrap<any>(data);
        const list = toList<any>(payload);
        if (list.length > 0) {
          for (const item of list) {
            rawItems.push({ item, isVendorEp: ep.isVendorEp });
          }
        }
      } catch {
        // 2. Try unauthenticated with raw axios (no Bearer token)
        try {
          const res = await axios.get<any>(`${env.apiUrl}${ep.url}`, {
            params: { _t: Date.now() },
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
          });
          const payload = safeUnwrap<any>(res.data);
          const list = toList<any>(payload);
          if (list.length > 0) {
            for (const item of list) {
              rawItems.push({ item, isVendorEp: ep.isVendorEp });
            }
          }
        } catch {
          // continue
        }
      }
    }

    const sellersMap = new Map<number, Seller>();

    for (const { item, isVendorEp } of rawItems) {
      const seller = normalizeSellerItem(item, isVendorEp);
      if (seller && seller.id > 0 && !sellersMap.has(seller.id)) {
        sellersMap.set(seller.id, seller);
      }
    }

    const result = Array.from(sellersMap.values());

    if (result.length > 0) {
      try {
        localStorage.setItem("drip_sellers_cache", JSON.stringify(result));
      } catch { /* ignore */ }
      return result;
    }

    try {
      const cached = localStorage.getItem("drip_sellers_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch { /* ignore */ }

    return [];
  }

  async getShippingZones(): Promise<ShippingZone[]> {
    try {
      const { data } = await httpClient.get<any>("/costos-envio/");
      return toList<any>(safeUnwrap(data)).map(toShippingZone);
    } catch {
      return [];
    }
  }
}
