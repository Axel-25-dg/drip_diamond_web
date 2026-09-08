import { useEffect, useState } from "react";
import { useAuthStore } from "@/presentation/store/authStore";
import { useNotificationStore } from "@/presentation/store/notificationStore";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import { playNotificationSound, SoundType } from "@/presentation/utils/notificationSound";
import type { CustomNotificationPayload, NotificationItem } from "@/domain/entities/User";
import { Button } from "@/presentation/components/ui/Button";
import {
  Bell, Send, Volume2, Sparkles, Monitor, Smartphone, CheckCircle2,
  AlertCircle, History, Image as ImageIcon, Link as LinkIcon, RefreshCw, Zap, Shield, Tag, Flame,
  Gift, Megaphone, Package, ShieldAlert, Settings, Globe, ShoppingCart, Briefcase, BarChart3, Crown, User, VolumeX
} from "lucide-react";

const TEMPLATES: { label: string; icon: any; payload: Partial<CustomNotificationPayload> }[] = [
  {
    label: "Drop Exclusivo Sneakers",
    icon: Flame,
    payload: {
      asunto: "Nuevas Jordan & Yeezy en Stock",
      mensaje: "Llegó el nuevo cargamento exclusivo a Drip Diamond. Pide las tuyas antes que se agoten.",
      tipo: "PROMOTION",
      prioridad: "EXCLUSIVA",
      sonido: "diamond",
      imagenUrl: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80",
      linkUrl: "/catalogo?ordering=-reciente",
    },
  },
  {
    label: "Promoción Envío Gratis",
    icon: Gift,
    payload: {
      asunto: "ENVÍO GRATIS en compras de 2+ pares",
      mensaje: "Por tiempo limitado, tu pedido llega sin costo adicional a cualquier ciudad de Ecuador.",
      tipo: "DISCOUNT",
      prioridad: "NORMAL",
      sonido: "chime",
      imagenUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80",
      linkUrl: "/catalogo",
    },
  },
  {
    label: "Alerta de Descuento 30%",
    icon: Zap,
    payload: {
      asunto: "30% OFF Flash Sale Drip Diamond",
      mensaje: "Aplica tu descuento en sneakers seleccionados. Promoción válida únicamente hoy.",
      tipo: "PROMOTION",
      prioridad: "ALTA",
      sonido: "alert",
      imagenUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
      linkUrl: "/catalogo",
    },
  },
  {
    label: "Actualización de Pedidos",
    icon: Package,
    payload: {
      asunto: "Tu pedido ha sido despachado",
      mensaje: "Tu guía de transporte ya está generada. Revisa los detalles en Mis Pedidos.",
      tipo: "ORDER_STATUS",
      prioridad: "NORMAL",
      sonido: "cash",
      linkUrl: "/pedidos",
    },
  },
];

export default function AdminNotificationsPage() {
  const { user } = useAuthStore();
  const {
    permissionState,
    requestPermissionAndSubscribe,
    sendBroadcast,
    testNativeOSPush,
  } = useNotificationStore();

  const [form, setForm] = useState<CustomNotificationPayload>({
    asunto: "Lanzamiento Exclusivo de Zapatillas en Drip Diamond",
    mensaje: "Descubre los modelos más cotizados del mercado con entrega rápida en todo Ecuador.",
    tipo: "PROMOTION",
    segmento: "TODOS",
    usuarioEmail: "",
    imagenUrl: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80",
    linkUrl: "/catalogo",
    sonido: "diamond",
    prioridad: "EXCLUSIVA",
  });

  const [previewDevice, setPreviewDevice] = useState<"windows" | "android">("windows");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<NotificationItem[]>([]);

  const loadRealHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await useCases.getAdminNotificationHistory.execute();
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadRealHistory();
  }, []);

  const handleTestSelf = async () => {
    if (permissionState !== "granted") {
      const granted = await requestPermissionAndSubscribe();
      if (!granted) {
        alert("Por favor concede el permiso de notificaciones en tu navegador para probar el aviso nativo.");
        return;
      }
    }
    testNativeOSPush(form.asunto, form.mensaje, form.imagenUrl, form.linkUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.asunto.trim() || !form.mensaje.trim()) return;

    setIsSending(true);
    setSuccessMessage(null);

    try {
      const res = await sendBroadcast(form);
      setSuccessMessage(`Notificación enviada con éxito a través de la API (${res.totalEnviados} destinatarios).`);
      await loadRealHistory();
    } catch {
      alert("Ocurrió un error al enviar la notificación mediante la API.");
    } finally {
      setIsSending(false);
    }
  };

  const applyTemplate = (tpl: Partial<CustomNotificationPayload>) => {
    setForm((prev) => ({ ...prev, ...tpl }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0a0c10] dark:text-slate-100 transition-colors duration-200 py-6 sm:py-10">
      <div className="container-app space-y-8">
        {/* Header */}
        <section className="rounded-[28px] sm:rounded-[32px] border border-blue-100 bg-white p-6 sm:p-8 shadow-sm dark:border-[#222732] dark:bg-[#12151c]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:bg-sky-950 dark:text-sky-300">
                  Panel Administrador
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> API Web Push Conectada
                </span>
              </div>
              <h1 className="mt-3 font-display text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
                Estudio de <span className="text-blue-600 dark:text-sky-400">Notificaciones Push & Sistema</span>
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400 max-w-3xl">
                Crea y emite notificaciones emergentes nativas de sistema a computadoras (Windows/macOS) y dispositivos móviles de todos los usuarios registrados.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTestSelf}
                className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-slate-700 transition-all"
              >
                <Zap className="h-4 w-4 text-amber-500" />
                Probar Notificación Real en mi Dispositivo
              </button>
            </div>
          </div>
        </section>

        {/* Studio Main Grid */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Quick Templates */}
            <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-sm dark:border-[#222732] dark:bg-[#12151c]">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Plantillas Rápidas con 1 Clic
              </p>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => applyTemplate(t.payload)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
                    >
                      <Icon className="h-3.5 w-3.5 text-blue-600 dark:text-sky-400" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="rounded-[28px] border border-blue-100 bg-white p-6 sm:p-8 shadow-sm dark:border-[#222732] dark:bg-[#12151c] space-y-5">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-sky-400" />
                Redactor de Notificación
              </h2>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Título de la Notificación / Asunto *
                </label>
                <input
                  type="text"
                  required
                  value={form.asunto}
                  onChange={(e) => setForm({ ...form, asunto: e.target.value })}
                  placeholder="Ej: Nuevo Drop Exclusivo Nike Air Jordan"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Mensaje / Contenido de la Alerta *
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.mensaje}
                  onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                  placeholder="Ej: Las zapatillas más buscadas ya están disponibles con envío rápido en todo Ecuador..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-white transition-all"
                />
              </div>

              {/* Category & Segment Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Categoría de Alerta
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="PROMOTION">Promoción / Drop</option>
                    <option value="DISCOUNT">Descuento / Oferta</option>
                    <option value="ANNOUNCEMENT">Anuncio Importante</option>
                    <option value="ORDER_STATUS">Estado de Pedido</option>
                    <option value="SECURITY">Alerta de Seguridad</option>
                    <option value="SYSTEM">Sistema</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Público Objetivo / Segmento
                  </label>
                  <select
                    value={form.segmento}
                    onChange={(e) => setForm({ ...form, segmento: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="TODOS">Todos los Usuarios (Broadcast)</option>
                    <option value="CLIENTES">Solo Clientes</option>
                    <option value="VENDEDORES">Solo Vendedores</option>
                    <option value="CONTADORES">Solo Contadores</option>
                    <option value="ADMINISTRADORES">Solo Administradores</option>
                    <option value="USUARIO_ESPECIFICO">Usuario Específico (Email)</option>
                  </select>
                </div>
              </div>

              {/* Email if specific user */}
              {form.segmento === "USUARIO_ESPECIFICO" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Correo del Usuario Destinatario
                  </label>
                  <input
                    type="email"
                    required
                    value={form.usuarioEmail || ""}
                    onChange={(e) => setForm({ ...form, usuarioEmail: e.target.value })}
                    placeholder="cliente@ejemplo.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Sound & Priority Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Efecto de Sonido
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={form.sonido}
                      onChange={(e) => setForm({ ...form, sonido: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="chime">Soft Crystal (Google Chime)</option>
                      <option value="diamond">Diamond Bell (Lujo)</option>
                      <option value="alert">Alerta Pulsante</option>
                      <option value="cash">Caja Registradora</option>
                      <option value="silent">Silencioso</option>
                    </select>

                    <button
                      type="button"
                      title="Probar sonido"
                      onClick={() => playNotificationSound(form.sonido as SoundType)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-slate-800 dark:text-sky-400 transition-colors"
                    >
                      <Volume2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Nivel de Novedad / Prioridad
                  </label>
                  <select
                    value={form.prioridad}
                    onChange={(e) => setForm({ ...form, prioridad: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="NORMAL">Standard / Normal</option>
                    <option value="ALTA">Alta Prioridad (Urgente)</option>
                    <option value="EXCLUSIVA">Exclusiva (Gold)</option>
                  </select>
                </div>
              </div>

              {/* Banner Image & Target Link */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-blue-600" /> URL Imagen Banner (Opcional)
                  </label>
                  <input
                    type="url"
                    value={form.imagenUrl || ""}
                    onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5 text-blue-600" /> Enlace de Destino (al hacer clic)
                  </label>
                  <input
                    type="text"
                    value={form.linkUrl || "/catalogo"}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                    placeholder="/catalogo, /pedidos..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  {successMessage}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <Button variant="secondary" size="lg" fullWidth isLoading={isSending}>
                  <Send className="h-5 w-5 mr-2" /> ENVIAR NOTIFICACIÓN MASIVA PUSH VIA API
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Mockup Preview Studio (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-24 rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm dark:border-[#222732] dark:bg-[#12151c] space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    Simulador en Tiempo Real
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Previsualización del aviso emergente de sistema
                  </p>
                </div>

                <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("windows")}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      previewDevice === "windows"
                        ? "bg-white text-blue-600 shadow dark:bg-slate-700 dark:text-sky-300"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" /> Windows / Mac
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewDevice("android")}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      previewDevice === "android"
                        ? "bg-white text-blue-600 shadow dark:bg-slate-700 dark:text-sky-300"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" /> Android / iOS
                  </button>
                </div>
              </div>

              {/* ── Windows 11 Native Pop-up Mockup ── */}
              {previewDevice === "windows" && (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 border-b border-slate-800 pb-2 mb-3">
                    <span className="flex items-center gap-1.5 font-semibold text-sky-400">
                      <img src="/logo_drip.png" alt="Icon" className="h-4 w-4" /> Drip Diamond System • ahora
                    </span>
                    <span className="text-slate-500">Google Chrome</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white leading-tight">
                        {form.asunto || "Título de notificación"}
                      </p>
                      <p className="mt-1 text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {form.mensaje || "Descripción de la notificación emergente..."}
                      </p>
                    </div>

                    {form.imagenUrl && (
                      <img
                        src={form.imagenUrl}
                        alt="Preview"
                        className="h-14 w-14 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                    )}
                  </div>

                  {form.imagenUrl && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-800">
                      <img src={form.imagenUrl} alt="Big Banner" className="h-32 w-full object-cover" />
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                    <span className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-bold text-white">
                      Ver en Drip Diamond
                    </span>
                  </div>
                </div>
              )}

              {/* ── Android / Mobile Push Card Mockup ── */}
              {previewDevice === "android" && (
                <div className="relative overflow-hidden rounded-[24px] border border-slate-300 bg-slate-900 text-white p-4 shadow-xl">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <div className="flex items-center gap-1.5">
                      <img src="/logo_drip.png" alt="Icon" className="h-4 w-4" />
                      <span className="font-bold text-white">DRIP DIAMOND</span>
                      <span className="text-[10px] text-slate-500">• ahora</span>
                    </div>
                    <span className="text-[10px] text-sky-400 font-bold">PUSH</span>
                  </div>

                  <p className="text-sm font-extrabold text-white">{form.asunto || "Título"}</p>
                  <p className="mt-1 text-xs text-slate-300 leading-snug">{form.mensaje || "Mensaje"}</p>

                  {form.imagenUrl && (
                    <img src={form.imagenUrl} alt="Banner" className="mt-3 h-28 w-full rounded-xl object-cover" />
                  )}

                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 rounded-xl bg-slate-800 py-1.5 text-center text-xs font-bold text-sky-400 hover:bg-slate-700">
                      Ver Oferta
                    </button>
                    <button className="flex-1 rounded-xl bg-slate-800 py-1.5 text-center text-xs font-medium text-slate-400">
                      Descartar
                    </button>
                  </div>
                </div>
              )}

              {/* Status Box */}
              <div className="rounded-2xl bg-blue-50/70 p-4 dark:bg-slate-900/60 border border-blue-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-blue-600" /> API VAPID Conectada
                </p>
                <p>
                  Segmento: <strong className="text-blue-600 dark:text-sky-400">{form.segmento}</strong>.
                  El mensaje se enviará a través de la API backend de Django para despachar a los dispositivos suscritos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* History Table */}
        <section className="rounded-[28px] border border-blue-100 bg-white p-6 sm:p-8 shadow-sm dark:border-[#222732] dark:bg-[#12151c] space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600 dark:text-sky-400" />
              Historial de Notificaciones de la API
            </h2>
            <button
              onClick={loadRealHistory}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-sky-400"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingHistory ? "animate-spin" : ""}`} /> Recargar Historial API
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Asunto / Alerta</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Destinatarios</th>
                  <th className="py-3 px-4">Fecha de Envío</th>
                  <th className="py-3 px-4 text-right">Entregados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoadingHistory ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Cargando historial desde la API...
                    </td>
                  </tr>
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No hay notificaciones emitidas aún en la base de datos.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {item.asunto}
                        <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 truncate">{item.mensaje}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 font-bold text-blue-700 dark:bg-slate-800 dark:text-sky-300">
                          {item.tipo || "PROMOTIONAL"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium">{item.segmento || "TODOS"}</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {item.creadaEn ? new Date(item.creadaEn).toLocaleString("es-EC") : "Reciente"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {item.totalAlcanzados ?? 1} entregados
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
