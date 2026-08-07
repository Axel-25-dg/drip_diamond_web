import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, CreditCard, Star, ChevronRight } from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { ProductSummary, Brand, Category } from "@/domain/entities/Product";
import { ProductGrid } from "@/presentation/components/catalog/ProductGrid";
import { Button } from "@/presentation/components/ui/Button";
import { resolveMediaUrl } from "@/presentation/utils/format";
import { useThemeStore } from "@/presentation/store/themeStore";

export default function HomePage() {
  const [featured, setFeatured] = useState<ProductSummary[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

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
        className="relative min-h-[88vh] flex items-center overflow-hidden"
        style={{
          background: isDark
            ? "linear-gradient(135deg, #050709 0%, #080d18 50%, #060b14 100%)"
            : "linear-gradient(135deg, #070a14 0%, #0d1526 50%, #050810 100%)",
        }}
      >
        {/* Grid pattern */}
        <div className="pointer-events-none absolute inset-0 line-pattern opacity-30" />

        {/* Ambient glows */}
        <div className="pointer-events-none absolute -left-48 top-1/4 h-[600px] w-[600px] rounded-full blur-[130px] opacity-60" style={{ background: "rgba(56,189,248,0.08)" }} />
        <div className="pointer-events-none absolute -right-48 bottom-0 h-[500px] w-[500px] rounded-full blur-[110px] opacity-40" style={{ background: "rgba(100,116,139,0.06)" }} />
        <div className="pointer-events-none absolute left-1/3 top-0 h-[400px] w-[400px] rounded-full blur-[90px] opacity-30" style={{ background: "rgba(56,189,248,0.05)" }} />

        <div className="container-app relative z-10 grid items-center gap-12 py-20 lg:grid-cols-[1fr_460px] lg:py-28">
          {/* LEFT */}
          <div className="space-y-8">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2"
              style={{ border: "1px solid rgba(56,189,248,0.18)", background: "rgba(56,189,248,0.06)" }}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-glow-pulse" />
              <span className="text-xs font-semibold tracking-[0.15em] text-sky-300 uppercase">
                Drip Diamond — Sneakers de Lujo
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="font-display leading-[0.88]">
                <span
                  className="block text-6xl sm:text-7xl lg:text-8xl xl:text-[96px]"
                  style={{
                    background: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 50%, #94a3b8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  PISA
                </span>
                <span
                  className="block text-6xl sm:text-7xl lg:text-8xl xl:text-[96px]"
                  style={{
                    background: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 50%, #94a3b8 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  FUERTE.
                </span>
                <span
                  className="block text-6xl sm:text-7xl lg:text-8xl xl:text-[96px] mt-2"
                  style={{
                    background: "linear-gradient(135deg, #7dd3fc 0%, #38bdf8 45%, #0ea5e9 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  DIAMOND
                </span>
                <span
                  className="block text-6xl sm:text-7xl lg:text-8xl xl:text-[96px]"
                  style={{
                    background: "linear-gradient(135deg, #7dd3fc 0%, #38bdf8 45%, #0ea5e9 100%)",
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
            <p className="max-w-md text-base leading-relaxed" style={{ color: "#94a3b8" }}>
              Las sneakers más exclusivas de Ecuador. 100% originales, verificadas y
              entregadas a todo el país con seguimiento en tiempo real.
            </p>

            {/* Stats */}
            <div
              className="flex flex-wrap gap-px rounded-2xl overflow-hidden border"
              style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}
            >
              {[
                { value: "500+", label: "Estilos únicos" },
                { value: "100%", label: "Pares verificados" },
                { value: "48h", label: "Entrega express" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="flex-1 px-6 py-4 text-center"
                  style={{
                    borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  }}
                >
                  <p
                    className="font-display text-2xl font-black"
                    style={{
                      background: "linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link to="/catalogo">
                <Button variant="secondary" size="xl" className="font-bold">
                  Explorar Catálogo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/catalogo?ordering=-reciente">
                <button
                  className="h-14 px-8 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#e2e8f0",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                >
                  Nuevos Ingresos
                </button>
              </Link>
            </div>
          </div>

          {/* RIGHT — hero card */}
          <div className="relative mx-auto w-full max-w-[420px] aspect-[3/4]">
            <div
              className="absolute -inset-8 rounded-full blur-3xl animate-glow-pulse"
              style={{ background: "rgba(56,189,248,0.12)" }}
            />
            <div
              className="relative h-full rounded-[28px] overflow-hidden shadow-2xl"
              style={{
                background: "linear-gradient(145deg, rgba(15,20,32,0.9) 0%, rgba(8,13,24,0.95) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="absolute inset-0 line-pattern opacity-15" />
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ color: "rgba(56,189,248,0.04)" }}
              >
                <span
                  className="font-display font-black select-none"
                  style={{ fontSize: "160px", lineHeight: 1, color: "rgba(255,255,255,0.03)" }}
                >
                  DD
                </span>
              </div>

              {/* Floating card inside */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div
                  className="rounded-2xl p-5 space-y-3"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#475569" }}>
                      Nuevo Ingreso
                    </span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="font-display text-xl" style={{ color: "#f1f5f9" }}>
                    Air Max 90 — Black Diamond
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-2xl font-bold font-display"
                      style={{
                        background: "linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      $189.00
                    </span>
                    <Link to="/catalogo">
                      <button
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-colors"
                        style={{ background: "#38bdf8", color: "#0a0c12" }}
                      >
                        Ver
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page bottom fade to bg-page */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
          style={{
            background: `linear-gradient(to top, var(--bg-page), transparent)`,
          }}
        />
      </section>

      {/* ─── BENEFICIOS BAR ───────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--bg-border)", borderBottom: "1px solid var(--bg-border)", background: "var(--bg-surface)" }}>
        <div className="container-app grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0" style={{ "--tw-divide-color": "var(--bg-border)" } as any}>
          <BenefitItem
            icon={<Truck className="h-5 w-5 text-sky-500" />}
            title="Envíos a todo Ecuador"
            text="Calculamos el costo según tu zona y transportista"
          />
          <BenefitItem
            icon={<ShieldCheck className="h-5 w-5 text-emerald-500" />}
            title="100% Verificados"
            text="Inspeccionamos cada par antes del despacho"
          />
          <BenefitItem
            icon={<CreditCard className="h-5 w-5 text-purple-500" />}
            title="Pago por transferencia"
            text="Sube tu comprobante y te confirmamos en 1–2h"
          />
        </div>
      </section>

      {/* ─── CATEGORÍAS ───────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="container-app py-20">
          <SectionHeader
            eyebrow="Explorar"
            title="Comprar por Categoría"
            href="/catalogo"
            linkLabel="Ver catálogo completo"
          />
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
                  <div className="absolute inset-0 line-pattern" style={{ background: "#0d1120" }} />
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
      <section style={{ background: "var(--bg-surface2)", padding: "80px 0" }}>
        <div className="container-app">
          <SectionHeader
            eyebrow="Colección"
            title="Recién Llegados"
            href="/catalogo"
            linkLabel="Ver todo el catálogo"
          />
          <div className="mt-8">
            <ProductGrid products={featured} isLoading={isLoading} />
          </div>
        </div>
      </section>

      {/* ─── MARCAS ───────────────────────────────────────────────── */}
      {brands.length > 0 && (
        <section style={{ borderTop: "1px solid var(--bg-border)", background: "var(--bg-surface)", padding: "64px 0" }}>
          <div className="container-app">
            <p className="mb-8 text-center text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
              Marcas Disponibles
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
              {brands.map((b) => (
                <Link
                  key={b.id}
                  to={`/catalogo?marca=${b.id}`}
                  className="font-display text-lg font-black tracking-tight transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                >
                  {b.nombre}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA BAND ─────────────────────────────────────────────── */}
      <section
        className="py-16"
        style={{
          background: isDark
            ? "linear-gradient(135deg, #050709 0%, #080d18 100%)"
            : "#0a0c12",
        }}
      >
        <div className="container-app text-center space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400">
            Exclusivo Drip Diamond
          </p>
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
          <p className="mx-auto max-w-md text-sm leading-relaxed" style={{ color: "#64748b" }}>
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
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: "var(--bg-surface2)", border: "1px solid var(--bg-border)" }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{text}</p>
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
        <h2 className="mt-1 font-display text-3xl sm:text-4xl" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
      </div>
      <Link
        to={href}
        className="hidden sm:flex items-center gap-1.5 text-sm font-semibold transition-colors whitespace-nowrap"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
      >
        {linkLabel}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
