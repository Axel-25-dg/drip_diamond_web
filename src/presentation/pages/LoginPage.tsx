import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuthStore } from "@/presentation/store/authStore";
import { Input } from "@/presentation/components/ui/Input";
import { Button } from "@/presentation/components/ui/Button";
import { AuthShell } from "@/presentation/components/auth/AuthShell";

interface LoginForm {
  correo: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (form: LoginForm) => {
    try {
      await login(form.correo, form.password);
      toast.success("Bienvenido de vuelta.");
      const user = useAuthStore.getState().user;
      const role = user?.rol?.toLowerCase();
      
      let defaultPath = "/";
      if (role === "vendedor") defaultPath = "/vendedor";
      else if (role === "administrador") defaultPath = "/admin";
      else if (role === "contador") defaultPath = "/contador";

      const fromPath = (location.state as { from?: string } | null)?.from;
      const redirectTo = fromPath && fromPath !== "/login" ? fromPath : defaultPath;
      navigate(redirectTo);
    } catch (err: any) {
      toast.error(err?.message || "Correo o contraseña incorrectos.");
    }
  };

  return (
    <AuthShell title="Inicia sesión" subtitle="Accede para ver tu carrito, pedidos y perfil.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="tucorreo@ejemplo.com"
          error={errors.correo?.message}
          {...register("correo", { required: "Ingresa tu correo" })}
        />
        <Input
          label="Contraseña"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password", { required: "Ingresa tu contraseña" })}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="-mt-2 self-start text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        >
          {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        </button>

        <div className="flex justify-end">
          <Link to="/recuperar-password" className="text-xs font-semibold text-sky-600 dark:text-sky-400 underline underline-offset-4">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" size="lg" variant="secondary" fullWidth isLoading={isLoading}>
          Iniciar sesión
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        ¿No tienes cuenta?{" "}
        <Link to="/registro" className="font-semibold text-sky-600 dark:text-sky-400 underline underline-offset-4">
          Regístrate
        </Link>
      </p>
    </AuthShell>
  );
}
