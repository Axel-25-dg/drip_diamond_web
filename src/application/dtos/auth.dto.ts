export interface UserDTO {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  email?: string;
  telefono: string;
  rol: string;
  username?: string;
  foto_perfil?: string | null;
  foto_perfil_url?: string | null;
  creado_en?: string;
  direccion_referencial?: string | null;
  ciudad?: string | null;
  primer_nombre?: string;
  segundo_nombre?: string | null;
  primer_apellido?: string;
  segundo_apellido?: string | null;
  nombre_completo?: string | null;
  doble_factor_activo?: boolean;
  perfil_vendedor?: {
    codigo_referido?: string;
    total_ventas?: number;
    comisiones_acumuladas?: number;
  } | null;
}

export interface LoginResponseDTO {
  user: UserDTO;
  access: string;
  refresh: string;
}

export interface SellerDTO {
  id: number;
  nombre: string;
  apellido: string;
  correo?: string;
}
