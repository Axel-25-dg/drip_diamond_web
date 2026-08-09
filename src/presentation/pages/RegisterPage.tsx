import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuthStore } from "@/presentation/store/authStore";
import { Input } from "@/presentation/components/ui/Input";
import { Button } from "@/presentation/components/ui/Button";
import { AuthShell } from "@/presentation/components/auth/AuthShell";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch("password");

  const onSubmit = async (form: RegisterForm) => {
    setIsSubmitting(true);
    try {
      await registerUser({
        nombre: form.nombre,
        apellido: form.apellido,
        correo: form.correo,
        telefono: form.telefono,
        direccion: form.direccion,
        ciudad: form.ciudad,
        password: form.password,
      });
      toast.success("Cuenta creada. Ahora inicia sesión.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo crear la cuenta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell title="Crea tu cuenta" subtitle="Solo necesitamos algunos datos básicos, sin cédula ni RUC.">
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
          label="Teléfono"
          placeholder="09XXXXXXXX"
          error={errors.telefono?.message}
          {...register("telefono", { required: "Requerido" })}
        />
        <Input
          label="Dirección exacta"
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

        <Button type="submit" size="lg" variant="secondary" fullWidth isLoading={isSubmitting} className="mt-2">
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-semibold text-ink underline underline-offset-4">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
