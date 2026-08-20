import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  ShoppingBag,
  Truck,
  CreditCard,
  HelpCircle,
  FileText,
  ShieldCheck,
  Cookie,
  Headphones,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronDown,
  Search,
  Lock,
  RefreshCw,
  Sparkles,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { useInfoPanels, type InfoPanelKey } from "@/presentation/store/useInfoPanels";
import { Button } from "@/presentation/components/ui/Button";
import { toast } from "sonner";

export function InfoPanelsModal() {
  const { isOpen, activePanel, openPanel, closePanel } = useInfoPanels();
  const [faqSearch, setFaqSearch] = useState("");
  const [openFaqId, setOpenFaqId] = useState<number | null>(0);

  // State for cookies management
  const [cookieSettings, setCookieSettings] = useState({
    essential: true,
    analytics: true,
    preferences: true,
  });

  // State for quick support form inside modal
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubject, setSupportSubject] = useState("");

  if (!isOpen) return null;

  const handleSaveCookies = () => {
    toast.success("Preferencias de cookies guardadas exitosamente.");
  };

  const handleClearCookies = () => {
    toast.info("Caché y cookies no esenciales restablecidas.");
  };

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) {
      toast.error("Por favor ingresa un mensaje para nuestro equipo.");
      return;
    }
    toast.success("Mensaje enviado. Un asesor te contactará a la brevedad vía WhatsApp o correo.");
    setSupportMessage("");
    setSupportSubject("");
  };

  const NAV_ITEMS: { id: InfoPanelKey; label: string; icon: any }[] = [
    { id: "como-comprar", label: "Cómo comprar", icon: ShoppingBag },
    { id: "envios", label: "Envíos y cobertura", icon: Truck },
    { id: "pagos", label: "Métodos de pago", icon: CreditCard },
    { id: "faq", label: "Preguntas frecuentes", icon: HelpCircle },
    { id: "terminos", label: "Términos y condiciones", icon: FileText },
    { id: "privacidad", label: "Políticas de privacidad", icon: ShieldCheck },
    { id: "cookies", label: "Administrar cookies", icon: Cookie },
    { id: "soporte", label: "Soporte y Atención", icon: Headphones },
  ];

  const FAQS = [
    {
      id: 0,
      question: "¿Los pares de zapatillas son 100% originales?",
      answer:
        "Absolutamente. En Drip Diamond garantizamos autenticidad verificada en cada sneaker y prenda de streetwear. Cada producto pasa por un riguroso control antes del empaque.",
    },
    {
      id: 1,
      question: "¿Cómo y qué días se realizan los envíos en Quito?",
      answer:
        "Todos los envíos se realizan exclusivamente a todo Quito mediante Servientrega. Los paquetes se despachan únicamente los días SÁBADOS o DOMINGOS para que estés atento a recibir tu pedido el fin de semana.",
    },
    {
      id: 2,
      question: "¿Cuál es la política para cambios o devoluciones?",
      answer:
        "Los cambios aplican ÚNICAMENTE si el par tuvo daños o defectos de fábrica y deben ser solicitados dentro de un plazo máximo de 1 SEMANA (7 días) tras recibir el pedido. Pasada una semana no se realizará ninguna devolución ni cambio.",
    },
    {
      id: 3,
      question: "¿Cuáles son los métodos de pago aceptados y cómo se verifican?",
      answer:
        "Aceptamos transferencia bancaria directa (Banco Pichincha, Produbanco), pago interactivo por DeUna con QR, tarjetas de crédito/débito y efectivo contra entrega verificado. Todos los pagos son revisados personalmente por nuestro equipo.",
    },
    {
      id: 4,
      question: "¿Cómo puedo realizar el seguimiento de mi envío con Servientrega?",
      answer:
        "Una vez despachado el pedido el fin de semana, te enviaremos por WhatsApp o correo el número de guía oficial de Servientrega para que monitorees la llegada de tu paquete.",
    },
  ];

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
          {/* Backdrop with backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePanel}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 flex h-[90vh] w-[95vw] max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d131f] text-slate-100 shadow-2xl md:flex-row"
          >
            {/* Close Button */}
            <button
              onClick={closePanel}
              className="absolute right-4 top-4 z-20 rounded-xl bg-white/10 p-2 text-slate-300 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Sidebar Navigation */}
            <div className="w-full shrink-0 border-b border-white/10 bg-[#090d16] p-4 md:w-64 md:border-b-0 md:border-r md:p-6 overflow-x-auto md:overflow-y-auto">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-display block text-sm font-bold text-white">DRIP DIAMOND</span>
                  <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">Centro de Ayuda & Legal</span>
                </div>
              </div>

              <nav className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePanel === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => openPanel(item.id)}
                      className={`flex whitespace-nowrap items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Direct Support Card in Sidebar */}
              <div className="mt-8 hidden rounded-xl border border-sky-500/20 bg-gradient-to-b from-sky-500/10 to-transparent p-4 md:block">
                <span className="flex items-center gap-2 text-xs font-bold text-sky-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Atención en Quito
                </span>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  Asesoría personalizada por WhatsApp para elegir tu talla o verificar envíos.
                </p>
                <a
                  href="https://wa.me/593999001471"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600/30 border border-emerald-500/40 py-2 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-600/50"
                >
                  <Phone className="h-3.5 w-3.5" />
                  WhatsApp Directo
                </a>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0d131f]">
              {/* 1. CÓMO COMPRAR */}
              {activePanel === "como-comprar" && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">Guía para compradores</span>
                    <h2 className="font-display text-2xl font-bold text-white mt-1">¿Cómo comprar en Drip Diamond?</h2>
                    <p className="mt-2 text-sm text-slate-300">
                      Adquirir tus zapatillas exclusivas en Quito es rápido, seguro y transparente. Sigue estos sencillos pasos:
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        num: "01",
                        title: "Explora el catálogo",
                        desc: "Navega por nuestras secciones de Novedades y Mejores Precios. Selecciona tu modelo favorito.",
                      },
                      {
                        num: "02",
                        title: "Selecciona tu talla",
                        desc: "Revisa la guía de tallas y agrega tu par al carrito de compras.",
                      },
                      {
                        num: "03",
                        title: "Ingresa tu dirección en Quito",
                        desc: "Ingresa tus datos completos para el despacho exclusivo vía Servientrega en Quito.",
                      },
                      {
                        num: "04",
                        title: "Confirma tu pago y recibe el fin de semana",
                        desc: "Realiza tu pago verificado. Tu pedido se enviará los días sábados o domingos.",
                      },
                    ].map((step) => (
                      <div
                        key={step.num}
                        className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-sky-500/30 hover:bg-white/[0.08]"
                      >
                        <span className="font-display text-xl font-black text-sky-400">{step.num}</span>
                        <h4 className="mt-1 font-bold text-white">{step.title}</h4>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">{step.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-xs text-sky-200 flex items-start gap-3">
                    <Truck className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-white text-sm">Envíos por Servientrega los Sábados y Domingos</span>
                      Todos los paquetes se despachan el fin de semana a cualquier sector de Quito. Recibirás tu guía oficial por WhatsApp.
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ENVÍOS Y COBERTURA */}
              {activePanel === "envios" && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">Logística Exclusiva</span>
                    <h2 className="font-display text-2xl font-bold text-white mt-1">Envíos y Cobertura en Quito</h2>
                    <p className="mt-2 text-sm text-slate-300">
                      Información oficial de despacho y entrega de tus pedidos.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <Truck className="h-6 w-6 text-sky-400" />
                        <div>
                          <h4 className="font-bold text-white text-sm">Courier Oficial: Servientrega</h4>
                          <span className="text-[11px] text-sky-300 font-semibold block">Envío seguro a todo Quito</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Cada uno de los pedidos realizados se despacha directamente a través de **Servientrega** a cualquier dirección dentro de todo Quito (Norte, Centro, Sur y Valles).
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-6 w-6 text-emerald-400" />
                        <div>
                          <h4 className="font-bold text-white text-sm">Días de Despacho</h4>
                          <span className="text-[11px] text-emerald-300 font-semibold block">Únicamente Sábados o Domingos</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Los despachos se procesan y envían los días **sábados o domingos**, para que todos los clientes estén atentos a recibir su paquete durante el fin de semana.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <MapPin className="h-5 w-5 text-sky-400" />
                      <h4 className="font-bold text-white">Sectores de Cobertura en Quito</h4>
                    </div>
                    <ul className="grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        Quito Norte (Carcelén, Ponceano, El Inca, La Carolina, Bellavista)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        Quito Centro y Sur (La Floresta, Villa Flora, El Recreo, Quitumbe)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        Valle de Tumbaco, Cumbayá y Nayón
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        Valle de Los Chillos, San Rafael y Sangolquí
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* 3. MÉTODOS DE PAGO */}
              {activePanel === "pagos" && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">Transacciones Seguras</span>
                    <h2 className="font-display text-2xl font-bold text-white mt-1">Métodos de Pago Verificados</h2>
                    <p className="mt-2 text-sm text-slate-300">
                      Aceptamos múltiples opciones de pago protegidas y verificadas manualmente por nuestro equipo en Quito.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-3 text-sky-400 font-bold mb-2">
                        <CreditCard className="h-5 w-5" />
                        <span className="text-white">Transferencia Bancaria</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Banco Pichincha, Produbanco o Banco Guayaquil. Envías el comprobante tras realizar la compra para aprobación inmediata.
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-3 text-sky-400 font-bold mb-2">
                        <Sparkles className="h-5 w-5 text-emerald-400" />
                        <span className="text-white">DeUna (Pichincha)</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Escanea el código QR de Drip Diamond desde tu app DeUna y confirma tu pago en segundos sin comisiones adicionales.
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-3 text-sky-400 font-bold mb-2">
                        <Lock className="h-5 w-5" />
                        <span className="text-white">Tarjetas de Crédito / Débito</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Cobro procesado mediante pasarela cifrada 256-bit SSL para Visa, Mastercard y tarjetas locales emitidas en Ecuador.
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-3 text-sky-400 font-bold mb-2">
                        <ShieldCheck className="h-5 w-5 text-sky-400" />
                        <span className="text-white">Efectivo contra entrega</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Disponible previa coordinación para Quito. Pagas al momento de recibir tu paquete.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. PREGUNTAS FRECUENTES (FAQ) */}
              {activePanel === "faq" && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">Resolución de Dudas</span>
                    <h2 className="font-display text-2xl font-bold text-white mt-1">Preguntas Frecuentes</h2>
                    <p className="mt-2 text-sm text-slate-300">
                      Respuestas claras a las consultas más comunes de nuestros clientes.
                    </p>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar pregunta o término (ej. servientrega, cambio, daños)..."
                      value={faqSearch}
                      onChange={(e) => setFaqSearch(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-3">
                    {filteredFaqs.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-6">No se encontraron preguntas que coincidan con tu búsqueda.</p>
                    ) : (
                      filteredFaqs.map((faq) => {
                        const isOpenFaq = openFaqId === faq.id;
                        return (
                          <div
                            key={faq.id}
                            className="rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-colors"
                          >
                            <button
                              onClick={() => setOpenFaqId(isOpenFaq ? null : faq.id)}
                              className="flex w-full items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-white hover:bg-white/5"
                            >
                              <span>{faq.question}</span>
                              <ChevronDown
                                className={`h-4 w-4 text-sky-400 transition-transform ${isOpenFaq ? "rotate-180" : ""}`}
                              />
                            </button>
                            {isOpenFaq && (
                              <div className="border-t border-white/5 bg-black/20 p-4 text-xs text-slate-300 leading-relaxed">
                                {faq.answer}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* 5. TÉRMINOS Y CONDICIONES */}
              {activePanel === "terminos" && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">Marco Legal</span>
                    <h2 className="font-display text-2xl font-bold text-white mt-1">Términos y Condiciones de Uso</h2>
                    <p className="mt-1 text-xs text-slate-400">Última actualización: 2026 — Drip Diamond Ecuador</p>
                  </div>

                  <div className="space-y-4 text-xs leading-relaxed text-slate-300 pr-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                      <h4 className="font-bold text-white text-sm">1. Autenticidad y Calidad Garantizada</h4>
                      <p>
                        Drip Diamond garantiza que cada par de calzado y prenda comercializada cumple con altos estándares de calidad y autenticidad comprobada antes del empaque.
                      </p>
                    </div>

                    <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 space-y-2">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Truck className="h-4 w-4 text-sky-400" />
                        2. Envíos Exclusivos por Servientrega (Quito)
                      </h4>
                      <p>
                        Todos los envíos se realizan únicamente a todo Quito a través de **Servientrega**. Los pedidos son despachados los días **sábados o domingos**, por lo que el cliente debe estar atento a la recepción de su paquete durante el fin de semana.
                      </p>
                    </div>

                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
                      <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        3. Política Estricta de Cambios y Devoluciones
                      </h4>
                      <p className="text-amber-100">
                        Los cambios de producto **SOLO SE REALIZARÁN SI EL PAR PRESENTÓ DAÑOS O DEFECTOS DE FÁBRICA**. La solicitud de cambio debe realizarse dentro de un plazo **MÁXIMO DE 1 SEMANA (7 DÍAS)** a partir de la fecha de recepción del pedido. Transcurrida la semana, **NO HABRÁ NINGUNA DEVOLUCIÓN NI CAMBIO BAJO NINGÚN MOTIVO**.
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                      <h4 className="font-bold text-white text-sm">4. Precios y Verificación de Pagos</h4>
                      <p>
                        Los precios están expresados en Dólares de los Estados Unidos (USD). Todos los pagos son verificados manualmente antes de liberar la orden para su envío en Servientrega.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. POLÍTICAS DE PRIVACIDAD */}
              {activePanel === "privacidad" && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">Protección de Datos</span>
                    <h2 className="font-display text-2xl font-bold text-white mt-1">Políticas de Privacidad</h2>
                    <p className="mt-1 text-xs text-slate-400">Protección integral de tu información personal</p>
                  </div>

                  <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                      <h4 className="font-bold text-white text-sm">1. Recolección Mínima de Datos</h4>
                      <p>
                        En Drip Diamond únicamente solicitamos los datos estrictamente necesarios para procesar tus compras y gestionar tus guías de Servientrega en Quito (nombre, correo electrónico, teléfono y dirección).
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                      <h4 className="font-bold text-white text-sm">2. Cifrado y Seguridad de Información</h4>
                      <p>
                        Toda la comunicación entre tu navegador y nuestra plataforma transita a través de canales cifrados con protocolos SSL/TLS de 256 bits. Tus contraseñas están completamente protegidas.
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                      <h4 className="font-bold text-white text-sm">3. No divulgación a terceros</h4>
                      <p>
                        Bajo ningún concepto vendemos ni comercializamos tu información personal a plataformas de publicidad de terceros.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. ADMINISTRAR COOKIES */}
              {activePanel === "cookies" && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">Preferencias de Privacidad</span>
                    <h2 className="font-display text-2xl font-bold text-white mt-1">Administrar Cookies</h2>
                    <p className="mt-2 text-sm text-slate-300">
                      Configura el nivel de almacenamiento local y cookies que deseas permitir en tu navegador.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                      <div>
                        <h4 className="font-bold text-white text-sm">Cookies Esenciales (Requeridas)</h4>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Permiten mantener tu sesión activa, guardar productos en el carrito y garantizar la seguridad del sitio.
                        </p>
                      </div>
                      <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                        Siempre activas
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                      <div>
                        <h4 className="font-bold text-white text-sm">Cookies de Rendimiento & Analítica</h4>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Nos ayudan a medir el rendimiento de búsqueda y velocidad de carga del catálogo.
                        </p>
                      </div>
                      <button
                        onClick={() => setCookieSettings((prev) => ({ ...prev, analytics: !prev.analytics }))}
                        className={`h-6 w-11 rounded-full transition-colors p-0.5 ${
                          cookieSettings.analytics ? "bg-sky-500" : "bg-slate-700"
                        }`}
                      >
                        <div
                          className={`h-5 w-5 rounded-full bg-white transition-transform ${
                            cookieSettings.analytics ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                      <div>
                        <h4 className="font-bold text-white text-sm">Cookies de Personalización</h4>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Recuerdan tus preferencias visuales como el modo oscuro/claro y filtros de búsqueda.
                        </p>
                      </div>
                      <button
                        onClick={() => setCookieSettings((prev) => ({ ...prev, preferences: !prev.preferences }))}
                        className={`h-6 w-11 rounded-full transition-colors p-0.5 ${
                          cookieSettings.preferences ? "bg-sky-500" : "bg-slate-700"
                        }`}
                      >
                        <div
                          className={`h-5 w-5 rounded-full bg-white transition-transform ${
                            cookieSettings.preferences ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button onClick={handleSaveCookies} variant="secondary" size="md">
                      Guardar Preferencias
                    </Button>
                    <Button onClick={handleClearCookies} variant="outline" size="md">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Restablecer Caché
                    </Button>
                  </div>
                </div>
              )}

              {/* 8. SOPORTE Y ATENCIÓN */}
              {activePanel === "soporte" && (
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">Atención al Cliente</span>
                    <h2 className="font-display text-2xl font-bold text-white mt-1">Soporte y Atención Directa</h2>
                    <p className="mt-2 text-sm text-slate-300">
                      Estamos listos para ayudarte con tus dudas sobre tallas, guías de Servientrega o pagos en Quito.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <a
                      href="https://wa.me/593999001471"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 transition-all hover:bg-emerald-500/20"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                        <Phone className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">WhatsApp Oficial</span>
                        <span className="text-sm font-extrabold text-white">+593 99 900 1471</span>
                        <span className="text-[10px] text-emerald-200 flex items-center gap-1 mt-0.5">
                          <ExternalLink className="h-3 w-3" /> Abrir chat inmediato
                        </span>
                      </div>
                    </a>

                    <a
                      href="mailto:dripzapatillas@gmail.com"
                      className="flex items-center gap-4 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 transition-all hover:bg-sky-500/20"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                        <Mail className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300 block">Correo Electrónico</span>
                        <span className="text-xs font-bold text-white font-mono">dripzapatillas@gmail.com</span>
                        <span className="text-[10px] text-sky-200 block mt-0.5">contacto@dripdiamond.ec</span>
                      </div>
                    </a>
                  </div>

                  {/* Formulario de Mensaje Rápido */}
                  <form onSubmit={handleSendSupport} className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
                    <h4 className="font-bold text-white text-sm">Enviar mensaje al equipo de Soporte</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Asunto (ej. Consulta sobre guía de Servientrega o pedido)"
                        value={supportSubject}
                        onChange={(e) => setSupportSubject(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none"
                      />
                      <textarea
                        rows={3}
                        placeholder="Escribe tu mensaje o consulta detallada aquí..."
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none"
                      />
                    </div>
                    <Button type="submit" variant="secondary" size="md">
                      Enviar Consulta
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
