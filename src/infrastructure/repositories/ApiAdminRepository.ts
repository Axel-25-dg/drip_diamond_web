import type { AdminRepositoryPort } from "@/domain/ports/AdminRepositoryPort";
import type { Product, Brand, Category, Talla } from "@/domain/entities/Product";
import type { Order } from "@/domain/entities/Order";
import type { User, PaymentProof, EmailCampaign, AdminStats, CommissionReport } from "@/domain/entities/User";
import type {
  CreateProductDTO,
  CreateVariantDTO,
  CreateBrandDTO,
  UpdateBrandDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CreateTallaDTO,
  VerifyPaymentDTO,
  ShipOrderDTO,
  CreateCampaignDTO,
  CreateUserDTO,
  UpdateUserDTO,
} from "@/application/dtos/admin.dto";
import { httpClient, unwrap, type ApiEnvelope } from "../http/httpClient";
import { toProduct, toBrand, toCategory } from "../adapters/catalog.adapter";
import { toOrder } from "../adapters/order.adapter";

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

    const { data } = await httpClient.post<ApiEnvelope<{ id: number; url: string; nombre_archivo?: string }>>(
      "/imagenes/subir/",
      formData
    );
    const res = unwrap(data);
    return { id: res.id, url: res.url };
  }

  async createProduct(payload: CreateProductDTO): Promise<Product> {
    const body: Record<string, any> = {
      nombre: payload.nombre,
      modelo: payload.modelo,
      descripcion: payload.descripcion,
      calidad: payload.calidad,
      precio_base: String(payload.precioBase),
      marca_id: payload.marcaId,
      categoria_id: payload.categoriaId,
      activo: payload.activo ?? true,
    };

    const { data } = await httpClient.post<ApiEnvelope<any>>("/productos/", body);
    return toProduct(unwrap(data));
  }

  async updateProduct(id: number, payload: Partial<CreateProductDTO>): Promise<Product> {
    const body: Record<string, any> = {};
    if (payload.nombre !== undefined) body.nombre = payload.nombre;
    if (payload.modelo !== undefined) body.modelo = payload.modelo;
    if (payload.descripcion !== undefined) body.descripcion = payload.descripcion;
    if (payload.calidad !== undefined) body.calidad = payload.calidad;
    if (payload.precioBase !== undefined) body.precio_base = String(payload.precioBase);
    if (payload.marcaId !== undefined) body.marca_id = payload.marcaId;
    if (payload.categoriaId !== undefined) body.categoria_id = payload.categoriaId;
    if (payload.activo !== undefined) body.activo = payload.activo;

    const { data } = await httpClient.patch<ApiEnvelope<any>>(`/productos/${id}/`, body);
    return toProduct(unwrap(data));
  }

  async createVariant(payload: CreateVariantDTO): Promise<void> {
    const body = {
      producto: payload.productoId,
      talla: payload.tallaId,
      stock: payload.stock,
      sku: payload.sku || undefined,
      peso_kg: payload.pesoKg ? String(payload.pesoKg) : "0.85",
    };
    await httpClient.post<ApiEnvelope<any>>("/variantes/", body);
  }

  async createBrand(payload: CreateBrandDTO): Promise<Brand> {
    const { data } = await httpClient.post<ApiEnvelope<any>>("/marcas/", payload);
    return toBrand(unwrap(data));
  }

  async updateBrand(id: number, payload: UpdateBrandDTO): Promise<Brand> {
    const { data } = await httpClient.patch<ApiEnvelope<any>>(`/marcas/${id}/`, payload);
    return toBrand(unwrap(data));
  }

  async deleteBrand(id: number): Promise<void> {
    await httpClient.delete(`/marcas/${id}/`);
  }

  async getBrands(): Promise<Brand[]> {
    const { data } = await httpClient.get<ApiEnvelope<any>>("/marcas/");
    const payload = unwrap(data);
    const list = Array.isArray(payload) ? payload : payload?.results || [];
    return list.map(toBrand);
  }

  async createCategory(payload: CreateCategoryDTO): Promise<Category> {
    const { data } = await httpClient.post<ApiEnvelope<any>>("/categorias/", payload);
    return toCategory(unwrap(data));
  }

  async updateCategory(id: number, payload: UpdateCategoryDTO): Promise<Category> {
    const { data } = await httpClient.patch<ApiEnvelope<any>>(`/categorias/${id}/`, payload);
    return toCategory(unwrap(data));
  }

  async deleteCategory(id: number): Promise<void> {
    await httpClient.delete(`/categorias/${id}/`);
  }

  async getCategories(): Promise<Category[]> {
    const { data } = await httpClient.get<ApiEnvelope<any>>("/categorias/");
    const payload = unwrap(data);
    const list = Array.isArray(payload) ? payload : payload?.results || [];
    return list.map(toCategory);
  }

  async createTalla(payload: CreateTallaDTO): Promise<Talla> {
    const { data } = await httpClient.post<ApiEnvelope<any>>("/tallas/", payload);
    const item = unwrap(data);
    return { id: item.id, valor: String(item.valor) };
  }

  async getTallas(): Promise<Talla[]> {
    const { data } = await httpClient.get<ApiEnvelope<any>>("/tallas/");
    const payload = unwrap(data);
    const items = Array.isArray(payload) ? payload : payload?.results || [];
    return items.map((t: any) => ({ id: t.id, valor: String(t.valor) }));
  }

  async getUsers(rol?: string): Promise<User[]> {
    const candidates = [
      rol ? `/usuarios/?rol=${encodeURIComponent(rol)}` : "/usuarios/",
      "/usuarios/",
      "/usuarios/?page=1",
    ];

    let lastError: unknown = null;

    for (const url of candidates) {
      try {
        const { data } = await httpClient.get<ApiEnvelope<any>>(url);
        const payload = unwrap(data);
        const items = Array.isArray(payload) ? payload : payload?.results || [];

        const mapped = items.map((u: any) => ({
          id: u.id,
          nombre: u.nombre || u.primer_nombre || "",
          apellido: u.apellido || u.primer_apellido || "",
          correo: u.correo || u.email || "",
          telefono: u.telefono || "",
          rol: u.rol || "CLIENTE",
          username: u.username,
          fotoPerfilUrl: u.foto_perfil_url,
          creadoEn: u.creado_en,
        }));

        if (mapped.length > 0) return mapped;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) throw lastError;
    return [];
  }

  async createUser(payload: CreateUserDTO): Promise<User> {
    const username = payload.correo.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");

    if (payload.rol === "VENDEDOR") {
      try {
        const body = {
          username,
          email: payload.correo,
          password: payload.password,
          primer_nombre: payload.nombre,
          primer_apellido: payload.apellido,
          telefono: payload.telefono,
          banco: "Banco Pichincha",
          tipo_cuenta: "Ahorros",
          numero_cuenta: "2200112233",
        };
        const { data } = await httpClient.post<ApiEnvelope<any>>("/usuarios/vendedores/crear/", body);
        const u = unwrap(data);
        return {
          id: u.id || Date.now(),
          nombre: u.primer_nombre || payload.nombre,
          apellido: u.primer_apellido || payload.apellido,
          correo: u.email || payload.correo,
          telefono: u.telefono || payload.telefono,
          rol: "VENDEDOR",
          username: u.username || username,
        };
      } catch {
        // Fallback to standard endpoint if endpoint is default DRF
      }
    } else if (payload.rol === "CONTADOR") {
      try {
        const body = {
          username,
          email: payload.correo,
          password: payload.password,
          primer_nombre: payload.nombre,
          primer_apellido: payload.apellido,
          telefono: payload.telefono,
        };
        const { data } = await httpClient.post<ApiEnvelope<any>>("/usuarios/contadores/crear/", body);
        const u = unwrap(data);
        return {
          id: u.id || Date.now(),
          nombre: u.primer_nombre || payload.nombre,
          apellido: u.primer_apellido || payload.apellido,
          correo: u.email || payload.correo,
          telefono: u.telefono || payload.telefono,
          rol: "CONTADOR",
          username: u.username || username,
        };
      } catch {
        // Fallback
      }
    }

    const standardBody = {
      nombre: payload.nombre,
      apellido: payload.apellido,
      correo: payload.correo,
      telefono: payload.telefono,
      password: payload.password,
      rol: payload.rol,
    };
    const { data } = await httpClient.post<ApiEnvelope<any>>("/usuarios/", standardBody);
    const u = unwrap(data);
    return {
      id: u.id,
      nombre: u.nombre || payload.nombre,
      apellido: u.apellido || payload.apellido,
      correo: u.correo || payload.correo,
      telefono: u.telefono || payload.telefono,
      rol: u.rol || payload.rol,
      username: u.username,
    };
  }

  async updateUser(id: number, payload: UpdateUserDTO): Promise<User> {
    const body: Record<string, any> = {};
    if (payload.nombre !== undefined) body.nombre = payload.nombre;
    if (payload.apellido !== undefined) body.apellido = payload.apellido;
    if (payload.telefono !== undefined) body.telefono = payload.telefono;
    if (payload.rol !== undefined) body.rol = payload.rol;
    const { data } = await httpClient.patch<ApiEnvelope<any>>(`/usuarios/${id}/`, body);
    const u = unwrap(data);
    return {
      id: u.id || id,
      nombre: u.nombre || payload.nombre || "",
      apellido: u.apellido || payload.apellido || "",
      correo: u.correo || u.email || "",
      telefono: u.telefono || payload.telefono || "",
      rol: u.rol || payload.rol || "CLIENTE",
      username: u.username,
    };
  }

  async deleteUser(id: number): Promise<void> {
    await httpClient.delete(`/usuarios/${id}/`);
  }

  async getPendingPayments(): Promise<PaymentProof[]> {
    const { data } = await httpClient.get<ApiEnvelope<any>>("/pedidos/comprobantes/pendientes/");
    const payload = unwrap(data);
    const items = Array.isArray(payload) ? payload : payload?.results || [];
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
    await httpClient.patch<ApiEnvelope<any>>(`/pedidos/comprobantes/${payload.comprobanteId}/verificar/`, {
      estado: payload.estado,
      observacion: payload.observacion || "",
    });
  }

  async shipOrder(payload: ShipOrderDTO): Promise<Order> {
    const { data } = await httpClient.post<ApiEnvelope<any>>(`/pedidos/${payload.pedidoId}/marcar_enviado/`, {
      numero_guia: payload.numeroGuia,
    });
    return toOrder(unwrap(data));
  }

  async deliverOrder(pedidoId: number): Promise<Order> {
    const { data } = await httpClient.post<ApiEnvelope<any>>(`/pedidos/${pedidoId}/marcar_entregado/`);
    return toOrder(unwrap(data));
  }

  async getAdminStats(): Promise<AdminStats> {
    const [pedidosRes, productosRes] = await Promise.all([
      httpClient.get<ApiEnvelope<any[]>>("/pedidos/"),
      httpClient.get<ApiEnvelope<any[]>>("/productos/"),
    ]);

    const pedidosList = unwrap(pedidosRes.data);
    const productosList = unwrap(productosRes.data);
    const pedidosArr = Array.isArray(pedidosList) ? pedidosList : (pedidosList as any)?.results || [];
    const productosArr = Array.isArray(productosList) ? productosList : (productosList as any)?.results || [];

    const totalVentas = pedidosArr
      .filter((p: any) => p.estado === "ENTREGADO" || p.estado === "ENVIADO" || p.estado === "PAGO_APROBADO")
      .reduce((sum: number, p: any) => sum + Number(p.total || p.monto_total || 0), 0);

    const pendientes = pedidosArr.filter(
      (p: any) => p.estado === "PENDIENTE_DE_PAGO" || p.estado === "COMPROBANTE_ENVIADO"
    ).length;

    return {
      totalVentas,
      totalPedidos: pedidosArr.length,
      pedidosPendientes: pendientes,
      productosActivos: productosArr.length,
      totalClientes: 0,
      totalVendedores: 0,
    };
  }

  async getSellerOrders(vendedorId?: number): Promise<Order[]> {
    const url = vendedorId ? `/pedidos/?vendedor_id=${vendedorId}` : "/pedidos/";
    const { data } = await httpClient.get<ApiEnvelope<any>>(url);
    const raw = unwrap(data);
    const list = Array.isArray(raw) ? raw : raw?.results || [];
    return list.map(toOrder);
  }

  async getCommissionReport(): Promise<CommissionReport[]> {
    try {
      const { data } = await httpClient.get<ApiEnvelope<any>>("/comisiones/");
      const raw = unwrap(data);
      const items = Array.isArray(raw) ? raw : raw?.results || [];
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

  async getCampaigns(): Promise<EmailCampaign[]> {
    const { data } = await httpClient.get<ApiEnvelope<any>>("/campanas/");
    const raw = unwrap(data);
    const items = Array.isArray(raw) ? raw : raw?.results || [];
    return items.map((c: any) => ({
      id: c.id,
      titulo: c.titulo,
      asunto: c.asunto,
      contenidoHtml: c.contenido_html,
      segmento: c.segmento,
      totalEnviados: c.total_enviados || 0,
      totalFallidos: c.total_fallidos || 0,
      estado: c.estado || "BORRADOR",
      creadoEn: c.creado_en || new Date().toISOString(),
    }));
  }

  async createCampaign(payload: CreateCampaignDTO): Promise<EmailCampaign> {
    const body = {
      titulo: payload.titulo,
      asunto: payload.asunto,
      contenido_html: payload.contenidoHtml,
      segmento: payload.segmento,
    };
    const { data } = await httpClient.post<ApiEnvelope<any>>("/campanas/", body);
    const c = unwrap(data);
    return {
      id: c.id,
      titulo: c.titulo,
      asunto: c.asunto,
      contenidoHtml: c.contenido_html,
      segmento: c.segmento,
      totalEnviados: c.total_enviados || 0,
      totalFallidos: c.total_fallidos || 0,
      estado: c.estado || "BORRADOR",
      creadoEn: c.creado_en || new Date().toISOString(),
    };
  }

  async sendCampaign(campaignId: number): Promise<{ totalEnviados: number; totalFallidos: number }> {
    const { data } = await httpClient.post<ApiEnvelope<any>>(`/campanas/${campaignId}/enviar/`);
    const res = unwrap(data);
    return {
      totalEnviados: Number(res?.total_enviados || 0),
      totalFallidos: Number(res?.total_fallidos || 0),
    };
  }
}
