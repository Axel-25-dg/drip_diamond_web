import { httpClient, unwrap, type ApiEnvelope } from "@/infrastructure/http/httpClient";
import type { AuthRepositoryPort } from "@/domain/ports/AuthRepositoryPort";
import type {
  AuthSession,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  User,
} from "@/domain/entities/User";
import { toUser } from "@/infrastructure/adapters/auth.adapter";

export class ApiAuthRepository implements AuthRepositoryPort {
  async login(payload: LoginPayload): Promise<AuthSession> {
    const { data } = await httpClient.post<ApiEnvelope<any>>("/auth/login/", {
      correo: payload.correo,
      password: payload.password,
    });
    const result = unwrap(data);
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
    const { data } = await httpClient.post<ApiEnvelope<any>>("/usuarios/registro/", {
      nombre: payload.nombre,
      apellido: payload.apellido,
      correo: payload.correo,
      telefono: payload.telefono,
      password: payload.password,
      username,
    });
    const result = unwrap(data);
    const userDTO = result?.usuario || result?.user || result;
    return toUser(userDTO);
  }

  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    const { data } = await httpClient.post<ApiEnvelope<{ access: string }>>("/auth/refresh/", {
      refresh: refreshToken,
    });
    return unwrap(data);
  }

  async getProfile(): Promise<User> {
    const { data } = await httpClient.get<ApiEnvelope<any>>("/usuarios/me/");
    const result = unwrap(data);
    const userDTO = result?.usuario || result?.user || result;
    return toUser(userDTO);
  }

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const body: Record<string, any> = {};

    if (payload.nombre !== undefined) body.nombre = payload.nombre;
    if (payload.apellido !== undefined) body.apellido = payload.apellido;
    if (payload.telefono !== undefined) body.telefono = payload.telefono;
    if (payload.fotoPerfilUrl !== undefined) body.foto_perfil_url = payload.fotoPerfilUrl;

    const { data } = await httpClient.patch<ApiEnvelope<any>>("/usuarios/me/", body);
    const result = unwrap(data);
    const userDTO = result?.usuario || result?.user || result;
    return toUser(userDTO);
  }

  async requestPasswordReset(correo: string): Promise<void> {
    await httpClient.post("/auth/recuperar-password/", { correo });
  }

  async verifyOtp(correo: string, codigo: string): Promise<{ resetToken: string }> {
    const { data } = await httpClient.post<ApiEnvelope<{ reset_token?: string }>>("/auth/verificar-otp/", {
      correo,
      codigo,
    });
    const result = unwrap(data);
    return { resetToken: result?.reset_token ?? "" };
  }

  async confirmPasswordReset(resetToken: string, nuevaPassword: string): Promise<void> {
    await httpClient.post("/auth/confirmar-password/", {
      reset_token: resetToken,
      nueva_password: nuevaPassword,
    });
  }

  async checkUsernameAvailable(username: string): Promise<boolean> {
    const { data } = await httpClient.get<ApiEnvelope<{ disponible: boolean }>>(
      "/usuarios/verificar-username/",
      { params: { username } }
    );
    return unwrap(data)?.disponible ?? true;
  }
}
