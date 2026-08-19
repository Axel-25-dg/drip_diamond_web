/**
 * ShippingTicket — Ticket imprimible para Servientrega + mini mapa de ubicación.
 * Usado en admin, contador y vendedor para imprimir y pegar en el paquete.
 */
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Printer, MapPin, Package, Phone, User, Hash, Truck } from "lucide-react";
import type { Order } from "@/domain/entities/Order";
import { formatCurrency, formatDate, formatAddressForDisplay } from "@/presentation/utils/format";

/* Fix leaflet icon */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* Intenta extraer coordenadas lat/lng de la dirección si vienen en el string */
export function extractCoords(direccion: string): { lat: number; lng: number } | null {
  if (!direccion) return null;
  const m = direccion.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  return null;
}

/* Geocodificación inteligente para direcciones de Quito */
export async function smartGeocode(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address || !address.trim()) return null;

  const fromCoords = extractCoords(address);
  if (fromCoords) return fromCoords;

  const clean = address
    .replace(/[\(\[]-?\d+\.\d+,\s*-?\d+\.\d+[\)\]]/g, "")
    .replace(/·/g, " ")
    .replace(/\b(casa esquinera|esquina|frente a|junto a|sector|barrio|lote|mz|manzana)\b/gi, " ")
    .replace(/\b(Quito|Pichincha|Ecuador)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return null;

  const queries: string[] = [`${clean}, Quito, Ecuador`];

  const tokens = clean
    .split(/[\s,\.-]+/)
    .filter((w) => w.length >= 4 && !/^\d+$/.test(w));

  if (tokens.length >= 2) {
    queries.push(`${tokens.slice(0, 2).join(" ")}, Quito, Ecuador`);
  }
  for (const token of tokens) {
    if (!queries.some((q) => q.toLowerCase().includes(token.toLowerCase()))) {
      queries.push(`${token}, Quito, Ecuador`);
    }
  }

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=ec`,
        { headers: { "Accept-Language": "es" } }
      );
      const data = await res.json();
      if (data && data[0] && data[0].lat && data[0].lon) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch { /* continue */ }
  }

  return null;
}

const QUITO_DEFAULT = { lat: -0.1807, lng: -78.4678 };

function MapFlyTo({ position }: { position: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.setView(position, 17);
  }, [map, position]);
  return null;
}

/* ─── Mini map component ─────────────────────────────────── */
function MiniMap({ coords }: { coords: { lat: number; lng: number } }) {
  return (
    <div style={{ height: 260, width: "100%" }} className="overflow-hidden rounded-xl border border-blue-100 shadow-sm">
      <MapContainer
        center={coords}
        zoom={17}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={coords} />
        <MapFlyTo position={coords} />
      </MapContainer>
    </div>
  );
}

/* ─── Props ────────────────────────────────────────────────── */
interface Props {
  order: Order;
}

/* ─── Main component ─────────────────────────────────────── */
export function ShippingTicket({ order }: Props) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingMap, setLoadingMap] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const rawAddress = typeof order.direccionEnvio === "string" ? order.direccionEnvio : JSON.stringify(order.direccionEnvio ?? "");
  const direccion = formatAddressForDisplay(order.direccionEnvio) || "";

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      setLoadingMap(true);
      const fromString = extractCoords(rawAddress);
      if (fromString) {
        if (isMounted) { setCoords(fromString); setLoadingMap(false); }
        return;
      }
      const geocoded = await smartGeocode(direccion || rawAddress);
      if (isMounted) {
        setCoords(geocoded ?? QUITO_DEFAULT);
        setLoadingMap(false);
      }
    };
    run();
    return () => { isMounted = false; };
  }, [rawAddress, direccion]);

  /* ── Imprimir solo el ticket ── */
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Ticket Servientrega — Pedido ${order.numero}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #0f172a; padding: 24px; }
          .ticket { border: 2px solid #2563eb; border-radius: 16px; overflow: hidden; max-width: 700px; margin: 0 auto; }
          .header { background: #2563eb; color: #fff; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
          .header h1 { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { font-size: 11px; opacity: 0.85; }
          .body { padding: 20px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .field { margin-bottom: 10px; }
          .field label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; display: block; margin-bottom: 2px; }
          .field p { font-size: 13px; font-weight: 600; color: #0f172a; }
          .field.full { grid-column: span 2; }
          .divider { border: none; border-top: 1px solid #e2e8f0; margin: 4px 0; }
          .badge { display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; border-radius: 999px; padding: 2px 10px; font-size: 10px; font-weight: 700; }
          .items { padding: 0 24px 20px; }
          .items table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .items th { background: #f8faff; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
          .items td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
          .total-row td { font-weight: 800; font-size: 13px; background: #eff6ff; }
          .footer { background: #f8faff; padding: 12px 24px; font-size: 10px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
          .cut-line { border-top: 2px dashed #cbd5e1; margin: 20px 0; text-align: center; }
          .cut-line span { background: #fff; padding: 0 10px; font-size: 10px; color: #94a3b8; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <script>window.onload = function(){ window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const totalPares = order.items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <div className="space-y-5">

      {/* ── Mini mapa ── */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-bold text-[var(--text-primary)]">Ubicación del cliente</span>
        </div>
        {loadingMap ? (
          <div className="flex h-[220px] items-center justify-center rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface2)]">
            <p className="text-sm text-[var(--text-muted)]">Cargando mapa...</p>
          </div>
        ) : (
          <MiniMap coords={coords!} />
        )}
        <p className="mt-1.5 text-xs text-[var(--text-muted)]">
          <strong>Dirección:</strong> {direccion || "—"}
          {" · "}{order.ciudad}, {order.provincia}
        </p>
      </div>

      {/* ── Botón imprimir ── */}
      <button
        type="button"
        onClick={handlePrint}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.35)] transition-all hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(37,99,235,0.45)]"
      >
        <Printer className="h-4 w-4" />
        Imprimir ticket Servientrega
      </button>

      {/* ── Ticket (hidden — solo para imprimir) ── */}
      <div ref={printRef} style={{ display: "none" }}>
        <div className="ticket">
          {/* Header */}
          <div className="header">
            <div>
              <h1>DRIP DIAMOND — Ticket de Envío</h1>
              <p>Servientrega Ecuador · Quito</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 20, fontWeight: 900 }}>{order.numero}</p>
              <p>{formatDate(order.creadoEn)}</p>
            </div>
          </div>

          {/* Datos */}
          <div className="body">
            <div className="field">
              <label>Destinatario</label>
              <p>{order.clienteNombre || "Cliente"}</p>
            </div>
            <div className="field">
              <label>Teléfono de contacto</label>
              <p>{order.telefonoContacto || "—"}</p>
            </div>
            <div className="field full">
              <label>Dirección exacta de entrega</label>
              <p>{direccion || "—"}</p>
            </div>
            <div className="field">
              <label>Ciudad</label>
              <p>{order.ciudad || "Quito"}</p>
            </div>
            <div className="field">
              <label>Provincia</label>
              <p>{order.provincia || "Pichincha"}</p>
            </div>
            <div className="field">
              <label>Total pares</label>
              <p>{totalPares} par(es)</p>
            </div>
            <div className="field">
              <label>Valor declarado</label>
              <p>{formatCurrency(order.total)}</p>
            </div>
            <div className="field">
              <label>Costo de envío</label>
              <p>$3.00 USD</p>
            </div>
            <div className="field">
              <label>Remitente</label>
              <p>Drip Diamond — 0999 001 471</p>
            </div>
            {order.vendedorNombre && (
              <div className="field">
                <label>Vendedor asignado</label>
                <p>{order.vendedorNombre}</p>
              </div>
            )}
          </div>

          {coords && (
            <div style={{ padding: "0 24px 16px" }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b", marginBottom: 4 }}>
                Mapa de entrega (GPS)
              </p>
              <img
                src={`https://static-maps.yandex.ru/1.x/?l=map&pt=${coords.lng},${coords.lat},pm2rdm&z=15&w=650&h=240`}
                alt="Mapa de entrega"
                style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 12, border: "1px solid #cbd5e1" }}
              />
            </div>
          )}

          <hr className="divider" />

          {/* Productos */}
          <div className="items">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Talla</th>
                  <th style={{ textAlign: "center" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Precio</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nombre}</td>
                    <td>{item.talla}</td>
                    <td style={{ textAlign: "center" }}>{item.cantidad}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrency(item.precioUnitario * item.cantidad)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={2}>TOTAL</td>
                  <td style={{ textAlign: "center" }}>{totalPares} pares</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(order.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="footer">
            <p>Drip Diamond | Luxury Sneakers Ecuador | WhatsApp: 0999 001 471</p>
            <p style={{ marginTop: 4 }}>Pedido {order.numero} · {formatDate(order.creadoEn)} · Estado: {order.estado}</p>
          </div>
        </div>

        {/* Línea de corte */}
        <div className="cut-line" style={{ marginTop: 24 }}>
          <span>✂ Cortar aquí — Pegar en el paquete</span>
        </div>

        {/* Segunda copia reducida */}
        <div className="ticket" style={{ marginTop: 16, fontSize: "11px" }}>
          <div className="header" style={{ padding: "10px 16px" }}>
            <div>
              <h1 style={{ fontSize: 14 }}>DRIP DIAMOND — Copia</h1>
            </div>
            <p>{order.numero}</p>
          </div>
          <div className="body" style={{ padding: "12px 16px", fontSize: 11 }}>
            <div className="field">
              <label>Destinatario</label>
              <p>{order.clienteNombre || "Cliente"}</p>
            </div>
            <div className="field">
              <label>Teléfono</label>
              <p>{order.telefonoContacto || "—"}</p>
            </div>
            <div className="field full">
              <label>Dirección</label>
              <p>{direccion || "—"} · {order.ciudad}</p>
            </div>
            <div className="field">
              <label>Pares</label>
              <p>{totalPares}</p>
            </div>
            <div className="field">
              <label>Total</label>
              <p>{formatCurrency(order.total)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
