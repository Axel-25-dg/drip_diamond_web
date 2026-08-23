import type { AdminRepositoryPort } from "@/domain/ports/AdminRepositoryPort";
import type { Product, Brand, Category, Talla } from "@/domain/entities/Product";
import type { Order } from "@/domain/entities/Order";
import { normalizeUserRole, type User, type PaymentProof, type EmailCampaign, type AdminStats, type CommissionReport } from "@/domain/entities/User";
import type {
  CreateProductDTO,
  CreateVariantDTO,
  UpdateVariantDTO,
  CreateBrandDTO,
  UpdateBrandDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CreateTallaDTO,
  UpdateTallaDTO,
  VerifyPaymentDTO,
  ShipOrderDTO,
  CreateCampaignDTO,
  CreateUserDTO,
  UpdateUserDTO,
} from "@/application/dtos/admin.dto";
import { httpClient, type ApiEnvelope } from "../http/httpClient";
import { toProduct, toBrand, toCategory } from "../adapters/catalog.adapter";
import { toOrder } from "../adapters/order.adapter";

/** Desempaqueta tanto {success, data} como respuesta directa */
function safeUnwrap<T>(data: any): T {
  if (data && "success" in data && "data" in data) return data.data as T;
  return data as T;
}

export class ApiAdminRepository implements AdminRepositoryPort {
  async uploadImage(
    file: File,
    appLabel = "tienda",
    model = "producto",
    objectId?: number
  ): Promise<{ id: number; url: string }> {
    if (!objectId || objectId <= 0) {
      throw new Error("Para subir una imagen al backend real se requiere app_label, model y object_id válidos.");
    }

    const formData = new FormData();
    formData.append("archivo", file);
    formData.append("app_label", appLabel);
    formData.append("model", model);
    formData.append("object_id", String(objectId));

    const { data } = await httpClient.post<any>("/imagenes/subir/", formData);
    const res = safeUnwrap<{ id: number; url: string }>(data);
    return { id: res.id, url: res.url };
  }

  async createProduct(payload: CreateProductDTO): Promise<Product> {
    // Payload oficial: campos snake_case. El `codigo` lo genera el backend automáticamente.
    const precioBaseStr =
      typeof payload.precio_base === "number"
        ? payload.precio_base.toFixed(2)
        : String(payload.precio_base);
    const body: Record<string, any> = {
      nombre: payload.nombre,
      modelo: payload.modelo || payload.nombre,
      descripcion: payload.descripcion ?? "",
      calidad: payload.calidad || "ORIGINAL",
      precio_base: precioBaseStr,
      marca_id: payload.marca_id,
      categoria_id: payload.categoria_id,
      activo: payload.activo ?? true,
    };
    if (payload.variantes_input && payload.variantes_input.length > 0) {
      body.variantes_input = payload.variantes_input.map((v, idx) => ({
        talla: v.talla,
        talla_id: v.talla,
        stock: Number(v.stock),
        peso_kg: v.peso_kg != null ? Number(v.peso_kg) : 0.85,
        sku: v.sku?.trim() || `SKU-${Date.now()}-${v.talla}-${idx}-${Math.floor(Math.random() * 10000)}`,
      }));
    }

    const { data } = await httpClient.post<any>("/productos/", body);
    return toProduct(safeUnwrap(data));
  }

  async updateProduct(id: number, payload: Partial<CreateProductDTO>): Promise<Product> {
    const body: Record<string, any> = {};
    if (payload.nombre !== undefined) body.nombre = payload.nombre;
    if (payload.modelo !== undefined) body.modelo = payload.modelo;
    if (payload.descripcion !== undefined) body.descripcion = payload.descripcion;
    if (payload.calidad !== undefined) body.calidad = payload.calidad;
    if (payload.precio_base !== undefined) {
      body.precio_base =
        typeof payload.precio_base === "number"
          ? payload.precio_base.toFixed(2)
          : String(payload.precio_base);
    }
    if (payload.marca_id !== undefined) body.marca_id = payload.marca_id;
    if (payload.categoria_id !== undefined) body.categoria_id = payload.categoria_id;
    if (payload.activo !== undefined) body.activo = payload.activo;
    if (payload.variantes_input !== undefined) {
      body.variantes_input = payload.variantes_input.map((v, idx) => ({
        talla: v.talla,
        talla_id: v.talla,
        stock: Number(v.stock),
        peso_kg: v.peso_kg != null ? Number(v.peso_kg) : 0.85,
        sku: v.sku?.trim() || `SKU-${id}-${v.talla}-${idx}-${Date.now()}`,
      }));
    }

    const { data } = await httpClient.patch<any>(`/productos/${id}/`, body);
    return toProduct(safeUnwrap(data));
  }

  async deleteProduct(id: number): Promise<void> {
    await httpClient.delete(`/productos/${id}/`);
  }

  async createVariant(payload: CreateVariantDTO): Promise<void> {
    const autoSku = payload.sku?.trim() || `SKU-${payload.productoId}-${payload.tallaId}-${Date.now()}`;
    const body = {
      producto: payload.productoId,
      talla: payload.tallaId,
      talla_id: payload.tallaId,
      stock: payload.stock,
      sku: autoSku,
      peso_kg: payload.pesoKg ? String(payload.pesoKg) : "0.85",
    };
    await httpClient.post<any>("/variantes/", body);
  }

  async updateVariant(id: number, payload: UpdateVariantDTO): Promise<void> {
    const body: Record<string, any> = {};
    if (payload.stock !== undefined) body.stock = Number(payload.stock);
    if (payload.sku !== undefined) body.sku = payload.sku.trim() || `SKU-VAR-${id}-${Date.now()}`;
    if (payload.pesoKg !== undefined) body.peso_kg = String(payload.pesoKg);
    await httpClient.patch<any>(`/variantes/${id}/`, body);
  }

  async deleteVariant(id: number): Promise<void> {
    await httpClient.delete(`/variantes/${id}/`);
  }

  async createBrand(payload: CreateBrandDTO): Promise<Brand> {
    const fd = new FormData();
    fd.append("nombre", payload.nombre);
    fd.append("descripcion", payload.descripcion ?? "");
    if (payload.logo) fd.append("logo", payload.logo);
    const { data } = await httpClient.post<any>("/marcas/", fd);
    return toBrand(safeUnwrap(data));
  }

  async updateBrand(id: number, payload: UpdateBrandDTO): Promise<Brand> {
    const fd = new FormData();
    if (payload.nombre !== undefined) fd.append("nombre", payload.nombre);
    if (payload.descripcion !== undefined) fd.append("descripcion", payload.descripcion ?? "");
    if (payload.logo) fd.append("logo", payload.logo);
    const { data } = await httpClient.patch<any>(`/marcas/${id}/`, fd);
    return toBrand(safeUnwrap(data));
  }

  async deleteBrand(id: number): Promise<void> {
    await httpClient.delete(`/marcas/${id}/`);
  }

  async getBrands(): Promise<Brand[]> {
    const { data } = await httpClient.get<any>("/marcas/");
    const payload = safeUnwrap<any>(data);
    const list: any[] = Array.isArray(payload) ? payload : payload?.results ?? [];
    return list.map((b: any) => ({
      id: b.id,
      nombre: b.nombre,
      descripcion: b.descripcion ?? null,
      logoUrl: b.logo_url ?? b.logoUrl ?? null,
    }));
  }

  async createCategory(payload: CreateCategoryDTO): Promise<Category> {
    const fd = new FormData();
    fd.append("nombre", payload.nombre);
    fd.append("descripcion", payload.descripcion ?? "");
    if (payload.imagen) fd.append("imagen", payload.imagen);
    const { data } = await httpClient.post<any>("/categorias/", fd);
    return toCategory(safeUnwrap(data));
  }

  async updateCategory(id: number, payload: UpdateCategoryDTO): Promise<Category> {
    const fd = new FormData();
    if (payload.nombre !== undefined) fd.append("nombre", payload.nombre);
    if (payload.descripcion !== undefined) fd.append("descripcion", payload.descripcion ?? "");
    if (payload.imagen) fd.append("imagen", payload.imagen);
    const { data } = await httpClient.patch<any>(`/categorias/${id}/`, fd);
    return toCategory(safeUnwrap(data));
  }

  async deleteCategory(id: number): Promise<void> {
    await httpClient.delete(`/categorias/${id}/`);
  }

  async getCategories(): Promise<Category[]> {
    const { data } = await httpClient.get<any>("/categorias/");
    const payload = safeUnwrap<any>(data);
    const list: any[] = Array.isArray(payload) ? payload : payload?.results ?? [];
    return list.map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion ?? null,
      subcategoria: c.subcategoria ?? null,
      imagenUrl: c.imagen_url ?? null,
    }));
  }

  async createTalla(payload: CreateTallaDTO): Promise<Talla> {
    const { data } = await httpClient.post<any>("/tallas/", payload);
    const item = safeUnwrap<any>(data);
    return { id: item.id, valor: String(item.valor) };
  }

  async updateTalla(id: number, payload: UpdateTallaDTO): Promise<Talla> {
    const { data } = await httpClient.patch<any>(`/tallas/${id}/`, payload);
    const item = safeUnwrap<any>(data);
    return { id: item.id ?? id, valor: String(item.valor ?? payload.valor) };
  }

  async deleteTalla(id: number): Promise<void> {
    await httpClient.delete(`/tallas/${id}/`);
  }

  async getTallas(): Promise<Talla[]> {
    const { data } = await httpClient.get<any>("/tallas/");
    const payload = safeUnwrap<any>(data);
    const items: any[] = Array.isArray(payload) ? payload : payload?.results ?? [];
    return items.map((t: any) => ({ id: t.id, valor: String(t.valor) }));
  }

  async getUsers(rol?: string): Promise<User[]> {
    const url = rol ? `/usuarios/?rol=${encodeURIComponent(rol)}` : "/usuarios/";
    try {
      const { data } = await httpClient.get<any>(url);
      const payload = safeUnwrap<any>(data);
      const items: any[] = Array.isArray(payload) ? payload : payload?.results ?? [];
      const mapped = items.map((u: any) => ({
        id: u.id,
        nombre: u.nombre || u.primer_nombre || u.first_name || "",
        apellido: u.apellido || u.primer_apellido || u.last_name || "",
        correo: u.correo || u.email || "",
        telefono: u.telefono || "",
        rol: normalizeUserRole(u.rol || u.role || u.tipo || u.usuario?.rol || u.user?.rol),
        username: u.username,
        fotoPerfilUrl: u.foto_perfil_url || u.foto_perfil,
        creadoEn: u.creado_en,
      }));

      const sellers = mapped
        .filter((u) => u.rol === "vendedor")
        .map((u) => ({
          id: u.id,
          nombre: u.nombre || u.username || "Vendedor",
          apellido: u.apellido || "",
          correo: u.correo,
        }));
      if (sellers.length > 0) {
        try {
          localStorage.setItem("drip_sellers_cache", JSON.stringify(sellers));
          localStorage.setItem("drip_sellers_timestamp", String(Date.now()));
        } catch {}
      }

      return mapped;
    } catch {
      return [];
    }
  }

  async createUser(payload: CreateUserDTO): Promise<User> {
    const jsonHeaders = { headers: { "Content-Type": "application/json" } };
    const baseName = payload.correo.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").substring(0, 15);
    const uniqueUsername = `${baseName}_${Math.floor(1000 + Math.random() * 9000)}`;
    const rolLower = (payload.rol || "vendedor").toLowerCase();

    const body = {
      username: uniqueUsername,
      email: payload.correo,
      correo: payload.correo,
      password: payload.password,
      nombre: payload.nombre,
      primer_nombre: payload.nombre,
      apellido: payload.apellido,
      primer_apellido: payload.apellido,
      telefono: payload.telefono || "",
      rol: rolLower,
      role: rolLower,
      tipo: rolLower,
      banco: "Banco Pichincha",
      tipo_cuenta: "Ahorros",
      numero_cuenta: "2200112233",
    };

    let responseData: any = null;
    let lastError: any = null;

    try {
      const { data } = await httpClient.post<any>("/usuarios/registro/", body, jsonHeaders);
      responseData = safeUnwrap<any>(data);
    } catch (err1: any) {
      lastError = err1;
      try {
        const { data } = await httpClient.post<any>("/usuarios/", body, jsonHeaders);
        responseData = safeUnwrap<any>(data);
      } catch (err2: any) {
        lastError = err2;
        if (payload.rol === "VENDEDOR") {
          try {
            const { data } = await httpClient.post<any>("/usuarios/vendedores/crear/", body, jsonHeaders);
            responseData = safeUnwrap<any>(data);
          } catch (err3: any) { lastError = err3; }
        } else if (payload.rol === "CONTADOR") {
          try {
            const { data } = await httpClient.post<any>("/usuarios/contadores/crear/", body, jsonHeaders);
            responseData = safeUnwrap<any>(data);
          } catch (err3: any) { lastError = err3; }
        }
      }
    }

    if (!responseData) {
      throw lastError || new Error("No se pudo crear el usuario. Revisa que el correo no esté registrado.");
    }

    const u = responseData?.usuario || responseData?.user || responseData || {};
    return {
      id: u.id || Date.now(),
      nombre: u.nombre || u.primer_nombre || payload.nombre,
      apellido: u.apellido || u.primer_apellido || payload.apellido,
      correo: u.correo || u.email || payload.correo,
      telefono: u.telefono || payload.telefono || "",
      rol: normalizeUserRole(u.rol || u.role || u.tipo || payload.rol),
      username: u.username || uniqueUsername,
    };
  }

  async updateUser(id: number, payload: UpdateUserDTO): Promise<User> {
    const rolRaw = payload.rol ? String(payload.rol).trim() : undefined;
    const rolLower = rolRaw ? rolRaw.toLowerCase() : undefined;
    const rolUpper = rolRaw ? rolRaw.toUpperCase() : undefined;

    const body: Record<string, any> = {};
    if (payload.nombre !== undefined) {
      body.nombre = payload.nombre;
      body.primer_nombre = payload.nombre;
    }
    if (payload.apellido !== undefined) {
      body.apellido = payload.apellido;
      body.primer_apellido = payload.apellido;
    }
    if (payload.telefono !== undefined) {
      body.telefono = payload.telefono;
    }
    if (rolRaw !== undefined) {
      body.rol = rolLower;
      body.role = rolLower;
      body.tipo = rolLower;
    }

    let responseData: any = null;
    const jsonHeaders = { headers: { "Content-Type": "application/json" } };

    try {
      const { data } = await httpClient.patch<any>(`/usuarios/${id}/`, body, jsonHeaders);
      responseData = safeUnwrap<any>(data);
    } catch (err: any) {
      try {
        const upperBody = { ...body, rol: rolUpper, role: rolUpper, tipo: rolUpper };
        const { data } = await httpClient.patch<any>(`/usuarios/${id}/`, upperBody, jsonHeaders);
        responseData = safeUnwrap<any>(data);
      } catch {
        try {
          const { data } = await httpClient.put<any>(`/usuarios/${id}/`, body, jsonHeaders);
          responseData = safeUnwrap<any>(data);
        } catch (finalErr: any) {
          throw err || finalErr;
        }
      }
    }

    const u = responseData || {};
    return {
      id: u.id || id,
      nombre: u.nombre || u.primer_nombre || payload.nombre || "",
      apellido: u.apellido || u.primer_apellido || payload.apellido || "",
      correo: u.correo || u.email || "",
      telefono: u.telefono || payload.telefono || "",
      rol: normalizeUserRole(u.rol || u.role || u.tipo || payload.rol),
      username: u.username,
    };
  }

  async deleteUser(id: number): Promise<void> {
    await httpClient.delete(`/usuarios/${id}/`);
  }

  async getPendingPayments(): Promise<PaymentProof[]> {
    const { data } = await httpClient.get<any>("/pedidos/comprobantes/pendientes/");
    const payload = safeUnwrap<any>(data);
    const items: any[] = Array.isArray(payload) ? payload : payload?.results ?? [];
    return items.map((c: any) => ({
      id: c.id,
      pedidoId: c.pedido_id || c.pedido?.id || c.pedido || 0,
      clienteNombre: c.cliente_nombre || c.pedido?.cliente_nombre || "Cliente Drip",
      monto: Number(c.monto || c.monto_declarado || 0),
      montoDeclarado: Number(c.monto_declarado || c.monto || 0),
      bancoOrigen: c.banco_origen || "",
      numeroReferencia: c.numero_referencia || "",
      comprobanteUrl: c.comprobante_url || c.archivo || "",
      estado: c.estado || "PENDIENTE",
      observacion: c.observacion || "",
      creadoEn: c.creado_en || new Date().toISOString(),
    }));
  }

  async verifyPayment(payload: VerifyPaymentDTO): Promise<void> {
    await httpClient.patch<any>(`/pedidos/comprobantes/${payload.comprobanteId}/verificar/`, {
      estado: payload.estado,
      observacion: payload.observacion || "",
    });
  }

  async shipOrder(payload: ShipOrderDTO): Promise<Order> {
    const { data } = await httpClient.post<any>(`/pedidos/${payload.pedidoId}/marcar-enviado/`, {
      numero_guia: payload.numeroGuia,
    });
    return toOrder(safeUnwrap(data));
  }

  async deliverOrder(pedidoId: number): Promise<Order> {
    const { data } = await httpClient.post<any>(`/pedidos/${pedidoId}/marcar-entregado/`);
    return toOrder(safeUnwrap(data));
  }

  async prepareOrder(pedidoId: number): Promise<Order> {
    const { data } = await httpClient.post<any>(`/pedidos/${pedidoId}/preparar-pedido/`);
    return toOrder(safeUnwrap(data));
  }

  async updateOrderStatus(pedidoId: number, estado: string, extra?: Record<string, any>): Promise<Order> {
    // Map states to their real backend action endpoints
    const actionMap: Record<string, string> = {
      PREPARANDO_PEDIDO: `/pedidos/${pedidoId}/preparar-pedido/`,
      ENVIADO: `/pedidos/${pedidoId}/marcar-enviado/`,
      ENTREGADO: `/pedidos/${pedidoId}/marcar-entregado/`,
      PAGO_EN_REVISION: `/pedidos/${pedidoId}/marcar-contactado/`,
    };
    const actionUrl = actionMap[estado];

    if (!actionUrl) {
      throw new Error(`No hay endpoint para el estado "${estado}". Contacta al administrador.`);
    }

    const body = extra ?? {};
    const { data } = await httpClient.post<any>(actionUrl, body);
    return toOrder(safeUnwrap(data));
  }

  async getAdminStats(): Promise<AdminStats> {
    try {
      const pedidosRes = await httpClient.get<any>("/pedidos/");
      const productosRes = await httpClient.get<any>("/productos/").catch(() => null);
      const pedidosList = safeUnwrap<any>(pedidosRes.data);
      const productosList = productosRes ? safeUnwrap<any>(productosRes.data) : [];
      const pedidosArr: any[] = Array.isArray(pedidosList) ? pedidosList : pedidosList?.results ?? [];
      const productosArr: any[] = Array.isArray(productosList) ? productosList : productosList?.results ?? [];
      const totalVentas = pedidosArr
        .filter((p: any) => ["PAGO_APROBADO", "PREPARANDO_PEDIDO", "ENVIADO", "ENTREGADO"].includes(p.estado))
        .reduce((sum: number, p: any) => sum + Number(p.total ?? p.monto_total ?? p.monto ?? 0), 0);
      const pendientes = pedidosArr.filter((p: any) => ["PENDIENTE_DE_PAGO", "COMPROBANTE_ENVIADO"].includes(p.estado)).length;
      return { totalVentas, totalPedidos: pedidosArr.length, pedidosPendientes: pendientes, productosActivos: productosArr.length, totalClientes: 0, totalVendedores: 0 };
    } catch {
      return { totalVentas: 0, totalPedidos: 0, pedidosPendientes: 0, productosActivos: 0, totalClientes: 0, totalVendedores: 0 };
    }
  }

  async getSellerOrders(vendedorId?: number): Promise<Order[]> {
    const url = vendedorId ? `/pedidos/?vendedor_id=${vendedorId}` : "/pedidos/";
    const { data } = await httpClient.get<any>(url);
    const raw = safeUnwrap<any>(data);
    const list: any[] = Array.isArray(raw) ? raw : raw?.results ?? [];
    return list.map(toOrder);
  }

  async getCommissionReport(): Promise<CommissionReport[]> {
    try {
      const { data } = await httpClient.get<any>("/comisiones/");
      const raw = safeUnwrap<any>(data);
      const items: any[] = Array.isArray(raw) ? raw : raw?.results ?? [];
      return items.map((item: any) => ({
        vendedorId: item.vendedor_id || item.vendedor || 0,
        vendedorNombre: item.vendedor_nombre || "Vendedor",
        paresVendidos: Number(item.pares_vendidos || item.cantidad_pares || 1),
        comisionesTotal: Number(item.monto || item.comisiones_total || 4.0),
        pedidosEntregados: Number(item.pedidos_entregados || 1),
      }));
    } catch {
      return [];
    }
  }

  async getSellerCommissionSummary(): Promise<{
    totalComisiones: number;
    comisionesPendientes: number;
    comisionesPagadas: number;
    ventasEntregadas: number;
    ventasAsignadas: number;
  } | null> {
    try {
      const { data } = await httpClient.get<any>("/comisiones/resumen-vendedor/");
      const raw = safeUnwrap<any>(data);
      return {
        totalComisiones: Number(raw.total_comisiones ?? 0),
        comisionesPendientes: Number(raw.comisiones_pendientes ?? 0),
        comisionesPagadas: Number(raw.comisiones_pagadas ?? 0),
        ventasEntregadas: Number(raw.ventas_entregadas ?? 0),
        ventasAsignadas: Number(raw.ventas_asignadas ?? 0),
      };
    } catch {
      return null;
    }
  }

  private _mapLiquidacion(l: any): import("@/domain/ports/AdminRepositoryPort").Liquidacion {
    const comisiones = (l.comisiones ?? []).map((c: any) => ({
      id: c.id,
      pedidoId: c.pedido_id ?? c.pedido ?? 0,
      vendedorId: typeof c.vendedor === "object" ? c.vendedor?.id : c.vendedor,
      cantidadPares: Number(c.cantidad_pares ?? 0),
      montoPorPar: Number(c.monto_por_par ?? 4),
      monto: Number(c.monto ?? 0),
      estado: c.estado ?? "PENDIENTE",
      generadaEn: c.generada_en ?? "",
    }));

    const derivedTotalPares = comisiones.reduce((s: number, c: any) => s + (c.cantidadPares ?? 0), 0);
    const derivedTotalComisiones = comisiones.reduce((s: number, c: any) => s + (c.monto ?? 0), 0);

    return {
      id: l.id,
      vendedorId: typeof l.vendedor === "object" ? l.vendedor?.id : l.vendedor,
      vendedorNombre:
        typeof l.vendedor === "object"
          ? `${l.vendedor?.primer_nombre || l.vendedor?.nombre || ""} ${l.vendedor?.primer_apellido || l.vendedor?.apellido || ""}`.trim()
          : undefined,
      periodoAnio: l.periodo_anio,
      periodoMes: l.periodo_mes,
      // Prefer derived totals from the comisiones array to avoid inconsistencies from the backend
      totalPares: derivedTotalPares,
      totalComisiones: derivedTotalComisiones,
      pagada: Boolean(l.pagada),
      fechaPago: l.fecha_pago ?? null,
      comprobanteUrl: l.comprobante_pago ?? null,
      comisiones,
      creadaEn: l.creada_en ?? "",
    } as any;
  }

  async getLiquidaciones(vendedorId?: number): Promise<import("@/domain/ports/AdminRepositoryPort").Liquidacion[]> {
    const params = vendedorId ? { vendedor: vendedorId } : {};
    const { data } = await httpClient.get<any>("/liquidaciones/", { params });
    const raw = safeUnwrap<any>(data);
    const items: any[] = Array.isArray(raw) ? raw : raw?.results ?? [];
    return items.map((l) => this._mapLiquidacion(l));
  }

  async getComisionesPendientes(vendedorId?: number): Promise<import("@/domain/ports/AdminRepositoryPort").ComisionItem[]> {
    const params: Record<string, any> = { estado: "PENDIENTE" };
    if (vendedorId) params.vendedor = vendedorId;
    const { data } = await httpClient.get<any>("/comisiones/", { params });
    const raw = safeUnwrap<any>(data);
    const items: any[] = Array.isArray(raw) ? raw : raw?.results ?? [];
    return items.map((c: any) => ({
      id: c.id,
      pedidoId: c.pedido_id ?? c.pedido ?? 0,
      vendedorId: typeof c.vendedor === "object" ? c.vendedor?.id : c.vendedor,
      cantidadPares: Number(c.cantidad_pares ?? 0),
      montoPorPar: Number(c.monto_por_par ?? 4),
      monto: Number(c.monto ?? 0),
      estado: c.estado ?? "PENDIENTE",
      generadaEn: c.generada_en ?? "",
    }));
  }

  async marcarComisionLiquidada(comisionId: number): Promise<{ id: number; estado: string }> {
    try {
      const { data } = await httpClient.post<any>(`/comisiones/${comisionId}/marcar-liquidada/`);
      const raw = safeUnwrap<any>(data);
      return { id: raw.id ?? comisionId, estado: raw.estado ?? "LIQUIDADA" };
    } catch {
      throw new Error("No se pudo marcar la comisión como liquidada.");
    }
  }

  async assignSellerToOrder(orderId: number, vendedorId: number): Promise<Order> {
    try {
      const { data } = await httpClient.post<any>(`/pedidos/${orderId}/asignar-vendedor/`, { vendedor_id: vendedorId });
      return toOrder(safeUnwrap(data));
    } catch {
      throw new Error("No se pudo asignar el vendedor al pedido.");
    }
  }

  async generarLiquidacion(vendedorId: number, anio: number, mes: number): Promise<import("@/domain/ports/AdminRepositoryPort").Liquidacion> {
    const { data } = await httpClient.post<any>("/liquidaciones/generar/", {
      vendedor_id: vendedorId,
      anio,
      mes,
    });
    return this._mapLiquidacion(safeUnwrap(data));
  }

  async marcarLiquidacionPagada(liquidacionId: number, comprobante: File): Promise<import("@/domain/ports/AdminRepositoryPort").Liquidacion> {
    const fd = new FormData();
    fd.append("comprobante_pago", comprobante);
    const { data } = await httpClient.post<any>(`/liquidaciones/${liquidacionId}/marcar-pagada/`, fd);
    return this._mapLiquidacion(safeUnwrap(data));
  }

  async getResumenGlobalVendedores(): Promise<import("@/domain/ports/AdminRepositoryPort").ResumenVendedor[]> {
    try {
      const { data } = await httpClient.get<any>("/liquidaciones/resumen-global/");
      const raw = safeUnwrap<any>(data);
      const items: any[] = Array.isArray(raw) ? raw : raw?.results ?? [];
      return items.map((v: any) => ({
        vendedorId: v.vendedor_id,
        vendedorNombre: v.vendedor_nombre || "",
        vendedorEmail: v.vendedor_email || "",
        totalParesMes: Number(v.total_pares_mes ?? 0),
        totalComisionesMes: Number(v.total_comisiones_mes ?? 0),
        totalComisionesHistorico: Number(v.total_comisiones_historico ?? 0),
        liquidacionId: v.liquidacion_id ?? null,
        liquidacionPagada: Boolean(v.liquidacion_pagada),
        fechaPago: v.fecha_pago ?? null,
        comprobantePagoUrl: v.comprobante_pago_url ?? null,
      }));
    } catch (err: any) {
      console.error("Error fetching resumen global de vendedores:", err);
      return [];
    }
  }

  async getLiquidacionDetalle(liquidacionId: number): Promise<import("@/domain/ports/AdminRepositoryPort").Liquidacion> {
    const { data } = await httpClient.get<any>(`/liquidaciones/${liquidacionId}/`);
    return this._mapLiquidacion(safeUnwrap(data));
  }

  async getCampaigns(): Promise<EmailCampaign[]> {
    try {
      const { data } = await httpClient.get<any>("/campanas/");
      // handle both envelope {success, data:[...]} and raw array/paginated
      const raw = data?.data ?? data;
      const items = Array.isArray(raw) ? raw : raw?.results || [];
      return items.map((c: any) => ({
        id: c.id,
        titulo: c.titulo,
        asunto: c.asunto,
        contenidoHtml: c.contenido_html || c.contenidoHtml || "",
        segmento: c.segmento,
        totalEnviados: c.total_enviados ?? c.totalEnviados ?? 0,
        totalFallidos: c.total_fallidos ?? c.totalFallidos ?? 0,
        estado: c.estado || "BORRADOR",
        creadoEn: c.creado_en || c.creadoEn || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }

  async createCampaign(payload: CreateCampaignDTO): Promise<EmailCampaign> {
    const body = {
      titulo: payload.titulo,
      asunto: payload.asunto,
      contenido_html: payload.contenidoHtml,
      segmento: payload.segmento,
    };
    const { data } = await httpClient.post<any>("/campanas/", body);
    const c = data?.data ?? data;
    return {
      id: c.id,
      titulo: c.titulo,
      asunto: c.asunto,
      contenidoHtml: c.contenido_html || c.contenidoHtml || "",
      segmento: c.segmento,
      totalEnviados: c.total_enviados ?? 0,
      totalFallidos: c.total_fallidos ?? 0,
      estado: c.estado || "BORRADOR",
      creadoEn: c.creado_en || new Date().toISOString(),
    };
  }

  async sendCampaign(campaignId: number): Promise<{ totalEnviados: number; totalFallidos: number }> {
    try {
      const { data } = await httpClient.post<any>(`/campanas/${campaignId}/enviar/`);
      const res = data?.data ?? data;
      return {
        totalEnviados: Number(res?.total_enviados ?? res?.totalEnviados ?? 0),
        totalFallidos: Number(res?.total_fallidos ?? res?.totalFallidos ?? 0),
      };
    } catch (err: any) {
      // If backend returns 200 with plain message, treat as success
      const msg = err?.message || "";
      if (err?.status === 200 || msg.toLowerCase().includes("enviado")) {
        return { totalEnviados: 0, totalFallidos: 0 };
      }
      throw err;
    }
  }
}
