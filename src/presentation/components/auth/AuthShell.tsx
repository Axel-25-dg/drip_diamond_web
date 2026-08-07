import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Gem, ShieldCheck, Truck, Star } from "lucide-react";

export function AuthShell({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-[1fr_520px]">
      {/* LEFT — always dark brand panel */}
      <div
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between p-12"
        style={{ background: "#070a14" }}
      >
        <div className="pointer-events-none absolute inset-0 line-pattern opacity-25" />
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full blur-[100px]" style={{ background: "rgba(56,189,248,0.08)" }} />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full blur-[80px]" style={{ background: "rgba(100,116,139,0.05)" }} />

        {/* Logo */}
        <Link to="/" className="relative z-10 inline-flex items-center gap-2.5 select-none">
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

        {/* Main copy */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2
              className="font-display text-5xl leading-[0.9]"
              style={{
                background: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 50%, #94a3b8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              TU ESTILO,
            </h2>
            <h2
              className="font-display text-5xl leading-[0.9] mt-1"
              style={{
                background: "linear-gradient(135deg, #7dd3fc 0%, #38bdf8 45%, #0ea5e9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              SIN LÍMITES.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed" style={{ color: "#475569" }}>
            Crea tu cuenta y gestiona tus pedidos, sigue el estado de tus envíos y accede a
            beneficios exclusivos de la comunidad Drip Diamond.
          </p>

          {/* Trust badges */}
          <div className="space-y-3">
            {[
              { Icon: ShieldCheck, text: "Pagos 100% verificados manualmente" },
              { Icon: Truck, text: "Envíos a todo Ecuador con guía de rastreo" },
              { Icon: Star, text: "Pares verificados antes del despacho" },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(56,189,248,0.08)" }}>
                  <Icon className="h-4 w-4 text-sky-400" />
                </div>
                <span className="text-sm" style={{ color: "#334155" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <span className="relative z-10 text-xs" style={{ color: "#1e293b" }}>
          © {new Date().getFullYear()} Drip Diamond · Ecuador
        </span>
      </div>

      {/* RIGHT — form panel (themed) */}
      <div
        className="flex items-center justify-center px-6 py-16"
        style={{ background: "var(--bg-surface)" }}
      >
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <Link to="/" className="mb-8 inline-flex items-center gap-2.5 lg:hidden select-none">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "var(--bg-surface2)", border: "1px solid var(--bg-border)" }}
            >
              <Gem className="h-4 w-4 text-sky-500" />
            </div>
            <span className="font-display text-lg font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              DRIP<span className="text-sky-500">DIAMOND</span>
            </span>
          </Link>

          <h1 className="font-display text-3xl" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {subtitle}
            </p>
          )}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
