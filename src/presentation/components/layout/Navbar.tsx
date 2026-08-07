import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, ShoppingBag, User, X, Menu, ChevronRight,
  Gem, LayoutDashboard, BarChart3, Briefcase, Sun, Moon, Bell,
} from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import { useAuthStore } from "@/presentation/store/authStore";
import { useCartStore } from "@/presentation/store/cartStore";
import { useThemeStore } from "@/presentation/store/themeStore";
import { cn } from "@/presentation/utils/cn";

const LINKS = [
  { to: "/catalogo", label: "Catálogo" },
  { to: "/catalogo?categoria=running", label: "Running" },
  { to: "/catalogo?categoria=casual", label: "Casual" },
  { to: "/catalogo?ordering=-reciente", label: "Nuevos" },
];

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { cart, openDrawer } = useCartStore();
  const { theme, toggleTheme } = useThemeStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const isDark = theme === "dark";

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadNotifications = async () => {
      try {
        const data = await useCases.getNotifications.execute();
        setNotifications(data);
      } catch {
        setNotifications([]);
      }
    };

    loadNotifications();
  }, [isAuthenticated]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/catalogo?search=${encodeURIComponent(query)}`);
    setMobileOpen(false);
    setSearchOpen(false);
    setQuery("");
  };

  const itemCount = cart?.totalItems ?? 0;
  const rol = user?.rol?.toLowerCase();
  const unreadCount = notifications.filter((n) => !n.leida && !n.leida_at).length;

  const markRead = async (id: number) => {
    try {
      await useCases.markNotificationRead.execute(id);
      setNotifications((current) => current.map((n) => (n.id === id ? { ...n, leida: true, leida_at: new Date().toISOString() } : n)));
    } catch {
      // no-op
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "shadow-sm"
          : ""
      )}
      style={{
        background: scrolled ? "var(--nav-bg)" : "var(--bg-surface)",
        borderBottom: `1px solid var(--bg-border)`,
        backdropFilter: scrolled ? "blur(20px)" : "none",
      }}
    >
      <div className="container-app flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        {/* LEFT: Logo + Mobile Menu */}
        <div className="flex items-center gap-3">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/8 lg:hidden"
            style={{ color: "var(--text-secondary)" }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2.5 select-none group">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-all group-hover:scale-105"
              style={{ background: isDark ? "rgba(56,189,248,0.12)" : "#0a0c12" }}
            >
              <Gem
                className="h-4 w-4"
                style={{ color: isDark ? "#38bdf8" : "#38bdf8" }}
              />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="font-display text-[15px] font-extrabold tracking-tight block"
                style={{ color: "var(--text-primary)" }}
              >
                DRIP<span className="text-sky-500">DIAMOND</span>
              </span>
              <span className="text-[9px] tracking-[0.25em] font-medium uppercase block mt-0.5" style={{ color: "var(--text-muted)" }}>
                Luxury Sneakers
              </span>
            </div>
          </Link>
        </div>

        {/* CENTER: Nav links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = "var(--text-primary)";
                (e.target as HTMLElement).style.background = "var(--bg-surface2)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = "var(--text-secondary)";
                (e.target as HTMLElement).style.background = "transparent";
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Role-based admin links */}
          {isAuthenticated && rol && (
            <div className="ml-2 flex items-center gap-1 pl-3" style={{ borderLeft: `1px solid var(--bg-border)` }}>
              {rol === "administrador" && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 dark:text-sky-400 transition-colors"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Admin
                </Link>
              )}
              {(rol === "contador" || rol === "administrador") && (
                <Link
                  to="/contador"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 transition-colors"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Contabilidad
                </Link>
              )}
              {(rol === "vendedor" || rol === "administrador") && (
                <Link
                  to="/vendedor"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 dark:text-purple-400 transition-colors"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  Ventas
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* RIGHT: Search, Theme Toggle, Account, Cart */}
        <div className="flex items-center gap-1">
          {/* Search toggle */}
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-all"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="relative flex h-9 w-[52px] items-center rounded-full border transition-all duration-300 p-1"
            style={{
              background: isDark ? "rgba(56,189,248,0.12)" : "#f1f5f9",
              borderColor: isDark ? "rgba(56,189,248,0.2)" : "#e2e8f0",
            }}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 shadow-sm"
              style={{
                background: isDark ? "#38bdf8" : "#0a0c12",
                transform: isDark ? "translateX(20px)" : "translateX(0px)",
              }}
            >
              {isDark ? (
                <Sun className="h-3.5 w-3.5 text-slate-900" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-white" />
              )}
            </div>
          </button>

          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-all"
                style={{ color: "var(--text-secondary)" }}
                aria-label="Notificaciones"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
                    <p className="text-sm font-bold text-slate-800">Notificaciones</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {unreadCount} sin leer
                    </span>
                  </div>

                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-2 py-4 text-center text-xs text-slate-400">Sin notificaciones</p>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => markRead(n.id)}
                          className={`w-full rounded-xl border p-3 text-left transition ${n.leida ? "border-slate-200 bg-slate-50" : "border-sky-200 bg-sky-50"}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                              {n.tipo || "NOTIFICACION"}
                            </p>
                            {!n.leida && <span className="h-2 w-2 rounded-full bg-sky-500" />}
                          </div>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{n.asunto || n.mensajeCorto || "Actualización"}</p>
                          <p className="mt-1 text-xs text-slate-500">{n.mensaje || n.mensajeCorto || "Tienes una nueva actualización."}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account */}
          <Link
            to={isAuthenticated ? "/perfil" : "/login"}
            className="flex h-9 items-center gap-1.5 px-2.5 rounded-lg transition-all"
            style={{ color: "var(--text-secondary)" }}
            title={isAuthenticated ? user?.nombre : "Iniciar sesión"}
          >
            <User className="h-4 w-4" />
            {isAuthenticated && (
              <span
                className="hidden text-xs font-medium sm:block max-w-[80px] truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {user?.nombre}
              </span>
            )}
          </Link>

          {/* Cart */}
          <button
            onClick={openDrawer}
            className="relative flex h-9 items-center gap-1.5 rounded-xl px-3 text-white transition-all hover:opacity-90"
            style={{ background: isDark ? "#0f1f30" : "#0a0c12", border: isDark ? "1px solid rgba(56,189,248,0.15)" : "none" }}
            aria-label="Carrito"
          >
            <ShoppingBag className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="text-xs font-bold text-sky-400">{itemCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Expandable search bar */}
      {searchOpen && (
        <div
          className="border-t px-4 py-3 animate-slide-up"
          style={{ background: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
        >
          <form onSubmit={submitSearch} className="container-app">
            <div className="relative max-w-lg mx-auto">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar zapatillas, marcas, tallas..."
                className="h-11 w-full rounded-xl border pl-10 pr-12 text-sm outline-none transition-all"
                style={{
                  background: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#38bdf8")}
                onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="border-t pb-4 lg:hidden animate-slide-up"
          style={{ background: "var(--bg-surface)", borderColor: "var(--bg-border)" }}
        >
          <form onSubmit={submitSearch} className="px-4 pt-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar zapatillas..."
                className="h-10 w-full rounded-xl border pl-9 pr-3 text-sm outline-none"
                style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text-primary)" }}
              />
            </div>
          </form>
          <nav className="mt-3 px-2 flex flex-col gap-0.5">
            {LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                {link.label}
                <ChevronRight className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              </Link>
            ))}
            {isAuthenticated && rol && (
              <div className="mt-2 pt-2 space-y-0.5" style={{ borderTop: `1px solid var(--bg-border)` }}>
                {rol === "administrador" && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-sky-500">
                    <LayoutDashboard className="h-4 w-4" /> Panel Admin
                  </Link>
                )}
                {(rol === "contador" || rol === "administrador") && (
                  <Link to="/contador" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-500">
                    <BarChart3 className="h-4 w-4" /> Contabilidad
                  </Link>
                )}
                {(rol === "vendedor" || rol === "administrador") && (
                  <Link to="/vendedor" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-purple-500">
                    <Briefcase className="h-4 w-4" /> Panel Ventas
                  </Link>
                )}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
