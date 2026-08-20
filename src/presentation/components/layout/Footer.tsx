import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/presentation/store/authStore";
import { useInfoPanels, type InfoPanelKey } from "@/presentation/store/useInfoPanels";
import { Mail, MapPin, ShieldCheck, Truck, Phone, Sparkles } from "lucide-react";

type IconProps = { className?: string };

function InstagramIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

function TikTokIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

const SHOP_LINKS = [
  { to: "/catalogo", label: "Todo el catálogo" },
  { to: "/catalogo?ordering=-reciente", label: "Novedades" },
  { to: "/catalogo?ordering=precio", label: "Mejores precios" },
];

const ACCOUNT_LINKS = [
  { to: "/perfil", label: "Mi perfil" },
  { to: "/pedidos", label: "Mis pedidos" },
  { to: "/carrito", label: "Mi carrito" },
];

const HELP_PANELS: { panelKey: InfoPanelKey; label: string }[] = [
  { panelKey: "como-comprar", label: "Cómo comprar" },
  { panelKey: "envios", label: "Envíos y cobertura" },
  { panelKey: "pagos", label: "Métodos de pago" },
  { panelKey: "faq", label: "Preguntas frecuentes" },
];

const SOCIALS = [
  {
    Icon: InstagramIcon,
    label: "Instagram",
    href: "https://www.instagram.com/drip.diamond.dd/?hl=en",
  },
  {
    Icon: TikTokIcon,
    label: "TikTok",
    href: "https://www.tiktok.com/@drip.diamond0?_r=1&_t=ZS-992u2C77kbX",
  },
];

export function Footer() {
  const { isAuthenticated } = useAuthStore();
  const { pathname } = useLocation();
  const { openPanel } = useInfoPanels();

  // Hide footer when on auth routes
  if (isAuthenticated || pathname.startsWith("/login") || pathname.startsWith("/registro")) {
    return null;
  }

  return (
    <footer className="relative bg-[#060a12] text-slate-200 overflow-hidden border-t border-white/10">
      {/* Glow Effects */}
      <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl" />

      {/* Línea de acento superior */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_12px_rgba(56,189,248,0.5)]" />

      <div className="container-app relative z-10 grid gap-8 sm:gap-12 py-12 sm:py-16 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-5">
        {/* Marca e Información de contacto */}
        <div className="xs:col-span-2 sm:col-span-2 lg:col-span-2 space-y-5">
          <Link to="/" className="inline-flex select-none items-center gap-3 group">
            <img
              src="/logo_drip.png"
              alt="Logo Drip Diamond"
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-transform duration-300 group-hover:scale-105"
            />
            <span className="leading-none">
              <span className="font-display block text-xl sm:text-2xl font-black tracking-tight text-white">
                DRIP<span className="text-sky-400">DIAMOND</span>
              </span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                Luxury Sneakers
              </span>
            </span>
          </Link>

          <p className="max-w-md text-sm leading-relaxed text-slate-300">
            Sneakers y streetwear de lujo. Entrega verificada a todo Quito con atención personalizada.
          </p>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm space-y-2.5">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
              <MapPin className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
              <span className="font-semibold text-white">Quito, Ecuador</span>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <Phone className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
              <a
                href="https://wa.me/593999001471"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-bold text-emerald-300 hover:text-emerald-200 transition-colors underline decoration-emerald-500/40 underline-offset-4"
              >
                +593 99 900 1471
              </a>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 pt-0.5">
              <Mail className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs">
                <a href="mailto:dripzapatillas@gmail.com" className="text-sky-300 hover:text-white transition-colors">
                  dripzapatillas@gmail.com
                </a>
                <span className="text-slate-500 font-bold">•</span>
                <a href="mailto:contacto@dripdiamond.ec" className="text-slate-300 hover:text-white transition-colors">
                  contacto@dripdiamond.ec
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Redes Oficiales:</span>
            <div className="flex gap-2.5">
              {SOCIALS.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition-all hover:-translate-y-0.5 hover:border-sky-400/50 hover:bg-sky-400/20 hover:text-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Secciones de Enlaces */}
        <FooterCol title="Tienda" links={SHOP_LINKS} />
        <FooterCol title="Mi cuenta" links={ACCOUNT_LINKS} />

        {/* Ayuda — abre los paneles interactivos */}
        <nav aria-label="Ayuda" className="space-y-4">
          <h4 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-400">Ayuda</h4>
          <ul className="space-y-3">
            {HELP_PANELS.map((item) => (
              <li key={item.label}>
                <button
                  onClick={() => openPanel(item.panelKey)}
                  className="group inline-flex items-center gap-2 text-left text-sm text-slate-300 transition-all hover:text-white hover:translate-x-1"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400/40 transition-all group-hover:bg-sky-400 group-hover:scale-125" aria-hidden="true" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Barra Inferior & Legales */}
      <div className="border-t border-white/10 bg-[#04070d]">
        <div className="container-app flex flex-col items-center justify-between gap-4 py-6 sm:flex-row text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="text-xs font-medium text-slate-400">
              © {new Date().getFullYear()} Drip Diamond. Todos los derechos reservados.
            </span>
            <div className="hidden sm:block h-3 w-px bg-white/15" />
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-slate-400">
              <button onClick={() => openPanel("terminos")} className="hover:text-sky-300 transition-colors">
                Términos y condiciones
              </button>
              <span className="text-slate-600">•</span>
              <button onClick={() => openPanel("privacidad")} className="hover:text-sky-300 transition-colors">
                Políticas de privacidad
              </button>
              <span className="text-slate-600">•</span>
              <button onClick={() => openPanel("cookies")} className="hover:text-sky-300 transition-colors">
                Administrar cookies
              </button>
              <span className="text-slate-600">•</span>
              <button onClick={() => openPanel("soporte")} className="hover:text-sky-300 transition-colors font-bold text-sky-400">
                Soporte
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-300 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              Pagos verificados manualmente
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-sky-300 font-semibold">
              <Truck className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
              Envíos Servientrega (Sábados/Domingos)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <nav aria-label={title} className="space-y-4">
      <h4 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-400">{title}</h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.to} className="group inline-flex items-center gap-2 text-sm text-slate-300 transition-all hover:text-white hover:translate-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400/40 transition-all group-hover:bg-sky-400 group-hover:scale-125" aria-hidden="true" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}