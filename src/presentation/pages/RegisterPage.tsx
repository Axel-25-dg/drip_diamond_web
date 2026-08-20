import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuthStore } from "@/presentation/store/authStore";
import { Input } from "@/presentation/components/ui/Input";
import { Button } from "@/presentation/components/ui/Button";
import { AuthShell } from "@/presentation/components/auth/AuthShell";
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
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();
  const { openPanel } = useInfoPanels();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast.success("Cuenta creada exitosamente. Ahora inicia sesión.");
      navigate("/login");
    } catch (err: any) {
      bruteForceGuard.recordAttempt("register-attempt");
      toast.error(err?.message || "No se pudo crear la cuenta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell title="Crea tu cuenta" subtitle="Solo datos básicos para entregas en Quito, sin cédula ni RUC.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre" error={errors.nombre?.message} {...register("nombre", { required: "Requerido" })} />
          <Input label="Apellido" error={errors.apellido?.message} {...register("apellido", { required: "Requerido" })} />
        </div>
        <Input
          label="Correo electrónico"
          type="email"
          error={errors.correo?.message}
          {...register("correo", { required: "Requerido" })}
        />
        <Input
          label="Teléfono (WhatsApp)"
          placeholder="09XXXXXXXX"
          error={errors.telefono?.message}
          {...register("telefono", { required: "Requerido" })}
        />
        <Input
          label="Dirección exacta en Quito"
          placeholder="Av. Amazonas y Naciones Unidas"
          error={errors.direccion?.message}
          {...register("direccion")}
        />
        <Input
          label="Ciudad"
          placeholder="Quito"
          error={errors.ciudad?.message}
          {...register("ciudad")}
        />
        <Input
          label="Contraseña"
          type="password"
          error={errors.password?.message}
          {...register("password", { required: "Requerido", minLength: { value: 8, message: "Mínimo 8 caracteres" } })}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Requerido",
            validate: (value) => value === password || "Las contraseñas no coinciden",
          })}
        />

        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          Al hacer clic en Crear cuenta, aceptas nuestros{" "}
          <button
            type="button"
            onClick={() => openPanel("terminos")}
            className="text-sky-600 dark:text-sky-400 underline font-semibold"
          >
            Términos y condiciones
          </button>{" "}
          y{" "}
          <button
            type="button"
            onClick={() => openPanel("privacidad")}
            className="text-sky-600 dark:text-sky-400 underline font-semibold"
          >
            Políticas de privacidad
          </button>
          .
        </div>

        <Button type="submit" size="lg" variant="secondary" fullWidth isLoading={isSubmitting} className="mt-2">
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-semibold text-sky-600 dark:text-sky-400 underline underline-offset-4">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
