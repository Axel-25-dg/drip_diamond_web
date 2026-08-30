import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Plus, Edit2, Trash2, CheckCircle2, XCircle,
  Truck, ArrowLeft, Search, Tag, AlertCircle, RefreshCw, Power
} from "lucide-react";
import { toast } from "sonner";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Promotion } from "@/domain/entities/Product";
import { Button } from "@/presentation/components/ui/Button";
import { Input } from "@/presentation/components/ui/Input";
import { Spinner } from "@/presentation/components/ui/Spinner";

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<"ENVIO_GRATIS_DOS_PARES" | "DESCUENTO_PORCENTAJE" | "DESCUENTO_FIJO" | "GENERAL">("ENVIO_GRATIS_DOS_PARES");
  const [minPares, setMinPares] = useState(2);
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState<number | undefined>(undefined);
  const [descuentoFijo, setDescuentoFijo] = useState<number | undefined>(undefined);
  const [activo, setActivo] = useState(true);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const res = await useCases.getPromotions.execute();
      setPromotions(res);
    } catch {
      toast.error("No se pudieron cargar las promociones.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleOpenModal = (promo?: Promotion) => {
    if (promo) {
      setEditingPromo(promo);
      setTitulo(promo.titulo);
      setDescripcion(promo.descripcion || "");
      setTipo(promo.tipo || "ENVIO_GRATIS_DOS_PARES");
      setMinPares(promo.minPares ?? 2);
      setDescuentoPorcentaje(promo.descuentoPorcentaje);
      setDescuentoFijo(promo.descuentoFijo);
      setActivo(promo.activo);
    } else {
      setEditingPromo(null);
      setTitulo("Envío GRATIS por 2 o más pares");
      setDescripcion("Por la compra de 2 o más pares de zapatillas, el envío es completamente gratis a todo Quito.");
      setTipo("ENVIO_GRATIS_DOS_PARES");
      setMinPares(2);
      setDescuentoPorcentaje(undefined);
      setDescuentoFijo(undefined);
      setActivo(true);
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      toast.error("Ingresa el título de la promoción.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<Promotion> = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        tipo,
        minPares,
        descuentoPorcentaje,
        descuentoFijo,
        activo,
      };

      if (editingPromo) {
        await useCases.updatePromotion.execute(editingPromo.id, payload);
        toast.success("Promoción actualizada correctamente.");
      } else {
        await useCases.createPromotion.execute(payload);
        toast.success("Promoción creada exitosamente.");
      }
      setShowModal(false);
      window.dispatchEvent(new CustomEvent("promotions:updated"));
      fetchPromotions();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo guardar la promoción.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (promo: Promotion) => {
    try {
      await useCases.togglePromotion.execute(promo.id, !promo.activo);
      toast.success(
        !promo.activo
          ? `Promoción "${promo.titulo}" activada`
          : `Promoción "${promo.titulo}" desactivada`
      );
      window.dispatchEvent(new CustomEvent("promotions:updated"));
      fetchPromotions();
    } catch {
      toast.error("No se pudo cambiar el estado de la promoción.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta promoción?")) return;
    try {
      await useCases.deletePromotion.execute(id);
      toast.success("Promoción eliminada.");
      window.dispatchEvent(new CustomEvent("promotions:updated"));
      fetchPromotions();
    } catch {
      toast.error("No se pudo eliminar la promoción.");
    }
  };

  const filtered = promotions.filter((p) =>
    [p.titulo, p.descripcion].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = promotions.filter((p) => p.activo).length;
  const freeShippingPromo = promotions.find((p) => p.tipo === "ENVIO_GRATIS_DOS_PARES" && p.activo);

  return (
    <div className="container-app py-6 sm:py-8 lg:py-10 text-slate-900 dark:text-white">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/admin"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al panel admin
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Promociones & Envío Gratis
            </h1>
            <span className="rounded-full bg-blue-100 dark:bg-sky-950/60 px-3 py-1 text-xs font-bold text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-sky-800/50">
              Descuentos & Reglas
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Administra promociones activas, descuentos y la regla de Envío Gratis por 2 o más pares de zapatillas.
          </p>
        </div>

        <Button
          onClick={() => handleOpenModal()}
          variant="secondary"
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 border-none"
        >
          <Plus className="h-4 w-4" /> Crear Promoción
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Promociones</span>
            <Tag className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-2 font-display text-3xl font-black text-slate-900 dark:text-white">{promotions.length}</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Activas Ahora</span>
            <Sparkles className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-2 font-display text-3xl font-black text-emerald-700 dark:text-emerald-300">{activeCount}</p>
        </div>

        <div className="rounded-2xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/20 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">Envío Gratis (2+ Pares)</span>
            <Truck className="h-5 w-5 text-sky-500" />
          </div>
          <p className="mt-2 text-sm font-bold text-sky-800 dark:text-sky-300">
            {freeShippingPromo ? "✅ Activa (2+ pares)" : "⚠️ Inactiva"}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {freeShippingPromo ? `Mínimo ${freeShippingPromo.minPares ?? 2} pares para $0.00 de envío` : "Sin regla activa"}
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título..."
            className="w-full rounded-full border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={fetchPromotions}
          className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-full border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#171a22]"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Actualizar
        </button>
      </div>

      {/* Promotions List */}
      {isLoading ? (
        <Spinner full />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] p-12 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 font-display text-lg font-bold text-slate-900 dark:text-white">
            No se encontraron promociones
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Crea una nueva promoción con el botón superior para activarla inmediatamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((promo) => (
            <div
              key={promo.id}
              className={`relative overflow-hidden rounded-2xl border bg-white dark:bg-[#12151c] p-6 shadow-sm transition-all ${
                promo.activo
                  ? "border-emerald-200 dark:border-emerald-900/40"
                  : "border-slate-200 dark:border-[#222732] opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                        promo.tipo === "ENVIO_GRATIS_DOS_PARES"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-blue-100 text-blue-800 dark:bg-sky-950/60 dark:text-sky-300"
                      }`}
                    >
                      {promo.tipo === "ENVIO_GRATIS_DOS_PARES" ? (
                        <>
                          <Truck className="h-3 w-3" /> Envío Gratis (2+ Pares)
                        </>
                      ) : promo.tipo === "DESCUENTO_PORCENTAJE" ? (
                        <>
                          <Tag className="h-3 w-3" /> Descuento %
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" /> Promoción General
                        </>
                      )}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        promo.activo
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {promo.activo ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {promo.activo ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-lg font-black text-slate-900 dark:text-white">
                    {promo.titulo}
                  </h3>

                  {promo.descripcion && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {promo.descripcion}
                    </p>
                  )}

                  {promo.tipo === "ENVIO_GRATIS_DOS_PARES" && (
                    <div className="mt-3 rounded-xl bg-slate-50 dark:bg-[#171a22] p-3 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-[#222732]">
                      💡 <strong>Regla aplicable:</strong> Cuando el cliente agrega <strong>{promo.minPares ?? 2} o más pares</strong> de zapatillas a su carrito, el envío pasa a ser <strong>$0.00 GRATIS</strong> automáticamente en el Checkout.
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(promo)}
                    title={promo.activo ? "Desactivar" : "Activar"}
                    className={`rounded-full p-2 text-xs transition-colors ${
                      promo.activo
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <Power className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleOpenModal(promo)}
                    title="Editar"
                    className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(promo.id)}
                    title="Eliminar"
                    className="rounded-full p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] shadow-2xl">
            <div className="border-b border-slate-100 dark:border-[#222732] p-5">
              <h2 className="font-display text-xl font-black text-slate-900 dark:text-white">
                {editingPromo ? "Editar Promoción" : "Nueva Promoción"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Configura los parámetros para que se aplique automáticamente a las compras.
              </p>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Título de la promoción
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="ej. Envío GRATIS por 2 o más pares"
                  className="w-full rounded-xl border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#171a22] p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe la ventaja o regla para el cliente..."
                  className="w-full rounded-xl border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#171a22] p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tipo de promoción
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#171a22] p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  >
                    <option value="ENVIO_GRATIS_DOS_PARES">Envío Gratis por Pares</option>
                    <option value="DESCUENTO_PORCENTAJE">Descuento Porcentaje (%)</option>
                    <option value="DESCUENTO_FIJO">Descuento Fijo ($)</option>
                    <option value="GENERAL">General / Informativa</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mínimo de pares requeridos
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={minPares}
                    onChange={(e) => setMinPares(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#171a22] p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="activo-check"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="activo-check" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Promoción Activa en la tienda
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-[#222732] pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-none"
                >
                  Guardar Promoción
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
