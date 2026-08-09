import { useEffect, useMemo, useState } from "react";
import { Search, CreditCard, MessageSquare } from "lucide-react";
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
import { formatCurrency } from "@/presentation/utils/format";

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
  const query = new URLSearchParams(location.search);
  const refParam = query.get("ref");

  useEffect(() => {
    Promise.all([useCases.getActiveSellers.execute(), useCases.getShippingZones.execute(), fetchCart()])
      .then(([s, z]) => {
        setSellers(s);
        setZones(z);
        // Auto-select seller from ref param if present
        if (refParam && s.length > 0) {
          const m = refParam.match(/(\d+)$/);
          let selId: number | null = null;
          if (m) selId = Number(m[1]);
          // try find by id or by code-containing string
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
          }
        }
      })
      .catch(() => toast.error("No se pudo cargar la información de checkout."))
      .finally(() => setIsLoading(false));
  }, []);

  const provincia = watch("provincia");
  const ciudad = watch("ciudad");

  const shippingCost = useMemo(() => {
    const match = zones.find(
      (z) => z.provincia.toLowerCase() === (provincia || "").toLowerCase() && z.ciudad.toLowerCase() === (ciudad || "").toLowerCase()
    );
    return match?.costo ?? null;
  }, [zones, provincia, ciudad]);

  const subtotal = cart?.subtotal ?? 0;
  const total = subtotal + (shippingCost ?? 0);
  const filteredSellers = useMemo(() => {
    const query = sellerSearch.trim().toLowerCase();
    if (!query) return sellers;
    return sellers.filter((seller) => {
      const values = [seller.nombre, seller.apellido, seller.correo].filter(Boolean).join(" ").toLowerCase();
      return values.includes(query);
    });
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
    <div className="container-app py-8 lg:py-12">
      <h1 className="font-display text-4xl">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-4 font-display text-xl">Datos de envío</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-ink/70">Tipo de entrega</label>
                <select
                  {...register("tipoEntrega", { required: "Requerido" })}
                  className="h-12 w-full rounded-xl border-2 border-ink/15 bg-white px-4 text-sm outline-none focus:border-ink"
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
                error={errors.referenciaAdicional?.message}
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

          <section>
            <h2 className="mb-4 font-display text-xl">Vendedor</h2>
            <p className="mb-3 text-sm text-ink/60">
              Si alguien te atendió, selecciónalo — así recibe su comisión. Si no, elige "Ningún vendedor".
            </p>
            <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={sellerSearch}
                  onChange={(e) => setSellerSearch(e.target.value)}
                  placeholder="Buscar vendedor por nombre o correo"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-sky-500"
                />
              </div>

              <select
                {...register("vendedorId")}
                className="mt-3 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-500"
              >
                <option value="">Ningún vendedor</option>
                {filteredSellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} {s.apellido} {s.correo ? `• ${s.correo}` : ""}
                  </option>
                ))}
              </select>

              {sellerSearch && filteredSellers.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  {sellers.length === 0 ? "No hay vendedores disponibles en este momento." : "No se encontraron vendedores con ese texto."}
                </p>
              )}

              {!sellerSearch && sellers.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">No hay vendedores disponibles en este momento.</p>
              )}
            </div>
          </section>

          {/* ── DATOS BANCARIOS DE PAGO ── */}
          <section className="rounded-3xl border border-sky-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 text-lg shadow-sm">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl text-ink">Pago por Transferencia Bancaria</h2>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Banco Pichincha Ecuador</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 rounded-2xl bg-slate-50 p-4 text-sm">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/60">Banco</span>
                <span className="mt-1 block font-semibold text-ink">Banco Pichincha</span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/60">N° de Cuenta</span>
                <span className="mt-1 block font-mono font-bold text-sky-600">2213521473</span>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/60">Titular de la cuenta</span>
                <span className="mt-1 block font-semibold text-ink">Danny Alexander Guaman Pillajo</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm leading-relaxed">
              <p className="flex items-center gap-2 font-bold text-ink">
                <MessageSquare className="h-4 w-4 text-sky-600" /> Pasos para confirmar tu pedido:
              </p>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-ink/70">
                <li>Realiza la transferencia del monto total a la cuenta indicada.</li>
                <li>Sube el comprobante en la sección <strong>Mis pedidos</strong> y, adicionalmente, si fuiste atendido por un vendedor, envíale también el comprobante para su registro.</li>
                <li>Si no fuiste atendido por ningún vendedor, sube el comprobante en <strong>Mis pedidos</strong> y, si lo deseas, envíalo por WhatsApp a <a href="https://wa.me/593999001471?text=Hola,%20adjunto%20mi%20comprobante%20de%20pago" target="_blank" rel="noreferrer" className="font-semibold text-sky-600 underline">+593999001471</a>.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-display text-xl">Notas (opcional)</h2>
            <textarea
              {...register("notas")}
              rows={3}
              placeholder="Indicaciones adicionales para tu pedido"
              className="w-full rounded-xl border-2 border-ink/15 bg-white p-4 text-sm outline-none focus:border-ink"
            />
          </section>
        </div>

        <aside className="h-fit rounded-2xl bg-white p-6">
          <h3 className="font-display text-xl">Resumen del pedido</h3>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {cart?.items.map((item) => (
              <li key={item.id} className="flex justify-between text-ink/70">
                <span className="truncate pr-3">
                  {item.nombre} <span className="text-ink/40">x{item.cantidad}</span>
                </span>
                <span className="flex-shrink-0 font-medium">{formatCurrency(item.precioUnitario * item.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between text-ink/60">
              <span>Subtotal</span>
              <span className="font-semibold text-ink">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink/60">
              <span>Envío</span>
              <span className="font-semibold text-ink">
                {shippingCost != null ? formatCurrency(shippingCost) : "Se calcula con tu ciudad"}
              </span>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          <Button type="submit" variant="secondary" size="lg" fullWidth className="mt-6" isLoading={isSubmitting}>
            Confirmar pedido
          </Button>
          <p className="mt-3 text-center text-xs text-ink/40">
            Después de confirmar, subirás tu comprobante de pago para su verificación.
          </p>
        </aside>
      </form>
    </div>
  );
}
