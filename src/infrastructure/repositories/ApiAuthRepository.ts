import { httpClient } from "@/infrastructure/http/httpClient";
import type { AuthRepositoryPort } from "@/domain/ports/AuthRepositoryPort";
import type { AuthSession, LoginPayload, RegisterPayload, UpdateProfilePayload, User } from "@/domain/entities/User";
import { toUser } from "@/infrastructure/adapters/auth.adapter";

function safeUnwrap<T>(data: any): T {
  if (data && "success" in data && "data" in data) return data.data as T;
  return data as T;
}

export class ApiAuthRepository implements AuthRepositoryPort {
  async login(payload: LoginPayload): Promise<AuthSession> {
    const { data } = await httpClient.post<any>("/auth/login/", {
      correo: payload.correo,
      password: payload.password,
    });
    const result = safeUnwrap<any>(data);
    const userDTO = result?.usuario || result?.user || result;
    return {
      user: toUser(userDTO),
      tokens: { access: result?.access || "", refresh: result?.refresh || "" },
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await httpClient.post("/auth/logout/", { refresh: refreshToken });
  }

  async register(payload: RegisterPayload): Promise<User> {
    const username = payload.correo.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
    const { data } = await httpClient.post<any>("/usuarios/registro/", {
      nombre: payload.nombre,
      apellido: payload.apellido,
      correo: payload.correo,
      telefono: payload.telefono,
      direccion: payload.direccion,
      ciudad: payload.ciudad,
      password: payload.password,
      username,
    });
    const result = safeUnwrap<any>(data);
    const userDTO = result?.usuario || result?.user || result;
    return toUser(userDTO);
  }

  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    const { data } = await httpClient.post<any>("/auth/refresh/", { refresh: refreshToken });
    return safeUnwrap<{ access: string }>(data);
  }

  async getProfile(): Promise<User> {
    const { data } = await httpClient.get<any>("/usuarios/me/");
    const result = safeUnwrap<any>(data);
    const userDTO = result?.usuario || result?.user || result;
    return toUser(userDTO);
  }

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    // Send as FormData — backend uses MultiPartParser on the me action
    const fd = new FormData();
    if (payload.nombre !== undefined) fd.append("primer_nombre", payload.nombre);
    if (payload.apellido !== undefined) fd.append("primer_apellido", payload.apellido);
    if (payload.telefono !== undefined) fd.append("telefono", payload.telefono);
    const { data } = await httpClient.patch<any>("/usuarios/me/", fd);
    const result = safeUnwrap<any>(data);
    const userDTO = result?.usuario || result?.user || result;
    return toUser(userDTO);
  }

  async uploadAvatar(file: File): Promise<User> {
    // foto_perfil is the exact field name defined in the User model
    const fd = new FormData();
    fd.append("foto_perfil", file);
    const { data } = await httpClient.patch<any>("/usuarios/me/", fd);
    const result = safeUnwrap<any>(data);
    const userDTO = result?.usuario || result?.user || result;
    return toUser(userDTO);
  }

  async requestPasswordReset(correo: string): Promise<void> {
    await httpClient.post("/auth/recuperar-password/", { email: correo });
  }

  async verifyOtp(correo: string, codigo: string): Promise<{ resetToken: string }> {
    const { data } = await httpClient.post<any>("/auth/verificar-otp/", { email: correo, codigo });
    const result = safeUnwrap<any>(data);
    // Backend devuelve el email verificado; lo pasamos como resetToken para que la UI lo use en el paso 3
    return { resetToken: result?.reset_token ?? result?.token ?? result?.email ?? correo };
  }

  async confirmPasswordReset(resetToken: string, nuevaPassword: string, codigo?: string): Promise<void> {
    // resetToken holds the email (returned by verifyOtp), codigo is the verified OTP
    await httpClient.post("/auth/confirmar-password/", {
      email: resetToken,
      codigo: codigo ?? "",
      nueva_password: nuevaPassword,
    });
  }

  async checkUsernameAvailable(username: string): Promise<boolean> {
    try {
      const { data } = await httpClient.get<any>("/usuarios/verificar-username/", { params: { username } });
      return safeUnwrap<any>(data)?.disponible ?? true;
    } catch {
      return true;
    }
  }
}
