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
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.results)) return payload.results as T[];
  if (Array.isArray(payload?.items)) return payload.items as T[];
  if (Array.isArray(payload?.usuarios)) return payload.usuarios as T[];
  if (Array.isArray(payload?.vendedores)) return payload.vendedores as T[];
  if (payload?.data) return toList<T>(payload.data);
  return [] as T[];
}

function isSellerItem(item: any): boolean {
  if (!item || typeof item !== "object") return false;

  const role = normalizeUserRole(
    item?.rol ?? item?.role ?? item?.tipo ?? item?.usuario?.rol ?? item?.usuario?.role ?? item?.user?.rol ?? item?.user?.role
  );

  const rawRol = String(item?.rol || item?.role || item?.tipo || "").toLowerCase();

  const hasSellerShape = Boolean(
    item?.perfil_vendedor ||
    item?.perfilVendedor ||
    item?.es_vendedor ||
    item?.is_vendedor ||
    item?.codigo_referido ||
    item?.codigoReferido ||
    rawRol.includes("vendedor")
  );

  return role === "vendedor" || hasSellerShape;
}

function normalizeSellerItem(item: any): Seller | null {
  if (!item || typeof item !== "object") return null;
  if (!isSellerItem(item)) return null;

  const id =
    item.id ??
    item.usuario?.id ??
    item.user?.id ??
    item.usuario_id ??
    item.user_id ??
    item.vendedor_id ??
    item.vendedor?.id ??
    item.usuario?.usuario_id ??
    item.user?.user_id ??
    null;
  const nombre =
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
  const apellido =
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
  const correo =
    item.correo ||
    item.email ||
    item.usuario?.correo ||
    item.user?.correo ||
    item.usuario?.email ||
    item.user?.email ||
    item.vendedor?.correo ||
    item.vendedor?.email ||
    "";

  if (!id) return null;

  return {
    id: Number(id) || 0,
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
    const rawItems: any[] = [];
    const endpoints = [
      "/usuarios/vendedores/activos/",
      "/usuarios/vendedores/",
      "/usuarios/?rol=vendedor",
      "/usuarios/?rol=VENDEDOR",
      "/usuarios/",
    ];

    for (const ep of endpoints) {
      try {
        const { data } = await httpClient.get<any>(ep, { params: { _t: Date.now() } });
        const payload = safeUnwrap<any>(data);
        const list = toList<any>(payload);
        if (list.length > 0) {
          rawItems.push(...list);
        }
      } catch {
        // continue
      }
    }

    const sellersMap = new Map<number, Seller>();

    for (const item of rawItems) {
      const seller = normalizeSellerItem(item);
      if (seller && seller.id > 0 && !sellersMap.has(seller.id)) {
        sellersMap.set(seller.id, seller);
      }
    }

    return Array.from(sellersMap.values());
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
