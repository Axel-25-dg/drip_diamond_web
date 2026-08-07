export interface UserDTO {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rol: string;
  username?: string;
  foto_perfil_url?: string | null;
  creado_en?: string;
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
