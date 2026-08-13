import { useEffect, useMemo, useState } from "react";
import { Search, CreditCard, MessageSquare, UserCheck, AlertCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Seller } from "@/domain/entities/User";
import type { ShippingZone } from "@/domain/entities/Order";
import { useCartStore } from "@/presentation/store/cartStore";
import { Input } from "@/presentation/components/ui/Input";
import { Button } from "@/presentation/components/ui/Button";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { formatCurrency, resolveMediaUrl } from "@/presentation/utils/format";

interface CheckoutForm {
  tipoEntrega: "DOMICILIO" | "RETIRO_LOCAL";
  direccionEnvio: string;
  referenciaAdicional: string;
  provincia: string;
  ciudad: string;
  telefonoContacto: string;
  vendedorId: string;
  notas: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCartStore();

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [sellerSearch, setSellerSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sellersLoading, setSellersLoading] = useState(true);
  const [sellersError, setSellersError] = useState(false);
  const [sellersLoadAttempt, setSellersLoadAttempt] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutForm>({
    defaultValues: {
      tipoEntrega: "DOMICILIO",
      vendedorId: "",
      provincia: "",
      referenciaAdicional: "",
      notas: "",
    },
  });

  const location = useLocation();
  const refParam = new URLSearchParams(location.search).get("ref");

  // ── Load cart + zones (independent of sellers) ──────────────────────────
  useEffect(() => {
    Promise.all([
      useCases.getShippingZones.execute(),
      fetchCart(),
    ])
      .then(([z]) => setZones(z))
      .catch(() => toast.error("No se pudo cargar la información de envío."))
      .finally(() => setIsLoading(false));
  }, []);

  // ── Load active sellers — separate request with JWT auto-injected ─────────
  useEffect(() => {
    setSellersLoading(true);
    setSellersError(false);

    useCases.getActiveSellers
      .execute()
      .then((s) => {
        setSellers(s);

        // Auto-select seller from ?ref= URL param
        if (refParam && s.length > 0) {
          const m = refParam.match(/(\d+)$/);
          const selId = m ? Number(m[1]) : null;
          const found = selId
            ? s.find((x) => x.id === selId)
            : s.find(
                (x) =>
                  `${x.id}` === refParam ||
                  `${x.nombre} ${x.apellido}`.toLowerCase().includes(refParam.toLowerCase()) ||
                  x.correo?.toLowerCase().includes(refParam.toLowerCase())
              );
          if (found) {
            setValue("vendedorId", String(found.id));
            toast.info(`Vendedor ${found.nombre} ${found.apellido} preseleccionado.`);
          }
        }
      })
      .catch((err) => {
        // Log para diagnóstico
        if (import.meta.env.DEV) {
          console.warn("[CheckoutPage] getActiveSellers error:", err);
        }
        setSellersError(true);
        // Non-fatal: user can still checkout without a seller
      })
      .finally(() => setSellersLoading(false));
  }, [sellersLoadAttempt]);

  const provincia = watch("provincia");
  const ciudad = watch("ciudad");

  const shippingCost = useMemo(() => {
    const match = zones.find(
      (z) =>
        z.provincia.toLowerCase() === (provincia || "").toLowerCase() &&
        z.ciudad.toLowerCase() === (ciudad || "").toLowerCase()
    );
    return match?.costo ?? null;
  }, [zones, provincia, ciudad]);

  const subtotal = cart?.subtotal ?? 0;
  const total = subtotal + (shippingCost ?? 0);

  const filteredSellers = useMemo(() => {
    const q = sellerSearch.trim().toLowerCase();
    if (!q) return sellers;
    return sellers.filter((s) =>
      [s.nombre, s.apellido, s.correo].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [sellerSearch, sellers]);

  const onSubmit = async (form: CheckoutForm) => {
    if (!cart || cart.items.length === 0) {
      toast.error("Tu carrito está vacío.");
      return;
    }
    setIsSubmitting(true);
    try {
      const order = await useCases.createOrder.execute({
        direccionEnvio: form.direccionEnvio,
        direccionFormateada: form.direccionEnvio,
        provincia: form.provincia,
        ciudad: form.ciudad,
        telefonoContacto: form.telefonoContacto,
        // vendedorId is sent as number or null
        vendedorId: form.vendedorId ? Number(form.vendedorId) : null,
        notas: form.notas || form.referenciaAdicional,
        referenciaAdicional: form.referenciaAdicional || form.notas,
        tipoEntrega: form.tipoEntrega,
      });
      toast.success("Pedido creado. Ahora sube tu comprobante de pago.");
      navigate(`/pedidos/${order.id}`);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo crear el pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Spinner full />;

  return (
    <div className="container-app py-6 sm:py-8 lg:py-12 text-slate-900 dark:text-white">
      <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 sm:mt-8 grid gap-6 lg:gap-10 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        <div className="flex flex-col gap-8">

          {/* ── Shipping data ── */}
          <section>
            <h2 className="mb-4 font-display text-xl font-bold text-slate-900 dark:text-white">Datos de envío</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de entrega</label>
                <select
                  {...register("tipoEntrega", { required: "Requerido" })}
                  className="h-12 w-full rounded-xl border border-blue-100 dark:border-[#222732] bg-white dark:bg-[#12151c] px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-400"
                >
                  <option value="DOMICILIO">Domicilio</option>
                  <option value="RETIRO_LOCAL">Retiro local</option>
                </select>
              </div>
              <Input
                label="Provincia"
                placeholder="Pichincha"
                error={errors.provincia?.message}
                {...register("provincia", { required: "Requerido" })}
              />
              <Input
                label="Ciudad"
                placeholder="Quito"
                error={errors.ciudad?.message}
                {...register("ciudad", { required: "Requerido" })}
              />
              <Input
                label="Dirección exacta"
                placeholder="Av. Amazonas y Naciones Unidas"
                className="sm:col-span-2"
                error={errors.direccionEnvio?.message}
                {...register("direccionEnvio", { required: "Requerido" })}
              />
              <Input
                label="Referencia adicional"
                placeholder="Casa azul, junto a la panadería"
                className="sm:col-span-2"
                {...register("referenciaAdicional")}
              />
              <Input
                label="Teléfono de contacto"
                placeholder="09XXXXXXXX"
                error={errors.telefonoContacto?.message}
                {...register("telefonoContacto", { required: "Requerido" })}
              />
            </div>
          </section>

          {/* ── Seller selector ── */}
          <section>
            <h2 className="mb-1 font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-sky-500" />
              Vendedor
            </h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Si alguien te atendió, selecciónalo para que reciba su comisión ($4 por par entregado).
            </p>

            <div className="max-w-xl rounded-2xl border border-blue-100 dark:border-[#222732] bg-white dark:bg-[#12151c] p-4 shadow-sm">
              {sellersLoading ? (
                <div className="flex items-center gap-2 py-3 text-sm text-slate-500 dark:text-slate-400">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
                  Cargando vendedores...
                </div>
              ) : sellersError ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    No se pudieron cargar los vendedores. Puedes continuar sin seleccionar uno.
                  </div>
                  <button
                    type="button"
                    onClick={() => setSellersLoadAttempt((n) => n + 1)}
                    className="self-start text-xs text-sky-600 underline hover:text-sky-800 dark:text-sky-400"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <>
                  {/* Search box */}
                  <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      value={sellerSearch}
                      onChange={(e) => setSellerSearch(e.target.value)}
                      placeholder="Buscar por nombre o correo..."
                      className="h-11 w-full rounded-xl border border-blue-100 dark:border-[#222732] bg-slate-50 dark:bg-[#171a22] pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-sky-400"
                    />
                  </div>

                  {/* Select */}
                  <select
                    {...register("vendedorId")}
                    className="h-12 w-full rounded-xl border border-blue-100 dark:border-[#222732] bg-white dark:bg-[#171a22] px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-400"
                  >
                    <option value="">— Ningún vendedor —</option>
                    {filteredSellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} {s.apellido}{s.correo ? ` · ${s.correo}` : ""}
                      </option>
                    ))}
                  </select>

                  {sellerSearch && filteredSellers.length === 0 && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      No se encontraron vendedores con "{sellerSearch}".
                    </p>
                  )}
                  {sellers.length === 0 && !sellerSearch && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      No hay vendedores activos registrados en este momento.
                    </p>
                  )}
                  {sellers.length > 0 && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {sellers.length} vendedor{sellers.length !== 1 ? "es" : ""} disponible{sellers.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </>
              )}
            </div>
          </section>

          {/* ── Bank info ── */}
          <section className="rounded-3xl border border-blue-100 dark:border-[#222732] bg-white dark:bg-[#12151c] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 shadow-sm dark:bg-sky-950 dark:text-sky-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">Pago por Transferencia Bancaria</h2>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">Banco Pichincha Ecuador</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 rounded-2xl bg-slate-50 dark:bg-[#171a22] p-4 text-sm">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Banco</span>
                <span className="mt-1 block font-semibold text-slate-900 dark:text-white">Banco Pichincha</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">N° de Cuenta</span>
                <span className="mt-1 block font-mono font-bold text-sky-600 dark:text-sky-400">2213521473</span>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Titular</span>
                <span className="mt-1 block font-semibold text-slate-900 dark:text-white">Danny Alexander Guaman Pillajo</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-blue-100 dark:border-[#222732] bg-sky-50 dark:bg-sky-950/40 p-4 text-sm leading-relaxed">
              <p className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <MessageSquare className="h-4 w-4 text-sky-600 dark:text-sky-400" /> Pasos para confirmar tu pedido:
              </p>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-slate-700 dark:text-slate-300">
                <li>Realiza la transferencia del monto total a la cuenta indicada.</li>
                <li>Sube el comprobante en <strong>Mis pedidos</strong> después de confirmar.</li>
                <li>Si deseas, envía también el comprobante por WhatsApp a{" "}
                  <a
                    href="https://wa.me/593999001471?text=Hola,%20adjunto%20mi%20comprobante%20de%20pago"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-sky-600 dark:text-sky-400 underline"
                  >
                    +593 999 001 471
                  </a>.
                </li>
              </ol>
            </div>
          </section>

          {/* ── Notes ── */}
          <section>
            <h2 className="mb-3 font-display text-xl font-bold text-slate-900 dark:text-white">Notas <span className="text-sm font-normal text-slate-400">(opcional)</span></h2>
            <textarea
              {...register("notas")}
              rows={3}
              placeholder="Indicaciones adicionales para tu pedido"
              className="w-full rounded-xl border border-blue-100 dark:border-[#222732] bg-white dark:bg-[#12151c] p-4 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-400"
            />
          </section>
        </div>
        {/* ── Order summary ── */}
        <aside className="h-fit rounded-2xl bg-white dark:bg-[#12151c] text-slate-900 dark:text-white p-6 border border-slate-100 dark:border-[#222732] shadow-sm sticky top-20">
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">Resumen del pedido</h3>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            {cart?.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={resolveMediaUrl(item.imagenUrl) ?? "/placeholder.svg"} alt={item.nombre}
                    className="h-12 w-12 rounded-lg object-contain bg-slate-50 dark:bg-slate-800 p-2" onError={(e)=>{(e.currentTarget as HTMLImageElement).src="/placeholder.svg"}} />
                  <div className="truncate">
                    <div className="text-sm font-medium truncate text-slate-900 dark:text-white">{item.nombre}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">x{item.cantidad}</div>
                  </div>
                </div>
                <div className="font-medium text-slate-900 dark:text-white">{formatCurrency(item.precioUnitario * item.cantidad)}</div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 dark:border-[#222732] pt-4 text-sm">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Envío</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {shippingCost != null ? formatCurrency(shippingCost) : "Según tu ciudad"}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-100 dark:border-[#222732] pt-2 text-base font-bold text-slate-900 dark:text-white">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Selected seller summary */}
          {watch("vendedorId") && (
            <div className="mt-4 rounded-xl border border-blue-100 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-950/40 px-4 py-3 text-xs">
              <p className="font-semibold text-sky-700 dark:text-sky-300">Vendedor seleccionado:</p>
              <p className="text-sky-600 dark:text-sky-400">
                {sellers.find((s) => String(s.id) === watch("vendedorId"))
                  ? `${sellers.find((s) => String(s.id) === watch("vendedorId"))!.nombre} ${sellers.find((s) => String(s.id) === watch("vendedorId"))!.apellido}`
                  : `ID #${watch("vendedorId")}`}
              </p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            className="mt-6"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Confirmar pedido
          </Button>
          <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">Después de confirmar, subirás tu comprobante de pago.</p>
        </aside>
      </form>
    </div>
  );
}
