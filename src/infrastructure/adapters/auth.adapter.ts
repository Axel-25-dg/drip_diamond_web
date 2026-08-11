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
    email: dto.email || dto.correo || undefined,
    telefono: dto.telefono || "",
    direccion: dto.direccion || dto.address || dto.direccion_referencial || null,
    direccionReferencial: dto.direccion_referencial ?? (dto.direccion || null),
    ciudad: dto.ciudad || dto.city || null,
    primerNombre: dto.primer_nombre ?? null,
    segundoNombre: dto.segundo_nombre ?? null,
    primerApellido: dto.primer_apellido ?? null,
    segundoApellido: dto.segundo_apellido ?? null,
    nombreCompleto: dto.nombre_completo ?? null,
    rol: normalizeUserRole(dto.rol as string | undefined),
    username: dto.username,
    fotoPerfil: dto.foto_perfil ?? null,
    fotoPerfilUrl: dto.foto_perfil_url ?? null,
    creadoEn: dto.creado_en || dto.creadoEn,
    dobleFactorActivo: dto.doble_factor_activo ?? null,
    perfilVendedor: dto.perfil_vendedor
      ? {
          codigoReferido: dto.perfil_vendedor.codigo_referido,
          totalVentas: dto.perfil_vendedor.total_ventas,
          comisionesAcumuladas: dto.perfil_vendedor.comisiones_acumuladas,
        }
      : null,
  };
}

export function toSeller(dto: SellerDTO): Seller {
  if (!dto) {
    return { id: 0, nombre: "Vendedor", apellido: "" };
  }
  return { id: dto.id, nombre: dto.nombre, apellido: dto.apellido, correo: dto.correo };
}
