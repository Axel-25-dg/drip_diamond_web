export type UserRole = "administrador" | "contador" | "vendedor" | "cliente" | "ADMINISTRADOR" | "CONTADOR" | "VENDEDOR" | "CLIENTE";

export function normalizeUserRole(role?: string | null): UserRole {
  if (!role) return "cliente";
  const value = role.toString().trim().toLowerCase();
  if (value.includes("admin")) return "administrador";
  if (value.includes("contador")) return "contador";
  if (value.includes("vendedor")) return "vendedor";
  return "cliente";
}

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  email?: string;
  telefono: string;
  direccion?: string | null;
  ciudad?: string | null;
  direccionReferencial?: string | null;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  nombreCompleto?: string;
  rol: UserRole;
  username?: string;
  fotoPerfil?: string | null;
  fotoPerfilUrl?: string | null;
  creadoEn?: string;
  dobleFactorActivo?: boolean;
  perfilVendedor?: {
    codigoReferido?: string;
    totalVentas?: number;
    comisionesAcumuladas?: number;
  } | null;
}

export interface Seller {
  id: number;
  nombre: string;
  apellido: string;
  correo?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterPayload {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  direccion?: string;
  ciudad?: string;
  password: string;
  rol?: string;
}

export interface LoginPayload {
  correo: string;
  password: string;
}

export interface UpdateProfilePayload {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  fotoPerfilUrl?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
}

export interface PaymentProof {
  id: number;
  pedidoId: number;
  clienteNombre: string;
  monto: number;
  montoDeclarado?: number;
  bancoOrigen?: string;
  numeroReferencia?: string;
  comprobanteUrl: string;
  estado: "PENDIENTE" | "VERIFICADO" | "RECHAZADO";
  observacion?: string;
  creadoEn: string;
}

export interface EmailCampaign {
  id: number;
  titulo: string;
  asunto: string;
  contenidoHtml: string;
  segmento: "TODOS_LOS_CLIENTES" | "VENDEDORES" | "CONTADORES" | "CLIENTES_CON_COMPRAS" | "CLIENTES_SIN_COMPRAS";
  totalEnviados?: number;
  totalFallidos?: number;
  estado?: "BORRADOR" | "ENVIADO" | "PROCESANDO";
  creadoEn: string;
}

export interface NotificationItem {
  id: number;
  tipo?: string;
  asunto?: string;
  mensajeCorto?: string;
  mensaje?: string;
  leida?: boolean;
  leida_at?: string | null;
  creadaEn?: string;
  creada_en?: string;
  correoEnviado?: boolean;
  correo_enviado?: boolean;
}

export interface AdminStats {
  totalVentas: number;
  totalPedidos: number;
  pedidosPendientes: number;
  productosActivos: number;
  totalClientes: number;
  totalVendedores: number;
}

export interface CommissionReport {
  vendedorId: number;
  vendedorNombre: string;
  paresVendidos: number;
  comisionesTotal: number;
  pedidosEntregados: number;
}
