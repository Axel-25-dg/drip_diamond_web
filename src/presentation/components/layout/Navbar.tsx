import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, ShoppingBag, User, X, Menu, ChevronRight,
  Gem, LayoutDashboard, BarChart3, Briefcase, Bell, Heart, Package, Sun, Moon,
} from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import { useAuthStore } from "@/presentation/store/authStore";
import { useCartStore } from "@/presentation/store/cartStore";
import { useFavoritesStore } from "@/presentation/store/favoritesStore";
import { useThemeStore } from "@/presentation/store/themeStore";
import { cn } from "@/presentation/utils/cn";

const LINKS = [
  { to: "/catalogo",                        label: "Catálogo" },
  { to: "/favoritos",                        label: "Favoritos" },
  { to: "/catalogo?ordering=-reciente",      label: "Novedades" },
];

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { cart, openDrawer }      = useCartStore();
  const { favorites }             = useFavoritesStore();
  const { theme, toggleTheme }   = useThemeStore();
  const [scrolled, setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery]         = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    useCases.getNotifications.execute()
      .then(setNotifications)
      .catch(() => setNotifications([]));
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

  const markRead = async (id: number) => {
    try {
      await useCases.markNotificationRead.execute(id);
      setNotifications((cur) =>
        cur.map((n) => n.id === id ? { ...n, leida: true, leida_at: new Date().toISOString() } : n)
      );
    } catch { /* no-op */ }
  };

  const itemCount   = cart?.totalItems ?? 0;
  const rol         = user?.rol?.toLowerCase();
  const unreadCount = notifications.filter((n) => !n.leida && !n.leida_at).length;

  /* ── Role pills ── */
  const rolePill = "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-200",
        scrolled
          ? "bg-white/95 dark:bg-[#0a0c10]/95 backdrop-blur-md border-blue-100 dark:border-slate-800/80 shadow-sm"
          : "bg-white dark:bg-[#0a0c10] border-blue-50 dark:border-slate-800/60"
      )}
    >
      <div className="container-app flex h-16 items-center justify-between gap-1.5 sm:gap-3 lg:h-[68px]">

        {/* ── Logo ── */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors lg:hidden shrink-0"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menú"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2 sm:gap-3 select-none shrink-0">
            <img src="/logo_drip.png" alt="Logo Drip Diamond" className="h-9 sm:h-11 w-auto object-contain shrink-0" />
            <div className="leading-none">
              <span className="font-display text-sm sm:text-base font-extrabold tracking-tight text-gray-900 dark:text-white">
                <span className="text-blue-600 dark:text-sky-400">DIAMOND</span>
              </span>
              <span className="hidden xs:block mt-0.5 text-[8px] sm:text-[9px] tracking-[0.2em] font-semibold uppercase text-gray-400 dark:text-slate-400">
                Calidad Sneakers
              </span>
            </div>
          </Link>
        </div>

        {/* ── Nav links (Desktop/TV) ── */}
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 dark:text-slate-300 dark:hover:text-sky-400 dark:hover:bg-slate-800 transition-all"
            >
              {link.label}
            </Link>
          ))}

          {isAuthenticated && rol && (
            <div className="ml-2 flex items-center gap-1 pl-3 border-l border-blue-100 dark:border-slate-800">
              {rol === "administrador" && (
                <Link to="/admin" className={cn(rolePill, "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-slate-700")}>
                  <LayoutDashboard className="h-3.5 w-3.5" /> Admin
                </Link>
              )}
              {rol === "administrador" && (
                <Link to="/admin/pedidos" className={cn(rolePill, "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-slate-700")}>
                  <ShoppingBag className="h-3.5 w-3.5" /> Pedidos
                </Link>
              )}
              {(rol === "contador" || rol === "administrador") && (
                <Link to="/contador" className={cn(rolePill, "bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-slate-700")}>
                  <BarChart3 className="h-3.5 w-3.5" /> Contabilidad
                </Link>
              )}
              {(rol === "vendedor" || rol === "administrador") && (
                <Link to="/vendedor" className={cn(rolePill, "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-slate-700")}>
                  <Briefcase className="h-3.5 w-3.5" /> Ventas
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* ── Actions ── */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Search (hidden on phone, visible on sm+) */}
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400 transition-colors"
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Notifications (hidden on phone, visible on sm+) */}
          {isAuthenticated && (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400 transition-colors"
                aria-label="Notificaciones"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-blue-100 bg-white p-3 shadow-[0_4px_24px_rgba(37,99,235,0.12)] dark:border-slate-800 dark:bg-[#12151c] dark:shadow-slate-950/50">
                  <div className="mb-2 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Notificaciones</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                      {unreadCount} sin leer
                    </span>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-gray-400 dark:text-slate-500">Sin notificaciones</p>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => markRead(n.id)}
                          className={cn(
                            "w-full rounded-xl border p-3 text-left transition-colors",
                            n.leida
                              ? "border-gray-100 bg-gray-50 hover:bg-gray-100 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/80"
                              : "border-blue-100 bg-blue-50 hover:bg-blue-100 dark:border-slate-700 dark:bg-slate-800/90 dark:hover:bg-slate-700"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                              {n.tipo || "NOTIFICACIÓN"}
                            </p>
                            {!n.leida && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                          </div>
                          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                            {n.asunto || n.mensajeCorto || "Actualización"}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                            {n.mensaje || n.mensajeCorto || "Tienes una nueva actualización."}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account (hidden on phone, visible on sm+) */}
          <Link
            to={isAuthenticated ? "/perfil" : "/login"}
            className="hidden sm:flex h-9 items-center gap-1 rounded-xl px-2 text-gray-500 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400 transition-colors"
            title={isAuthenticated ? user?.nombre : "Iniciar sesión"}
          >
            <User className="h-4 w-4" />
            {isAuthenticated && (
              <span className="hidden text-xs font-medium text-gray-700 dark:text-slate-300 md:block max-w-[72px] truncate">
                {user?.nombre}
              </span>
            )}
          </Link>

          {/* Mis pedidos (hidden on phone, visible on sm+) */}
          {isAuthenticated && (
            <Link
              to="/pedidos"
              title="Mis pedidos"
              className="hidden sm:flex h-9 items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 xl:px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-slate-800 dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-slate-700 transition-colors"
            >
              <Package className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xl:inline">Mis pedidos</span>
            </Link>
          )}

          {/* Favorites (hidden on phone, visible on sm+) */}
          <Link
            to="/favoritos"
            className="relative hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-rose-50 hover:text-rose-500 dark:text-slate-400 dark:hover:bg-rose-950/40 transition-colors"
            aria-label="Favoritos"
          >
            <Heart className={cn("h-4 w-4", favorites.length > 0 && "fill-rose-500 text-rose-500")} />
            {favorites.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {favorites.length}
              </span>
            )}
          </Link>

          {/* Theme Toggle (hidden on phone, visible on sm+) */}
          <button
            onClick={toggleTheme}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors shrink-0"
            title={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700 dark:text-slate-300" />}
          </button>

          {/* Cart — THE MAIN & ONLY BUTTON IN TOP BAR ON PHONE! */}
          <button
            onClick={openDrawer}
            className="relative flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 text-white hover:bg-blue-700 transition-colors shadow-[0_2px_8px_rgba(37,99,235,0.30)] shrink-0"
            aria-label="Carrito"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="text-xs font-bold text-sky-200">{itemCount}</span>
          </button>
        </div>
      </div>

      {/* ── Search bar expandible ── */}
      {searchOpen && (
        <div className="border-t border-blue-50 bg-white dark:bg-[#0a0c10] dark:border-slate-800 px-4 py-3 animate-slide-up">
          <form onSubmit={submitSearch} className="container-app">
            <div className="relative mx-auto max-w-lg">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar zapatillas, marcas, tallas..."
                className="h-11 w-full rounded-xl border border-blue-100 bg-blue-50 dark:border-slate-800 dark:bg-slate-900 pl-10 pr-10 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)] transition-all"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="border-t border-blue-50 bg-white dark:bg-[#0a0c10] dark:border-slate-800 pb-4 lg:hidden animate-slide-up max-h-[calc(100vh-4rem)] overflow-y-auto">
          <form onSubmit={submitSearch} className="px-4 pt-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar zapatillas..."
                className="h-10 w-full rounded-xl border border-blue-100 bg-blue-50 dark:border-slate-800 dark:bg-slate-900 pl-9 pr-3 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
            </div>
          </form>

          <nav className="mt-3 px-2 flex flex-col gap-0.5">
            {LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-sky-400 transition-colors"
              >
                {link.label}
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-slate-500" />
              </Link>
            ))}

            <div className="mt-2 space-y-1 pt-2 border-t border-blue-50 dark:border-slate-800">
              {/* Theme toggle in mobile menu */}
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-sky-400 transition-colors"
              >
                <span className="flex items-center gap-2">
                  {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700 dark:text-slate-300" />}
                  Tema ({theme === "dark" ? "Oscuro" : "Claro"})
                </span>
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">Cambiar</span>
              </button>

              <Link
                to={isAuthenticated ? "/perfil" : "/login"}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-sky-400 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600 dark:text-sky-400" />
                  {isAuthenticated ? `Mi perfil (${user?.nombre})` : "Iniciar sesión"}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-slate-500" />
              </Link>

              {isAuthenticated && (
                <Link
                  to="/pedidos"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-sky-400 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600 dark:text-sky-400" />
                    Mis pedidos
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                </Link>
              )}

              <Link
                to="/favoritos"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-sky-400 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500" />
                  Favoritos ({favorites.length})
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-slate-500" />
              </Link>
            </div>

            {isAuthenticated && rol && (
              <div className="mt-2 space-y-1 pt-2 border-t border-blue-50 dark:border-slate-800">
                {rol === "administrador" && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)}
                    className={cn(rolePill, "w-full bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-slate-800 dark:text-sky-300 rounded-xl px-3 py-2.5 justify-start")}>
                    <LayoutDashboard className="h-4 w-4" /> Panel Admin
                  </Link>
                )}
                {rol === "administrador" && (
                  <Link to="/admin/pedidos" onClick={() => setMobileOpen(false)}
                    className={cn(rolePill, "w-full bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-slate-800 dark:text-sky-300 rounded-xl px-3 py-2.5 justify-start")}>
                    <ShoppingBag className="h-4 w-4" /> Gestión Pedidos
                  </Link>
                )}
                {(rol === "contador" || rol === "administrador") && (
                  <Link to="/contador" onClick={() => setMobileOpen(false)}
                    className={cn(rolePill, "w-full bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-slate-800 dark:text-sky-300 rounded-xl px-3 py-2.5 justify-start")}>
                    <BarChart3 className="h-4 w-4" /> Contabilidad
                  </Link>
                )}
                {(rol === "vendedor" || rol === "administrador") && (
                  <Link to="/vendedor" onClick={() => setMobileOpen(false)}
                    className={cn(rolePill, "w-full bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-slate-800 dark:text-sky-300 rounded-xl px-3 py-2.5 justify-start")}>
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
