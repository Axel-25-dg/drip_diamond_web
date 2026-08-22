import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Search, CreditCard, MessageSquare, UserCheck,
  AlertCircle, MapPin, Truck, X, Loader2, Navigation, Phone, Sparkles, ShieldCheck,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import type { LatLngLiteral } from "leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { Seller } from "@/domain/entities/User";
import { useCartStore } from "@/presentation/store/cartStore";
import { Input } from "@/presentation/components/ui/Input";
import { Button } from "@/presentation/components/ui/Button";
import { Spinner } from "@/presentation/components/ui/Spinner";
import { formatCurrency, resolveMediaUrl } from "@/presentation/utils/format";
import { smartGeocode } from "@/presentation/components/ui/ShippingTicket";
import { StockVerificationModal } from "@/presentation/components/checkout/StockVerificationModal";
import { CheckoutMap } from "@/presentation/components/checkout/CheckoutMap";

const QUITO_CENTER: LatLngLiteral = { lat: -0.1807, lng: -78.4678 };
const SHIPPING_COST = 3;

const QUITO_PRESETS = [
  { name: "La Carolina", lat: -0.1825, lng: -78.4845 },
  { name: "Quicentro Norte", lat: -0.1762, lng: -78.4795 },
  { name: "C.C. El Recreo", lat: -0.2486, lng: -78.5144 },
  { name: "CCI / Iñaquito", lat: -0.1802, lng: -78.4877 },
  { name: "Condado Shopping", lat: -0.1042, lng: -78.4908 },
];

/* ── Tipos ────────────────────────────────────────────────── */
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

/* ── Reverse geocode: coordenadas → dirección detallada estilo Google Maps ──────── */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`,
      { headers: { "User-Agent": "ZapatillasEC-Web/1.0", "Accept-Language": "es" } }
    );
    const data = await res.json();
    if (!data || !data.address) return "";

    const a = data.address;
    let place = data.name || a.amenity || a.shop || a.building || a.office || a.tourism || a.leisure || "";

    // Ignorar etiquetas genéricas internas de OSM
    if (/^(planta \d+|nodo|punto|bench|tree|lote \d+|banca|árbol|semáforo)/i.test(place)) {
      place = "";
    }

    const rawRoad = a.road || a.pedestrian || a.street || a.footway || a.residential || a.path || "";
    const houseNo = a.house_number || "";
    const sector = a.suburb || a.neighbourhood || a.city_district || a.quarter || a.parish || "";

    let parts: string[] = [];

    if (place && place.toLowerCase() !== rawRoad.toLowerCase()) {
      parts.push(place);
    }

    if (rawRoad) {
      let formattedRoad = rawRoad;
      if (!/^(av|avenida|calle|pasaje|transversal|diagonal|n-)/i.test(rawRoad)) {
        formattedRoad = `Calle ${rawRoad}`;
      }
      if (houseNo) {
        formattedRoad += ` N° ${houseNo}`;
      }
      parts.push(formattedRoad);
    }

    if (sector && sector.toLowerCase() !== rawRoad.toLowerCase()) {
      parts.push(`Sector ${sector}`);
    }

    if (!parts.some((p) => p.toLowerCase().includes("quito"))) {
      parts.push("Quito");
    }

    if (parts.length === 0 && data.display_name) {
      return data.display_name.split(",").slice(0, 4).join(", ").trim();
    }

    return parts.join(", ").trim();
  } catch { return ""; }
}

/* ── Forward geocode: texto → sugerencias de Quito ────────── */
async function forwardGeocode(query: string): Promise<NominatimResult[]> {
  if (!query || query.length < 3) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Quito, Ecuador")}&limit=6&countrycodes=ec&accept-language=es`,
      { headers: { "Accept-Language": "es" } }
    );
    return await res.json();
  } catch { return []; }
}

/* ── Componente: mueve el mapa cuando cambia la posición ───── */
function MapFlyTo({ position }: { position: LatLngLiteral }) {
  const map = useMap();
  useEffect(() => { map.flyTo(position, 17, { duration: 1.2 }); }, [position]);
  return null;
}

/* ── Componente: captura click en el mapa ─────────────────── */
function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

/* ── Buscador integrado sobre el mapa ─────────────────────── */
function MapSearchBox({
  onSelect,
}: {
  onSelect: (lat: number, lng: number, label: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); setShowResults(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const r = await forwardGeocode(val);
      setResults(r);
      setShowResults(true);
      setSearching(false);
    }, 420);
  };

  const pick = (r: NominatimResult) => {
    const label = r.display_name.split(",").slice(0, 3).join(", ");
    setQuery(label);
    setShowResults(false);
    onSelect(parseFloat(r.lat), parseFloat(r.lon), label);
  };

  return (
    <div className="relative w-full">
      {/* Input */}
      <div className="flex items-center gap-2 rounded-xl border border-blue-200 dark:border-sky-800 bg-[var(--card-bg)] px-3 shadow-[var(--shadow-sm)]">
        {searching
          ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-500" />
          : <Search className="h-4 w-4 shrink-0 text-gray-400" />
        }
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Busca tu dirección en Quito... (ej: Av. Amazonas N34)"
          className="h-11 flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); setResults([]); setShowResults(false); }}>
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showResults && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-blue-100 dark:border-[#222732] bg-[var(--card-bg)] shadow-[var(--shadow-modal)]">
          {results.map((r) => (
            <li key={r.place_id}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="flex w-full items-start gap-2 px-4 py-3 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                <span className="text-[var(--text-secondary)] line-clamp-2">{r.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showResults && results.length === 0 && !searching && query.length >= 3 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-blue-100 dark:border-[#222732] bg-[var(--card-bg)] px-4 py-3 text-sm text-[var(--text-muted)] shadow-[var(--shadow-modal)]">
          No se encontraron resultados en Quito.
        </div>
      )}
    </div>
  );
}

/* ── Form type ────────────────────────────────────────────── */
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

/* ═══════════════════════════════════════════════════════════
   CHECKOUT PAGE
═══════════════════════════════════════════════════════════ */
export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCartStore();
  const location = useLocation();
  const refParam = new URLSearchParams(location.search).get("ref");

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sellerSearch, setSellerSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sellersLoading, setSellersLoading] = useState(true);
  const [sellersError, setSellersError] = useState(false);
  const [sellersLoadAttempt, setSellersLoadAttempt] = useState(0);
  const [markerPos, setMarkerPos] = useState<LatLngLiteral>(QUITO_CENTER);
  const [geocoding, setGeocoding] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<CheckoutForm | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<CheckoutForm>({
      defaultValues: {
        tipoEntrega: "DOMICILIO",
        vendedorId: "",
        provincia: "Pichincha",
        ciudad: "Quito",
        referenciaAdicional: "",
        notas: "",
      },
    });

  /* Load cart */
  useEffect(() => {
    fetchCart()
      .catch(() => toast.error("No se pudo cargar el carrito."))
      .finally(() => setIsLoading(false));
  }, []);

  /* Load sellers */
  useEffect(() => {
    setSellersLoading(true);
    setSellersError(false);
    useCases.getActiveSellers.execute()
      .then((s) => {
        setSellers(s);
        if (refParam && s.length > 0) {
          const m = refParam.match(/(\d+)$/);
          const selId = m ? Number(m[1]) : null;
          const found = selId
            ? s.find((x) => x.id === selId)
            : s.find((x) =>
              `${x.id}` === refParam ||
              `${x.nombre} ${x.apellido}`.toLowerCase().includes(refParam.toLowerCase()) ||
              x.correo?.toLowerCase().includes(refParam.toLowerCase())
            );
          if (found) { setValue("vendedorId", String(found.id)); toast.info(`Vendedor ${found.nombre} preseleccionado.`); }
        }
      })
      .catch(() => setSellersError(true))
      .finally(() => setSellersLoading(false));
  }, [sellersLoadAttempt]);

  /* Click en mapa → reverse geocode → llenar campo */
  const handleMapPick = useCallback(async (lat: number, lng: number) => {
    setMarkerPos({ lat, lng });
    setGeocoding(true);
    const addr = await reverseGeocode(lat, lng);
    if (addr) { setValue("direccionEnvio", addr, { shouldValidate: true }); toast.success("Dirección detectada. Puedes editarla."); }
    setGeocoding(false);
  }, [setValue]);

  /* Buscador → mover mapa + llenar campo con dirección detallada */
  const handleSearchSelect = useCallback(async (lat: number, lng: number, label: string) => {
    setMarkerPos({ lat, lng });
    setGeocoding(true);
    const detailed = await reverseGeocode(lat, lng);
    const finalAddr = detailed || label.split(",").slice(0, 4).join(", ").trim();
    setValue("direccionEnvio", finalAddr, { shouldValidate: true });
    toast.success("Dirección detectada.");
    setGeocoding(false);
  }, [setValue]);

  const tipoEntrega = watch("tipoEntrega");
  const shippingCost = tipoEntrega === "RETIRO_LOCAL" ? 0 : SHIPPING_COST;
  const subtotal = cart?.subtotal ?? 0;
  const total = subtotal + shippingCost;

  useEffect(() => {
    if (tipoEntrega === "RETIRO_LOCAL") {
      setValue("direccionEnvio", "Retiro en local - Centro Comercial por acordar");
    }
  }, [tipoEntrega, setValue]);

  const filteredSellers = useMemo(() => {
    const q = sellerSearch.trim().toLowerCase();
    if (!q) return sellers;
    return sellers.filter((s) =>
      [s.nombre, s.apellido, s.correo].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [sellerSearch, sellers]);

  /* Abrir modal de verificación de stock antes de crear pedido */
  const handleFormValid = (form: CheckoutForm) => {
    if (!cart || cart.items.length === 0) { toast.error("Tu carrito está vacío."); return; }
    setPendingFormData(form);
    setIsStockModalOpen(true);
  };

  /* Confirmar solicitud de pedido desde el modal */
  const handleConfirmOrder = async () => {
    if (!pendingFormData) return;
    setIsSubmitting(true);
    const form = pendingFormData;
    const addressBase = form.tipoEntrega === "RETIRO_LOCAL"
      ? "Retiro en local - Centro Comercial por acordar"
      : form.direccionEnvio?.trim() || "";
    const cleanBase = addressBase.replace(/\s*[\(\[]-?\d+\.\d+,\s*-?\d+\.\d+[\)\]]/g, "").trim();
    const direccionConCoords =
      form.tipoEntrega === "DOMICILIO" && markerPos
        ? `${cleanBase} (${markerPos.lat.toFixed(6)}, ${markerPos.lng.toFixed(6)})`
        : cleanBase;

    try {
      const order = await useCases.createOrder.execute({
        direccionEnvio: direccionConCoords,
        direccionFormateada: direccionConCoords,
        provincia: "Pichincha",
        ciudad: "Quito",
        telefonoContacto: form.telefonoContacto,
        vendedorId: form.vendedorId ? Number(form.vendedorId) : null,
        notas: form.notas || form.referenciaAdicional,
        referenciaAdicional: form.referenciaAdicional || form.notas,
        tipoEntrega: form.tipoEntrega,
      });
      toast.success("¡Solicitud recibida! Te contactaremos vía WhatsApp para confirmar tu talla.");
      setIsStockModalOpen(false);
      navigate(`/pedidos/${order.id}`);
    } catch (err: any) {
      toast.error(err?.message || "No se pudo crear el pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Spinner full />;

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Modal Flotante de Verificación de Stock */}
      <StockVerificationModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onConfirm={handleConfirmOrder}
        isSubmitting={isSubmitting}
        userPhone={watch("telefonoContacto")}
      />

      <div className="container-app py-6 sm:py-8 lg:py-10">
        <h1 className="font-display text-3xl font-extrabold text-[var(--text-primary)] sm:text-4xl">
          Checkout
        </h1>

        {/* Banner Informativo Flotante / Destacado */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 dark:from-emerald-950/40 dark:via-[#121622] dark:to-teal-950/30 p-4 sm:p-5 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/20">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Verificación de disponibilidad antes del pago
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  <Sparkles className="h-3 w-3" /> WhatsApp
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Antes de que realices el pago o envíes tu comprobante, nos comunicaremos contigo por WhatsApp para confirmarte que el modelo y talla de la zapatilla siguen disponibles en inventario.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(handleFormValid)}
          className="mt-6 grid gap-6 lg:gap-8 lg:grid-cols-[1fr_380px]"
        >
          {/* ════ LEFT ════ */}
          <div className="flex flex-col gap-6">

            {/* ── Tipo de entrega ── */}
            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 font-display text-lg font-bold text-[var(--text-primary)]">Tipo de entrega</h2>
              <div className="grid grid-cols-2 gap-3">
                {(["DOMICILIO", "RETIRO_LOCAL"] as const).map((opt) => (
                  <label
                    key={opt}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${tipoEntrega === opt
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-[var(--bg-border)] hover:border-blue-300"
                      }`}
                  >
                    <input type="radio" value={opt} {...register("tipoEntrega")} className="hidden" />
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${tipoEntrega === opt ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}>
                      {tipoEntrega === opt && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        {opt === "DOMICILIO" ? "Domicilio" : "Retiro local"}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {opt === "DOMICILIO" ? `$${SHIPPING_COST}.00 vía Servientrega` : "Gratis"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* ── Mapa con buscador ── */}
            {tipoEntrega === "DOMICILIO" && (
              <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)]">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                    Ubica tu dirección
                  </h2>
                </div>
                <p className="mb-4 text-sm text-[var(--text-muted)]">
                  Haz clic en el mapa, usa tus accesos rápidos o activa tu ubicación GPS.
                </p>

                {/* ── Botón GPS: usar mi ubicación actual ── */}
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      toast.error("Tu navegador no soporta geolocalización.");
                      return;
                    }
                    setGeocoding(true);
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        const lat = pos.coords.latitude;
                        const lng = pos.coords.longitude;
                        setMarkerPos({ lat, lng });
                        const addr = await reverseGeocode(lat, lng);
                        if (addr) {
                          setValue("direccionEnvio", addr, { shouldValidate: true });
                          toast.success("Ubicación GPS detectada. Verifica la dirección.");
                        }
                        setGeocoding(false);
                      },
                      () => {
                        toast.error("No se pudo obtener tu ubicación. Activa el permiso de GPS.");
                        setGeocoding(false);
                      },
                      { enableHighAccuracy: true, timeout: 10000 }
                    );
                  }}
                  disabled={geocoding}
                  className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 dark:border-sky-800 bg-blue-50 dark:bg-sky-950/20 py-3 text-sm font-semibold text-blue-700 dark:text-sky-400 transition-all hover:border-blue-400 hover:bg-blue-100 dark:hover:bg-sky-950/30 disabled:opacity-60"
                >
                  {geocoding
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Detectando ubicación...</>
                    : <><Navigation className="h-4 w-4" /> Usar mi ubicación actual (GPS)</>
                  }
                </button>

                {/* ── Chips de Ubicación Rápida ── */}
                <div className="mb-3">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Sectores populares en Quito:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUITO_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleMapPick(preset.lat, preset.lng)}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200/60 dark:border-sky-800/60 bg-blue-50/60 dark:bg-sky-950/30 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-sky-300 transition-all hover:bg-blue-100 dark:hover:bg-sky-900/40 active:scale-95"
                      >
                        <MapPin className="h-3 w-3 text-blue-500" />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Mapa HD Google / CARTO ── */}
                <CheckoutMap position={markerPos} onPick={handleMapPick} height={350} />
              </section>
            )}

            {/* ── Retiro local: Datos de contacto y entrega ── */}
            {tipoEntrega === "RETIRO_LOCAL" && (
              <section className="rounded-2xl border-2 border-blue-500/40 bg-gradient-to-br from-blue-50/80 via-blue-50/30 to-sky-50/50 dark:from-blue-950/40 dark:via-[#121622] dark:to-sky-950/30 p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                      Datos de contacto para Retiro Local
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                      Ingresa tu número de teléfono. Nos pondremos en contacto contigo vía WhatsApp para acordar la hora y el punto de encuentro en uno de los <strong>3 centros comerciales</strong> principales (Quito Norte, Quito Sur o C.C. El Recreo).
                    </p>

                    <div className="mt-5">
                      <Input
                        label="Teléfono de contacto *"
                        placeholder="09XXXXXXXX"
                        error={errors.telefonoContacto?.message}
                        {...register("telefonoContacto", { required: "Requerido para coordinar la entrega" })}
                      />
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        Nos comunicaremos a este número para coordinar el retiro.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── Datos de envío (Solo para Domicilio) ── */}
            {tipoEntrega === "DOMICILIO" && (
              <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)]">
                <h2 className="mb-4 font-display text-lg font-bold text-[var(--text-primary)]">Datos de envío</h2>
                <div className="grid gap-4 sm:grid-cols-2">

                  {/* Ciudad fija: Quito */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-sky-400">
                      Ciudad
                    </label>
                    <div className="mt-1 flex h-[46px] items-center justify-between rounded-xl border border-blue-200 dark:border-sky-800/50 bg-blue-50 dark:bg-blue-950/20 px-4 text-sm">
                      <span className="font-semibold text-[var(--text-primary)]">Quito</span>
                      <span className="flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        <Truck className="h-3 w-3" /> $3.00 · Servientrega
                      </span>
                    </div>
                    <input type="hidden" value="Quito"     {...register("ciudad")} />
                    <input type="hidden" value="Pichincha" {...register("provincia")} />
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">Solo realizamos envíos en Quito.</p>
                  </div>

                  {/* Teléfono */}
                  <Input
                    label="Teléfono de contacto"
                    placeholder="09XXXXXXXX"
                    error={errors.telefonoContacto?.message}
                    {...register("telefonoContacto", { required: "Requerido" })}
                  />

                  {/* Dirección — se llena del mapa */}
                  <div className="sm:col-span-2">
                    <Input
                      label="Dirección exacta"
                      placeholder="Busca en el mapa o escribe aquí..."
                      error={errors.direccionEnvio?.message}
                      {...register("direccionEnvio", { required: "Requerido" })}
                    />
                  </div>

                  {/* Referencia */}
                  <div className="sm:col-span-2">
                    <Input
                      label="Referencia adicional"
                      placeholder="Casa azul, piso 3, junto a la farmacia..."
                      {...register("referenciaAdicional")}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* ── Vendedor ── */}
            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)]">
              <div className="mb-1 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-sky-500" />
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Vendedor</h2>
              </div>
              <p className="mb-4 text-sm text-[var(--text-muted)]">
                Si alguien te atendió, selecciónalo para que reciba su comisión ($4 por par).
              </p>

              {sellersLoading ? (
                <div className="flex items-center gap-2 py-3 text-sm text-[var(--text-muted)]">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
                  Cargando vendedores...
                </div>
              ) : sellersError ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    No se pudieron cargar los vendedores. Puedes continuar sin seleccionar.
                  </div>
                  <button type="button" onClick={() => setSellersLoadAttempt(n => n + 1)}
                    className="self-start text-xs text-blue-600 dark:text-sky-400 underline">
                    Reintentar
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      value={sellerSearch}
                      onChange={(e) => setSellerSearch(e.target.value)}
                      placeholder="Buscar por nombre o correo..."
                      className="h-11 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--input-border-focus)] focus:shadow-[var(--ring-focus)]"
                    />
                  </div>
                  <select
                    {...register("vendedorId")}
                    className="h-12 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--input-border-focus)]"
                  >
                    <option value="">— Ningún vendedor —</option>
                    {filteredSellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} {s.apellido}{s.correo ? ` · ${s.correo}` : ""}
                      </option>
                    ))}
                  </select>
                  {sellers.length === 0 && (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">No hay vendedores activos.</p>
                  )}
                </>
              )}
            </section>

            {/* ── Datos bancarios ── */}
            <section className="rounded-2xl border border-blue-200 dark:border-sky-900/50 bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-sky-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Transferencia Bancaria</h2>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-500 dark:text-sky-400">Banco Pichincha</p>
                </div>
              </div>
              <div className="grid gap-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 p-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Banco</span>
                  <span className="mt-0.5 block font-bold text-[var(--text-primary)]">Banco Pichincha</span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">N° de Cuenta</span>
                  <span className="mt-0.5 block font-mono font-bold text-blue-600 dark:text-sky-400">2213521473</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Titular</span>
                  <span className="mt-0.5 block font-bold text-[var(--text-primary)]">Danny Alexander Guaman Pillajo</span>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 dark:border-sky-900/50 bg-blue-50 dark:bg-sky-950/20 p-4 text-sm">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-blue-500 dark:text-sky-400" />
                <div>
                  <p className="font-bold text-[var(--text-primary)]">Pasos para confirmar tu pedido:</p>
                  <ol className="mt-2 list-decimal list-inside space-y-1 text-[var(--text-secondary)]">
                    <li>Realiza la transferencia del monto total.</li>
                    <li>Sube el comprobante en <strong>Mis pedidos</strong>.</li>
                    <li>También puedes enviarlo por{" "}
                      <a href="https://wa.me/593999001471" target="_blank" rel="noreferrer"
                        className="font-semibold text-blue-600 dark:text-sky-400 underline">
                        WhatsApp +593 999 001 471
                      </a>.
                    </li>
                  </ol>
                </div>
              </div>
            </section>

            {/* ── Notas ── */}
            <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="mb-3 font-display text-lg font-bold text-[var(--text-primary)]">
                Notas <span className="text-sm font-normal text-[var(--text-muted)]">(opcional)</span>
              </h2>
              <textarea
                {...register("notas")}
                rows={3}
                placeholder="Indicaciones adicionales..."
                className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] p-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--input-border-focus)] focus:shadow-[var(--ring-focus)]"
              />
            </section>
          </div>

          {/* ════ ASIDE ════ */}
          <aside className="h-fit rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--shadow-card)] lg:sticky lg:top-20">
            <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">Resumen del pedido</h3>

            <ul className="mt-4 flex flex-col gap-3 text-sm">
              {cart?.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={resolveMediaUrl(item.imagenUrl) ?? "/placeholder.svg"}
                      alt={item.nombre}
                      className="h-12 w-12 shrink-0 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface2)] object-contain p-1"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{item.nombre}</p>
                      <p className="text-xs text-[var(--text-muted)]">×{item.cantidad}</p>
                    </div>
                  </div>
                  <span className="shrink-0 font-semibold text-[var(--text-primary)]">
                    {formatCurrency(item.precioUnitario * item.cantidad)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-col gap-2 border-t border-[var(--bg-border)] pt-4 text-sm">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Subtotal</span>
                <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-blue-500" />
                  Envío {tipoEntrega === "RETIRO_LOCAL" ? "(retiro)" : "(Servientrega)"}
                </span>
                <span className={`font-semibold ${shippingCost === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--text-primary)]"}`}>
                  {shippingCost === 0 ? "Gratis" : formatCurrency(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[var(--bg-border)] pt-3 text-base font-black">
                <span className="text-[var(--text-primary)]">Total</span>
                <span className="text-blue-600 dark:text-sky-400">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Vendedor seleccionado */}
            {watch("vendedorId") && (
              <div className="mt-4 rounded-xl border border-blue-100 dark:border-sky-900/50 bg-blue-50 dark:bg-sky-950/20 px-4 py-3 text-xs">
                <p className="font-bold text-blue-700 dark:text-sky-300">Vendedor:</p>
                <p className="mt-0.5 text-blue-600 dark:text-sky-400">
                  {(() => {
                    const s = sellers.find((x) => String(x.id) === watch("vendedorId"));
                    return s ? `${s.nombre} ${s.apellido}` : `ID #${watch("vendedorId")}`;
                  })()}
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="secondary"
              size="lg"
              fullWidth
              className="mt-5 bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-lg shadow-emerald-600/25 gap-2"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              <MessageSquare className="h-5 w-5" />
              Solicitar Pedido
            </Button>
            <p className="mt-3 text-center text-xs leading-normal text-slate-500 dark:text-slate-400">
              Verificamos la disponibilidad en bodega y te confirmamos por WhatsApp antes de tu pago.
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
}
