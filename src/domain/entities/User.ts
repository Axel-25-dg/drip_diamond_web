export type UserRole = "administrador" | "contador" | "vendedor" | "cliente" | "ADMINISTRADOR" | "CONTADOR" | "VENDEDOR" | "CLIENTE";

export function normalizeUserRole(role?: string | null): UserRole {
  const value = (role || "cliente").toString().trim().toLowerCase();
  if (value === "administrador") return "administrador";
  if (value === "contador") return "contador";
  if (value === "vendedor") return "vendedor";
  return "cliente";
}

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rol: UserRole;
  username?: string;
  fotoPerfilUrl?: string | null;
  creadoEn?: string;
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
