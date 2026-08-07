import { Link } from "react-router-dom";
import { Instagram, Facebook, MessageCircle, Gem, Mail, MapPin } from "lucide-react";

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
const HELP_LINKS = [
  { href: "#", label: "Cómo comprar" },
  { href: "#", label: "Envíos y cobertura" },
  { href: "#", label: "Métodos de pago" },
  { href: "#", label: "Preguntas frecuentes" },
];

export function Footer() {
  return (
    <footer style={{ background: "var(--sidebar-bg)", color: "#f1f5f9", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      {/* Main grid */}
      <div className="container-app grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-5">
        {/* Brand col (spans 2) */}
        <div className="lg:col-span-2">
          <Link to="/" className="inline-flex items-center gap-2.5 select-none">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.07)" }}>
              <Gem className="h-5 w-5 text-sky-400" />
            </div>
            <div className="leading-none">
              <span className="font-display text-xl font-black text-white tracking-tight block">
                DRIP<span className="text-sky-400">DIAMOND</span>
              </span>
              <span className="text-[9px] tracking-[0.25em] font-medium uppercase block mt-0.5" style={{ color: "#475569" }}>
                Luxury Sneakers
              </span>
            </div>
          </Link>

          <p className="mt-5 max-w-xs text-sm leading-relaxed" style={{ color: "#475569" }}>
            Sneakers y streetwear de lujo 100% originales. Entrega verificada a todo Ecuador con atención personalizada.
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm" style={{ color: "#334155" }}>
            <MapPin className="h-4 w-4 text-slate-600" />
            <span>Quito, Ecuador</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: "#334155" }}>
            <Mail className="h-4 w-4 text-slate-600" />
            <span>contacto@dripdiamond.ec</span>
          </div>

          {/* Social icons */}
          <div className="mt-6 flex gap-2">
            {[
              { Icon: Instagram, label: "Instagram" },
              { Icon: Facebook, label: "Facebook" },
              { Icon: MessageCircle, label: "WhatsApp" },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all"
                style={{ background: "rgba(255,255,255,0.06)", color: "#475569" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(56,189,248,0.15)";
                  (e.currentTarget as HTMLElement).style.color = "#38bdf8";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLElement).style.color = "#475569";
                }}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <FooterCol title="Tienda" links={SHOP_LINKS} isRoute />
        <FooterCol title="Mi cuenta" links={ACCOUNT_LINKS} isRoute />
        <FooterCol title="Ayuda" links={HELP_LINKS} isRoute={false} />
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="container-app flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <span className="text-xs" style={{ color: "#1e293b" }}>
            © {new Date().getFullYear()} Drip Diamond. Todos los derechos reservados.
          </span>
          <div className="flex items-center gap-4 text-xs" style={{ color: "#1e293b" }}>
            <span>Pagos verificados manualmente</span>
            <span className="h-1 w-1 rounded-full" style={{ background: "#1e293b" }} />
            <span>Envíos a todo Ecuador</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links, isRoute }: {
  title: string;
  links: { to?: string; href?: string; label: string }[];
  isRoute: boolean;
}) {
  return (
    <div>
      <h4 className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#334155" }}>
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {isRoute && link.to ? (
              <Link
                to={link.to}
                className="text-sm transition-colors"
                style={{ color: "#334155" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f1f5f9"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#334155"; }}
              >
                {link.label}
              </Link>
            ) : (
              <a
                href={link.href || "#"}
                className="text-sm transition-colors"
                style={{ color: "#334155" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f1f5f9"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#334155"; }}
              >
                {link.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
