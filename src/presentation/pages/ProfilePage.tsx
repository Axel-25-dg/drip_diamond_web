import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Camera, LogOut, Package, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/presentation/store/authStore";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import { Input } from "@/presentation/components/ui/Input";
import { Button } from "@/presentation/components/ui/Button";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "@/presentation/utils/format";

interface ProfileForm {
  nombre: string;
  apellido: string;
  telefono: string;
  direccion?: string | null;
  ciudad?: string | null;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, setUser, hydrateProfile } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  // Preview blob URL while uploading
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    defaultValues: {
      nombre: user?.nombre ?? "",
      apellido: user?.apellido ?? "",
      telefono: user?.telefono ?? "",
      direccion: user?.direccion ?? "",
      ciudad: user?.ciudad ?? "",
    },
  });

  const avatarUrl = avatarPreview ?? resolveMediaUrl(user?.fotoPerfilUrl) ?? null;

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("La foto debe ser JPG, PNG o WEBP.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 5 MB.");
      event.target.value = "";
      return;
    }

    // Show local preview immediately
    const blobUrl = URL.createObjectURL(file);
    setAvatarPreview(blobUrl);

    try {
      setIsUploadingAvatar(true);
      const updatedUser = await useCases.uploadAvatar.execute(file);
      setUser(updatedUser);
      // Replace blob with real URL from server
      const serverUrl = resolveMediaUrl(updatedUser.fotoPerfilUrl);
      if (serverUrl) {
        setAvatarPreview(serverUrl);
      }
      toast.success("Foto de perfil actualizada.");
    } catch (error: any) {
      // Revert preview on error
      setAvatarPreview(null);
      toast.error(error?.message || "No se pudo actualizar la foto de perfil.");
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const onSubmit = async (form: ProfileForm) => {
    setIsSubmitting(true);
    try {
      const updated = await useCases.updateProfile.execute(form);
      // Update local store immediately with returned user to avoid stale state
      if (updated) {
        setUser(updated);
      } else {
        await hydrateProfile();
      }
      // Reset form dirty state with new values
      reset(form);
      toast.success("Perfil actualizado.");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo actualizar el perfil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Sesión cerrada.");
    navigate("/");
  };

  if (!user) return null;

  const rolLabel: Record<string, string> = {
    administrador: "Administrador",
    vendedor: "Vendedor",
    contador: "Contador",
    cliente: "Cliente",
  };

  return (
    <div className="container-app py-6 sm:py-8 lg:py-12 text-slate-900 dark:text-white">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
        <div className="relative">
          <div className="h-20 w-20 overflow-hidden rounded-full ring-2 ring-slate-200 dark:ring-slate-700">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Foto de perfil"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                <UserIcon className="h-9 w-9 text-slate-400" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow transition hover:opacity-80 disabled:opacity-50 dark:border-slate-900"
            aria-label="Cambiar foto de perfil"
          >
            {isUploadingAvatar ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
            {user.nombre} {user.apellido}
          </h1>
          <span className="mt-1 inline-block rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {rolLabel[user.rol?.toLowerCase()] ?? user.rol}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Datos personales */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] p-4 sm:p-6 shadow-sm"
        >
          <h2 className="mb-5 font-display text-xl font-bold text-slate-900 dark:text-white">Datos personales</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombre"
              error={errors.nombre?.message}
              {...register("nombre", { required: "Requerido" })}
            />
            <Input
              label="Apellido"
              error={errors.apellido?.message}
              {...register("apellido", { required: "Requerido" })}
            />
          </div>

          <div className="mt-4">
            <Input
              label="Correo electrónico"
              value={user.correo}
              disabled
              readOnly
              className="cursor-not-allowed opacity-60"
            />
          </div>

          <div className="mt-4">
            <Input
              label="Teléfono"
              error={errors.telefono?.message}
              {...register("telefono", { required: "Requerido" })}
            />
          </div>

          <div className="mt-4">
            <Input
              label="Dirección exacta"
              error={errors.direccion?.message}
              {...register("direccion")}
            />
          </div>

          <div className="mt-4">
            <Input
              label="Ciudad"
              error={errors.ciudad?.message}
              {...register("ciudad")}
            />
          </div>

          {user.username && (
            <div className="mt-4">
              <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Nombre de usuario</p>
              <p className="rounded-lg border border-slate-200 dark:border-[#222732] bg-slate-50 dark:bg-[#171a22] px-3 py-2 text-sm text-slate-900 dark:text-white">
                {user.username}
              </p>
            </div>
          )}

          {/* Vendedor info */}
          {user.perfilVendedor && (
            <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800/60 dark:bg-sky-950/30">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Perfil de vendedor
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                {user.perfilVendedor.codigoReferido && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Código referido</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{user.perfilVendedor.codigoReferido}</p>
                  </div>
                )}
                {user.perfilVendedor.totalVentas != null && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total ventas</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{user.perfilVendedor.totalVentas}</p>
                  </div>
                )}
                {user.perfilVendedor.comisionesAcumuladas != null && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Comisiones</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      ${user.perfilVendedor.comisionesAcumuladas.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="secondary"
            size="lg"
            className="mt-5 self-start"
            isLoading={isSubmitting}
            disabled={!isDirty}
          >
            Guardar cambios
          </Button>
        </form>

        {/* Panel lateral */}
        <div className="flex flex-col gap-3">
          <Link
            to="/pedidos"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] p-5 text-slate-900 dark:text-white transition-colors hover:bg-slate-50 dark:hover:bg-[#171a22] shadow-sm"
          >
            <Package className="h-5 w-5 shrink-0 text-slate-400" />
            <div>
              <p className="font-semibold">Mis pedidos</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Revisa el estado de tus compras</p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 text-left text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <p className="font-semibold">Cerrar sesión</p>
          </button>
        </div>
      </div>
    </div>
  );
}
