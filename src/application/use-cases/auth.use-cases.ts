import type { AuthRepositoryPort } from "@/domain/ports/AuthRepositoryPort";
import type { LoginPayload, RegisterPayload, UpdateProfilePayload } from "@/domain/entities/User";

export class LoginUseCase {
  constructor(private repo: AuthRepositoryPort) {}
  execute(payload: LoginPayload) {
    return this.repo.login(payload);
  }
}

export class RegisterUseCase {
  constructor(private repo: AuthRepositoryPort) {}
  execute(payload: RegisterPayload) {
    return this.repo.register(payload);
  }
}

export class LogoutUseCase {
  constructor(private repo: AuthRepositoryPort) {}
  execute(refreshToken: string) {
    return this.repo.logout(refreshToken);
  }
}

export class GetProfileUseCase {
  constructor(private repo: AuthRepositoryPort) {}
  execute() {
    return this.repo.getProfile();
  }
}

export class UpdateProfileUseCase {
  constructor(private repo: AuthRepositoryPort) {}
  execute(payload: UpdateProfilePayload) {
    return this.repo.updateProfile(payload);
  }
}

export class RequestPasswordResetUseCase {
  constructor(private repo: AuthRepositoryPort) {}
  execute(correo: string) {
    return this.repo.requestPasswordReset(correo);
  }
}

export class VerifyOtpUseCase {
  constructor(private repo: AuthRepositoryPort) {}
  execute(correo: string, codigo: string) {
    return this.repo.verifyOtp(correo, codigo);
  }
}

export class ConfirmPasswordResetUseCase {
  constructor(private repo: AuthRepositoryPort) {}
  execute(resetToken: string, nuevaPassword: string) {
    return this.repo.confirmPasswordReset(resetToken, nuevaPassword);
  }
}
