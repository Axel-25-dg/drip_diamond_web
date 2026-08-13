import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, ShoppingBag, User, X, Menu, ChevronRight,
  Gem, LayoutDashboard, BarChart3, Briefcase, Bell, Heart, Package,
} from "lucide-react";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import { useAuthStore } from "@/presentation/store/authStore";
import { useCartStore } from "@/presentation/store/cartStore";
import { useFavoritesStore } from "@/presentation/store/favoritesStore";
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
          ? "bg-white/95 backdrop-blur-md border-blue-100 shadow-[0_1px_8px_rgba(37,99,235,0.08)]"
          : "bg-white border-blue-50"
      )}
    >
      <div className="container-app flex h-16 items-center justify-between gap-4 lg:h-[68px]">

        {/* ── Logo ── */}
        
        <div className="flex items-center gap-3">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-blue-50 transition-colors lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menú"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/" className="flex items-center gap-3 select-none">
            <img src="/logo_drip.png" alt="Logo Drip Diamond" className="h-15 w-auto object-contain" />
            <div className="leading-none">
              <span className="font-display text-[16px] font-extrabold tracking-tight text-gray-900">
                <span className="text-blue-600">DIAMOND</span>
              </span>
              <span className="block mt-0.5 text-[9px] tracking-[0.25em] font-semibold uppercase text-gray-400">
                Calidad Sneakers
              </span>
            </div>
          </Link>
        </div>

        {/* ── Nav links ── */}
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-all"
            >
              {link.label}
            </Link>
          ))}

          {isAuthenticated && rol && (
            <div className="ml-2 flex items-center gap-1 pl-3 border-l border-blue-100">
              {rol === "administrador" && (
                <Link to="/admin" className={cn(rolePill, "bg-blue-50 text-blue-700 hover:bg-blue-100")}>
                  <LayoutDashboard className="h-3.5 w-3.5" /> Admin
                </Link>
              )}
              {rol === "administrador" && (
                <Link to="/admin/pedidos" className={cn(rolePill, "bg-blue-50 text-blue-700 hover:bg-blue-100")}>
                  <ShoppingBag className="h-3.5 w-3.5" /> Pedidos
                </Link>
              )}
              {(rol === "contador" || rol === "administrador") && (
                <Link to="/contador" className={cn(rolePill, "bg-sky-50 text-sky-700 hover:bg-sky-100")}>
                  <BarChart3 className="h-3.5 w-3.5" /> Contabilidad
                </Link>
              )}
              {(rol === "vendedor" || rol === "administrador") && (
                <Link to="/vendedor" className={cn(rolePill, "bg-blue-50 text-blue-700 hover:bg-blue-100")}>
                  <Briefcase className="h-3.5 w-3.5" /> Ventas
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* ── Actions ── */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Notifications */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
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
                <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-blue-100 bg-white p-3 shadow-[0_4px_24px_rgba(37,99,235,0.12)]">
                  <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-2">
                    <p className="text-sm font-bold text-gray-900">Notificaciones</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {unreadCount} sin leer
                    </span>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-gray-400">Sin notificaciones</p>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => markRead(n.id)}
                          className={cn(
                            "w-full rounded-xl border p-3 text-left transition-colors",
                            n.leida
                              ? "border-gray-100 bg-gray-50 hover:bg-gray-100"
                              : "border-blue-100 bg-blue-50 hover:bg-blue-100"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                              {n.tipo || "NOTIFICACIÓN"}
                            </p>
                            {!n.leida && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                          </div>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {n.asunto || n.mensajeCorto || "Actualización"}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
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

          {/* Account */}
          <Link
            to={isAuthenticated ? "/perfil" : "/login"}
            className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-gray-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            title={isAuthenticated ? user?.nombre : "Iniciar sesión"}
          >
            <User className="h-4 w-4" />
            {isAuthenticated && (
              <span className="hidden text-xs font-medium text-gray-700 sm:block max-w-[72px] truncate">
                {user?.nombre}
              </span>
            )}
          </Link>

          {/* Mis pedidos */}
          {isAuthenticated && (
            <Link
              to="/pedidos"
              className="ml-1 hidden items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors lg:flex"
            >
              <Package className="h-3.5 w-3.5" /> Mis pedidos
            </Link>
          )}

          {/* Favorites */}
          <Link
            to="/favoritos"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"
            aria-label="Favoritos"
          >
            <Heart className={cn("h-4 w-4", favorites.length > 0 && "fill-rose-500 text-rose-500")} />
            {favorites.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {favorites.length}
              </span>
            )}
          </Link>

          {/* Cart */}
          <button
            onClick={openDrawer}
            className="relative ml-1 flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 text-white hover:bg-blue-700 transition-colors shadow-[0_2px_8px_rgba(37,99,235,0.30)]"
            aria-label="Carrito"
          >
            <ShoppingBag className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="text-xs font-bold text-sky-200">{itemCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Search bar expandible ── */}
      {searchOpen && (
        <div className="border-t border-blue-50 bg-white px-4 py-3 animate-slide-up">
          <form onSubmit={submitSearch} className="container-app">
            <div className="relative mx-auto max-w-lg">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar zapatillas, marcas, tallas..."
                className="h-11 w-full rounded-xl border border-blue-100 bg-blue-50 pl-10 pr-10 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.14)] transition-all"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="border-t border-blue-50 bg-white pb-4 lg:hidden animate-slide-up">
          <form onSubmit={submitSearch} className="px-4 pt-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar zapatillas..."
                className="h-10 w-full rounded-xl border border-blue-100 bg-blue-50 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:bg-white transition-all"
              />
            </div>
          </form>

          <nav className="mt-3 px-2 flex flex-col gap-0.5">
            {LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                {link.label}
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            ))}

            {isAuthenticated && rol && (
              <div className="mt-2 space-y-1 pt-2 border-t border-blue-50">
                {rol === "administrador" && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)}
                    className={cn(rolePill, "w-full bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl px-3 py-2.5 justify-start")}>
                    <LayoutDashboard className="h-4 w-4" /> Panel Admin
                  </Link>
                )}
                {rol === "administrador" && (
                  <Link to="/admin/pedidos" onClick={() => setMobileOpen(false)}
                    className={cn(rolePill, "w-full bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl px-3 py-2.5 justify-start")}>
                    <ShoppingBag className="h-4 w-4" /> Gestión Pedidos
                  </Link>
                )}
                {(rol === "contador" || rol === "administrador") && (
                  <Link to="/contador" onClick={() => setMobileOpen(false)}
                    className={cn(rolePill, "w-full bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl px-3 py-2.5 justify-start")}>
                    <BarChart3 className="h-4 w-4" /> Contabilidad
                  </Link>
                )}
                {(rol === "vendedor" || rol === "administrador") && (
                  <Link to="/vendedor" onClick={() => setMobileOpen(false)}
                    className={cn(rolePill, "w-full bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl px-3 py-2.5 justify-start")}>
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
