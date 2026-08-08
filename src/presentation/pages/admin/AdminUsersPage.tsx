import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { User, UserRole } from "@/domain/entities/User";
import { Button } from "@/presentation/components/ui/Button";
import { Badge } from "@/presentation/components/ui/Badge";
import { toast } from "sonner";
import { ArrowLeft, UserPlus, Users, Search, ShieldCheck, Pencil, Trash2 } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<UserRole>("VENDEDOR");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Try fetching all at once first, then per-role as fallback
      let allUsers: User[] = [];
      try {
        allUsers = await useCases.getAdminUsers.execute();
      } catch {
        allUsers = [];
      }

      if (allUsers.length === 0) {
        const roles = ["CLIENTE", "VENDEDOR", "CONTADOR", "ADMINISTRADOR"] as const;
        const requests = await Promise.all(
          roles.map(async (role) => {
            try { return await useCases.getAdminUsers.execute(role); }
            catch { return [] as User[]; }
          })
        );
        allUsers = requests.flat();
      }

      const merged = Array.from(new Map(allUsers.map((u) => [u.id, u])).values());
      setUsers(merged);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setNombre(""); setApellido(""); setCorreo("");
    setTelefono(""); setPassword(""); setRol("VENDEDOR");
    setShowModal(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setNombre(u.nombre); setApellido(u.apellido);
    setCorreo(u.correo); setTelefono(u.telefono || "");
    setPassword(""); setRol((u.rol?.toUpperCase() as UserRole) || "CLIENTE");
    setShowModal(true);
  };

  const handleDeleteUser = async (u: User) => {
    if (!confirm(`¿Eliminar al usuario ${u.nombre} ${u.apellido}? Esta acción no se puede deshacer.`)) return;
    try {
      await useCases.deleteUserAdmin.execute(u.id);
      toast.success("Usuario eliminado");
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo eliminar el usuario");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      setIsSubmitting(true);
      try {
        await useCases.updateUserAdmin.execute(editingUser.id, { nombre, apellido, telefono, rol: rol as any });
        toast.success("Usuario actualizado con éxito");
        setShowModal(false);
        fetchUsers();
      } catch (err: any) {
        toast.error(err?.message || "No se pudo actualizar el usuario");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!nombre || !apellido || !correo || !password) {
      toast.error("Por favor completa los datos obligatorios");
      return;
    }
    setIsSubmitting(true);
    try {
      await useCases.createUserAdmin.execute({ nombre, apellido, correo, telefono, password, rol: rol as any });
      toast.success(`Usuario con rol ${rol} creado con éxito`);
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      const msg = err?.errors
        ? Object.values(err.errors).flat().join(", ")
        : err?.message || "No se pudo crear el usuario";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.correo.toLowerCase().includes(search.toLowerCase()) ||
      u.rol.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (rolValue: string) => {
    const r = rolValue?.toLowerCase();
    if (r === "administrador") return <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-600 border border-sky-400/20">Administrador</span>;
    if (r === "contador") return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-400/20">Contador</span>;
    if (r === "vendedor") return <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-600 border border-purple-400/20">Vendedor</span>;
    return <Badge tone="neutral">Cliente</Badge>;
  };

  return (
    <div className="container-app py-10">
      <Link to="/admin" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900">
        <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Administración
          </div>
          <h1 className="mt-3 font-display text-4xl text-slate-900 sm:text-5xl">
            Gestión de <span className="text-accent">usuarios y roles</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Administra vendedores, contadores, administradores y clientes registrados.
          </p>
        </div>
        <Button variant="secondary" size="lg" onClick={openCreateModal} className="shadow-md shadow-sky-500/20">
          <UserPlus className="h-4 w-4" /> Crear usuario
        </Button>
      </div>

      {/* SEARCH */}
      <div className="mt-8 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, correo o rol..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Cargando usuarios...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Users className="h-8 w-8" />
            </div>
            <p className="mt-4 font-display text-xl text-slate-700">No hay usuarios registrados</p>
            <p className="mt-1 text-sm text-slate-500">Crea un perfil nuevo desde aquí para empezar a administrar roles.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Correo Electrónico</th>
                  <th className="px-6 py-4">Teléfono</th>
                  <th className="px-6 py-4">Rol Asignado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-900">{u.nombre} {u.apellido}</td>
                    <td className="px-6 py-4 text-slate-600">{u.correo}</td>
                    <td className="px-6 py-4 text-slate-500">{u.telefono || "—"}</td>
                    <td className="px-6 py-4">{roleBadge(u.rol)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(u)}>
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(u)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-display text-2xl text-slate-900">
                {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Nombre *</label>
                  <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan"
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Apellido *</label>
                  <input required value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Pérez"
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500" />
                </div>
              </div>

              {!editingUser ? (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Correo Electrónico *</label>
                  <input required type="email" value={correo} onChange={(e) => setCorreo(e.target.value)}
                    placeholder="vendedor@dripdiamond.com"
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500" />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Correo (no editable)</label>
                  <div className="mt-1 flex h-11 w-full items-center rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm text-slate-500">
                    {editingUser.correo}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Teléfono</label>
                <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="0991234567"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500" />
              </div>

              {!editingUser && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Contraseña Inicial *</label>
                  <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500" />
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Rol a Asignar *</label>
                <select value={rol} onChange={(e) => setRol(e.target.value as any)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 outline-none focus:border-sky-500">
                  <option value="VENDEDOR">Vendedor ($4.00 por par)</option>
                  <option value="CONTADOR">Contador (Verificación y entregas)</option>
                  <option value="ADMINISTRADOR">Administrador (Acceso total)</option>
                  <option value="CLIENTE">Cliente (Comprador)</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button type="submit" variant="secondary" isLoading={isSubmitting}>
                  {editingUser ? "Guardar Cambios" : "Guardar Usuario"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
