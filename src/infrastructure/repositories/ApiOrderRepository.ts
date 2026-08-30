import axios from "axios";
import { env } from "@/infrastructure/config/env";
import { httpClient } from "@/infrastructure/http/httpClient";
import type { OrderRepositoryPort } from "@/domain/ports/OrderRepositoryPort";
import type { CreateOrderPayload, Order, ShippingZone, UploadComprobanteMetadata } from "@/domain/entities/Order";
import { normalizeUserRole, type Seller } from "@/domain/entities/User";
import { toOrder, toShippingZone } from "@/infrastructure/adapters/order.adapter";
import { useCartStore } from "@/presentation/store/cartStore";

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
  if (Array.isArray(payload?.vendedores)) return payload.vendedores as T[];
  if (Array.isArray(payload?.vendedores_activos)) return payload.vendedores_activos as T[];
  if (Array.isArray(payload?.vendedoresActivos)) return payload.vendedoresActivos as T[];
  if (Array.isArray(payload?.active_sellers)) return payload.active_sellers as T[];
  if (Array.isArray(payload?.sellers)) return payload.sellers as T[];
  if (Array.isArray(payload?.usuarios)) return payload.usuarios as T[];
  if (typeof payload === "object") {
    for (const value of Object.values(payload)) {
      if (Array.isArray(value) && value.length > 0) return value as T[];
    }
  }
  return [];
}

function isSellerItem(item: any): boolean {
  if (!item || typeof item !== "object") return false;

  const email = String(
    item?.correo || item?.email || item?.usuario?.correo || item?.user?.correo || item?.usuario?.email || item?.user?.email || ""
  ).toLowerCase().trim();

  // Explicit blacklisting of non-seller accounts from dropdown
  if (email === "alexander18br17@gmail.com" || email === "alexguamn772@gmail.com") {
    return false;
  }

  const rawRol = String(
    item?.rol || item?.role || item?.tipo || item?.usuario?.rol || item?.user?.rol || ""
  ).toLowerCase().trim();

  if (rawRol.includes("admin") || rawRol.includes("contador") || rawRol.includes("normal") || rawRol.includes("cliente")) {
    if (!rawRol.includes("vendedor")) return false;
  }

  const role = normalizeUserRole(rawRol);

  if (role === "administrador" || role === "contador" || role === "cliente") {
    if (!rawRol.includes("vendedor")) return false;
  }

  return role === "vendedor" || rawRol.includes("vendedor") || Boolean(item?.perfil_vendedor);
}

function normalizeSellerItem(item: any, trustedSellerEndpoint = false): Seller | null {
  if (!item || typeof item !== "object") return null;

  if (!trustedSellerEndpoint && !isSellerItem(item)) {
    return null;
  }

  const id =
    item.vendedor_id ??
    item.usuario_id ??
    item.user_id ??
    item.usuario?.id ??
    item.vendedor?.id ??
    item.id ??
    null;

  if (!id || Number(id) <= 0) return null;

  const rawFullName =
    item.vendedor_nombre ||
    item.usuario_nombre ||
    item.nombre_completo ||
    item.nombre_vendedor ||
    item.usuario?.nombre_completo ||
    "";

  let nombre =
    item.nombre ||
    item.primer_nombre ||
    item.first_name ||
    item.usuario?.nombre ||
    item.usuario?.primer_nombre ||
    "";

  let apellido =
    item.apellido ||
    item.primer_apellido ||
    item.last_name ||
    item.usuario?.apellido ||
    item.usuario?.primer_apellido ||
    "";

  if (!nombre && rawFullName) {
    const parts = rawFullName.trim().split(" ");
    nombre = parts[0] || "";
    apellido = parts.slice(1).join(" ") || "";
  }

  if (!nombre && (item.username || item.usuario?.username)) {
    nombre = item.username || item.usuario?.username;
  }

  const correo =
    item.correo ||
    item.email ||
    item.usuario_email ||
    item.usuario?.correo ||
    item.usuario?.email ||
    "";

  return {
    id: Number(id),
    nombre: String(nombre || "Vendedor").trim(),
    apellido: String(apellido || "").trim(),
    correo: correo ? String(correo).trim() : undefined,
  };
}

export class ApiOrderRepository implements OrderRepositoryPort {
  async getShippingZones(): Promise<ShippingZone[]> {
    try {
      const { data } = await httpClient.get<any>("/costos-envio/");
      return toList<any>(safeUnwrap(data)).map(toShippingZone);
    } catch {
      return [{ id: 1, provincia: "Pichincha", ciudad: "Quito", costo: 3.0 }];
    }
  }

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    // 1. Ensure backend Django cart has items before creating order
    try {
      const cartRes = await httpClient.get<any>("/pedidos/carrito/");
      const cartData = safeUnwrap<any>(cartRes.data);
      const itemsList = cartData?.items || [];
      
      // If backend cart is empty, sync from local cart store
      if (!Array.isArray(itemsList) || itemsList.length === 0) {
        const localCartItems = useCartStore.getState().cart?.items;
        if (Array.isArray(localCartItems) && localCartItems.length > 0) {
          for (const item of localCartItems) {
            const varId = item.varianteId || item.id;
            if (varId && varId > 0) {
              await httpClient.post<any>("/pedidos/carrito/", {
                variante_producto_id: varId,
                cantidad: item.cantidad || 1,
              }).catch(() => {/* ignore individual item sync error */});
            }
          }
        }
      }
    } catch {
      // ignore cart check error, proceed to create order
    }

    const rawVendedorId =
      payload.vendedorId != null && String(payload.vendedorId).trim() !== ""
        ? Number(payload.vendedorId)
        : null;

    const vendedorId =
      rawVendedorId && !isNaN(rawVendedorId) && rawVendedorId > 0
        ? rawVendedorId
        : null;

    const isRetiro = payload.tipoEntrega === "RETIRO_LOCAL";
    const defaultAddress = isRetiro
      ? "Retiro en Local (Centro Comercial)"
      : "Dirección de entrega en Quito";

    const direccionEnvio = payload.direccionEnvio?.trim() || defaultAddress;
    const direccionFormateada = payload.direccionFormateada?.trim() || direccionEnvio;
    const telefonoContacto = payload.telefonoContacto?.trim() || "0999999999";
    const referenciaAdicional = payload.referenciaAdicional?.trim() || payload.notas?.trim() || "Sin referencia adicional";

    const body: Record<string, any> = {
      vendedor_id: vendedorId,
      tipo_entrega: payload.tipoEntrega ?? "DOMICILIO",
      direccion_envio: direccionEnvio,
      direccion_formateada: direccionFormateada,
      referencia_adicional: referenciaAdicional,
      ciudad: payload.ciudad || "Quito",
      provincia: payload.provincia || "Pichincha",
      telefono_contacto: telefonoContacto,
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

  async cancelOrder(pedidoId: number): Promise<Order> {
    const { data } = await httpClient.post<any>(`/pedidos/${pedidoId}/cancelar/`);
    return toOrder(safeUnwrap(data));
  }

  async getActiveSellers(): Promise<Seller[]> {
    const sellersMap = new Map<string, Seller>();
    let apiRequestSucceeded = false;

    const sellerEndpoints = [
      "/usuarios/vendedores/activos/",
      "/usuarios/vendedores_activos/",
      "/usuarios/vendedores-activos/",
      "/usuarios/vendedores/",
    ];

    for (const endpoint of sellerEndpoints) {
      try {
        const { data } = await httpClient.get<any>(endpoint, { params: { _t: Date.now() } });
        apiRequestSucceeded = true;
        const list = toList<any>(safeUnwrap(data));
        for (const item of list) {
          const seller = normalizeSellerItem(item, true);
          if (seller && seller.id > 0) {
            const key = seller.correo ? `email:${seller.correo.toLowerCase()}` : `id:${seller.id}`;
            sellersMap.set(key, seller);
          }
        }
        break;
      } catch {
        continue;
      }
    }

    if (!apiRequestSucceeded) {
      try {
        const cached = localStorage.getItem("drip_sellers_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            for (const s of parsed) {
              const email = String(s.correo || s.email || "").toLowerCase().trim();
              if (email && email !== "alexander18br17@gmail.com" && email !== "alexguamn772@gmail.com" && s.id > 0) {
                const key = `email:${email}`;
                if (!sellersMap.has(key)) {
                  sellersMap.set(key, {
                    id: Number(s.id),
                    nombre: String(s.nombre || "Vendedor").trim(),
                    apellido: String(s.apellido || "").trim(),
                    correo: email,
                  });
                }
              }
            }
          }
        }
      } catch { /* ignore */ }
    }

    const result = Array.from(sellersMap.values());

    if (result.length > 0) {
      try {
        localStorage.setItem("drip_sellers_cache", JSON.stringify(result));
      } catch { /* ignore */ }
    }

    return result;
  }
}
