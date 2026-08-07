import type {
  AuthSession,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  User,
} from "@/domain/entities/User";

export interface AuthRepositoryPort {
  login(payload: LoginPayload): Promise<AuthSession>;
  logout(refreshToken: string): Promise<void>;
  register(payload: RegisterPayload): Promise<User>;
  refreshToken(refreshToken: string): Promise<{ access: string }>;
  getProfile(): Promise<User>;
  updateProfile(payload: UpdateProfilePayload): Promise<User>;
  requestPasswordReset(correo: string): Promise<void>;
  verifyOtp(correo: string, codigo: string): Promise<{ resetToken: string }>;
  confirmPasswordReset(resetToken: string, nuevaPassword: string): Promise<void>;
  checkUsernameAvailable(username: string): Promise<boolean>;
}
