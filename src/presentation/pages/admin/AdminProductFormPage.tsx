import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Brand, Category, Talla, ProductVariant } from "@/domain/entities/Product";
import type { VarianteInputDTO } from "@/application/dtos/admin.dto";
import { Button } from "@/presentation/components/ui/Button";
import { Badge } from "@/presentation/components/ui/Badge";
import { toast } from "sonner";
import { ArrowLeft, Upload, Package, Edit3, AlertTriangle, Ruler, Trash2, Save, Image as ImageIcon, Layers } from "lucide-react";

type CalidadKey = "ORIGINAL" | "PRIMERA_CLASE" | "SEGUNDA_CLASE";

const CALIDAD_OPCIONES: { value: CalidadKey; label: string }[] = [
  { value: "ORIGINAL", label: "Original" },
  { value: "PRIMERA_CLASE", label: "Full Quality" },
  { value: "SEGUNDA_CLASE", label: "Calidad 1.1 Plus" },
];

interface SelectedTallaData {
  included: boolean;
  stock: string;
  pesoKg: string;
  sku: string;
  variantId?: number;
  isNew?: boolean;
}

function emptyTallaData(): SelectedTallaData {
  return { included: false, stock: "9999", pesoKg: "0.85", sku: "", isNew: true };
}

type SelectionMap = Record<number, SelectedTallaData>;

export default function AdminProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tallas, setTallas] = useState<Talla[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [modelo, setModelo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [calidad, setCalidad] = useState<CalidadKey>("ORIGINAL");
  const [precioBase, setPrecioBase] = useState("");
  const [marcaId, setMarcaId] = useState<number>(0);
  const [categoriaId, setCategoriaId] = useState<number>(0);
  const [activo, setActivo] = useState(true);

  const [selection, setSelection] = useState<SelectionMap>({});
  const [existingVariantsMap, setExistingVariantsMap] = useState<Record<number, number>>({});
  const [savingRow, setSavingRow] = useState<number | null>(null);
  const [deletingRow, setDeletingRow] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedFile) return;
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  useEffect(() => {
    (async () => {
      setIsLoadingData(true);
      setLoadError(null);
      try {
        const [brandsRes, categoriesRes, tallasRes] = await Promise.all([
          useCases.getBrands.execute(),
          useCases.getCategories.execute(),
          useCases.getTallas.execute(),
        ]);

        setBrands(brandsRes);
        setCategories(categoriesRes);
        setTallas(tallasRes);

        if (brandsRes.length > 0) setMarcaId(brandsRes[0].id);
        if (categoriesRes.length > 0) setCategoriaId(categoriesRes[0].id);

        const initSelection: SelectionMap = {};
        tallasRes.forEach((t) => {
          initSelection[t.id] = emptyTallaData();
        });

        if (id) {
          const product = await useCases.getProductDetail.execute(Number(id));
          setNombre(product.nombre);
          setModelo(product.modelo || product.nombre);
          setDescripcion(product.descripcion || "");
          setCalidad((product.calidad as CalidadKey) || "ORIGINAL");
          setPrecioBase(String(product.precioBase));
          if (product.marcaId) setMarcaId(product.marcaId);
          if (product.categoriaId) setCategoriaId(product.categoriaId);
          setActivo(
            product.estado === "disponible" || product.estado === "activo"
              ? true
              : (product as any).activo ?? true
          );
          setPreviewUrl(product.imagenPrincipal);

          const existing: ProductVariant[] = product.variantes ?? [];
          const evMap: Record<number, number> = {};
          existing.forEach((v) => {
            evMap[v.tallaId] = v.id;
            if (initSelection[v.tallaId] != null) {
              initSelection[v.tallaId] = {
                included: true,
                stock: String(v.stock ?? 9999),
                pesoKg: "0.85",
                sku: v.sku ?? "",
                variantId: v.id,
                isNew: false,
              };
            }
          });
          setExistingVariantsMap(evMap);
        }
        setSelection(initSelection);
        if (isEditMode) {
          setStep(2);
        } else {
          setStep(1);
        }
      } catch (err: any) {
        const msg =
          err?.message ||
          "No se pudieron cargar marcas, categorías o tallas desde la API.";
        setLoadError(msg);
        toast.error(msg);
      } finally {
        setIsLoadingData(false);
      }
    })();
  }, [id]);

  const updateSelection = (tallaId: number, patch: Partial<SelectedTallaData>) => {
    setSelection((prev) => {
      const current = prev[tallaId] ?? emptyTallaData();
      return { ...prev, [tallaId]: { ...current, ...patch } };
    });
  };

  const toggleIncluded = (tallaId: number) => {
    setSelection((prev) => {
      const current = prev[tallaId] ?? emptyTallaData();
      return {
        ...prev,
        [tallaId]: {
          ...current,
          included: !current.included,
        },
      };
    });
  };

  const includedCount = useMemo(
    () => Object.values(selection).filter((s) => s.included).length,
    [selection]
  );

  const handleSaveVariantRow = async (tallaId: number) => {
    const s = selection[tallaId];
    if (!s || !isEditMode || !id) return;
    if (!s.variantId) {
      toast.warning(
        "Esta talla aún no existe en el backend. Primero guarda el producto completo usando el botón inferior, o marca el check y guarda."
      );
      return;
    }
    const stock = Number(s.stock);
    if (!Number.isFinite(stock) || stock < 0) {
      toast.error("Stock debe ser un número mayor o igual a 0");
      return;
    }
    setSavingRow(tallaId);
    try {
      await useCases.updateVariant.execute(s.variantId, {
        stock,
        sku: s.sku.trim() || undefined,
        pesoKg: s.pesoKg ? Number(s.pesoKg) : undefined,
      });
      toast.success("Variante actualizada");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo actualizar la variante");
    } finally {
      setSavingRow(null);
    }
  };

  const handleDeleteVariantRow = async (tallaId: number) => {
    const s = selection[tallaId];
    if (!s || !isEditMode || !id) return;

    const confirmMsg = s.variantId
      ? `¿Eliminar la talla asignada a esta zapatilla? Se borrará permanentemente del backend.`
      : `¿Quitar esta talla de la lista de guardado? No se enviará en la próxima actualización.`;
    if (!confirm(confirmMsg)) return;

    if (s.variantId) {
      setDeletingRow(tallaId);
      try {
        await useCases.deleteVariant.execute(s.variantId);
        toast.success("Talla eliminada del producto");
      } catch (err: any) {
        toast.error(err?.message || "No se pudo eliminar la variante");
        setDeletingRow(null);
        return;
      } finally {
        setDeletingRow(null);
      }
    }

    setSelection((prev) => {
      const current = prev[tallaId] ?? emptyTallaData();
      return {
        ...prev,
        [tallaId]: {
          ...emptyTallaData(),
          variantId: undefined,
          isNew: true,
          included: false,
        },
      };
    });
    setExistingVariantsMap((prev) => {
      const next = { ...prev };
      delete next[tallaId];
      return next;
    });
  };

  const buildVariantesInput = (): VarianteInputDTO[] | undefined => {
    const result: VarianteInputDTO[] = [];
    tallas.forEach((t) => {
      const s = selection[t.id];
      if (!s || !s.included) return;
      const stock = Number(s.stock);
      if (!s || !Number.isFinite(stock) || stock < 0) return;
      result.push({
        talla: t.id,
        stock,
        peso_kg: s.pesoKg ? Number(s.pesoKg) : 0.85,
        sku: s.sku.trim() || undefined,
      });
    });
    return result.length > 0 ? result : undefined;
  };

  const goNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditMode && !selectedFile) {
      toast.warning(
        "Sin imagen seleccionada. Puedes continuar sin ella o subirla después."
      );
    }
    setStep(2);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !modelo.trim()) {
      toast.error("Nombre y modelo son obligatorios");
      return;
    }
    if (!precioBase || isNaN(Number(precioBase)) || Number(precioBase) <= 0) {
      toast.error("Precio base debe ser un número mayor a 0");
      return;
    }
    if (!marcaId || marcaId === 0) {
      toast.error("Debes seleccionar una marca válida");
      return;
    }
    if (!categoriaId || categoriaId === 0) {
      toast.error("Debes seleccionar una categoría válida");
      return;
    }
    const variantes_input = buildVariantesInput();
    if (!isEditMode && (!variantes_input || variantes_input.length === 0)) {
      toast.error(
        "Selecciona al menos una TALLA de la lista. El stock por defecto es 9999 si no lo modificas."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        const prodId = Number(id);
        // For edit: send only basic product fields (no variantes_input — handled separately below)
        const editPayload = {
          nombre: nombre.trim(),
          modelo: modelo.trim(),
          descripcion: descripcion.trim(),
          calidad,
          precio_base: precioBase,
          marca_id: marcaId,
          categoria_id: categoriaId,
          activo,
        };
        await useCases.updateProduct.execute(prodId, editPayload);

        // Explicitly sync variants for all tallas
        for (const t of tallas) {
          const s = selection[t.id];
          if (s?.included && !s.variantId) {
            // NEW talla — create variant
            const autoSku = s.sku.trim() || `SKU-${prodId}-${t.id}-${Date.now()}`;
            try {
              await useCases.createVariant.execute({
                productoId: prodId,
                tallaId: t.id,
                stock: Number(s.stock) || 9999,
                sku: autoSku,
              });
            } catch {
              // might already exist, ignore
            }
          } else if (s?.included && s.variantId) {
            // EXISTING talla — update stock
            try {
              await useCases.updateVariant.execute(s.variantId, {
                stock: Number(s.stock) || 9999,
                sku: s.sku.trim() || `SKU-VAR-${s.variantId}-${Date.now()}`,
              });
            } catch {
              // ignore
            }
          } else if (!s?.included && s?.variantId) {
            // UNCHECKED existing talla — delete variant
            try {
              await useCases.deleteVariant.execute(s.variantId);
            } catch {
              // ignore
            }
          }
        }

        if (selectedFile) {
          try {
            await useCases.uploadImage.execute(selectedFile, "tienda", "producto", prodId);
            toast.success("Zapatilla actualizada e imagen subida correctamente");
          } catch {
            toast.warning("Zapatilla actualizada, pero la imagen no pudo subirse.");
          }
        } else {
          toast.success("Zapatilla actualizada con todas sus tallas correctamente");
        }
      } else {
        // CREATE mode
        const payload = {
          nombre: nombre.trim(),
          modelo: modelo.trim(),
          descripcion: descripcion.trim(),
          calidad,
          precio_base: precioBase,
          marca_id: marcaId,
          categoria_id: categoriaId,
          activo,
          variantes_input,
        };
        const product = await useCases.createProduct.execute(payload as any);
        const prodId = product.id;

        // Ensure all checked tallas are created (backend may have already created some)
        if (prodId) {
          const existingTallaIds = new Set(product.variantes?.map((v) => v.tallaId) ?? []);
          for (const t of tallas) {
            const s = selection[t.id];
            if (s?.included && !existingTallaIds.has(t.id)) {
              const autoSku = s.sku.trim() || `SKU-${prodId}-${t.id}-${Date.now()}`;
              try {
                await useCases.createVariant.execute({
                  productoId: prodId,
                  tallaId: t.id,
                  stock: Number(s.stock) || 9999,
                  sku: autoSku,
                });
              } catch {
                // ignore error
              }
            }
          }
        }

        if (selectedFile && prodId) {
          try {
            await useCases.uploadImage.execute(
              selectedFile,
              "tienda",
              "producto",
              prodId
            );
            toast.success("Zapatilla creada e imagen subida correctamente");
          } catch {
            toast.warning(
              "Zapatilla creada, pero la imagen no pudo subirse al backend."
            );
          }
        } else {
          toast.success("Zapatilla creada con éxito con todas sus tallas");
        }
      }
      navigate("/admin/productos");
    } catch (err: any) {
      const errors = err?.errors;
      const msg = errors
        ? Object.entries(errors)
            .map(
              ([k, v]) =>
                `${k}: ${(Array.isArray(v) ? v : [v]).join(", ")}`
            )
            .join(" | ")
        : err?.message ||
          (isEditMode
            ? "No se pudo actualizar la zapatilla"
            : "No se pudo crear la zapatilla");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canShowForm =
    !isLoadingData &&
    !loadError &&
    brands.length > 0 &&
    categories.length > 0;

  return (
    <div className="container-app py-10">
      {/* ── Breadcrumb ── */}
      <div className="flex flex-wrap items-center gap-2 animate-slide-up">
        <Link
          to="/admin/productos"
          className="chip hover:border-[color:var(--card-border-hover)] transition-all cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Catálogo
        </Link>
        <span className="text-muted-t">/</span>
        <Badge tone="accent">
          {isEditMode ? "Editar" : "Nuevo"} · Producto
        </Badge>
        {isEditMode && id && (
          <>
            <span className="text-muted-t">·</span>
            <span className="chip-accent chip">ID #{id}</span>
          </>
        )}
      </div>

      {/* ── Título ── */}
      <div className="mt-5 animate-slide-up delay-100">
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.05]">
          <span className="text-gradient-ink">
            {isEditMode ? "Editar" : "Crear Nueva"}
          </span>{" "}
          <span className="text-gradient-brand">Zapatilla</span>
        </h1>
        <p className="mt-2 text-sm text-secondary">
          {isEditMode
            ? `Modificando especificaciones del producto #${id}`
            : "Imagen + Datos oficiales + Selección de Tallas. El código lo genera el backend."}
        </p>
      </div>

      {/* ── Error de carga ── */}
      {!isLoadingData && loadError && (
        <div className="mt-8 flex items-start gap-3 rounded-[22px] border border-theme p-6 text-sm animate-slide-up delay-150"
          style={{
            background: "linear-gradient(135deg, rgba(220,38,38,0.08), rgba(239,68,68,0.04))",
            borderColor: "rgba(220,38,38,0.25)",
          }}>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]"
            style={{
              background: "linear-gradient(135deg, rgba(220,38,38,0.15), rgba(239,68,68,0.08))",
            }}
          >
            <AlertTriangle className="h-5 w-5 text-[#dc2626]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-primary">
              No se pudieron cargar los datos desde la API
            </p>
            <p className="mt-1 text-secondary">{loadError}</p>
            <p className="mt-3 text-xs text-muted-t">
              Antes de crear zapatillas debes tener al menos una{" "}
              <Link
                to="/admin/marcas"
                className="font-bold text-[#0369a1] underline decoration-dotted underline-offset-2"
              >
                marca
              </Link>{" "}
              y una{" "}
              <Link
                to="/admin/categorias"
                className="font-bold text-[#0369a1] underline decoration-dotted underline-offset-2"
              >
                categoría
              </Link>{" "}
              registradas. No olvides registrar también las{" "}
              <Link
                to="/admin/tallas"
                className="font-bold text-[#0369a1] underline decoration-dotted underline-offset-2"
              >
                tallas
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {/* ── Faltan datos requeridos ── */}
      {!isLoadingData &&
        !loadError &&
        (brands.length === 0 ||
          categories.length === 0 ||
          tallas.length === 0) && (
          <div
            className="mt-8 flex items-start gap-3 rounded-[22px] border p-6 text-sm animate-slide-up delay-150"
            style={{
              background:
                "linear-gradient(135deg, rgba(217,119,6,0.08), rgba(245,158,11,0.04))",
              borderColor: "rgba(217,119,6,0.25)",
            }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(217,119,6,0.15), rgba(245,158,11,0.08))",
              }}
            >
              <AlertTriangle className="h-5 w-5 text-[#d97706]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-primary">
                Faltan datos requeridos para crear una zapatilla
              </p>
              <ul className="mt-2 list-disc pl-4 space-y-1 text-secondary">
                {brands.length === 0 && (
                  <li>
                    No hay marcas registradas.{" "}
                    <Link
                      to="/admin/marcas"
                      className="font-bold text-[#0369a1] underline decoration-dotted underline-offset-2"
                    >
                      Crear marcas →
                    </Link>
                  </li>
                )}
                {categories.length === 0 && (
                  <li>
                    No hay categorías registradas.{" "}
                    <Link
                      to="/admin/categorias"
                      className="font-bold text-[#0369a1] underline decoration-dotted underline-offset-2"
                    >
                      Crear categorías →
                    </Link>
                  </li>
                )}
                {tallas.length === 0 && (
                  <li>
                    No hay tallas registradas.{" "}
                    <Link
                      to="/admin/tallas"
                      className="font-bold text-[#0369a1] underline decoration-dotted underline-offset-2"
                    >
                      Crear tallas →
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

      {/* ── Loading skeleton ── */}
      {isLoadingData && (
        <div className="mt-8 rounded-[22px] border border-theme bg-surf shadow-card p-16 text-center animate-slide-up">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full skeleton mb-5" />
          <p className="text-muted-t text-sm">
            Cargando marcas, categorías y tallas desde la API...
          </p>
        </div>
      )}

      {/* ── FORMULARIO ── */}
      {canShowForm && (
        <>
          {/* ── Stepper pills ── */}
          <div className="mt-8 flex flex-wrap items-center gap-3 animate-slide-up delay-150">
            <div
              className={`step-pill ${
                step === 1 ? "active" : step > 1 ? "done" : ""
              }`}
            >
              <span className="step-num">
                {step > 1 ? "✓" : "1"}
              </span>
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  step === 1 ? "text-primary" : "text-secondary"
                }`}
              >
                Imagen
              </span>
            </div>
            <div className="h-[2px] w-10 rounded-full bg-gradient-to-r from-[rgba(14,165,233,0.25)] to-[rgba(99,102,241,0.15)]" />
            <div
              className={`step-pill ${step === 2 ? "active" : ""}`}
            >
              <span className="step-num">2</span>
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  step === 2 ? "text-primary" : "text-secondary"
                }`}
              >
                Datos y Tallas
              </span>
            </div>
          </div>

          {/* ── Paso 1: Imagen ── */}
          {step === 1 && (
            <form
              onSubmit={goNext}
              className="mt-8 rounded-[22px] border border-theme bg-surf shadow-card p-8 animate-slide-up delay-200"
            >
              {/* ── Header card ── */}
              <div className="flex items-center gap-4 pb-5 border-b border-theme2">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[16px]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(99,102,241,0.12))",
                  }}
                >
                  <Upload className="h-6 w-6 text-[#0ea5e9]" />
                </div>
                <div>
                  <h2 className="font-display text-2xl text-primary">
                    Paso 1 · Fotografía del Producto
                  </h2>
                  <p className="text-xs text-muted-t mt-0.5">
                    Sube la imagen principal que se verá en el catálogo
                  </p>
                </div>
              </div>

              {/* ── Upload zone ── */}
              <div className="mt-7 grid gap-7 rounded-[22px] border-[1.5px] border-dashed p-8 sm:grid-cols-[1fr_280px] dot-pattern"
                style={{
                  borderColor: "rgba(14,165,233,0.25)",
                  background:
                    "linear-gradient(135deg, rgba(14,165,233,0.04), rgba(99,102,241,0.02))",
                }}
              >
                <div className="text-center sm:text-left">
                  <div
                    className="mx-auto sm:mx-0 flex h-16 w-16 items-center justify-center rounded-[20px] mb-4"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.10))",
                      border: "1px solid rgba(14,165,233,0.22)",
                    }}
                  >
                    <ImageIcon className="h-8 w-8 text-[#0ea5e9]" />
                  </div>
                  <p className="font-bold text-primary">
                    Arrastra o selecciona la imagen
                  </p>
                  <p className="text-xs text-muted-t mt-1">
                    JPEG · PNG · WEBP — tamaño recomendado 1200×1200px
                  </p>
                  <label className="mt-5 inline-flex items-center gap-2 rounded-[14px] cursor-pointer overflow-hidden font-bold text-sm"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(99,102,241,0.08))",
                      border: "1.5px solid rgba(14,165,233,0.25)",
                      color: "#0369a1",
                      padding: "0.65rem 1.25rem",
                    }}
                  >
                    <Package className="h-4 w-4" />
                    Seleccionar archivo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                  </label>
                  {selectedFile && (
                    <p className="mt-3 text-xs text-[#065f46] chip chip-success inline-flex">
                      ✓ {selectedFile.name}
                    </p>
                  )}
                  <p className="mt-5 text-xs text-muted-t max-w-xs">
                    La imagen es opcional. Puedes continuar sin ella y subirla
                    después desde la edición.
                  </p>
                </div>

                {/* ── Preview ── */}
                <div
                  className="rounded-[20px] p-[1px]"
                  style={{
                    background: previewUrl
                      ? "linear-gradient(135deg, rgba(14,165,233,0.35), rgba(99,102,241,0.25))"
                      : "var(--bg-border)",
                  }}
                >
                  <div className="rounded-[19px] bg-surf p-3 h-full">
                    <div className="flex items-center justify-between px-1 pb-2">
                      <span className="chip !py-1">Vista previa</span>
                      {previewUrl && <Badge tone="success">OK</Badge>}
                    </div>
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="preview"
                        className="h-60 w-full rounded-[16px] object-contain bg-surf2 border border-theme2"
                      />
                    ) : (
                      <div className="h-60 w-full flex flex-col items-center justify-center rounded-[16px] border border-dashed border-theme bg-surf2 text-muted-t">
                        <ImageIcon className="h-10 w-10 mb-2 opacity-40" />
                        <span className="text-xs">Sin imagen seleccionada</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Botón siguiente ── */}
              <div className="mt-7 flex justify-end">
                <Button type="submit" variant="secondary" size="lg">
                  Continuar a Datos y Tallas
                </Button>
              </div>
            </form>
          )}

          {/* ── Paso 2: Datos y Tallas ── */}
          {step === 2 && (
            <form onSubmit={handleSave} className="mt-8 space-y-7">
              {/* ── Card Datos del Producto ── */}
              <div className="rounded-[22px] border border-theme bg-surf shadow-card p-8 animate-slide-up delay-200">
                <div className="flex items-center gap-4 pb-5 border-b border-theme2">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-[16px]"
                    style={{
                      background: isEditMode
                        ? "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(99,102,241,0.12))"
                        : "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(99,102,241,0.12))",
                    }}
                  >
                    {isEditMode ? (
                      <Edit3 className="h-6 w-6 text-[#7c3aed]" />
                    ) : (
                      <Layers className="h-6 w-6 text-[#0ea5e9]" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-primary">
                      {isEditMode
                        ? "Editar Datos Oficiales"
                        : "Paso 2 · Datos Oficiales del Producto"}
                    </h2>
                    <p className="text-xs text-muted-t mt-0.5">
                      Información básica que aparecerá en la ficha del producto
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Nombre */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Nombre *
                    </label>
                    <input
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Air Max 90 Black Edition"
                      className="input-premium mt-2 h-[50px]"
                    />
                  </div>

                  {/* Modelo */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Modelo *
                    </label>
                    <input
                      required
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      placeholder="Ej. Air Max 90"
                      className="input-premium mt-2 h-[50px]"
                    />
                  </div>

                  {/* Marca */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Marca *{" "}
                      <span className="font-normal text-muted-t">
                        ({brands.length} disponibles)
                      </span>
                    </label>
                    <select
                      required
                      value={marcaId}
                      onChange={(e) => setMarcaId(Number(e.target.value))}
                      className="input-premium mt-2 h-[50px] font-semibold"
                    >
                      <option value={0} disabled>
                        — Selecciona una marca —
                      </option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Categoría */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Categoría *{" "}
                      <span className="font-normal text-muted-t">
                        ({categories.length} disponibles)
                      </span>
                    </label>
                    <select
                      required
                      value={categoriaId}
                      onChange={(e) => setCategoriaId(Number(e.target.value))}
                      className="input-premium mt-2 h-[50px] font-semibold"
                    >
                      <option value={0} disabled>
                        — Selecciona una categoría —
                      </option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Calidad */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Calidad *
                    </label>
                    <select
                      value={calidad}
                      onChange={(e) =>
                        setCalidad(e.target.value as CalidadKey)
                      }
                      className="input-premium mt-2 h-[50px] font-semibold"
                    >
                      {CALIDAD_OPCIONES.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Precio */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Precio Base ($ USD) *
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={precioBase}
                      onChange={(e) => setPrecioBase(e.target.value)}
                      placeholder="145.00"
                      className="input-premium mt-2 h-[50px] font-mono"
                    />
                  </div>

                  {/* Checkbox Producto Activo */}
                  <div className="sm:col-span-2 rounded-[18px] border border-theme bg-surf2 p-5">
                    <div className="flex items-start gap-4">
                      <div className="pt-0.5">
                        <label
                          className="relative inline-flex h-6 w-11 cursor-pointer items-center"
                          htmlFor="activo"
                        >
                          <input
                            id="activo"
                            type="checkbox"
                            checked={activo}
                            onChange={(e) => setActivo(e.target.checked)}
                            className="peer sr-only"
                          />
                          <span
                            className="absolute inset-0 rounded-full transition-colors peer-checked:bg-gradient-to-r peer-checked:from-[#0ea5e9] peer-checked:to-[#6366f1]"
                            style={{
                              background: activo
                                ? undefined
                                : "var(--bg-surface3)",
                              border: "1px solid var(--bg-border)",
                            }}
                          />
                          <span
                            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full transition-all ${
                              activo
                                ? "translate-x-5 bg-white shadow-md"
                                : "bg-white shadow-sm border border-theme"
                            }`}
                          />
                        </label>
                      </div>
                      <div className="flex-1">
                        <label
                          htmlFor="activo"
                          className="text-xs font-bold uppercase tracking-wider text-primary cursor-pointer"
                        >
                          Producto Activo
                          {activo ? (
                            <span className="ml-2 chip chip-success">
                              ✓ Visible en catálogo
                            </span>
                          ) : (
                            <span className="ml-2 chip chip-danger">
                              Oculto
                            </span>
                          )}
                        </label>
                        <p className="text-xs text-muted-t mt-1">
                          Si está activo aparecerá en el catálogo público.
                          Desactívalo para ocultarlo temporalmente.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Descripción <span className="text-muted-t font-normal">(Opcional)</span>
                    </label>
                    <textarea
                      rows={4}
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Materiales, amortiguación, historia del modelo, recomendaciones de uso..."
                      className="input-premium mt-2 rounded-[14px] p-4"
                    />
                  </div>
                </div>
              </div>

              {/* ── PANEL DE TALLAS ── */}
              <div className="rounded-[22px] border border-theme bg-surf shadow-card p-8 animate-slide-up delay-250">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-theme2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge tone="accent">Panel de Tallas</Badge>
                      <span className="chip chip-accent">
                        <Ruler className="h-3 w-3" />
                        {includedCount === 0
                          ? "Sin tallas seleccionadas"
                          : includedCount === 1
                          ? "1 talla incluida"
                          : `${includedCount} tallas incluidas`}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl text-primary">
                      Tallas Disponibles
                    </h2>
                    <p className="text-xs text-muted-t mt-1 max-w-2xl">
                      {isEditMode ? (
                        <>
                          Marca el check de cada talla que vende este producto.
                          Las filas con botones permiten <strong className="text-primary">Guardar Cambios</strong> o <strong className="text-[#dc2626]">Eliminar</strong> la variante directamente en el backend.
                          Las tallas nuevas se crearán al guardar el producto completo.
                        </>
                      ) : (
                        <>
                          Marca el check de cada talla que vende este producto.
                          Solo las tallas checkeadas se guardan vía{" "}
                          <code className="chip !py-0.5 !text-[10px]">
                            variantes_input
                          </code>
                          .
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto rounded-[18px] border border-theme2">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr
                        className="text-xs font-bold uppercase tracking-[0.12em] text-muted-t"
                        style={{
                          background:
                            "linear-gradient(180deg, var(--bg-surface2), var(--bg-surface3))",
                        }}
                      >
                        <th className="py-4 px-4 w-16 text-center">Incluir</th>
                        <th className="py-4 px-4">Talla</th>
                        <th className="py-4 px-4">Stock *</th>
                        <th className="py-4 px-4">Peso (kg)</th>
                        <th className="py-4 px-4">SKU</th>
                        {isEditMode && (
                          <th className="py-4 px-4 text-right">Acciones Granulares</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme2">
                      {tallas.map((t) => {
                        const s = selection[t.id] ?? emptyTallaData();
                        const disabled = !s.included;
                        const hasExistingVariant = Boolean(s.variantId);
                        return (
                          <tr
                            key={t.id}
                            className={`row-hover ${
                              s.included
                                ? "bg-gradient-to-r from-[rgba(14,165,233,0.06)] to-transparent"
                                : ""
                            }`}
                          >
                            <td className="py-4 px-4 text-center">
                              <label
                                htmlFor={`talla-${t.id}`}
                                className="relative inline-flex h-5 w-5 cursor-pointer items-center justify-center"
                              >
                                <input
                                  id={`talla-${t.id}`}
                                  type="checkbox"
                                  checked={s.included}
                                  onChange={() => toggleIncluded(t.id)}
                                  className="peer sr-only"
                                />
                                <span
                                  className={`flex h-5 w-5 items-center justify-center rounded-[6px] border-[1.5px] transition-all ${
                                    s.included
                                      ? "border-transparent bg-gradient-to-br from-[#0ea5e9] to-[#6366f1]"
                                      : "bg-surf"
                                  }`}
                                  style={{
                                    borderColor: s.included
                                      ? undefined
                                      : "var(--input-border)",
                                  }}
                                >
                                  {s.included && (
                                    <svg
                                      className="h-3 w-3 text-white"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth="3.5"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </span>
                              </label>
                            </td>
                            <td className="py-4 px-4">
                              <label
                                htmlFor={`talla-${t.id}`}
                                className="inline-flex items-center gap-2 cursor-pointer select-none"
                              >
                                <span
                                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold text-primary"
                                  style={{
                                    background:
                                      "linear-gradient(135deg, var(--bg-surface2), var(--bg-surface3))",
                                    border: "1px solid var(--bg-border)",
                                  }}
                                >
                                  <Ruler className="h-3.5 w-3.5 text-muted-t" />
                                  Talla {t.valor}
                                  <span className="text-[10px] font-mono text-muted-t">
                                    #{t.id}
                                  </span>
                                </span>
                                {hasExistingVariant && (
                                  <span className="chip chip-success ml-1">
                                    EXISTE
                                  </span>
                                )}
                              </label>
                            </td>
                            <td className="py-4 px-4">
                              <input
                                type="number"
                                min="0"
                                disabled={disabled}
                                value={s.stock}
                                onChange={(e) =>
                                  updateSelection(t.id, {
                                    stock: e.target.value,
                                  })
                                }
                                className="input-premium h-[44px] !py-0 disabled:opacity-40 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="py-4 px-4">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                disabled={disabled}
                                value={s.pesoKg}
                                onChange={(e) =>
                                  updateSelection(t.id, {
                                    pesoKg: e.target.value,
                                  })
                                }
                                className="input-premium h-[44px] !py-0 disabled:opacity-40 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="py-4 px-4">
                              <input
                                disabled={disabled}
                                value={s.sku}
                                onChange={(e) =>
                                  updateSelection(t.id, {
                                    sku: e.target.value,
                                  })
                                }
                                placeholder="EJ. AM90-NGR-41"
                                className="input-premium h-[44px] !py-0 font-mono uppercase disabled:opacity-40 disabled:cursor-not-allowed"
                              />
                            </td>
                            {isEditMode && (
                              <td className="py-4 px-4 text-right">
                                {hasExistingVariant ? (
                                  <div className="inline-flex items-center justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleSaveVariantRow(t.id)
                                      }
                                      isLoading={savingRow === t.id}
                                      disabled={
                                        savingRow !== null ||
                                        deletingRow !== null
                                      }
                                    >
                                      <Save className="h-3.5 w-3.5" /> Guardar
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-[#dc2626] hover:bg-[rgba(220,38,38,0.08)]"
                                      onClick={() =>
                                        handleDeleteVariantRow(t.id)
                                      }
                                      isLoading={deletingRow === t.id}
                                      disabled={
                                        savingRow !== null ||
                                        deletingRow !== null
                                      }
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ) : s.included ? (
                                  <span className="chip chip-accent">
                                    Nueva · se crea al guardar
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-t">
                                    Marca el check →
                                  </span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="mt-5 text-xs text-muted-t leading-relaxed">
                  1) Crea todas tus tallas maestras en{" "}
                  <Link
                    to="/admin/tallas"
                    className="font-semibold text-[#0369a1] underline decoration-dotted underline-offset-2"
                  >
                    Gestión → Tallas
                  </Link>
                  . 2) Aquí solo marcas un check y rellenas Stock / Peso / SKU
                  para cada talla para esta zapatilla. 3) Las ofertas (precio
                  oferta) se gestionan por separado en el módulo de
                  Promociones.
                  {isEditMode && (
                    <>
                      {" "}
                      4) Para variantes existentes puedes usar{" "}
                      <strong className="text-primary">Guardar</strong> para
                      actualizar individualmente vía PATCH o{" "}
                      <strong className="text-[#dc2626]">Eliminar</strong> para
                      borrarla vía DELETE.
                    </>
                  )}
                </p>
              </div>

              {/* ── Botones finales ── */}
              <div className="flex justify-end gap-3 animate-slide-up delay-300">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Atrás (Imagen)
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  className="glow-brand-sm"
                  isLoading={isSubmitting}
                >
                  {isEditMode ? (
                    <>
                      <Save className="h-4 w-4" />
                      Guardar Cambios
                    </>
                  ) : (
                    <>Crear Zapatilla</>
                  )}
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
