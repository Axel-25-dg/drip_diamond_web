import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { User, UserRole } from "@/domain/entities/User";
import { Button } from "@/presentation/components/ui/Button";
import { toast } from "sonner";
import { ArrowLeft, UserPlus, Users, Search, Pencil, Trash2, X } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

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
      let allUsers: User[] = [];
      try { allUsers = await useCases.getAdminUsers.execute(); } catch { allUsers = []; }
      if (allUsers.length === 0) {
        const roles = ["CLIENTE", "VENDEDOR", "CONTADOR", "ADMINISTRADOR"] as const;
        const reqs = await Promise.all(roles.map(async (r) => { try { return await useCases.getAdminUsers.execute(r); } catch { return [] as User[]; } }));
        allUsers = reqs.flat();
      }
      setUsers(Array.from(new Map(allUsers.map((u) => [u.id, u])).values()));
    } catch { setUsers([]); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { fetchUsers(); }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setNombre(""); setApellido(""); setCorreo(""); setTelefono(""); setPassword(""); setRol("VENDEDOR");
    setShowModal(true);
  };
  const openEditModal = (u: User) => {
    setEditingUser(u);
    setNombre(u.nombre); setApellido(u.apellido); setCorreo(u.correo); setTelefono(u.telefono || "");
    setPassword(""); setRol((u.rol?.toUpperCase() as UserRole) || "CLIENTE");
    setShowModal(true);
  };
  const handleDeleteUser = async (u: User) => {
    if (!confirm(`¿Eliminar a ${u.nombre} ${u.apellido}? Esta acción no se puede deshacer.`)) return;
    try { await useCases.deleteUserAdmin.execute(u.id); toast.success("Usuario eliminado"); fetchUsers(); }
    catch (err: any) { toast.error(err?.message || "No se pudo eliminar"); }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setIsSubmitting(true);
      try { await useCases.updateUserAdmin.execute(editingUser.id, { nombre, apellido, telefono, rol: rol as any }); toast.success("Usuario actualizado"); setShowModal(false); fetchUsers(); }
      catch (err: any) { toast.error(err?.message || "No se pudo actualizar"); }
      finally { setIsSubmitting(false); }
      return;
    }
    if (!nombre || !apellido || !correo || !password) { toast.error("Completa los campos obligatorios"); return; }
    setIsSubmitting(true);
    try { await useCases.createUserAdmin.execute({ nombre, apellido, correo, telefono, password, rol: rol as any }); toast.success("Usuario creado"); setShowModal(false); fetchUsers(); }
    catch (err: any) { toast.error(err?.errors ? Object.values(err.errors).flat().join(", ") : err?.message || "Error al crear"); }
    finally { setIsSubmitting(false); }
  };

  const filtered = users.filter((u) =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.correo.toLowerCase().includes(search.toLowerCase()) ||
    u.rol.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (r: string) => {
    const v = r?.toLowerCase();
    const map: Record<string, { bg: string; text: string; label: string }> = {
      administrador: { bg: "bg-blue-100", text: "text-blue-700",   label: "Administrador" },
      contador:      { bg: "bg-sky-100",  text: "text-sky-700",    label: "Contador" },
      vendedor:      { bg: "bg-indigo-100", text: "text-indigo-700", label: "Vendedor" },
      cliente:       { bg: "bg-gray-100", text: "text-gray-600",   label: "Cliente" },
    };
    const t = map[v] || map.cliente;
    return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${t.bg} ${t.text}`}>{t.label}</span>;
  };

  const inputCls = "mt-1 h-11 w-full rounded-xl border border-blue-100 bg-blue-50/40 px-4 text-sm text-gray-900 outline-none transition-all focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]";
  const labelCls = "text-[11px] font-bold uppercase tracking-wider text-blue-700";

  return (
    <div className="min-h-screen bg-[#f0f6ff]">
      <div className="container-app py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link to="/admin" className="flex items-center gap-1 font-medium text-gray-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-blue-600">Usuarios & Roles</span>
        </div>

        {/* Header */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Gestión de <span className="text-blue-600">Usuarios</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">Administra vendedores, contadores, admins y clientes.</p>
          </div>
          <Button variant="secondary" size="md" onClick={openCreateModal}>
            <UserPlus className="h-4 w-4" /> Crear usuario
          </Button>
        </div>

        {/* Search */}
        <div className="mt-8">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, correo o rol..."
              className="h-11 w-full rounded-xl border border-blue-100 bg-white pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_2px_12px_rgba(37,99,235,0.07)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-500" />
              <p className="text-sm font-medium text-gray-400">Cargando usuarios...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 p-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-300">
                <Users className="h-7 w-7" />
              </div>
              <div>
                <p className="font-display text-xl text-gray-700">No hay usuarios</p>
                <p className="mt-1 text-sm text-gray-400">Crea el primer usuario desde el botón de arriba.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-blue-50 bg-blue-50/60 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-3.5">Usuario</th>
                    <th className="px-6 py-3.5">Correo</th>
                    <th className="px-6 py-3.5">Teléfono</th>
                    <th className="px-6 py-3.5">Rol</th>
                    <th className="px-6 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {filtered.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-blue-50/40">
                      <td className="px-6 py-4 font-semibold text-gray-900">{u.nombre} {u.apellido}</td>
                      <td className="px-6 py-4 text-gray-600">{u.correo}</td>
                      <td className="px-6 py-4 text-gray-500">{u.telefono || "—"}</td>
                      <td className="px-6 py-4">{roleBadge(u.rol)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(u)}>
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </Button>
                          <button onClick={() => handleDeleteUser(u)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-6 shadow-[0_20px_60px_rgba(37,99,235,0.18)]">
            <div className="flex items-center justify-between border-b border-blue-50 pb-4">
              <h3 className="font-display text-xl font-bold text-gray-900">
                {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
              </h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Nombre *</label><input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan" className={inputCls} /></div>
                <div><label className={labelCls}>Apellido *</label><input required value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Pérez" className={inputCls} /></div>
              </div>
              {!editingUser ? (
                <div><label className={labelCls}>Correo *</label><input required type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="email@ejemplo.com" className={inputCls} /></div>
              ) : (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Correo (no editable)</label>
                  <div className="mt-1 flex h-11 w-full items-center rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm text-gray-400">{editingUser.correo}</div>
                </div>
              )}
              <div><label className={labelCls}>Teléfono</label><input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="09XXXXXXXX" className={inputCls} /></div>
              {!editingUser && (
                <div><label className={labelCls}>Contraseña *</label><input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} /></div>
              )}
              <div>
                <label className={labelCls}>Rol *</label>
                <select value={rol} onChange={(e) => setRol(e.target.value as any)}
                  className="mt-1 h-11 w-full rounded-xl border border-blue-100 bg-blue-50/40 px-4 text-sm font-semibold text-gray-800 outline-none focus:border-blue-400 focus:bg-white">
                  <option value="VENDEDOR">Vendedor ($4.00 por par)</option>
                  <option value="CONTADOR">Contador (Verificación y entregas)</option>
                  <option value="ADMINISTRADOR">Administrador (Acceso total)</option>
                  <option value="CLIENTE">Cliente (Comprador)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button type="submit" variant="secondary" isLoading={isSubmitting}>
                  {editingUser ? "Guardar cambios" : "Crear usuario"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
