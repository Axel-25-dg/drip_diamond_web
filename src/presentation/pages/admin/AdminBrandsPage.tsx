import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Brand } from "@/domain/entities/Product";
import { Button } from "@/presentation/components/ui/Button";
import { Badge } from "@/presentation/components/ui/Badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Tag, Pencil, Trash2, ImagePlus, Sparkles, Layers } from "lucide-react";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchBrands = async () => {
    setIsLoading(true);
    try {
      const res = await useCases.getBrands.execute();
      setBrands(res);
    } catch {
      setBrands([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBrands(); }, []);

  const resetForm = () => {
    setNombre(""); setDescripcion("");
    setLogoFile(null); setLogoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const openCreate = () => {
    setEditingBrand(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (b: Brand) => {
    setEditingBrand(b);
    setNombre(b.nombre);
    setDescripcion((b as any).descripcion ?? "");
    setLogoFile(null);
    setLogoPreview(b.logoUrl ?? null);
    setShowModal(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const handleDelete = async (b: Brand) => {
    if (!confirm(`¿Eliminar la marca "${b.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await useCases.deleteBrand.execute(b.id);
      toast.success("Marca eliminada");
      fetchBrands();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo eliminar la marca");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    setIsSubmitting(true);
    try {
      if (editingBrand) {
        await useCases.updateBrand.execute(editingBrand.id, {
          nombre,
          descripcion,
          ...(logoFile ? { logo: logoFile } : {}),
        });
        toast.success("Marca actualizada");
      } else {
        await useCases.createBrand.execute({
          nombre,
          descripcion,
          ...(logoFile ? { logo: logoFile } : {}),
        });
        toast.success("Marca creada con éxito");
      }
      setShowModal(false);
      resetForm();
      fetchBrands();
    } catch (err: any) {
      const msg = err?.errors
        ? Object.entries(err.errors).map(([k, v]) => `${k}: ${(Array.isArray(v) ? v : [v]).join(", ")}`).join(" | ")
        : err?.message || "No se pudo guardar la marca";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-app py-10">
      {/* BREADCRUMB + BADGE SECCIÓN */}
      <div className="flex flex-wrap items-center gap-3 animate-slide-up">
        <Badge tone="accent" className="mb-1">
          <Layers className="h-3 w-3" />
          Catálogo · Marcas
        </Badge>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-t">
          <Link to="/admin" className="hover:text-primary flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <span className="text-muted-t/50">/</span>
          <span className="text-secondary">Gestión de Catálogo</span>
          <span className="text-muted-t/50">/</span>
          <span className="text-primary">Marcas</span>
        </div>
      </div>

      {/* HERO HEADER */}
      <div className="relative mt-6 overflow-hidden rounded-[28px] p-[1px] animate-slide-up delay-100"
        style={{
          background:
            "linear-gradient(135deg, rgba(14,165,233,0.55), rgba(99,102,241,0.55) 50%, rgba(212,175,55,0.45))",
        }}
      >
        <div className="relative overflow-hidden rounded-[27px] bg-surf px-8 py-10 sm:px-12 sm:py-12">
          <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(14,165,233,0.22), transparent)" }}
          />
          <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(212,175,55,0.20), transparent)" }}
          />
          <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <Badge tone="gold" className="mb-4">
                <Sparkles className="h-3 w-3" />
                Panel administrador · DRIP DIAMOND
              </Badge>
              <h1 className="font-display text-4xl sm:text-6xl leading-[1.02] tracking-tight">
                <span className="text-gradient-ink">Gestión de</span>{" "}
                <span className="text-gradient-brand">Marcas</span>
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-secondary">
                Crea, edita y elimina las marcas disponibles en el catálogo.
                Sube logos personalizados y manten tu inventario de marcas
                siempre actualizado.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                <span className="chip chip-accent">
                  <Tag className="h-3 w-3" /> {isLoading ? "..." : `${brands.length} registradas`}
                </span>
                <span className="chip chip-success">
                  <Sparkles className="h-3 w-3" /> Soporte multipart
                </span>
                <span className="chip chip-gold">
                  <Layers className="h-3 w-3" /> Catálogo premium
                </span>
              </div>
            </div>

            <div className="animate-slide-up delay-200">
              <Button variant="secondary" size="lg" onClick={openCreate} className="glow-brand-sm">
                <Plus className="h-4 w-4" /> Nueva Marca
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="mt-10 relative overflow-hidden rounded-[22px] border bg-surf shadow-card animate-slide-up delay-200"
        style={{ borderColor: "var(--card-border)" }}
      >
        {isLoading ? (
          <div className="p-16 text-center">
            <div className="skeleton h-8 w-56 mx-auto mb-4" />
            <div className="text-muted-t text-sm font-medium">Cargando marcas desde la API...</div>
          </div>
        ) : brands.length === 0 ? (
          <div className="p-16 text-center">
            <div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-[22px] border"
              style={{
                background: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(99,102,241,0.08))",
                borderColor: "rgba(14,165,233,0.25)",
              }}
            >
              <Tag className="h-10 w-10" style={{ color: "#0284c7" }} />
            </div>
            <h3 className="mt-6 font-display text-2xl text-gradient-ink">No hay marcas registradas</h3>
            <p className="mt-2 text-sm text-secondary">Crea la primera marca para poder asignarla a las zapatillas.</p>
            <Button variant="secondary" size="lg" onClick={openCreate} className="mt-6 glow-brand-sm">
              <Plus className="h-4 w-4" /> Crear primera marca
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead
                className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-t"
                style={{
                  background: "linear-gradient(180deg, var(--bg-surface2), var(--bg-surface))",
                  borderBottom: "1px solid var(--bg-border)",
                }}
              >
                <tr>
                  <th className="px-6 py-5">Logo</th>
                  <th className="px-6 py-5">ID</th>
                  <th className="px-6 py-5">Nombre de la Marca</th>
                  <th className="px-6 py-5">Descripción</th>
                  <th className="px-6 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((b, idx) => (
                  <tr
                    key={b.id}
                    className="row-hover border-t"
                    style={{ borderColor: "var(--bg-border2)" }}
                  >
                    <td className="px-6 py-5">
                      {b.logoUrl ? (
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-[14px] border overflow-hidden"
                          style={{
                            background: "var(--bg-surface2)",
                            borderColor: "var(--bg-border)",
                          }}
                        >
                          <img
                            src={b.logoUrl}
                            alt={b.nombre}
                            className="h-full w-full object-contain p-1"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-[14px] border"
                          style={{
                            background: "var(--bg-surface2)",
                            borderColor: "var(--bg-border)",
                            color: "var(--text-muted)",
                          }}
                        >
                          <Tag className="h-5 w-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className="chip chip-accent font-mono">#{b.id}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-display font-semibold text-lg text-primary">{b.nombre}</div>
                    </td>
                    <td className="px-6 py-5 max-w-xs">
                      {(b as any).descripcion ? (
                        <p className="text-sm text-secondary line-clamp-2 leading-relaxed">{(b as any).descripcion}</p>
                      ) : (
                        <Badge tone="neutral" className="font-normal normal-case tracking-normal">
                          Sin descripción
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(b)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-500/10"
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

      {/* MODAL PREMIUM */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{
            background: "rgba(7, 10, 18, 0.55)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div
            className="relative w-full max-w-lg animate-scale-in"
          >
            <div
              className="relative rounded-[22px] p-[1px]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(14,165,233,0.7), rgba(99,102,241,0.6) 45%, rgba(212,175,55,0.55))",
                boxShadow: "0 30px 80px -20px rgba(15,23,42,0.55), 0 0 0 1px rgba(255,255,255,0.05) inset",
              }}
            >
              <div className="relative rounded-[21px] bg-surf p-6 sm:p-8">
                <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full opacity-60"
                  style={{ background: "radial-gradient(closest-side, rgba(14,165,233,0.22), transparent)" }}
                />

                <div className="relative flex items-start justify-between gap-4 border-b pb-5"
                  style={{ borderColor: "var(--bg-border)" }}
                >
                  <div>
                    <Badge tone={editingBrand ? "info" : "accent"} className="mb-3">
                      {editingBrand ? (
                        <><Pencil className="h-3 w-3" /> Modo edición</>
                      ) : (
                        <><Plus className="h-3 w-3" /> Nueva marca</>
                      )}
                    </Badge>
                    <h3 className="font-display text-2xl sm:text-3xl text-gradient-ink leading-tight">
                      {editingBrand ? "Editar Marca" : "Crear Nueva Marca"}
                    </h3>
                    <p className="mt-1.5 text-sm text-secondary">
                      {editingBrand
                        ? "Actualiza los datos de la marca existente en el catálogo."
                        : "Completa el formulario para registrar una nueva marca."}
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-muted-t transition-all hover:text-primary hover:border-[var(--bg-border-strong)] hover:bg-[var(--bg-surface2)]"
                    style={{ borderColor: "var(--bg-border)" }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="relative mt-6 space-y-5">
                  <div>
                    <label className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-secondary">
                      Nombre de la marca <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      autoFocus
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Nike, Adidas, Jordan, Puma..."
                      className="mt-2 h-[50px] w-full rounded-[14px] border-[1.5px] px-4 text-[14px] text-primary outline-none transition-all duration-200 placeholder:text-muted-t placeholder:opacity-80"
                      style={{
                        borderColor: "var(--input-border)",
                        background: "var(--input-bg)",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--input-border-focus)";
                        e.currentTarget.style.boxShadow = "var(--ring-focus)";
                        e.currentTarget.style.background = "var(--bg-surface)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--input-border)";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.background = "var(--input-bg)";
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-secondary">
                      Descripción breve <span className="text-muted-t font-normal normal-case">(opcional)</span>
                    </label>
                    <input
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Origen, filosofía o slogan distintivo de la marca..."
                      className="mt-2 h-[50px] w-full rounded-[14px] border-[1.5px] px-4 text-[14px] text-primary outline-none transition-all duration-200 placeholder:text-muted-t placeholder:opacity-80"
                      style={{
                        borderColor: "var(--input-border)",
                        background: "var(--input-bg)",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "var(--input-border-focus)";
                        e.currentTarget.style.boxShadow = "var(--ring-focus)";
                        e.currentTarget.style.background = "var(--bg-surface)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "var(--input-border)";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.background = "var(--input-bg)";
                      }}
                    />
                  </div>

                  {/* Logo — multipart/form-data */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-secondary">
                        Logo de la marca <span className="text-muted-t font-normal normal-case">(opcional)</span>
                      </label>
                      <Badge tone="accent" className="font-normal normal-case tracking-normal">
                        multipart/form-data
                      </Badge>
                    </div>
                    <p className="mb-3 text-[11px] text-muted-t leading-relaxed">
                      Formatos aceptados: JPG, PNG, WEBP · Se recomienda fondo transparente para mejor integración.
                    </p>
                    <div
                      className="flex items-start gap-4 rounded-[18px] border p-4"
                      style={{
                        background: "var(--bg-surface2)",
                        borderColor: "var(--bg-border)",
                      }}
                    >
                      {logoPreview ? (
                        <div
                          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[14px] border overflow-hidden"
                          style={{
                            background: "var(--bg-surface)",
                            borderColor: "rgba(14,165,233,0.35)",
                            boxShadow: "0 0 0 3px rgba(14,165,233,0.10)",
                          }}
                        >
                          <img
                            src={logoPreview}
                            alt="preview"
                            className="h-full w-full object-contain p-1.5"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[14px] border-2 border-dashed"
                          style={{
                            background: "var(--bg-surface)",
                            borderColor: "var(--bg-border-strong)",
                            color: "var(--text-muted)",
                          }}
                        >
                          <ImagePlus className="h-7 w-7" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="block w-full text-[13px] text-secondary
                            file:mr-3 file:mb-2 file:rounded-[12px] file:border-0
                            file:bg-gradient-to-br file:from-sky-500/15 file:to-indigo-500/10
                            file:px-4 file:py-2.5
                            file:text-xs file:font-extrabold file:text-sky-700
                            file:border file:border-sky-400/30
                            hover:file:from-sky-500/25 hover:file:to-indigo-500/15
                            file:cursor-pointer file:transition-all"
                        />
                        {logoFile ? (
                          <p className="mt-1 text-[12px] font-semibold text-emerald-700 flex items-center gap-1.5">
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {logoFile.name}
                            <span className="text-muted-t font-normal">
                              · {logoFile.size < 1024 ? `${logoFile.size} B` : `${(logoFile.size / 1024).toFixed(1)} KB`}
                            </span>
                          </p>
                        ) : logoPreview && editingBrand ? (
                          <p className="mt-1 text-[12px] font-semibold text-sky-700 flex items-center gap-1.5">
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                            Logo actual · Selecciona un archivo para reemplazarlo
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="divider-premium mt-6" />

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:items-center pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setShowModal(false); resetForm(); }}
                      className="w-full sm:w-auto justify-center"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variant="secondary"
                      isLoading={isSubmitting}
                      className="w-full sm:w-auto justify-center glow-brand-sm"
                    >
                      {editingBrand ? "Guardar Cambios" : "Crear Marca"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
