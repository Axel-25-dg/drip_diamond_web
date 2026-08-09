import type { SellerDTO } from "@/application/dtos/auth.dto";
import { normalizeUserRole, type Seller, type User, type UserRole } from "@/domain/entities/User";

export function toUser(dto: any): User {
  if (!dto) {
    return {
      id: 0,
      nombre: "Usuario",
      apellido: "",
      correo: "",
      telefono: "",
      rol: "cliente",
    };
  }

  return {
    id: dto.id ?? 0,
    nombre: dto.nombre || dto.primer_nombre || "",
    apellido: dto.apellido || dto.primer_apellido || "",
    correo: dto.correo || dto.email || "",
    telefono: dto.telefono || "",
    rol: normalizeUserRole(dto.rol as string | undefined),
    username: dto.username,
    fotoPerfilUrl: dto.foto_perfil_url ?? null,
    creadoEn: dto.creado_en || dto.creadoEn,
    perfilVendedor: dto.perfil_vendedor
      ? {
          codigoReferido: dto.perfil_vendedor.codigo_referido,
          totalVentas: dto.perfil_vendedor.total_ventas,
          comisionesAcumuladas: dto.perfil_vendedor.comisiones_acumuladas,
        }
      : null,
    direccion: dto.direccion || dto.address || null,
    ciudad: dto.ciudad || dto.city || null,
  };
}

export function toSeller(dto: SellerDTO): Seller {
  if (!dto) {
    return { id: 0, nombre: "Vendedor", apellido: "" };
  }
  return { id: dto.id, nombre: dto.nombre, apellido: dto.apellido, correo: dto.correo };
}
