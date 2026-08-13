import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/presentation/store/authStore";
import { Mail, MapPin, ShieldCheck, Truck } from "lucide-react"

type IconProps = { className?: string }

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
  )
}

function FacebookIcon({ className }: IconProps) {
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
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function WhatsappIcon({ className }: IconProps) {
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
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
      <path d="M9 9.5c0 2.5 2 4.5 4.5 4.5" />
    </svg>
  )
}

const SHOP_LINKS = [
  { to: "/catalogo", label: "Todo el catálogo" },
  { to: "/catalogo?ordering=-reciente", label: "Novedades" },
  { to: "/catalogo?ordering=precio", label: "Mejores precios" },
]
const ACCOUNT_LINKS = [
  { to: "/perfil", label: "Mi perfil" },
  { to: "/pedidos", label: "Mis pedidos" },
  { to: "/carrito", label: "Mi carrito" },
]
const HELP_LINKS = [
  { to: "#", label: "Cómo comprar" },
  { to: "#", label: "Envíos y cobertura" },
  { to: "#", label: "Métodos de pago" },
  { to: "#", label: "Preguntas frecuentes" },
]

const SOCIALS = [
  { Icon: InstagramIcon, label: "Instagram", href: "#" },
  { Icon: FacebookIcon, label: "Facebook", href: "#" },
  { Icon: WhatsappIcon, label: "WhatsApp", href: "#" },
]

export function Footer() {
  const { isAuthenticated } = useAuthStore();
  const { pathname } = useLocation();

  // Hide footer for authenticated users or when on auth routes
  if (isAuthenticated || pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null;
  }

  return (
    <footer className="relative bg-[#0b1220] text-slate-200">
      {/* Línea de acento superior */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-sky-500/60 to-transparent" />

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-5">
        {/* Marca */}
        <div className="lg:col-span-2">
          <Link to="/" className="inline-flex select-none items-center gap-3">
            <img
              src="/logo_drip.png"
              alt="Logo Drip Diamond"
              className="h-12 w-auto object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.35)]"
            />
            <span className="leading-none">
              <span className="font-display block text-2xl font-black tracking-tight text-white">
                DRIP<span className="text-sky-400">DIAMOND</span>
              </span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                Luxury Sneakers
              </span>
            </span>
          </Link>

          <p className="mt-6 max-w-sm text-sm leading-relaxed text-slate-300">
            Sneakers y streetwear de lujo. Entrega verificada a todo Quito con atención
            personalizada.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-3">
              <MapPin className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
              <span>Quito, Ecuador</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
              <a href="mailto:contacto@dripdiamond.ec" className="transition-colors hover:text-sky-300">
                contacto@dripdiamond.ec
              </a>
            </li>
          </ul>

          <div className="mt-7 flex gap-3">
            {SOCIALS.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition-all hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-sky-400/15 hover:text-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <FooterCol title="Tienda" links={SHOP_LINKS} />
        <FooterCol title="Mi cuenta" links={ACCOUNT_LINKS} />
        <FooterCol title="Ayuda" links={HELP_LINKS} />
      </div>

      {/* Barra inferior */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
          <span className="text-xs text-slate-400">
            © {new Date().getFullYear()} Drip Diamond. Todos los derechos reservados.
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-400" aria-hidden="true" />
              Pagos verificados manualmente
            </span>
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-sky-400" aria-hidden="true" />
              Envíos a todo Quito
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-400">{title}</h4>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.to} className="group inline-flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white">
              <span className="h-px w-0 bg-sky-400 transition-all duration-300 group-hover:w-4" aria-hidden="true" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}