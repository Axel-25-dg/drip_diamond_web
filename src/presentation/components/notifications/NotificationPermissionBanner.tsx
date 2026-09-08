import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BellOff, X, Sparkles, Volume2, VolumeX, ArrowRight, ShieldCheck } from "lucide-react";
import { useNotificationStore } from "@/presentation/store/notificationStore";

export function NotificationPermissionBanner() {
  const {
    permissionState,
    requestPermissionAndSubscribe,
    activeToast,
    closeToast,
    soundEnabled,
    toggleSound,
    initNotifications,
  } = useNotificationStore();

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    initNotifications();
  }, [initNotifications]);

  const showBanner = permissionState === "default" && !dismissed;

  return (
    <>
      {/* ── 1. Glassmorphism System Permission Bar ── */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-[999] mx-auto max-w-xl animate-bounce-short">
          <div className="relative overflow-hidden rounded-[24px] border border-blue-200 bg-white/95 p-4 shadow-[0_12px_40px_rgba(37,99,235,0.22)] backdrop-blur-xl dark:border-sky-500/30 dark:bg-[#121622]/95 sm:p-5">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl dark:bg-sky-400/20 pointer-events-none" />

            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
                <Bell className="h-5 w-5 animate-pulse" />
              </div>

              <div className="flex-1 pr-6">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-sky-950 dark:text-sky-300">
                    SISTEMA PUSH
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                    ¡Activa Notificaciones en tu Dispositivo!
                  </p>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Recibe alertas del sistema en tu pantalla sobre ofertas de zapatillas, drops exclusivos y estado de tus pedidos.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => requestPermissionAndSubscribe()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 transition-all hover:scale-[1.02]"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Activar Notificaciones
                  </button>

                  <button
                    onClick={() => setDismissed(true)}
                    className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                  >
                    Ahora no
                  </button>
                </div>
              </div>

              <button
                onClick={() => setDismissed(true)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Realtime In-App Notification Floating Toast ── */}
      {activeToast && (
        <div className="fixed top-20 right-4 z-[9999] max-w-sm w-full animate-slide-in-right">
          <div className="relative overflow-hidden rounded-[22px] border border-blue-200 bg-white p-4 shadow-[0_16px_36px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-[#151922] dark:shadow-slate-950/80">
            <div className="flex items-start gap-3">
              {activeToast.imagenUrl ? (
                <img
                  src={activeToast.imagenUrl}
                  alt="Banner"
                  className="h-12 w-12 rounded-xl object-cover border border-slate-100 dark:border-slate-800"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                  <Bell className="h-5 w-5" />
                </div>
              )}

              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    {activeToast.tipo || "NUEVA ALERTA"}
                  </span>
                  <button onClick={toggleSound} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {activeToast.asunto}
                </p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {activeToast.mensaje}
                </p>

                {activeToast.linkUrl && (
                  <Link
                    to={activeToast.linkUrl}
                    onClick={closeToast}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-sky-400"
                  >
                    Ver detalles <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>

              <button onClick={closeToast} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
