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
      {/* BREADCRUMB */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-t hover:text-primary transition-colors duration-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </Link>
        <span className="text-muted-t/40">/</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Campañas</span>
        <Badge tone="gold" className="ml-1">Email Marketing</Badge>
      </div>

      {/* HERO HEADER */}
      <div
        className="p-[1px] rounded-[28px] overflow-hidden animate-fade-in"
        style={{
          background: "linear-gradient(135deg, rgba(14,165,233,0.55) 0%, rgba(99,102,241,0.55) 45%, rgba(234,179,8,0.55) 100%)",
        }}
      >
        <div className="relative rounded-[27px] bg-[var(--color-surf)] overflow-hidden">
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-ink) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />
          {/* Radial glows */}
          <div
            className="absolute -top-24 -left-20 w-[380px] h-[380px] rounded-full pointer-events-none opacity-40"
            style={{
              background:
                "radial-gradient(circle, rgba(14,165,233,0.35) 0%, rgba(14,165,233,0) 70%)",
              filter: "blur(6px)",
            }}
          />
          <div
            className="absolute -bottom-28 -right-16 w-[420px] h-[420px] rounded-full pointer-events-none opacity-40"
            style={{
              background:
                "radial-gradient(circle, rgba(234,179,8,0.3) 0%, rgba(234,179,8,0) 70%)",
              filter: "blur(8px)",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full pointer-events-none opacity-25"
            style={{
              background:
                "radial-gradient(circle, rgba(99,102,241,0.45) 0%, rgba(99,102,241,0) 70%)",
              filter: "blur(10px)",
            }}
          />

          <div className="relative p-8 sm:p-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(14,165,233,0.18) 0%, rgba(99,102,241,0.18) 100%)",
                  }}
                >
                  <Mail className="h-5 w-5 text-[var(--color-brand)]" />
                </div>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl leading-[1.08]">
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(180deg, var(--color-ink) 0%, var(--color-ink-muted) 100%)",
                  }}
                >
                  Campañas de{" "}
                </span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, var(--color-brand) 0%, #6366f1 50%, #eab308 100%)",
                  }}
                >
                  Email Masivo
                </span>
              </h1>
              <p className="text-secondary max-w-xl leading-relaxed">
                Diseña y despacha promociones a segmentos reales de clientes, vendedores y contadores.
              </p>
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowModal(true)}
              className="glow-brand-sm whitespace-nowrap"
            >
              <Plus className="h-4 w-4" /> Nueva campaña
            </Button>
          </div>
        </div>
      </div>

      {/* CAMPAIGN LIST */}
      <div className="mt-8 rounded-[22px] border border-[var(--color-border-subtle)] bg-[var(--color-surf)] shadow-card animate-fade-in">
        {isLoading ? (
          <div className="p-16 text-center text-muted-t">Cargando campañas...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-16 text-center">
            <div
              className="mx-auto w-20 h-20 rounded-[20px] flex items-center justify-center mb-5"
              style={{
                background:
                  "linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(99,102,241,0.12) 100%)",
              }}
            >
              <Mail className="h-10 w-10 text-muted-t/70" />
            </div>
            <p className="font-display text-2xl text-primary">No hay campañas registradas</p>
            <p className="mt-2 text-sm text-muted-t">
              Crea una nueva campaña para notificar ofertas a tus clientes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg)]/50 text-xs font-bold uppercase tracking-wider text-muted-t">
                <tr>
                  <th className="px-6 py-4">Título / Asunto</th>
                  <th className="px-6 py-4">Segmento Receptores</th>
                  <th className="px-6 py-4">Estadísticas Envío</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {campaigns.map((c) => (
                  <tr key={c.id} className="row-hover transition-colors duration-200">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-primary">{c.titulo}</p>
                      <p className="text-xs text-muted-t font-mono mt-0.5">Asunto: {c.asunto}</p>
                    </td>
                    <td className="px-6 py-5">
                      <Badge tone="info">{SEGMENT_LABELS[c.segmento] ?? c.segmento}</Badge>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="chip chip-success">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {c.totalEnviados ?? 0} Enviados
                        </span>
                        {c.totalFallidos ? (
                          <span className="chip chip-danger">
                            ✕ {c.totalFallidos} Fallidos
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {c.estado === "ENVIADO" ? (
                        <Badge tone="success">ENVIADO</Badge>
                      ) : (
                        <Badge tone="warning">BORRADOR</Badge>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink)]/70 p-4 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-2xl p-[1px] animate-scale-in"
            style={{
              background:
                "linear-gradient(135deg, rgba(14,165,233,0.6) 0%, rgba(99,102,241,0.6) 35%, rgba(234,179,8,0.6) 70%, rgba(14,165,233,0.6) 100%)",
              borderRadius: "22px",
            }}
          >
            <div className="rounded-[21px] bg-[var(--color-surf)] p-7 sm:p-8">
              <div className="flex items-start justify-between pb-5 border-b border-[var(--color-border-subtle)]">
                <div>
                  <h3 className="font-display text-2xl text-primary">
                    Nueva Campaña Email Masivo
                  </h3>
                  <p className="text-sm text-secondary mt-1">
                    Configura el contenido y segmento de destino.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-muted-t hover:text-primary transition-colors duration-200 font-bold text-xl leading-none p-1 rounded-lg hover:bg-[var(--color-bg)]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="mt-6 space-y-5">
                <div className="animate-slide-up" style={{ animationDelay: "50ms" }}>
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Título Interno *
                  </label>
                  <input
                    required
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Promoción Flash de Agosto"
                    className="input-premium mt-1.5 h-[50px] rounded-[14px] border-[1.5px] px-4 text-sm outline-none transition-all duration-200 focus:border-[var(--color-brand)] focus:shadow-[0_0_0_4px_rgba(14,165,233,0.12)]"
                    style={{
                      borderColor: "var(--input-border)",
                      backgroundColor: "var(--input-bg)",
                      color: "var(--color-primary)",
                    }}
                  />
                </div>

                <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Asunto del Correo *
                  </label>
                  <input
                    required
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    placeholder="🔥 30% OFF en Zapatillas Nike seleccionadas"
                    className="input-premium mt-1.5 h-[50px] rounded-[14px] border-[1.5px] px-4 text-sm outline-none transition-all duration-200 focus:border-[var(--color-brand)] focus:shadow-[0_0_0_4px_rgba(14,165,233,0.12)]"
                    style={{
                      borderColor: "var(--input-border)",
                      backgroundColor: "var(--input-bg)",
                      color: "var(--color-primary)",
                    }}
                  />
                </div>

                <div className="animate-slide-up" style={{ animationDelay: "150ms" }}>
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Segmento de Usuarios *
                  </label>
                  <select
                    value={segmento}
                    onChange={(e) => setSegmento(e.target.value as any)}
                    className="input-premium mt-1.5 h-[50px] rounded-[14px] border-[1.5px] px-4 text-sm font-semibold outline-none transition-all duration-200 focus:border-[var(--color-brand)] focus:shadow-[0_0_0_4px_rgba(14,165,233,0.12)]"
                    style={{
                      borderColor: "var(--input-border)",
                      backgroundColor: "var(--input-bg)",
                      color: "var(--color-primary)",
                    }}
                  >
                    <option value="TODOS_LOS_CLIENTES">Todos los clientes registrados</option>
                    <option value="CLIENTES_CON_COMPRAS">Clientes con compras previas</option>
                    <option value="CLIENTES_SIN_COMPRAS">Clientes sin compras aún</option>
                    <option value="VENDEDORES">Vendedores</option>
                    <option value="CONTADORES">Contadores</option>
                  </select>
                </div>

                <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Contenido HTML / Mensaje *
                    </label>
                    <Badge tone="info" className="text-[10px]">
                      Variables dinámicas disponibles
                    </Badge>
                  </div>
                  <textarea
                    required
                    rows={10}
                    value={contenidoHtml}
                    onChange={(e) => setContenidoHtml(e.target.value)}
                    className="input-premium mt-1.5 w-full rounded-[14px] border-[1.5px] p-4 text-sm font-mono outline-none transition-all duration-200 focus:border-[var(--color-brand)] focus:shadow-[0_0_0_4px_rgba(14,165,233,0.12)] resize-y min-h-[220px]"
                    style={{
                      borderColor: "var(--input-border)",
                      backgroundColor: "var(--input-bg)",
                      color: "var(--color-primary)",
                    }}
                  />
                  <p className="mt-3 text-xs text-muted-t flex flex-wrap items-center gap-1.5">
                    Usa estas variables en el HTML:
                    <span className="chip inline-flex">{`{{titulo}}`}</span>
                    <span className="chip inline-flex">{`{{mensaje}}`}</span>
                    <span className="chip inline-flex">{`{{imagen_principal}}`}</span>
                    <span className="chip inline-flex">{`{{url_boton}}`}</span>
                    <span className="chip inline-flex">{`{{texto_boton}}`}</span>
                  </p>
                </div>

                <div
                  className="mt-7 flex justify-end gap-3 pt-4 border-t border-[var(--color-border-subtle)] animate-slide-up"
                  style={{ animationDelay: "250ms" }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" variant="secondary" isLoading={isSubmitting}>
                    Guardar Borrador de Campaña
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
