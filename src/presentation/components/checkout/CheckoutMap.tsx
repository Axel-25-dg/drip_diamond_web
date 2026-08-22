import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import type { LatLngLiteral } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers, MapPin, Eye, Satellite } from "lucide-react";

/* ── Custom Animated Pin Icon ─────────────────────────────── */
const customPinIcon = L.divIcon({
  className: "custom-leaflet-marker",
  html: `
    <div class="relative flex items-center justify-center">
      <span class="absolute h-10 w-10 rounded-full bg-blue-500/30 dark:bg-sky-400/30 animate-ping"></span>
      <span class="absolute h-7 w-7 rounded-full bg-blue-600/40 dark:bg-sky-500/40 animate-pulse"></span>
      <div class="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white shadow-xl shadow-blue-500/40 ring-4 ring-white dark:ring-slate-900 transition-transform duration-300 hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

/* ── Map Types ────────────────────────────────────────────── */
export type MapTileProvider = "google" | "carto" | "satellite";

interface TileConfig {
  url: string;
  attribution: string;
  subdomains?: string[];
  maxZoom?: number;
}

const TILE_PROVIDERS: Record<string, Record<MapTileProvider, TileConfig>> = {
  light: {
    google: {
      url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
      attribution: "&copy; Google Maps",
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      maxZoom: 20,
    },
    carto: {
      url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      attribution: "&copy; CARTO &copy; OpenStreetMap",
      subdomains: ["a", "b", "c", "d"],
      maxZoom: 20,
    },
    satellite: {
      url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      attribution: "&copy; Google Maps Satellite",
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      maxZoom: 20,
    },
  },
  dark: {
    google: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: "&copy; Google Maps / CARTO Dark",
      subdomains: ["a", "b", "c", "d"],
      maxZoom: 20,
    },
    carto: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: "&copy; CARTO Dark Matter",
      subdomains: ["a", "b", "c", "d"],
      maxZoom: 20,
    },
    satellite: {
      url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      attribution: "&copy; Google Maps Satellite",
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      maxZoom: 20,
    },
  },
};

/* ── Smooth FlyTo Component ───────────────────────────────── */
function MapFlyTo({ position }: { position: LatLngLiteral }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 17, { duration: 1.2 });
  }, [position, map]);
  return null;
}

/* ── Click Handler Component ──────────────────────────────── */
function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface CheckoutMapProps {
  position: LatLngLiteral;
  onPick: (lat: number, lng: number) => void;
  height?: number;
}

export function CheckoutMap({ position, onPick, height = 340 }: CheckoutMapProps) {
  const [provider, setProvider] = useState<MapTileProvider>("google");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode from html element
  useEffect(() => {
    const checkDark = () => setIsDarkMode(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const currentTheme = isDarkMode ? "dark" : "light";
  const activeTileConfig = TILE_PROVIDERS[currentTheme][provider];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--bg-border)] shadow-md group">
      {/* Layer Selector Overlay */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1 rounded-xl bg-white/90 dark:bg-slate-900/90 p-1.5 backdrop-blur-md shadow-lg border border-slate-200/80 dark:border-slate-800/80 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setProvider("google")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all ${
            provider === "google"
              ? "bg-blue-600 text-white shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Google HD
        </button>
        <button
          type="button"
          onClick={() => setProvider("carto")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all ${
            provider === "carto"
              ? "bg-blue-600 text-white shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          CARTO
        </button>
        <button
          type="button"
          onClick={() => setProvider("satellite")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all ${
            provider === "satellite"
              ? "bg-blue-600 text-white shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Satellite className="h-3.5 w-3.5" />
          Satélite
        </button>
      </div>

      {/* Leaflet Container */}
      <div style={{ height }}>
        <MapContainer
          center={position}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            key={`${currentTheme}-${provider}`}
            url={activeTileConfig.url}
            attribution={activeTileConfig.attribution}
            subdomains={activeTileConfig.subdomains}
            maxZoom={activeTileConfig.maxZoom}
          />
          <Marker position={position} icon={customPinIcon} />
          <MapFlyTo position={position} />
          <MapClickHandler onPick={onPick} />
        </MapContainer>
      </div>

      {/* Floating Bottom Info Pill */}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[400] flex items-center justify-between gap-2 rounded-xl bg-white/90 dark:bg-slate-900/90 px-3 py-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-blue-500" />
          Toca o haz clic en cualquier lugar para ubicar tu entrega
        </span>
        <span className="font-bold text-blue-600 dark:text-sky-400">Quito, Ecuador</span>
      </div>
    </div>
  );
}
