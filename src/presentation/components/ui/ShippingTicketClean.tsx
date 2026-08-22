import { useEffect, useState, useRef } from "react";
import { MapPin, Printer } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import type { LatLngLiteral } from "leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Order } from "@/domain/entities/Order";
import { formatCurrency, formatDate } from "@/presentation/utils/format";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const QUITO_DEFAULT: LatLngLiteral = { lat: -0.1807, lng: -78.4678 };

function extractCoords(str?: string | null): { lat: number; lng: number } | null {
  if (!str) return null;
  const m = str.match(/[\(\[]\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*[\)\]]/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

function formatAddressForDisplay(str?: string | null): string {
  if (!str) return "";
  return str.replace(/\s*[\(\[]-?\d+\.\d+,\s*-?\d+\.\d+[\)\]]/g, "").trim();
}

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
    } catch {
      // Fallback
    }
  }
  return null;
}

function MapFlyTo({ position }: { position: LatLngLiteral }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 16, { duration: 1 });
  }, [position, map]);
  return null;
}

function MiniMap({ coords }: { coords: LatLngLiteral }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--bg-border)]" style={{ height: 220 }}>
      <MapContainer
        center={coords}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={coords} />
        <MapFlyTo position={coords} />
      </MapContainer>
    </div>
  );
}

interface Props {
  order: Order;
}

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
        <title>Ticket Servientrega - Pedido ${order.numero}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #fff;
            color: #0f172a;
            padding: 12px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .ticket {
            border: 2px solid #2563eb;
            border-radius: 14px;
            overflow: hidden;
            max-width: 680px;
            margin: 0 auto;
            page-break-inside: avoid;
            break-inside: avoid;
            background: #fff;
          }
          .header {
            background: #2563eb;
            color: #fff;
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .header h1 { font-size: 16px; font-weight: 800; letter-spacing: -0.3px; }
          .header p { font-size: 11px; opacity: 0.9; }
          .body {
            padding: 14px 20px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 16px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .field { margin-bottom: 2px; page-break-inside: avoid; break-inside: avoid; }
          .field label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; display: block; margin-bottom: 1px; }
          .field p { font-size: 12px; font-weight: 600; color: #0f172a; word-break: break-word; }
          .field.full { grid-column: span 2; }
          .divider { border: none; border-top: 1px solid #e2e8f0; margin: 2px 0; }
          .items { padding: 0 20px 14px; page-break-inside: avoid; break-inside: avoid; }
          .items table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .items th { background: #f8faff; padding: 6px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
          .items td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
          .total-row td { font-weight: 800; font-size: 12px; background: #eff6ff; }
          .footer { background: #f8faff; padding: 10px 20px; font-size: 10px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; page-break-inside: avoid; break-inside: avoid; }
          
          .ticket-copy-container {
            page-break-before: always;
            break-before: page;
            margin-top: 10px;
          }
          .cut-line {
            border-top: 2px dashed #94a3b8;
            margin: 12px 0;
            text-align: center;
          }
          .cut-line span {
            background: #fff;
            padding: 0 10px;
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
          }

          @media print {
            body { padding: 0 !important; }
            .ticket { border-color: #2563eb !important; }
          }
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
      <div>
        <div className="mb-2 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-bold text-[var(--text-primary)]">Ubicacion del cliente</span>
        </div>
        {loadingMap ? (
          <div className="flex h-[220px] items-center justify-center rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface2)]">
            <p className="text-sm text-[var(--text-muted)]">Cargando mapa...</p>
          </div>
        ) : (
          <MiniMap coords={coords!} />
        )}
        <p className="mt-1.5 text-xs text-[var(--text-muted)]">
          <strong>Direccion:</strong> {direccion || "—"}
          {" · "}{order.ciudad}, {order.provincia}
        </p>
      </div>

      <button
        type="button"
        onClick={handlePrint}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.35)] transition-all hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(37,99,235,0.45)]"
      >
        <Printer className="h-4 w-4" />
        Imprimir ticket Servientrega
      </button>

      <div ref={printRef} style={{ display: "none" }}>
        <div className="ticket">
          <div className="header">
            <div>
              <h1>DRIP DIAMOND - Ticket de Envio</h1>
              <p>Servientrega Ecuador · Quito</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 18, fontWeight: 900 }}>{order.numero}</p>
              <p>{formatDate(order.creadoEn)}</p>
            </div>
          </div>

          <div className="body">
            <div className="field">
              <label>Destinatario</label>
              <p>{order.clienteNombre || "Cliente"}</p>
            </div>
            <div className="field">
              <label>Telefono de contacto</label>
              <p>{order.telefonoContacto || "—"}</p>
            </div>
            <div className="field full">
              <label>Direccion exacta de entrega</label>
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
              <label>Costo de envio</label>
              <p>$3.00 USD</p>
            </div>
            <div className="field">
              <label>Remitente</label>
              <p>Drip Diamond - 0999 001 471</p>
            </div>
            {order.vendedorNombre && (
              <div className="field">
                <label>Vendedor asignado</label>
                <p>{order.vendedorNombre}</p>
              </div>
            )}
          </div>

          {coords && (
            <div style={{ padding: "0 20px 12px" }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b", marginBottom: 3 }}>
                Mapa de entrega (GPS)
              </p>
              <img
                src={`https://static-maps.yandex.ru/1.x/?l=map&pt=${coords.lng},${coords.lat},pm2rdm&z=15&w=600&h=200`}
                alt="Mapa de entrega"
                style={{ width: "100%", height: 125, objectFit: "cover", borderRadius: 10, border: "1px solid #cbd5e1" }}
              />
            </div>
          )}

          <hr className="divider" />

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

          <div className="footer">
            <p>Drip Diamond | Luxury Sneakers Ecuador | WhatsApp: 0999 001 471</p>
            <p style={{ marginTop: 2 }}>Pedido {order.numero} · {formatDate(order.creadoEn)} · Estado: {order.estado}</p>
          </div>
        </div>

        <div className="ticket-copy-container">
          <div className="cut-line">
            <span>-- Cortar aqui - Pegar en el paquete --</span>
          </div>

          <div className="ticket" style={{ fontSize: "11px" }}>
            <div className="header" style={{ padding: "10px 16px" }}>
              <div>
                <h1 style={{ fontSize: 14 }}>DRIP DIAMOND - Copia para Paquete</h1>
              </div>
              <p>{order.numero}</p>
            </div>
            <div className="body" style={{ padding: "12px 16px", fontSize: 11 }}>
              <div className="field">
                <label>Destinatario</label>
                <p>{order.clienteNombre || "Cliente"}</p>
              </div>
              <div className="field">
                <label>Telefono</label>
                <p>{order.telefonoContacto || "—"}</p>
              </div>
              <div className="field full">
                <label>Direccion exacta de entrega</label>
                <p>{direccion || "—"} · {order.ciudad}</p>
              </div>
              <div className="field">
                <label>Pares</label>
                <p>{totalPares}</p>
              </div>
              <div className="field">
                <label>Total declarado</label>
                <p>{formatCurrency(order.total)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
