import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { EmailCampaign } from "@/domain/entities/User";
import { Button } from "@/presentation/components/ui/Button";
import { Badge } from "@/presentation/components/ui/Badge";
import { toast } from "sonner";
import {
  ArrowLeft, Mail, Send, Plus, CheckCircle2, Eye,
  FileText, Users, Sparkles, X, ImageIcon, Link2, Type, AlignLeft,
} from "lucide-react";

/* ────────────────────────────────────────────────
   BASE TEMPLATE — variables will be replaced before saving
──────────────────────────────────────────────── */
const buildCampaignHtml = (
  titulo: string,
  mensaje: string,
  imagenUrl: string,
  urlBoton: string,
  textoBoton: string,
): string => {
  const imgBlock = imagenUrl
    ? '<tr><td style="padding:10px 32px 20px; text-align:center;"><img src="' +
      imagenUrl +
      '" alt="Promo Drip Diamond" style="width:100%; max-width:536px; border-radius:16px; object-fit:cover; display:block; margin:0 auto;" /></td></tr>'
    : "";

  const btnBlock =
    urlBoton && textoBoton
      ? '<tr><td style="padding:12px 32px 36px; text-align:center;"><a href="' +
        urlBoton +
        '" style="display:inline-block; background:linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%); color:#ffffff; text-decoration:none; padding:16px 36px; border-radius:14px; font-size:15px; font-weight:700; box-shadow:0 4px 14px rgba(37,99,235,0.35);">' +
        textoBoton +
        "</a></td></tr>"
      : "";

  const bodyPadding = imagenUrl ? "10px" : "24px";
  const safeTitle = titulo || "Tu oferta especial te espera";
  const safeMensaje =
    mensaje ||
    "Gracias por ser parte de nuestra comunidad. Tenemos algo especial preparado para ti.";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo || "Drip Diamond"}</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9; padding:40px 15px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 10px 30px rgba(0,0,0,0.06);">

          <tr>
            <td style="background:#0b1220; padding:28px 32px; text-align:center;">
              <span style="font-family:Syne,sans-serif; font-size:24px; font-weight:900; letter-spacing:1px; color:#ffffff;">
                DRIP<span style="color:#38bdf8;">DIAMOND</span>
              </span>
              <span style="display:block; margin-top:4px; font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#94a3b8;">
                Luxury Sneakers
              </span>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 16px; text-align:center;">
              <h1 style="margin:0; font-size:26px; font-weight:800; color:#0f172a; line-height:1.2;">${safeTitle}</h1>
            </td>
          </tr>

          ${imgBlock}

          <tr>
            <td style="padding:${bodyPadding} 36px 24px; text-align:left; color:#334155; font-size:15px; line-height:1.7;">
              ${safeMensaje}
            </td>
          </tr>

          ${btnBlock}

          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px; background:#f1f5f9; width:100%;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 28px; text-align:center; font-size:12px; color:#94a3b8; line-height:1.5;">
              <p style="margin:0 0 6px 0;">Drip Diamond · Sneakers y Streetwear de Lujo · Quito, Ecuador</p>
              <p style="margin:0; font-size:11px;">Si no deseas recibir promociones, puedes gestionar tus preferencias en tu cuenta.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const SEGMENT_LABELS: Record<EmailCampaign["segmento"], string> = {
  TODOS_LOS_CLIENTES: "Todos los clientes",
  VENDEDORES: "Vendedores",
  CONTADORES: "Contadores",
  CLIENTES_CON_COMPRAS: "Clientes con compras",
  CLIENTES_SIN_COMPRAS: "Clientes sin compras",
};

// ─── Small reusable field wrapper ───────────────────────────────────────────
function FieldLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1.5">
      {icon}
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 dark:border-[#222732] bg-slate-50 dark:bg-[#171a22] px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600";

// ────────────────────────────────────────────────────────────────────────────

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Campaign fields
  const [titulo, setTitulo] = useState("");
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [urlBoton, setUrlBoton] = useState("");
  const [textoBoton, setTextoBoton] = useState("Ver Catálogo Completo");
  const [segmento, setSegmento] = useState<EmailCampaign["segmento"]>("TODOS_LOS_CLIENTES");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await useCases.getCampaigns.execute();
      setCampaigns(res);
    } catch (error) {
      console.error("Error cargando campañas:", error);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const resetForm = () => {
    setTitulo("");
    setAsunto("");
    setMensaje("");
    setImagenUrl("");
    setUrlBoton("");
    setTextoBoton("Ver Catálogo Completo");
    setSegmento("TODOS_LOS_CLIENTES");
    setActiveTab("edit");
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !asunto.trim() || !mensaje.trim()) {
      toast.error("Título, asunto y mensaje son obligatorios");
      return;
    }

    // Build the final HTML with real values replacing all template variables
    const contenidoHtml = buildCampaignHtml(titulo, mensaje, imagenUrl, urlBoton, textoBoton);

    setIsSubmitting(true);
    try {
      const newCampaign = await useCases.createCampaign.execute({
        titulo,
        asunto,
        contenidoHtml,
        segmento,
      });
      toast.success("Borrador de campaña creado exitosamente");
      setShowModal(false);
      resetForm();
      setCampaigns((prev) => [newCampaign, ...prev]);
      fetchCampaigns();
    } catch (error) {
      toast.error("No se pudo crear la campaña. Revisa los datos e intenta de nuevo.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendCampaign = async (id: number) => {
    setSendingId(id);
    try {
      const res = await useCases.sendCampaign.execute(id);
      toast.success(`Campaña enviada: ${res.totalEnviados} correos recibidos`);
      fetchCampaigns();
    } catch (error) {
      toast.error("No se pudo enviar la campaña. Intenta nuevamente más tarde.");
      console.error(error);
    } finally {
      setSendingId(null);
    }
  };

  // Live preview uses real field values
  const livePreviewHtml = buildCampaignHtml(titulo, mensaje, imagenUrl, urlBoton, textoBoton);

  const totalEnviadosCount = campaigns.reduce((acc, c) => acc + (c.totalEnviados || 0), 0);
  const borradoresCount = campaigns.filter((c) => c.estado !== "ENVIADO").length;
  const enviadasCount = campaigns.filter((c) => c.estado === "ENVIADO").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0a0c10] dark:text-slate-100 transition-colors duration-200">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">

        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link
            to="/admin"
            className="flex items-center gap-1 font-medium text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="font-semibold text-sky-600 dark:text-sky-400">Campañas Email</span>
        </div>

        {/* HERO HEADER */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-600 dark:text-sky-400">
                <Mail className="h-3.5 w-3.5" />
                Email Marketing
              </div>
              <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
                Campañas de <span className="text-blue-600 dark:text-[#38bdf8]">Email Masivo</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                Diseña y despacha promociones con plantillas profesionales a segmentos reales de tu tienda.
              </p>
            </div>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => { setShowModal(true); setActiveTab("edit"); }}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" /> Nueva campaña
            </Button>
          </div>
        </div>

        {/* KPI STAT CARDS */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Campañas", value: campaigns.length, sub: "registradas en total", icon: <FileText className="h-4 w-4 text-sky-500" />, color: "text-slate-900 dark:text-white" },
            { label: "Enviadas", value: enviadasCount, sub: "despachadas", icon: <Send className="h-4 w-4 text-emerald-500" />, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Borradores", value: borradoresCount, sub: "pendientes de envío", icon: <Sparkles className="h-4 w-4 text-amber-500" />, color: "text-amber-600 dark:text-amber-400" },
            { label: "Correos", value: totalEnviadosCount, sub: "correos recibidos", icon: <Users className="h-4 w-4 text-blue-500" />, color: "text-blue-600 dark:text-sky-400" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{kpi.label}</span>
                {kpi.icon}
              </div>
              <p className={`mt-2 font-display text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* CAMPAIGN LIST TABLE */}
        <div className="mt-6 rounded-2xl border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-16 text-center text-slate-400">Cargando campañas...</div>
          ) : campaigns.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-sky-50 dark:bg-slate-800 flex items-center justify-center mb-4 text-sky-500">
                <Mail className="h-8 w-8" />
              </div>
              <p className="font-display text-xl font-bold text-slate-800 dark:text-white">No hay campañas registradas</p>
              <p className="mt-1 text-sm text-slate-400">
                Crea una nueva campaña para notificar ofertas a tus clientes.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 dark:border-[#222732] bg-slate-50 dark:bg-[#171a22] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Título / Asunto</th>
                    <th className="px-6 py-4">Segmento Receptores</th>
                    <th className="px-6 py-4">Estadísticas Envío</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#222732]">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-[#171a22]/60">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{c.titulo}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Asunto: {c.asunto}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone="info">{SEGMENT_LABELS[c.segmento] ?? c.segmento}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {c.totalEnviados ?? 0} Enviados
                          </span>
                          {c.totalFallidos ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                              ✕ {c.totalFallidos} Fallidos
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {c.estado === "ENVIADO" ? (
                          <Badge tone="success">ENVIADO</Badge>
                        ) : (
                          <Badge tone="warning">BORRADOR</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          isLoading={sendingId === c.id}
                          onClick={() => handleSendCampaign(c.id)}
                        >
                          <Send className="h-3.5 w-3.5" /> Enviar Ahora
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ── CREATE CAMPAIGN MODAL ────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl my-8 rounded-2xl border border-slate-200 dark:border-[#222732] bg-white dark:bg-[#12151c] shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 dark:border-[#222732]">
              <div>
                <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  Nueva Campaña de Email
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Completa cada campo — el correo se construye automáticamente.
                </p>
              </div>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1.5 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* TAB CONTROLS */}
            <div className="flex border-b border-slate-200 dark:border-[#222732] px-6 sm:px-8">
              {(["edit", "preview"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                    activeTab === tab
                      ? "border-sky-500 text-sky-600 dark:text-sky-400"
                      : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  {tab === "edit" ? <><FileText className="h-4 w-4" /> Editar Campaña</> : <><Eye className="h-4 w-4" /> Previsualizar Correo</>}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateCampaign} className="px-6 sm:px-8 py-6 space-y-5">

              {activeTab === "edit" ? (
                <>
                  {/* Row 1: Titulo + Asunto */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel icon={<Type className="h-3.5 w-3.5" />}>Título del Correo *</FieldLabel>
                      <input
                        required
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Ej: ¡30% OFF en zapatillas Nike!"
                        className={`${inputCls} h-11`}
                      />
                      <p className="mt-1 text-[11px] text-slate-400">Aparece como encabezado principal del correo.</p>
                    </div>
                    <div>
                      <FieldLabel icon={<Mail className="h-3.5 w-3.5" />}>Asunto del Correo *</FieldLabel>
                      <input
                        required
                        value={asunto}
                        onChange={(e) => setAsunto(e.target.value)}
                        placeholder="Ej: Tu descuento exclusivo te espera"
                        className={`${inputCls} h-11`}
                      />
                      <p className="mt-1 text-[11px] text-slate-400">Lo que verá el usuario en su bandeja de entrada.</p>
                    </div>
                  </div>

                  {/* Row 2: Mensaje */}
                  <div>
                    <FieldLabel icon={<AlignLeft className="h-3.5 w-3.5" />}>Mensaje del Correo *</FieldLabel>
                    <textarea
                      required
                      rows={4}
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                      placeholder="Escribe aquí el cuerpo del correo. Ej: Aprovecha nuestros descuentos exclusivos en la nueva colección de zapatillas premium..."
                      className={`${inputCls} py-3 resize-none`}
                    />
                  </div>

                  {/* Row 3: Imagen URL */}
                  <div>
                    <FieldLabel icon={<ImageIcon className="h-3.5 w-3.5" />}>URL de la Imagen Principal</FieldLabel>
                    <input
                      type="url"
                      value={imagenUrl}
                      onChange={(e) => setImagenUrl(e.target.value)}
                      placeholder="https://ejemplo.com/imagen-promo.jpg (opcional)"
                      className={`${inputCls} h-11`}
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Pega la URL de una imagen de producto o promoción. Si la dejas vacía, el correo no mostrará imagen.
                    </p>
                  </div>

                  {/* Row 4: Boton CTA */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel icon={<Link2 className="h-3.5 w-3.5" />}>Texto del Botón</FieldLabel>
                      <input
                        value={textoBoton}
                        onChange={(e) => setTextoBoton(e.target.value)}
                        placeholder="Ver Catálogo Completo"
                        className={`${inputCls} h-11`}
                      />
                    </div>
                    <div>
                      <FieldLabel icon={<Link2 className="h-3.5 w-3.5" />}>URL del Botón</FieldLabel>
                      <input
                        type="url"
                        value={urlBoton}
                        onChange={(e) => setUrlBoton(e.target.value)}
                        placeholder="https://dripdiamond.com/catalogo"
                        className={`${inputCls} h-11`}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 -mt-2">Si dejas el botón vacío, no aparecerá en el correo.</p>

                  {/* Row 5: Segmento */}
                  <div>
                    <FieldLabel icon={<Users className="h-3.5 w-3.5" />}>Segmento de Destinatarios *</FieldLabel>
                    <select
                      value={segmento}
                      onChange={(e) => setSegmento(e.target.value as EmailCampaign["segmento"])}
                      className={`${inputCls} h-11 font-semibold`}
                    >
                      <option value="TODOS_LOS_CLIENTES">Todos los clientes registrados</option>
                      <option value="CLIENTES_CON_COMPRAS">Clientes con compras previas</option>
                      <option value="CLIENTES_SIN_COMPRAS">Clientes sin compras aún</option>
                      <option value="VENDEDORES">Vendedores</option>
                      <option value="CONTADORES">Contadores</option>
                    </select>
                  </div>
                </>
              ) : (
                /* ── PREVIEW TAB ── */
                <div className="rounded-2xl border border-slate-200 dark:border-[#222732] bg-slate-100 dark:bg-[#171a22] p-4">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-sky-500" />
                    Asunto del correo:{" "}
                    <span className="text-slate-900 dark:text-white font-normal">{asunto || "(Sin asunto)"}</span>
                  </p>
                  {!titulo && !mensaje ? (
                    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                      Completa el formulario para previsualizar el correo
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <iframe
                        title="Email Preview"
                        srcDoc={livePreviewHtml}
                        className="w-full h-[480px] border-0"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#222732]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setShowModal(false); resetForm(); }}
                >
                  Cancelar
                </Button>
                {activeTab === "edit" && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveTab("preview")}
                  >
                    <Eye className="h-4 w-4" /> Ver Previsualización
                  </Button>
                )}
                <Button type="submit" variant="secondary" isLoading={isSubmitting}>
                  <FileText className="h-4 w-4" /> Guardar Borrador
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
