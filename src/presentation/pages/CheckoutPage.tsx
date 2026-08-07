import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
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

  useEffect(() => {
    Promise.all([useCases.getActiveSellers.execute(), useCases.getShippingZones.execute(), fetchCart()])
      .then(([s, z]) => {
        setSellers(s);
        setZones(z);
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
            <select
              {...register("vendedorId")}
              className="h-12 w-full max-w-sm rounded-xl border-2 border-ink/15 bg-white px-4 text-sm outline-none focus:border-ink"
            >
              <option value="">Ningún vendedor</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} {s.apellido}
                </option>
              ))}
            </select>
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
