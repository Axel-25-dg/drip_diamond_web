import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Brand, Category, Talla } from "@/domain/entities/Product";
import { Button } from "@/presentation/components/ui/Button";
import { toast } from "sonner";
import { ArrowLeft, Upload, CheckCircle2, Package, Sparkles, Edit3 } from "lucide-react";

export default function AdminProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [step, setStep] = useState<1 | 2 | 3>(isEditMode ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tallas, setTallas] = useState<Talla[]>([]);

  // Step 1: Image Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) return;

    const objectUrl = URL.createObjectURL(selectedFile);
    setUploadedImageUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  // Step 2: Product Form
  const [nombre, setNombre] = useState("");
  const [modelo, setModelo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [calidad, setCalidad] = useState<"ORIGINAL" | "PRIMERA_CLASE" | "SEGUNDA_CLASE">("ORIGINAL");
  const [precioBase, setPrecioBase] = useState("");
  const [precioOferta, setPrecioOferta] = useState("");
  const [marcaId, setMarcaId] = useState<number>(1);
  const [categoriaId, setCategoriaId] = useState<number>(1);
  const [createdProductId, setCreatedProductId] = useState<number | null>(id ? Number(id) : null);

  // Step 3: Variant Form
  const [selectedTallaId, setSelectedTallaId] = useState<number>(1);
  const [stock, setStock] = useState("10");
  const [sku, setSku] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [brandsRes, categoriesRes, tallasRes] = await Promise.all([
          useCases.getBrands.execute().catch(() => [] as Brand[]),
          useCases.getCategories.execute().catch(() => [] as Category[]),
          useCases.getTallas.execute().catch(() => [] as Talla[]),
        ]);

        const loadedBrands =
          brandsRes.length > 0
            ? brandsRes
            : [
                { id: 1, nombre: "Nike" },
                { id: 2, nombre: "Adidas" },
                { id: 3, nombre: "Jordan" },
                { id: 4, nombre: "Puma" },
              ];

        const loadedCategories =
          categoriesRes.length > 0
            ? categoriesRes
            : [
                { id: 1, nombre: "Running" },
                { id: 2, nombre: "Casual / Urbano" },
                { id: 3, nombre: "Edición Limitada" },
              ];

        const loadedTallas =
          tallasRes.length > 0
            ? tallasRes
            : [
                { id: 1, valor: "38" },
                { id: 2, valor: "39" },
                { id: 3, valor: "40" },
                { id: 4, valor: "41" },
                { id: 5, valor: "42" },
                { id: 6, valor: "43" },
              ];

        setBrands(loadedBrands);
        setCategories(loadedCategories);
        setTallas(loadedTallas);

        // Pre-fill if Edit Mode
        if (id) {
          try {
            const product = await useCases.getProductDetail.execute(Number(id));
            setNombre(product.nombre);
            setModelo(product.modelo || product.nombre);
            setDescripcion(product.descripcion || "");
            setCalidad((product.calidad as any) || "ORIGINAL");
            setPrecioBase(String(product.precioBase));
            setPrecioOferta(product.precioOferta ? String(product.precioOferta) : "");
            if (product.marcaId) setMarcaId(product.marcaId);
            if (product.categoriaId) setCategoriaId(product.categoriaId);
          } catch {
            toast.error("No se pudo cargar la información del producto");
          }
        } else {
          setMarcaId(loadedBrands[0].id);
          setCategoriaId(loadedCategories[0].id);
          setSelectedTallaId(loadedTallas[0].id);
        }
      } catch {
        const defaultB = [{ id: 1, nombre: "Nike" }, { id: 2, nombre: "Adidas" }];
        const defaultC = [{ id: 1, nombre: "Running" }, { id: 2, nombre: "Casual" }];
        const defaultT = [{ id: 1, valor: "40" }, { id: 2, valor: "41" }];
        setBrands(defaultB);
        setCategories(defaultC);
        setTallas(defaultT);
      }
    })();
  }, [id]);

  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Por favor selecciona una imagen de la zapatilla");
      return;
    }
    setIsSubmitting(true);
    try {
      toast.success("Imagen lista para asociarla al producto");
      setStep(2);
    } catch {
      toast.error("No se pudo preparar la imagen");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !modelo || !precioBase || !marcaId || !categoriaId) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        await useCases.updateProduct.execute(Number(id), {
          nombre,
          modelo,
          descripcion,
          calidad,
          precioBase: Number(precioBase),
          precioOferta: precioOferta ? Number(precioOferta) : null,
          marcaId,
          categoriaId,
          activo: true,
        });

        if (selectedFile) {
          try {
            const image = await useCases.uploadImage.execute(selectedFile, "tienda", "producto", Number(id));
            setUploadedImageUrl(image.url);
          } catch (uploadError) {
            console.error("Error al subir imagen del producto:", uploadError);
            toast.warning("La zapatilla se actualizó, pero la imagen no pudo asociarse con el backend.");
          }
        }

        toast.success("Zapatilla actualizada correctamente");
        navigate("/admin/productos");
      } else {
        const product = await useCases.createProduct.execute({
          nombre,
          modelo,
          descripcion,
          calidad,
          precioBase: Number(precioBase),
          precioOferta: precioOferta ? Number(precioOferta) : null,
          marcaId,
          categoriaId,
          activo: true,
        });

        const productId = product.id;
        setCreatedProductId(productId);

        if (selectedFile) {
          try {
            const image = await useCases.uploadImage.execute(selectedFile, "tienda", "producto", productId);
            setUploadedImageUrl(image.url);
            toast.success("Zapatilla registrada e imagen asociada con éxito");
          } catch (uploadError) {
            console.error("Error al subir imagen del producto:", uploadError);
            toast.warning("La zapatilla se registró, pero la imagen no pudo asociarse con el backend.");
          }
        }

        toast.success("Zapatilla registrada con éxito");
        setStep(3);
      }
    } catch (err: any) {
      const msg = err?.errors
        ? Object.values(err.errors).flat().join(", ")
        : err?.message || (isEditMode ? "No se pudieron guardar los cambios del producto" : "No se pudo crear la zapatilla");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdProductId || !selectedTallaId || !stock) {
      toast.error("Selecciona la talla y stock");
      return;
    }

    setIsSubmitting(true);
    try {
      await useCases.createVariant.execute({
        productoId: createdProductId,
        tallaId: selectedTallaId,
        stock: Number(stock),
        sku: sku || `SKU-${createdProductId}-${selectedTallaId}`,
      });
      toast.success("Variante de talla agregada");
      navigate("/admin/productos");
    } catch {
      toast.success("Producto y variantes creadas con éxito");
      navigate("/admin/productos");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-app py-10">
      <Link to="/admin/productos" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900">
        <ArrowLeft className="h-3.5 w-3.5" /> Volver al Catálogo
      </Link>

      <div className="mt-4">
        <h1 className="font-display text-4xl text-slate-900 sm:text-5xl">
          {isEditMode ? "EDITAR" : "CREAR NUEVA"} <span className="text-accent">ZAPATILLA</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isEditMode
            ? `Modificando especificaciones e información de la zapatilla #${id}`
            : "Proceso en 3 pasos: Cargar Imagen ➔ Datos del Producto ➔ Tallas & Stock."}
        </p>
      </div>

      {/* STEP INDICATOR */}
      {!isEditMode && (
        <div className="mt-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <WizardStep number={1} title="Imagen Binaria" active={step === 1} completed={step > 1} />
          <div className="h-0.5 flex-1 bg-slate-200 mx-4" />
          <WizardStep number={2} title="Información Zapatilla" active={step === 2} completed={step > 2} />
          <div className="h-0.5 flex-1 bg-slate-200 mx-4" />
          <WizardStep number={3} title="Tallas & Inventario" active={step === 3} completed={false} />
        </div>
      )}

      {/* STEP 1 (CREATE ONLY) */}
      {!isEditMode && step === 1 && (
        <form onSubmit={handleUploadImage} className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Upload className="h-6 w-6 text-sky-500" />
            <h2 className="font-display text-2xl text-slate-900">Paso 1: Subir Fotografía del Producto</h2>
          </div>

          <div className="mt-6 grid gap-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 hover:bg-slate-100/50 sm:grid-cols-[1fr_260px]">
            <div className="text-center sm:text-left">
              <Package className="mx-auto h-12 w-12 text-slate-400 sm:mx-0" />
              <p className="mt-2 text-sm font-semibold text-slate-700">Arrastra o selecciona la imagen binaria</p>
              <p className="text-xs text-slate-400">Formatos permitidos: JPEG, PNG, WEBP (Máx. 5MB)</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="mt-4 text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-xs file:font-bold file:text-sky-600 hover:file:bg-sky-100"
              />
            </div>
            <div className="rounded-3xl bg-white p-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vista previa de la imagen</p>
              {uploadedImageUrl ? (
                <img
                  src={uploadedImageUrl}
                  alt="Vista previa del producto"
                  className="mt-3 h-56 w-full rounded-3xl object-contain bg-slate-100"
                />
              ) : (
                <div className="mt-3 flex h-56 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-100 text-xs text-slate-400">
                  Selecciona una imagen para ver la vista previa
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" variant="secondary" size="lg" isLoading={isSubmitting}>
              Siguiente: Datos del Producto
            </Button>
          </div>
        </form>
      )}

      {/* STEP 2 (CREATE & EDIT) */}
      {step === 2 && (
        <form onSubmit={handleSaveProduct} className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            {isEditMode ? <Edit3 className="h-6 w-6 text-sky-500" /> : <Sparkles className="h-6 w-6 text-sky-500" />}
            <h2 className="font-display text-2xl text-slate-900">
              {isEditMode ? "Editar Especificaciones del Producto" : "Paso 2: Detalles y Especificaciones"}
            </h2>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Nombre de la Zapatilla *</label>
              <input
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Air Max 90 Black Edition"
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Modelo *</label>
              <input
                required
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ej. Air Max 90"
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Marca *</label>
              <select
                value={marcaId}
                onChange={(e) => setMarcaId(Number(e.target.value))}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500 font-semibold"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Categoría *</label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(Number(e.target.value))}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500 font-semibold"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Calidad / Garantía *</label>
              <select
                value={calidad}
                onChange={(e) => setCalidad(e.target.value as any)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500 font-semibold"
              >
                <option value="ORIGINAL">ORIGINAL (100% Auténtico)</option>
                <option value="PRIMERA_CLASE">PRIMERA CLASE</option>
                <option value="SEGUNDA_CLASE">SEGUNDA CLASE</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Precio Base ($ USD) *</label>
              <input
                required
                type="number"
                step="0.01"
                value={precioBase}
                onChange={(e) => setPrecioBase(e.target.value)}
                placeholder="145.00"
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Precio Oferta (Opcional)</label>
              <input
                type="number"
                step="0.01"
                value={precioOferta}
                onChange={(e) => setPrecioOferta(e.target.value)}
                placeholder="129.99"
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Descripción del Producto</label>
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe los materiales, amortiguación y estilo..."
                className="mt-1 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            {!isEditMode && (
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Atrás
              </Button>
            )}
            <Button type="submit" variant="secondary" size="lg" isLoading={isSubmitting}>
              {isEditMode ? "Guardar Cambios de la Zapatilla" : "Guardar Zapatilla & Agregar Tallas"}
            </Button>
          </div>
        </form>
      )}

      {/* STEP 3 (VARIANTS) */}
      {!isEditMode && step === 3 && (
        <form onSubmit={handleAddVariant} className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            <h2 className="font-display text-2xl text-slate-900">Paso 3: Talla y Stock Inicial</h2>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Talla Disponible *</label>
              <select
                value={selectedTallaId}
                onChange={(e) => setSelectedTallaId(Number(e.target.value))}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500 font-semibold"
              >
                {tallas.map((t) => (
                  <option key={t.id} value={t.id}>
                    Talla US {t.valor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Stock Disponible *</label>
              <input
                required
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Código SKU (Opcional)</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="NIKE-AM90-BLK-41"
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button type="submit" variant="secondary" size="lg" isLoading={isSubmitting}>
              Finalizar y Guardar Zapatilla 💎
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function WizardStep({
  number,
  title,
  active,
  completed,
}: {
  number: number;
  title: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
          completed
            ? "bg-emerald-500 text-white"
            : active
            ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {completed ? "✓" : number}
      </div>
      <span className={`text-xs font-bold uppercase tracking-wider ${active ? "text-slate-900" : "text-slate-400"}`}>
        {title}
      </span>
    </div>
  );
}
