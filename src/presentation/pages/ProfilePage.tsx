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
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    defaultValues: { nombre: user?.nombre, apellido: user?.apellido, telefono: user?.telefono },
  });

  const avatarUrl = resolveMediaUrl(user?.fotoPerfilUrl) ?? null;

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("La foto debe ser una imagen JPG, PNG o WEBP.");
      event.target.value = "";
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const uploaded = await useCases.uploadImage.execute(file, "tienda", "usuario", user.id);
      const finalUrl = uploaded.url || "";
      if (!finalUrl) throw new Error("No se obtuvo la URL de la foto");

      const updatedUser = await useCases.updateProfile.execute({ fotoPerfilUrl: finalUrl });
      setUser(updatedUser);
      toast.success("Foto de perfil actualizada.");
    } catch (error: any) {
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
      setUser(updated);
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

  return (
    <div className="container-app py-8 lg:py-12">
      <div className="mb-8 flex items-center gap-4">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-ink text-paper">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-7 w-7" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-slate-900 text-white shadow-sm transition hover:bg-slate-700"
            aria-label="Cambiar foto de perfil"
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <h1 className="font-display text-3xl">
            {user.nombre} {user.apellido}
          </h1>
          <p className="text-sm capitalize text-ink/50">{user.rol}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-2xl bg-white p-6">
          <h2 className="font-display text-xl">Datos personales</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nombre" error={errors.nombre?.message} {...register("nombre", { required: "Requerido" })} />
            <Input label="Apellido" error={errors.apellido?.message} {...register("apellido", { required: "Requerido" })} />
          </div>
          <Input label="Correo" value={user.correo} disabled readOnly className="opacity-60" />
          <Input label="Teléfono" error={errors.telefono?.message} {...register("telefono", { required: "Requerido" })} />
          <Button type="submit" variant="secondary" size="lg" className="mt-2 self-start" isLoading={isSubmitting} disabled={!isDirty}>
            Guardar cambios
          </Button>
        </form>

        <div className="flex flex-col gap-4">
          <Link
            to="/pedidos"
            className="flex items-center gap-3 rounded-2xl bg-white p-5 transition-colors hover:bg-black/[0.03]"
          >
            <Package className="h-5 w-5" />
            <div>
              <p className="font-semibold">Mis pedidos</p>
              <p className="text-xs text-ink/50">Revisa el estado de tus compras</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-2xl bg-white p-5 text-left text-danger transition-colors hover:bg-danger/5"
          >
            <LogOut className="h-5 w-5" />
            <p className="font-semibold">Cerrar sesión</p>
          </button>
        </div>
      </div>
    </div>
  );
}
