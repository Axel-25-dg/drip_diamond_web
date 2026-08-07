import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import type { EmailCampaign } from "@/domain/entities/User";
import { Button } from "@/presentation/components/ui/Button";
import { Badge } from "@/presentation/components/ui/Badge";
import { toast } from "sonner";
import { ArrowLeft, Mail, Send, Plus, CheckCircle2 } from "lucide-react";

const CAMPAIGN_TEMPLATE = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{titulo}}</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f7fb; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb; padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td style="background:#111827; padding:20px; text-align:center; color:#ffffff; font-size:24px; font-weight:bold;">
              {{titulo}}
            </td>
          </tr>

          <tr>
            <td style="padding:30px 30px 10px; text-align:center;">
              <img src="{{imagen_principal}}" alt="Promoción" style="max-width:100%; border-radius:12px;" />
            </td>
          </tr>

          <tr>
            <td style="padding:20px 30px 10px; text-align:left; color:#111827; font-size:16px; line-height:1.7;">
              {{mensaje}}
            </td>
          </tr>

          <tr>
            <td style="padding:20px 30px 30px; text-align:center;">
              <a href="{{url_boton}}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:14px 28px; border-radius:8px; font-weight:bold;">
                {{texto_boton}}
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:0 30px 30px; text-align:center; font-size:12px; color:#6b7280;">
              Si no deseas recibir más correos, puedes darte de baja.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const SEGMENT_LABELS: Record<EmailCampaign["segmento"], string> = {
  TODOS_LOS_CLIENTES: "Todos los clientes",
  VENDEDORES: "Vendedores",
  CONTADORES: "Contadores",
  CLIENTES_CON_COMPRAS: "Clientes con compras",
  CLIENTES_SIN_COMPRAS: "Clientes sin compras",
};

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New campaign state
  const [titulo, setTitulo] = useState("");
  const [asunto, setAsunto] = useState("");
  const [contenidoHtml, setContenidoHtml] = useState(CAMPAIGN_TEMPLATE);
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

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !asunto || !contenidoHtml) {
      toast.error("Por favor completa todos los campos de la campaña");
      return;
    }

    setIsSubmitting(true);
    try {
      const newCampaign = await useCases.createCampaign.execute({
        titulo,
        asunto,
        contenidoHtml,
        segmento,
      });
      toast.success("Borrador de campaña creado");
      setShowModal(false);
      setTitulo("");
      setAsunto("");
      setContenidoHtml(CAMPAIGN_TEMPLATE);
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
      toast.success(`Campaña enviada: ${res.totalEnviados} recibidos`);
      fetchCampaigns();
    } catch (error) {
      toast.error("No se pudo enviar la campaña. Intenta nuevamente más tarde.");
      console.error(error);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="container-app py-10">
      <Link to="/admin" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900">
        <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-slate-900 sm:text-5xl">
            Campañas de <span className="text-accent">Email Masivo</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Diseña y despacha promociones a segmentos reales de clientes, vendedores y contadores.
          </p>
        </div>

        <Button variant="secondary" size="lg" onClick={() => setShowModal(true)} className="shadow-md shadow-sky-500/20">
          <Plus className="h-4 w-4" /> Nueva campaña
        </Button>
      </div>

      {/* CAMPAIGN LIST */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Cargando campañas...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Mail className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 font-display text-xl text-slate-700">No hay campañas registradas</p>
            <p className="text-xs">Crea una nueva campaña para notificar ofertas a tus clientes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Título / Asunto</th>
                  <th className="px-6 py-4">Segmento Receptores</th>
                  <th className="px-6 py-4">Estadísticas Envío</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{c.titulo}</p>
                      <p className="text-xs text-slate-500 font-mono">Asunto: {c.asunto}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-xs text-slate-700">
                      <Badge tone="info">{SEGMENT_LABELS[c.segmento] ?? c.segmento}</Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      <span className="text-emerald-600 font-bold">✓ {c.totalEnviados ?? 0} Enviados</span>
                      {c.totalFallidos ? (
                        <span className="ml-2 text-rose-500 font-bold">✕ {c.totalFallidos} Fallidos</span>
                      ) : null}
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

      {/* CREATE CAMPAIGN MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-display text-2xl text-slate-900">Nueva Campaña Email Masivo</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Título Interno *</label>
                <input
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Promoción Flash de Agosto"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Asunto del Correo *</label>
                <input
                  required
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="🔥 30% OFF en Zapatillas Nike seleccionadas"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Segmento de Usuarios *</label>
                <select
                  value={segmento}
                  onChange={(e) => setSegmento(e.target.value as any)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-500 font-semibold"
                >
                  <option value="TODOS_LOS_CLIENTES">Todos los clientes registrados</option>
                  <option value="CLIENTES_CON_COMPRAS">Clientes con compras previas</option>
                  <option value="CLIENTES_SIN_COMPRAS">Clientes sin compras aún</option>
                  <option value="VENDEDORES">Vendedores</option>
                  <option value="CONTADORES">Contadores</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Contenido HTML / Mensaje *</label>
                <textarea
                  required
                  rows={10}
                  value={contenidoHtml}
                  onChange={(e) => setContenidoHtml(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-4 text-sm font-mono outline-none focus:border-sky-500"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Usa estas variables en el HTML: <code className="rounded bg-slate-100 px-1 py-0.5">{`{{titulo}}`}</code>, <code className="rounded bg-slate-100 px-1 py-0.5">{`{{mensaje}}`}</code>, <code className="rounded bg-slate-100 px-1 py-0.5">{`{{imagen_principal}}`}</code>, <code className="rounded bg-slate-100 px-1 py-0.5">{`{{url_boton}}`}</code>, <code className="rounded bg-slate-100 px-1 py-0.5">{`{{texto_boton}}`}</code>.
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="secondary" isLoading={isSubmitting}>
                  Guardar Borrador de Campaña
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
