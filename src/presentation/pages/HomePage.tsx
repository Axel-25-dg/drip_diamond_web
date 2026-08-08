import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, CreditCard, ChevronRight } from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { ProductSummary, Brand, Category } from "@/domain/entities/Product";
import { ProductGrid } from "@/presentation/components/catalog/ProductGrid";
import { Button } from "@/presentation/components/ui/Button";
import { resolveMediaUrl } from "@/presentation/utils/format";

export default function HomePage() {
  const [featured, setFeatured] = useState<ProductSummary[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [products, filters] = await Promise.all([
          useCases.getProducts.execute({ page: 1, pageSize: 8, ordering: "-reciente" }),
          useCases.getCatalogFilters.execute(),
        ]);
        if (!active) return;
        setFeatured(products.items);
        setBrands(filters.brands);
        setCategories(filters.categories);
      } catch {
        // Backend offline — page still renders
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div style={{ overflow: "hidden" }}>
      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}
      >
        <div className="container-app relative z-10 grid items-center gap-8 py-10 lg:grid-cols-[1fr_440px] lg:py-14">
          {/* LEFT */}
          <div className="space-y-5">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ border: "1px solid #bae6fd", background: "#f0f9ff" }}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              <span className="text-[11px] font-bold tracking-[0.14em] text-sky-600 uppercase">
                Drip Diamond — Sneakers de Lujo
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="font-display leading-[0.9]">
                <span className="block text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900">PISA</span>
                <span className="block text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900">FUERTE.</span>
                <span
                  className="block text-4xl sm:text-5xl lg:text-6xl font-black mt-1"
                  style={{
                    background: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  DIAMOND
                </span>
                <span
                  className="block text-4xl sm:text-5xl lg:text-6xl font-black"
                  style={{
                    background: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  DRIP.
                </span>
              </h1>
            </div>

            {/* Description */}
            <p className="max-w-sm text-sm leading-relaxed text-slate-500">
              Las sneakers más exclusivas de Ecuador. 100% originales, verificadas y
              entregadas a todo el país con seguimiento en tiempo real.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-px rounded-xl overflow-hidden border border-slate-200 bg-slate-50 w-fit">
              {[
                { value: "500+", label: "Estilos únicos" },
                { value: "100%", label: "Pares verificados" },
                { value: "48h", label: "Entrega express" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="px-5 py-3 text-center"
                  style={{ borderLeft: i > 0 ? "1px solid #e2e8f0" : "none" }}
                >
                  <p className="font-display text-xl font-black text-sky-600">{stat.value}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link to="/catalogo">
                <button
                  className="h-11 px-7 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #0ea5e9, #38bdf8)" }}
                >
                  Explorar Catálogo →
                </button>
              </Link>
              <Link to="/catalogo?ordering=-reciente">
                <button className="h-11 px-7 rounded-xl text-sm font-semibold border-2 border-slate-200 text-slate-700 hover:border-sky-300 hover:text-sky-600 transition-all bg-white">
                  Nuevos Ingresos
                </button>
              </Link>
            </div>
          </div>

          {/* RIGHT — sneaker image */}
          <div className="relative mx-auto w-full max-w-[420px]">
            <div
              className="absolute inset-0 rounded-3xl"
              style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)" }}
            />
            <img
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80"
              alt="Zapatilla Drip Diamond"
              className="relative z-10 w-full rounded-3xl object-cover drop-shadow-2xl"
              style={{ aspectRatio: "4/3" }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80";
              }}
            />
            {/* Floating badge */}
            <div
              className="absolute bottom-4 left-4 right-4 z-20 rounded-2xl p-4"
              style={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-sky-500">Nuevo Ingreso</p>
                  <p className="font-display text-base font-bold text-slate-900 mt-0.5">Air Max 90 — Black Diamond</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-sky-600 font-display">$189.00</p>
                  <Link to="/catalogo">
                    <button
                      className="mt-1 rounded-lg px-3 py-1 text-[11px] font-bold text-white"
                      style={{ background: "#0ea5e9" }}
                    >
                      Ver →
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BENEFICIOS BAR ───────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
        <div className="container-app grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0" style={{ "--tw-divide-color": "#e2e8f0" } as any}>
          <BenefitItem icon={<Truck className="h-5 w-5 text-sky-500" />} title="Envíos a todo Ecuador" text="Calculamos el costo según tu zona y transportista" />
          <BenefitItem icon={<ShieldCheck className="h-5 w-5 text-emerald-500" />} title="100% Verificados" text="Inspeccionamos cada par antes del despacho" />
          <BenefitItem icon={<CreditCard className="h-5 w-5 text-purple-500" />} title="Pago por transferencia" text="Sube tu comprobante y te confirmamos en 1–2h" />
        </div>
      </section>

      {/* ─── CATEGORÍAS ───────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="container-app py-16">
          <SectionHeader eyebrow="Explorar" title="Comprar por Categoría" href="/catalogo" linkLabel="Ver catálogo completo" />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 8).map((c) => (
              <Link
                key={c.id}
                to={`/catalogo?categoria=${c.id}`}
                className="group relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl"
                style={{ background: "#0a0c12" }}
              >
                {resolveMediaUrl(c.imagenUrl) ? (
                  <img
                    src={resolveMediaUrl(c.imagenUrl)!}
                    alt={c.nombre}
                    className="absolute inset-0 h-full w-full object-cover opacity-60 transition-all duration-500 group-hover:scale-105 group-hover:opacity-70"
                  />
                ) : (
                  <div className="absolute inset-0" style={{ background: "#0d1120" }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="relative z-10 p-4 w-full flex items-end justify-between">
                  <span className="font-display text-lg text-white">{c.nombre}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── PRODUCTOS DESTACADOS ─────────────────────────────────── */}
      <section style={{ background: "#f8fafc", padding: "64px 0" }}>
        <div className="container-app">
          <SectionHeader eyebrow="Colección" title="Recién Llegados" href="/catalogo" linkLabel="Ver todo el catálogo" />
          <div className="mt-8">
            <ProductGrid products={featured} isLoading={isLoading} />
          </div>
        </div>
      </section>

      {/* ─── MARCAS ───────────────────────────────────────────────── */}
      {brands.length > 0 && (
        <section style={{ borderTop: "1px solid #e2e8f0", background: "#fff", padding: "48px 0" }}>
          <div className="container-app">
            <p className="mb-8 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Marcas Disponibles</p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
              {brands.map((b) => (
                <Link
                  key={b.id}
                  to={`/catalogo?marca=${b.id}`}
                  className="font-display text-lg font-black tracking-tight text-slate-400 hover:text-slate-900 transition-colors"
                >
                  {b.nombre}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA BAND ─────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: "#0a0c12" }}>
        <div className="container-app text-center space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400">Exclusivo Drip Diamond</p>
          <h2
            className="font-display text-4xl sm:text-5xl"
            style={{
              background: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 50%, #94a3b8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Tu estilo, en tus pies.
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500">
            Más de 500 modelos disponibles. Entrega garantizada a todo Ecuador con soporte personalizado.
          </p>
          <div className="pt-2">
            <Link to="/catalogo">
              <Button variant="secondary" size="xl">
                Descubrir colección
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function BenefitItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-center gap-4 px-8 py-5">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs mt-0.5 text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, href, linkLabel }: {
  eyebrow: string; title: string; href: string; linkLabel: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-500">{eyebrow}</p>
        <h2 className="mt-1 font-display text-3xl sm:text-4xl text-slate-900">{title}</h2>
      </div>
      <Link
        to={href}
        className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-900 transition-colors whitespace-nowrap"
      >
        {linkLabel}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
