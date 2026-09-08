import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, ShieldAlert, ArrowRight, Sparkles } from "lucide-react";
import { useAuthStore } from "@/presentation/store/authStore";
import { Input } from "@/presentation/components/ui/Input";
import { Button } from "@/presentation/components/ui/Button";
import { AuthShell } from "@/presentation/components/auth/AuthShell";
import { sanitizeInput, bruteForceGuard } from "@/presentation/utils/securityUtils";

interface LoginForm {
  correo: string;
  password: string;
  rememberMe?: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const handleRedirect = () => {
    const user = useAuthStore.getState().user;
    const role = user?.rol?.toLowerCase();

    let defaultPath = "/";
    if (role === "vendedor") defaultPath = "/vendedor";
    else if (role === "administrador") defaultPath = "/admin";
    else if (role === "contador") defaultPath = "/contador";

    const fromPath = (location.state as { from?: string } | null)?.from;
    const redirectTo = fromPath && fromPath !== "/login" ? fromPath : defaultPath;
    navigate(redirectTo, { replace: true });
  };

  const onSubmit = async (form: LoginForm) => {
    // 1. Client-Side Anti-Brute-Force Rate Limiting Guard
    const guard = bruteForceGuard.checkAllowed("login-attempt", 5, 60000);
    if (!guard.allowed) {
      setLockoutTime(guard.waitSeconds ?? null);
      toast.error(`Protección de seguridad activa. Demasiados intentos. Espera ${guard.waitSeconds}s.`);
      return;
    }

    try {
      const cleanEmail = sanitizeInput(form.correo);
      await login(cleanEmail, form.password);

      // Reset rate limit on success
      bruteForceGuard.reset("login-attempt");
      setLockoutTime(null);
      toast.success("¡Bienvenido de vuelta a Drip Diamond!");

      handleRedirect();
    } catch (err: any) {
      // Record failed attempt
      bruteForceGuard.recordAttempt("login-attempt");
      const currentGuard = bruteForceGuard.checkAllowed("login-attempt", 5, 60000);
      if (!currentGuard.allowed) {
        setLockoutTime(currentGuard.waitSeconds ?? null);
      }
      toast.error(err?.message || "Correo electrónico o contraseña incorrectos.");
    }
  };

  return (
    <AuthShell
      title="Iniciar Sesión"
      subtitle="Ingresa a tu cuenta para gestionar tus pedidos, carrito y beneficios exclusivos Drip."
    >
      <div className="space-y-6">
        {/* Anti-Brute Force Lockout Alert */}
        {lockoutTime && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-amber-900 dark:text-amber-300 flex items-center gap-3 animate-pulse shadow-sm">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-bold">Protección de Seguridad Activa</p>
              <p className="mt-0.5 text-[11px] opacity-90">
                Demasiados intentos fallidos. Espera {lockoutTime}s antes de intentar nuevamente.
              </p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              label="Correo electrónico *"
              type="email"
              placeholder="tucorreo@ejemplo.com"
              iconLeft={<Mail className="h-4 w-4 text-slate-400" />}
              error={errors.correo?.message}
              {...register("correo", { required: "Ingresa tu correo registrado" })}
            />
          </div>

          <div>
            <Input
              label="Contraseña *"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              iconLeft={<Lock className="h-4 w-4 text-slate-400" />}
              iconRight={
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPassword((v) => !v);
                  }}
                  className="p-1 text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors cursor-pointer select-none"
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register("password", { required: "Ingresa tu contraseña" })}
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <input
                type="checkbox"
                defaultChecked
                {...register("rememberMe")}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 cursor-pointer"
              />
              Recordar mi sesión
            </label>

            <Link
              to="/recuperar-password"
              className="font-bold text-sky-600 dark:text-sky-400 hover:underline underline-offset-4"
            >
              ¿Olvidaste tu clave?
            </Link>
          </div>

          <Button
            type="submit"
            size="lg"
            variant="secondary"
            fullWidth
            isLoading={isLoading}
            className="mt-3 h-12 text-sm font-bold tracking-wide rounded-2xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200"
          >
            INGRESAR A MI CUENTA <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </form>

        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          ¿No tienes una cuenta aún?{" "}
          <Link
            to="/registro"
            className="font-bold text-sky-600 dark:text-sky-400 underline underline-offset-4 hover:text-sky-500 inline-flex items-center gap-1 ml-1"
          >
            Regístrate aquí gratis <Sparkles className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
