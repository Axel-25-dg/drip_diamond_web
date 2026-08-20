import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, Plus, Star,
  Sparkles, Truck, ShieldCheck, RefreshCw,
} from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { ProductSummary, Brand, Category } from "@/domain/entities/Product";
import { resolveMediaUrl, formatCurrency } from "@/presentation/utils/format";

/* ─── Static data ──────────────────────────────────────────── */
const SHOES_DEMO = [
  { id: "s1", name: 'Azul High "Cloud"',  price: "$129", tag: "Nuevo"  },
  { id: "s2", name: "Celeste Runner",      price: "$109", tag: "Top"    },
  { id: "s3", name: "Court Blue Pro",      price: "$149", tag: undefined },
  { id: "s4", name: "Skate Ice Suede",     price: "$99",  tag: "Oferta" },
];

const MARQUEE_WORDS = [
  "Drip Diamond","Luxury Sneakers","Ecuador","Envío rápido",
  "Ediciones limitadas","Estilo urbano","100% Verificados",
];

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  casual: "/categoria_e_imagenes/casual.webp",
  urbano: "/categoria_e_imagenes/urbano.webp",
  urbano_uy: "/categoria_e_imagenes/urbano.webp",
  runing: "/categoria_e_imagenes/runing.webp",
  running: "/categoria_e_imagenes/runing.webp",
  jordan: "/categoria_e_imagenes/jordan.jpg",
};

const HERO_SHOES = [
  "/zapatillas/jordan_11.png",
  "/zapatillas/adidas_bad.png",
  "/zapatillas/puma_zap.png",
];

function getCategoryImage(category: Category): string | null {
  const normalized = category.nombre?.toLowerCase().replace(/\s+/g, "") ?? "";
  if (!normalized) return null;
  if (normalized in CATEGORY_IMAGE_MAP) return CATEGORY_IMAGE_MAP[normalized as keyof typeof CATEGORY_IMAGE_MAP];
  if (normalized.includes("casual")) return CATEGORY_IMAGE_MAP.casual;
  if (normalized.includes("urbano") || normalized.includes("urban")) return CATEGORY_IMAGE_MAP.urbano;
  if (normalized.includes("run") || normalized.includes("jog")) return CATEGORY_IMAGE_MAP.runing;
  if (normalized.includes("jordan")) return CATEGORY_IMAGE_MAP.jordan;
  return null;
}

const BENEFITS = [
  { Icon: Truck, title: "Envío por Servientrega", text: "Despachos a todo Quito los días sábados o domingos para tu comodidad." },
  { Icon: ShieldCheck, title: "Pares verificados", text: "Revisamos cada sneaker antes de enviarla para asegurar su calidad." },
  { Icon: RefreshCw, title: "Cambios por fábrica", text: "Máximo 1 semana de plazo para solicitar cambios por daños de fábrica." },
];

/* ─── Sneaker 3D component ─────────────────────────────────── */
function Sneaker3D({ products }: { products: ProductSummary[] }) {
  const [active, setActive]   = useState(0);
  const [paused, setPaused]   = useState(false);
  const [tilt,   setTilt]     = useState({ x: 0, y: 0 });
  const frameRef              = useRef<HTMLDivElement>(null);

  /* Use real products if available, otherwise fall back to demo labels */
  const desiredCount = HERO_SHOES.length;
  let items = products.length > 0 ? products.slice(0, desiredCount) : SHOES_DEMO;
  if (products.length > 0 && items.length < desiredCount) {
    const pads = Array.from({ length: desiredCount - items.length }).map((_, i) => ({ id: `pad-${i}` }));
    items = [...items, ...pads] as any[];
  }

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((i) => (i + 1) % items.length), 3800);
    return () => clearInterval(id);
  }, [paused, items.length]);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width  - 0.5;
    const py = (e.clientY - rect.top)  / rect.height - 0.5;
    setTilt({ x: -py * 16, y: px * 26 });
  }, []);

  const item = items[active];
  const imgSrc = HERO_SHOES[active % HERO_SHOES.length];
  const price =
    (item as any).precioBase
      ? formatCurrency((item as any).precioBase)
      : (item as any).price ?? "$—";

  return (
    <div className="relative select-none">
      <div
        ref={frameRef}
        onMouseMove={handleMove}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => { setPaused(false); setTilt({ x: 0, y: 0 }); }}
        className="relative mx-auto flex aspect-square w-full max-w-[520px] items-center justify-center"
        style={{ perspective: "1400px" }}
      >
        {/* Dashed rings */}
        <div
          className="absolute inset-6 rounded-full border-2 border-dashed border-blue-300/30"
          style={{ animation: "ring-spin 32s linear infinite" }}
          aria-hidden
        />
        <div
          className="absolute inset-16 rounded-full border border-blue-200/20"
          style={{ animation: "ring-spin 24s linear infinite reverse" }}
          aria-hidden
        />

        {/* Ghost number */}
        <span
          className="pointer-events-none absolute font-display text-[7rem] font-black leading-none text-blue-600/5 sm:text-[9rem]"
          aria-hidden
        >
          {String(active + 1).padStart(2, "0")}
        </span>

        {/* 3D shoe */}
        <div
          className="relative h-[78%] w-[78%]"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: "transform 0.25s ease-out",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              transformStyle: "preserve-3d",
              animation: paused ? "none" : "shoe-float 6s ease-in-out infinite",
            }}
          >
            <img
              key={(item as any).id}
              src={imgSrc}
              alt={(item as any).nombre ?? (item as any).name}
              className="h-full w-full object-contain drop-shadow-[0_45px_45px_rgba(2,132,199,0.22)]"
              style={{ animation: "shoe-enter 0.7s cubic-bezier(0.22,1,0.36,1)" }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
            />
          </div>
        </div>

        {/* Ground shadow */}
        <div className="absolute bottom-[12%] h-5 w-2/5 rounded-[100%] bg-blue-600/10" aria-hidden />

        {/* Price chip */}
        <div className="absolute right-2 top-6 rounded-2xl border border-blue-100 bg-white/90 dark:border-[#222732] dark:bg-[#12151c]/90 px-4 py-3 shadow-lg backdrop-blur sm:right-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-400">Desde</p>
          <p className="font-display text-xl font-extrabold text-gray-900 dark:text-white">{price}</p>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="mt-4 flex items-center justify-center gap-3">
        {items.map((s, i) => {
          const thumb = HERO_SHOES[i % HERO_SHOES.length];
          return (
            <button
              key={(s as any).id}
              onClick={() => setActive(i)}
              aria-label={`Ver ${(s as any).nombre ?? (s as any).name}`}
              aria-pressed={i === active}
              className={`relative h-14 w-14 overflow-hidden rounded-xl border bg-white dark:bg-[#12151c] transition-all sm:h-16 sm:w-16 ${
                i === active
                  ? "border-blue-500 ring-2 ring-blue-400/30 dark:border-sky-400"
                  : "border-gray-200 dark:border-[#222732] opacity-60 hover:opacity-100"
              }`}
            >
              <img src={thumb} alt="" className="h-full w-full object-contain p-1"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = HERO_SHOES[i % HERO_SHOES.length]; }} />
            </button>
          );
        })}
      </div>

      {/* name hidden by request */}
    </div>
  );
}

/* ─── HomePage ─────────────────────────────────────────────── */
export default function HomePage() {
  const [featured,    setFeatured]    = useState<ProductSummary[]>([]);
  const [brands,      setBrands]      = useState<Brand[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);

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
      } catch { /* offline — page still renders */ }
      finally { if (active) setIsLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const marqueeRow = [...MARQUEE_WORDS, ...MARQUEE_WORDS];

  return (
    <main className="min-h-screen bg-[#f8faff] dark:bg-[#0a0c10] text-slate-900 dark:text-white transition-colors duration-200">

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white dark:bg-[#0a0c10]">
        {/* Celeste wash */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(120% 90% at 85% 10%, rgba(14,165,233,0.14) 0%, transparent 55%)" }}
          aria-hidden
        />

        <div className="container-app relative grid items-center gap-8 py-10 sm:gap-10 sm:py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">

          {/* LEFT */}
          <div className="space-y-7">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/40 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-500 dark:text-sky-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-sky-400">
                Nueva temporada · Drip Diamond Ecuador
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl font-black leading-[0.92] tracking-tight text-gray-900 dark:text-white text-balance sm:text-5xl lg:text-6xl xl:text-7xl">
              Camina con{" "}
              <span className="relative whitespace-nowrap text-blue-600 dark:text-sky-400">
                drip diamond
                <svg
                  className="absolute -bottom-2 left-0 w-full text-sky-400"
                  viewBox="0 0 200 12"
                  fill="none"
                  aria-hidden
                >
                  <path d="M2 9C40 3 160 3 198 9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
              <br />
              siente la diferencia.
            </h1>

            {/* Description */}
            <p className="max-w-md text-base leading-relaxed text-gray-500 dark:text-slate-400">
              Las sneakers más exclusivas de Ecuador. Verificadas y
              entregadas a todo el país. Gira, explora y descubre el par que combina con tu ritmo.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                to="/catalogo"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-blue-600 px-7 text-sm font-bold text-white shadow-[0_4px_16px_rgba(37,99,235,0.35)] transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_8px_24px_rgba(37,99,235,0.45)]"
              >
                Explorar catálogo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/catalogo?ordering=-reciente"
                className="inline-flex h-12 items-center rounded-full border border-blue-200 bg-white dark:border-[#222732] dark:bg-[#12151c] px-7 text-sm font-semibold text-gray-700 dark:text-slate-200 transition-all hover:border-blue-400 dark:hover:border-sky-400 hover:text-blue-700 dark:hover:text-white"
              >
                Ver novedades
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 sm:gap-10 pt-2">
              {[
                { v: "Servientrega", l: "Envíos Sábados/Domingos" },
                { v: "+500", l: "Modelos únicos" },
                { v: "4.9/5", l: "Valoración media" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="font-display text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{s.v}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-400">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — 3D shoe */}
          <div className="order-first lg:order-last">
            <Sneaker3D products={featured.slice(0, 4)} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MARQUEE
      ══════════════════════════════════════════════════════════ */}
      <div className="border-y border-blue-600 bg-blue-600 text-white">
        <div className="flex overflow-hidden py-3">
          {[0, 1].map((k) => (
            <div
              key={k}
              className="animate-marquee flex shrink-0 items-center gap-8 pr-8"
              aria-hidden={k === 1}
            >
              {marqueeRow.map((w, i) => (
                <span key={i} className="flex items-center gap-8">
                  <span className="font-display text-sm font-bold uppercase tracking-[0.18em]">{w}</span>
                  <span className="text-white/50">◆</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          CATEGORÍAS
      ══════════════════════════════════════════════════════════ */}
      <section className="container-app py-16" id="categorias">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500 dark:text-sky-400">Explorar</p>
            <h2 className="mt-1 font-display text-3xl font-black tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Compra por categoría
            </h2>
          </div>
          <Link to="/catalogo" className="hidden text-sm font-semibold text-gray-400 dark:text-slate-400 transition-colors hover:text-gray-900 dark:hover:text-white sm:block">
            Ver todo →
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 4).map((c, idx) => {
              const isUrbano = /urbano|urban/i.test(String(c.nombre ?? ""));
              return (
                <Link
                  key={c.id}
                  to={`/catalogo?categoria=${c.id}`}
                  className={`group relative flex min-h-[320px] flex-col justify-end overflow-hidden rounded-3xl border border-blue-100 dark:border-[#222732] bg-blue-50 dark:bg-[#12151c] ${isUrbano ? "md:col-span-2 lg:col-span-2" : ""}`}
                >
                <img
                  src={getCategoryImage(c) ?? resolveMediaUrl(c.imagenUrl) ?? `/zapatillas/shoe-${(idx % 4) + 1}.svg`}
                  alt={c.nombre}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent" />
                <div className="relative z-10 p-5">
                  <h3 className="font-display text-2xl font-black text-white">{c.nombre}</h3>
                  <p className="mt-2 max-w-xs text-sm text-white/80">Explora los mejores pares de esta categoría.</p>
                </div>
                <div className="absolute right-5 bottom-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-transform group-hover:rotate-45">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </Link>
              )
            })}
          </div>
        ) : (
          /* Placeholder categories cuando no hay datos */
          <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
            {["Running","Urbano","Basket","Casual"].map((name, idx) => (
              <Link
                key={name}
                to="/catalogo"
                className={`group relative flex items-end overflow-hidden rounded-3xl ${
                  idx === 0 ? "aspect-[4/5] md:col-span-2 lg:min-h-[320px]" : idx === 1 ? "aspect-[4/5] md:col-span-2 lg:min-h-[320px]" : "aspect-[4/5] lg:min-h-[320px]"
                } ${["bg-blue-100","bg-sky-100","bg-blue-50","bg-indigo-100"][idx]}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${["from-blue-400 to-blue-600","from-sky-400 to-sky-600","from-blue-300 to-sky-400","from-indigo-400 to-blue-500"][idx]}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                <div className="relative z-10 flex w-full items-end justify-between p-5">
                  <div>
                    <h3 className="font-display text-2xl font-black text-white">{name}</h3>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-transform group-hover:rotate-45">
                    <ArrowUpRight className="h-5 w-5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEATURED PRODUCTS
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-blue-50/60 dark:bg-[#0e1117] py-16" id="novedades">
        <div className="container-app">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500 dark:text-sky-400">Colección</p>
              <h2 className="mt-1 font-display text-3xl font-black tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Recién llegados
              </h2>
            </div>
            <Link to="/catalogo" className="hidden text-sm font-semibold text-gray-400 dark:text-slate-400 transition-colors hover:text-gray-900 dark:hover:text-white sm:block">
              Ver catálogo →
            </Link>
          </div>

          <div id="catalogo" className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col overflow-hidden rounded-3xl border border-blue-100 dark:border-[#222732] bg-white dark:bg-[#12151c]">
                    <div className="aspect-square animate-pulse bg-blue-100 dark:bg-slate-800" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 rounded-lg bg-blue-100 dark:bg-slate-800 animate-pulse w-3/4" />
                      <div className="h-3 rounded-lg bg-blue-50 dark:bg-slate-900 animate-pulse w-1/2" />
                    </div>
                  </div>
                ))
              : featured.length > 0
                ? featured.slice(0, 8).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))
                : SHOES_DEMO.map((s) => (
                    <DemoCard key={s.id} name={s.name} price={s.price} tag={s.tag} />
                  ))
            }
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          BENEFITS
      ══════════════════════════════════════════════════════════ */}
      <section className="container-app py-10 sm:py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-blue-100 dark:border-[#222732] bg-white dark:bg-[#12151c] p-5 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-sky-400">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-gray-900 dark:text-white">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-slate-400">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          DETAIL BAND
      ══════════════════════════════════════════════════════════ */}
      <section className="container-app py-16">
        <div className="relative grid overflow-hidden rounded-[2rem] border border-blue-100 dark:border-[#222732] bg-white dark:bg-[#12151c] shadow-sm md:grid-cols-2">
          <div className="flex flex-col justify-center gap-5 p-8 sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500 dark:text-sky-400">
              Detalle &amp; materiales
            </p>
            <h2 className="font-display text-3xl font-black leading-tight tracking-tight text-gray-900 dark:text-white text-balance sm:text-4xl">
              Cada puntada, pensada para durar.
            </h2>
            <p className="max-w-md text-base leading-relaxed text-gray-500 dark:text-slate-400 text-pretty">
              Tejidos técnicos, costuras en celeste y suelas amortiguadas. Un acabado limpio
              en blanco y azul que se siente tan bien como se ve.
            </p>
            <Link
              to="/catalogo"
              className="group inline-flex w-fit items-center gap-2 text-sm font-bold text-blue-600 dark:text-sky-400"
            >
              Descubre la colección
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="relative min-h-[280px] overflow-hidden bg-gradient-to-br from-blue-50 to-sky-100 dark:from-slate-900 dark:to-slate-800">
                <img
                  src="/categoria_e_imagenes/jordan.jpg"
                  alt="Detalle Jordan"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          BRANDS
      ══════════════════════════════════════════════════════════ */}
      {brands.length > 0 && (
        <section className="border-y border-blue-50 dark:border-[#222732] bg-white dark:bg-[#0a0c10] py-12">
          <div className="container-app">
            <p className="mb-8 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400 dark:text-slate-500">
              Marcas Disponibles
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              {brands.map((b) => (
                <Link
                  key={b.id}
                  to={`/catalogo?marca=${b.id}`}
                  className="font-display text-lg font-black tracking-tight text-gray-300 dark:text-slate-600 transition-colors hover:text-blue-600 dark:hover:text-sky-400"
                >
                  {b.nombre}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          CTA BAND
      ══════════════════════════════════════════════════════════ */}
      <section className="container-app pb-16 pt-4">
        <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-[#12151c] text-slate-900 dark:text-white border border-slate-100 dark:border-[#222732] px-5 py-10 sm:px-8 sm:py-14 md:px-12 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-white to-white dark:from-sky-950/30 dark:via-[#12151c] dark:to-[#12151c] opacity-90" />
          <div className="relative mx-auto max-w-xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600 dark:text-sky-400">Tu próximo par te está esperando</p>
                <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white">
                  Encuentra el par que define tu estilo.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Selección curada de zapatillas premium, envíos por Servientrega los sábados y domingos a todo Quito.
                </p>
              </div>
            </div>
            <div className="mx-auto flex max-w-md flex-col gap-3 pt-2 sm:flex-row">
              <input
                type="email"
                placeholder="tu@correo.com"
                className="h-12 flex-1 rounded-full border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#171a22] px-5 text-sm text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-sky-400"
              />
              <Link
                to="/catalogo"
                className="flex h-12 items-center justify-center rounded-full bg-blue-600 px-7 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
              >
                Explorar ahora
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

/* ─── Product card (real data) ─────────────────────────────── */
function ProductCard({ product: p }: { product: ProductSummary }) {
  const imgSrc = resolveMediaUrl(p.imagenPrincipal) ?? "/placeholder.svg";
  const isAvailable = p.estado === "disponible" || (p.tallasDisponibles && p.tallasDisponibles.length > 0);

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-blue-100 dark:border-[#222732] bg-white dark:bg-[#12151c] transition-shadow hover:shadow-xl hover:shadow-blue-600/10">
      <div className="relative aspect-square overflow-hidden bg-blue-50/40 dark:bg-[#171a22]">
        {!isAvailable && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-gray-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Agotado
          </span>
        )}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/90 dark:bg-[#12151c]/90 px-2 py-1 text-[11px] font-bold text-gray-800 dark:text-white backdrop-blur shadow-sm border border-slate-100 dark:border-[#222732]">
          <Star className="h-3 w-3 fill-blue-500 text-blue-500" />
          4.9
        </div>
        <img
          src={imgSrc}
          alt={p.nombre}
          className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-bold text-gray-900 dark:text-white line-clamp-1">{p.nombre}</h3>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-400">{p.marca}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-display text-lg font-black text-gray-900 dark:text-white">
            {formatCurrency(p.precioBase)}
          </span>
          <Link
            to={`/producto/${p.id}`}
            aria-label={`Ver ${p.nombre}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)] transition-transform hover:scale-110"
          >
            <Plus className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ─── Demo card (fallback when no products) ─────────────────── */
function DemoCard({ name, price, tag }: { name: string; price: string; tag?: string }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-blue-100 dark:border-[#222732] bg-white dark:bg-[#12151c] transition-shadow hover:shadow-xl hover:shadow-blue-600/10">
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-blue-50 to-sky-100 dark:from-slate-900 dark:to-slate-800">
        {tag && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            {tag}
          </span>
        )}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/90 dark:bg-[#12151c]/90 px-2 py-1 text-[11px] font-bold text-gray-800 dark:text-white backdrop-blur border border-slate-100 dark:border-[#222732]">
          <Star className="h-3 w-3 fill-blue-500 text-blue-500" />
          4.9
        </div>
        <div className="flex h-full items-center justify-center">
          <div className="h-24 w-24 rounded-full bg-blue-200/50 dark:bg-slate-800" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-bold text-gray-900 dark:text-white">{name}</h3>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-400">Edición cápsula</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-display text-lg font-black text-gray-900 dark:text-white">{price}</span>
          <Link
            to="/catalogo"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)] transition-transform hover:scale-110"
          >
            <Plus className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
