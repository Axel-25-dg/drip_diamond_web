import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, Phone, User, MapPin, Building, ArrowRight, Sparkles } from "lucide-react";
import { useAuthStore } from "@/presentation/store/authStore";
import { Input } from "@/presentation/components/ui/Input";
import { Button } from "@/presentation/components/ui/Button";
import { AuthShell } from "@/presentation/components/auth/AuthShell";
import { PasswordStrengthMeter } from "@/presentation/components/auth/PasswordStrengthMeter";
import { sanitizeInput, bruteForceGuard } from "@/presentation/utils/securityUtils";
import { useInfoPanels } from "@/presentation/store/useInfoPanels";

interface RegisterForm {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  direccion?: string;
  ciudad?: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();
  const { openPanel } = useInfoPanels();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch("password");

  const onSubmit = async (form: RegisterForm) => {
    // Client-Side Anti-Brute-Force Rate Limiting
    const guard = bruteForceGuard.checkAllowed("register-attempt", 4, 60000);
    if (!guard.allowed) {
      toast.error(`Demasiadas solicitudes de registro. Espera ${guard.waitSeconds}s.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser({
        nombre: sanitizeInput(form.nombre),
        apellido: sanitizeInput(form.apellido),
        correo: sanitizeInput(form.correo),
        telefono: sanitizeInput(form.telefono),
        direccion: form.direccion ? sanitizeInput(form.direccion) : undefined,
        ciudad: form.ciudad ? sanitizeInput(form.ciudad) : undefined,
        password: form.password,
      });

      bruteForceGuard.reset("register-attempt");
      toast.success("¡Cuenta creada exitosamente! Inicia sesión para continuar.");
      navigate("/login");
    } catch (err: any) {
      bruteForceGuard.recordAttempt("register-attempt");
      toast.error(err?.message || "No se pudo completar el registro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Crear una Cuenta"
      subtitle="Únete a Drip Diamond y disfruta de envíos rápidos a todo Ecuador y compras en 1 clic."
    >
      <div className="space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombre *"
              placeholder="Juan"
              iconLeft={<User className="h-4 w-4 text-slate-400" />}
              error={errors.nombre?.message}
              {...register("nombre", { required: "Ingresa tu nombre" })}
            />
            <Input
              label="Apellido *"
              placeholder="Pérez"
              iconLeft={<User className="h-4 w-4 text-slate-400" />}
              error={errors.apellido?.message}
              {...register("apellido", { required: "Ingresa tu apellido" })}
            />
          </div>

          <Input
            label="Correo electrónico *"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            iconLeft={<Mail className="h-4 w-4 text-slate-400" />}
            error={errors.correo?.message}
            {...register("correo", {
              required: "Ingresa tu correo",
              pattern: { value: /^\S+@\S+$/i, message: "Correo inválido" },
            })}
          />

          <Input
            label="Teléfono / WhatsApp *"
            placeholder="09XXXXXXXX"
            iconLeft={<Phone className="h-4 w-4 text-slate-400" />}
            error={errors.telefono?.message}
            {...register("telefono", {
              required: "Ingresa tu número celular",
              minLength: { value: 9, message: "Número celular inválido" },
            })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Dirección (Opcional)"
              placeholder="Av. Amazonas N24"
              iconLeft={<MapPin className="h-4 w-4 text-slate-400" />}
              error={errors.direccion?.message}
              {...register("direccion")}
            />
            <Input
              label="Ciudad (Opcional)"
              placeholder="Quito"
              iconLeft={<Building className="h-4 w-4 text-slate-400" />}
              error={errors.ciudad?.message}
              {...register("ciudad")}
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
              {...register("password", {
                required: "Crea una contraseña",
                minLength: { value: 8, message: "Mínimo 8 caracteres" },
              })}
            />

            {/* Live Password Strength Meter */}
            <PasswordStrengthMeter password={password} />
          </div>

          <Input
            label="Confirmar Contraseña *"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            iconLeft={<Lock className="h-4 w-4 text-slate-400" />}
            iconRight={
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirmPassword((v) => !v);
                }}
                className="p-1 text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors cursor-pointer select-none"
                aria-label={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
                title={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={errors.confirmPassword?.message}
            {...register("confirmPassword", {
              required: "Confirma tu contraseña",
              validate: (val) => val === password || "Las contraseñas no coinciden",
            })}
          />

          <div className="flex items-start gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
            <input
              type="checkbox"
              id="acceptTerms"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
              {...register("acceptTerms", { required: "Debes aceptar los términos para continuar" })}
            />
            <label htmlFor="acceptTerms" className="cursor-pointer select-none leading-relaxed">
              Acepto los{" "}
              <button
                type="button"
                onClick={() => openPanel("terminos")}
                className="font-bold text-sky-600 dark:text-sky-400 underline hover:text-sky-500"
              >
                Términos y Condiciones
              </button>{" "}
              y la{" "}
              <button
                type="button"
                onClick={() => openPanel("privacidad")}
                className="font-bold text-sky-600 dark:text-sky-400 underline hover:text-sky-500"
              >
                Política de Privacidad
              </button>
              .
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-[11px] font-semibold text-red-500">{errors.acceptTerms.message}</p>
          )}

          <Button
            type="submit"
            size="lg"
            variant="secondary"
            fullWidth
            isLoading={isSubmitting}
            className="mt-3 h-12 text-sm font-bold tracking-wide rounded-2xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200"
          >
            CREAR MI CUENTA <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </form>

        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          ¿Ya posees una cuenta registrada?{" "}
          <Link
            to="/login"
            className="font-bold text-sky-600 dark:text-sky-400 underline underline-offset-4 hover:text-sky-500 inline-flex items-center gap-1 ml-1"
          >
            Inicia sesión aquí <Sparkles className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
