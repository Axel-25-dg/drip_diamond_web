import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Category } from "@/domain/entities/Product";
import { Button } from "@/presentation/components/ui/Button";
import { toast } from "sonner";
import { ArrowLeft, Plus, Layers, Pencil, Trash2, ImagePlus, Tag, CalendarDays, Hash, Sparkles, CheckCircle2 } from "lucide-react";
import { resolveMediaUrl } from "@/presentation/utils/format";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await useCases.getCategories.execute();
      setCategories(res);
    } catch {
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const resetForm = () => {
    setNombre(""); setDescripcion("");
    setImagenFile(null); setImagenPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const openCreate = () => {
    setEditingCategory(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (c: Category) => {
    setEditingCategory(c);
    setNombre(c.nombre);
    setDescripcion(c.descripcion ?? "");
    setImagenFile(null);
    setImagenPreview(c.imagenUrl ?? null);
    setShowModal(true);
  };

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImagenFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagenPreview(url);
    }
  };

  const handleDelete = async (c: Category) => {
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await useCases.deleteCategory.execute(c.id);
      toast.success("Categoría eliminada");
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo eliminar la categoría");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await useCases.updateCategory.execute(editingCategory.id, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          ...(imagenFile ? { imagen: imagenFile } : {}),
        });
        toast.success("Categoría actualizada");
      } else {
        await useCases.createCategory.execute({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          ...(imagenFile ? { imagen: imagenFile } : {}),
        });
        toast.success("Categoría creada con éxito");
      }
      setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (err: any) {
      const msg = err?.errors
        ? Object.values(err.errors).flat().join(", ")
        : err?.message || "No se pudo guardar la categoría";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-app py-8 sm:py-10">
      <div className="animate-slide-up delay-100 flex flex-wrap items-center gap-3">
        <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-t">
          <Link to="/admin" className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all hover:bg-surf2 hover:text-secondary">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <span className="text-muted-t/50">/</span>
          <span className="text-primary">Categorías</span>
        </nav>
        <span className="chip chip-accent">
          <Sparkles className="h-3 w-3" />
          Admin Panel
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-6 sm:mt-8 sm:flex-row sm:items-end sm:justify-between animate-slide-up delay-150">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-gold">
              <Tag className="h-3 w-3" />
              {categories.length} registrada{categories.length !== 1 ? "s" : ""}
            </span>
            <span className="chip">
              <CalendarDays className="h-3 w-3" />
              Gestión Activa
            </span>
          </div>
          <h1 className="font-display text-4xl leading-[1.05] text-gradient-ink sm:text-5xl lg:text-[3.5rem]">
            Gestión de <span className="text-gradient-brand">Categorías</span>
          </h1>
          <p className="max-w-xl text-sm text-secondary sm:text-[0.95rem]">
            Administra las categorías disponibles del catálogo. Las imágenes se envían como
            <span className="font-semibold text-primary"> multipart/form-data</span>.
          </p>
        </div>
        <Button variant="secondary" size="lg" onClick={openCreate} className="group glow-brand-sm animate-slide-up delay-200">
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          Nueva Categoría
        </Button>
      </div>

      <div className="mt-8 overflow-hidden rounded-[22px] border border-theme bg-surf shadow-card animate-slide-up delay-250">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-16 text-muted-t">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-theme2 border-t-accent" />
            <p className="text-sm font-semibold">Cargando categorías desde la API...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="relative overflow-hidden p-16 text-center">
            <div className="pointer-events-none absolute inset-0 dot-pattern opacity-50" />
            <div className="relative flex flex-col items-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-surf2 shadow-card">
                <Layers className="h-9 w-9 text-muted-t" />
              </div>
              <h3 className="font-display text-2xl text-primary">No hay categorías registradas</h3>
              <p className="mt-2 text-sm text-secondary">Crea la primera categoría para poder asignarla a los productos.</p>
              <Button variant="secondary" size="lg" onClick={openCreate} className="mt-6 glow-brand-sm">
                <Plus className="h-4 w-4" />
                Crear primera categoría
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-theme bg-surf2 text-xs font-bold uppercase tracking-wider text-muted-t">
                  <th className="px-6 py-5">Imagen</th>
                  <th className="px-6 py-5"><span className="inline-flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> ID</span></th>
                  <th className="px-6 py-5">Nombre</th>
                  <th className="px-6 py-5">Descripción</th>
                  <th className="px-6 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c, idx) => (
                  <tr key={c.id} className="row-hover border-b border-theme2 last:border-0" style={{ animation: `slide-up 0.4s cubic-bezier(0.16,1,0.3,1) ${0.3 + idx * 0.04}s both` }}>
                    <td className="px-6 py-5">
                      {c.imagenUrl ? (
                        <div className="relative">
                          <img
                            src={resolveMediaUrl(c.imagenUrl) ?? undefined}
                            alt={c.nombre}
                            className="h-12 w-12 rounded-[14px] border border-theme bg-surf2 object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-dashed border-theme bg-surf2 text-muted-t">
                          <Layers className="h-5 w-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 font-mono text-xs text-muted-t">
                      <span className="chip font-mono">#{c.id}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-purple-500/15 text-accent">
                          <Tag className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-primary">{c.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-secondary text-xs max-w-xs truncate">
                      {c.descripcion || <span className="text-muted-t/50 italic">— Sin descripción —</span>}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)} className="group">
                          <Pencil className="h-3.5 w-3.5 transition-transform group-hover:-rotate-12" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => handleDelete(c)}
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/70 backdrop-blur-md animate-fade-in"
            onClick={() => { setShowModal(false); resetForm(); }}
          />
          <div
            className="relative w-full max-w-lg rounded-[22px] p-[1px] animate-scale-in"
            style={{
              background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 35%, #7c3aed 55%, #d4af37 100%)",
              boxShadow: "0 30px 80px -20px rgba(14,165,233,0.35), 0 0 0 1px rgba(255,255,255,0.05)",
            }}
          >
            <div className="h-full w-full rounded-[21px] bg-surf p-0">
              <div className="relative overflow-hidden rounded-t-[21px] border-b border-theme px-7 py-6">
                <div className="relative flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-theme bg-surf2 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-muted-t">
                      {editingCategory ? (
                        <><Pencil className="h-3 w-3" /> Edición</>
                      ) : (
                        <><Plus className="h-3 w-3" /> Creación</>
                      )}
                    </div>
                    <h3 className="font-display text-2xl leading-tight text-gradient-ink sm:text-[1.7rem]">
                      {editingCategory ? (<>Editar <span className="text-gradient-brand">Categoría</span></>) : (<>Nueva <span className="text-gradient-brand">Categoría</span></>)}
                    </h3>
                    <p className="text-xs text-secondary">
                      {editingCategory ? `Actualizando: ID #${editingCategory.id}` : "Completa los campos para registrar una nueva categoría"}
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-theme bg-surf text-muted-t transition-all hover:border-danger/30 hover:bg-danger/5 hover:text-danger"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 px-7 py-6">
                <div className="animate-slide-up delay-100 space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Nombre <span className="text-danger">*</span>
                  </label>
                  <input
                    required autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Running, Casual, Fútbol..."
                    className="input-premium h-[50px] rounded-[14px] border-[1.5px]"
                    style={{ background: "var(--input-bg)" }}
                  />
                </div>

                <div className="animate-slide-up delay-150 space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple" />
                    Descripción <span className="text-muted-t font-normal normal-case">(opcional)</span>
                  </label>
                  <input
                    value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Descripción breve de la categoría"
                    className="input-premium h-[50px] rounded-[14px] border-[1.5px]"
                    style={{ background: "var(--input-bg)" }}
                  />
                </div>

                <div className="animate-slide-up delay-200 space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    Imagen de la Categoría <span className="text-muted-t font-normal normal-case">(opcional)</span>
                  </label>
                  <div className="rounded-[14px] border border-theme bg-surf2 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="relative flex-shrink-0">
                        {imagenPreview ? (
                          <img
                            src={resolveMediaUrl(imagenPreview) ?? undefined}
                            alt="preview"
                            className="h-[72px] w-[72px] rounded-[16px] border border-theme bg-surf object-cover shadow-card"
                          />
                        ) : (
                          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[16px] border-[1.5px] border-dashed border-theme bg-surf text-muted-t transition-all hover:border-accent/40 hover:text-accent">
                            <ImagePlus className="h-7 w-7" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-[11px] text-muted-t">
                          Formatos permitidos: <span className="font-semibold text-secondary">JPEG · PNG · WEBP</span>
                        </p>
                        <input
                          ref={fileRef} type="file" accept="image/*" onChange={handleImagenChange}
                          className="block w-full text-sm text-secondary
                            file:mr-3 file:cursor-pointer file:rounded-[12px] file:border-0
                            file:bg-gradient-to-br file:from-sky-500/15 file:to-purple-500/10
                            file:px-4 file:py-2 file:text-xs file:font-bold file:text-accent
                            hover:file:from-sky-500/25 hover:file:to-purple-500/20
                            transition-all"
                        />
                        {imagenFile && (
                          <div className="flex items-center gap-2">
                            <span className="chip chip-success inline-flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Listo para subir
                            </span>
                            <span className="truncate text-xs text-secondary">{imagenFile.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="animate-slide-up delay-250 mt-2 flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="ghost" onClick={() => { setShowModal(false); resetForm(); }} className="h-[46px] rounded-[14px] px-6">
                    Cancelar
                  </Button>
                  <Button type="submit" variant="secondary" isLoading={isSubmitting} className="h-[46px] rounded-[14px] px-7 glow-brand-sm">
                    {editingCategory ? "Guardar Cambios" : "Crear Categoría"}
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
