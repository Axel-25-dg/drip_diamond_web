import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Talla } from "@/domain/entities/Product";
import { Button } from "@/presentation/components/ui/Button";
import { Badge } from "@/presentation/components/ui/Badge";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { toast } from "sonner";
import { ArrowLeft, Plus, Ruler, Pencil, Trash2, Home, ChevronRight, Sparkles, X } from "lucide-react";

export default function AdminTallasPage() {
  const [tallas, setTallas] = useState<Talla[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTalla, setEditingTalla] = useState<Talla | null>(null);
  const [valor, setValor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTallas = async () => {
    setIsLoading(true);
    try {
      const res = await useCases.getTallas.execute();
      setTallas(res);
    } catch {
      setTallas([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTallas(); }, []);

  const openCreate = () => {
    setEditingTalla(null);
    setValor("");
    setShowModal(true);
  };

  const openEdit = (t: Talla) => {
    setEditingTalla(t);
    setValor(t.valor);
    setShowModal(true);
  };

  const handleDelete = async (t: Talla) => {
    if (!confirm(`¿Eliminar la talla "${t.valor}"? Esta acción no se puede deshacer y puede afectar productos asociados.`)) return;
    try {
      await useCases.deleteTalla.execute(t.id);
      toast.success("Talla eliminada");
      fetchTallas();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo eliminar la talla");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = valor.trim();
    if (!v) { toast.error("El valor de la talla es obligatorio"); return; }
    setIsSubmitting(true);
    try {
      if (editingTalla) {
        await useCases.updateTalla.execute(editingTalla.id, { valor: v });
        toast.success("Talla actualizada");
      } else {
        await useCases.createTalla.execute({ valor: v });
        toast.success("Talla creada con éxito");
      }
      setShowModal(false);
      fetchTallas();
    } catch (err: any) {
      const msg = err?.errors
        ? Object.values(err.errors).flat().join(", ")
        : err?.message || "No se pudo guardar la talla";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-app py-10">
      <nav className="animate-slide-up flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-t" aria-label="Breadcrumb">
        <Link to="/admin" className="group inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 transition-all duration-200 hover:bg-surf2 hover:text-primary">
          <Home className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 opacity-40" />
        <span className="rounded-[10px] px-2.5 py-1.5 text-primary">Tallas</span>
      </nav>

      <header className="animate-slide-up delay-100 mt-6 overflow-hidden rounded-[26px] border border-theme bg-surf shadow-premium relative">
        <div className="relative flex flex-col gap-6 px-7 py-8 sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <Badge tone="accent" pulse>
                <Sparkles className="h-3 w-3" />
                Panel Administrativo
              </Badge>
              <span className="chip chip-gold">
                <Ruler className="h-3 w-3" />
                Módulo Tallas
              </span>
            </div>
            <h1 className="font-display text-4xl text-gradient-ink sm:text-5xl lg:text-[3.35rem]">
              Gestión de <span className="text-gradient-brand">Tallas</span>
            </h1>
            <p className="max-w-xl text-[14.5px] leading-relaxed text-secondary">
              Administra las tallas disponibles para las zapatillas. Son obligatorias para crear productos.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="chip chip-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              Total: <span className="font-extrabold text-sky-900">{tallas.length}</span> tallas
            </span>
            <span className="chip">
              <Ruler className="h-3 w-3" />
              Obligatorio en productos
            </span>
          </div>
          </div>
          <div className="animate-slide-up delay-200">
            <Button variant="secondary" size="xl" onClick={openCreate} className="glow-brand">
              <Plus className="h-4.5 w-4.5" />
              Nueva Talla
            </Button>
          </div>
        </div>
      </header>

      <div className="animate-slide-up delay-200 mt-8 overflow-hidden rounded-[22px] border border-theme bg-surf shadow-card">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-16">
            <Spinner className="h-10 w-10 text-sky-500" />
            <p className="text-sm font-semibold text-secondary">Cargando tallas desde la API...</p>
          </div>
        ) : tallas.length === 0 ? (
          <div className="relative p-16 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-50 to-indigo-50 ring-1 ring-sky-200/60">
            <Ruler className="h-9 w-9 text-sky-500" />
          </div>
          <p className="font-display text-2xl text-gradient-ink">No hay tallas registradas</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-secondary">
            Crea las tallas (ej. 39, 40, 41, 42, etc.) para poder asignarlas a las zapatillas.
          </p>
          <div className="mt-6 inline-flex">
            <Button variant="secondary" size="lg" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Crear primera talla
            </Button>
          </div>
        </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="border-b border-theme bg-surf2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-secondary">
                <tr>
                  <th className="px-7 py-5">ID</th>
                  <th className="px-7 py-5">Valor de la Talla</th>
                  <th className="px-7 py-5">Estado</th>
                  <th className="px-7 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme2">
                {tallas.map((t, idx) => (
                  <tr key={t.id} className="row-hover group">
                    <td className="px-7 py-5">
                      <span className="font-mono text-[11px] font-bold tracking-wider text-muted-t">#{String(t.id).padStart(3, '0')}</span>
                    </td>
                    <td className="px-7 py-5">
                      <span className="chip chip-accent">
                        <Ruler className="h-3.5 w-3.5" />
                        Talla <span className="font-extrabold tracking-tight">{t.valor}</span>
                      </span>
                    </td>
                    <td className="px-7 py-5">
                      <Badge tone="success" pulse>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Activa
                      </Badge>
                    </td>
                    <td className="px-7 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => handleDelete(t)}
                          className="text-rose-500 hover:!bg-rose-50 hover:text-rose-700"
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm animate-scale-in">
            <div className="absolute inset-0 rounded-[22px] bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-500 opacity-[0.9]" />
            <div className="relative m-[1px] rounded-[21px] bg-surf p-6 shadow-premium">
              <div className="flex items-start justify-between border-b border-theme pb-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Badge tone={editingTalla ? "info" : "accent"}>
                    <Sparkles className="h-3 w-3" />
                    {editingTalla ? "Modo edición" : "Nuevo registro"}
                  </Badge>
                  </div>
                  <h3 className="font-display text-2xl text-gradient-ink">
                    {editingTalla ? "Editar Talla" : "Nueva Talla"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="group flex h-9 w-9 items-center justify-center rounded-[12px] border border-theme bg-surf2 text-muted-t transition-all duration-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-secondary">
                    Valor *</label>
                  <p className="mb-1.5 mt-1 text-[11px] leading-relaxed text-muted-t">
                    Ejemplos: 38, 39, 40, 40.5, 41, M, L, EU 42
                  </p>
                  <div className="group relative flex items-center rounded-[14px] border-[1.5px] border-theme-s bg-surf2 transition-all duration-200 focus-within:border-sky-400 focus-within:bg-surf focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.12)]">
                    <span className="pointer-events-none pl-3.5 text-muted-t transition-colors group-focus-within:text-sky-500">
                      <Ruler className="h-[18px] w-[18px]" />
                    </span>
                    <input
                      required autoFocus value={valor} onChange={(e) => setValor(e.target.value)}
                      placeholder="Ej. 41"
                      className="h-[50px] w-full flex-1 bg-transparent px-3 text-[14px] font-semibold text-primary outline-none placeholder:text-muted-t placeholder:opacity-80"
                    />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-end gap-2.5 pt-1">
                  <Button type="button" variant="ghost" size="lg" onClick={() => setShowModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="secondary" size="lg" isLoading={isSubmitting}>
                    {editingTalla ? "Guardar Cambios" : "Crear Talla"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
