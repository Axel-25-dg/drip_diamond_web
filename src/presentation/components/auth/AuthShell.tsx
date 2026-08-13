import React, { useEffect, useState, type ReactNode } from "react";
import { Gem, ShieldCheck, Truck, Star } from "lucide-react";

export function AuthShell({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const CAROUSEL_IMAGES = [
    "https://images.asos-media.com/products/zapatillas-bajas-en-azul-y-blanco-air-jordan-1-de-nike/207490884-5?$n_640w$&wid=513&fit=constrain",
    "https://i.pinimg.com/1200x/4d/a6/80/4da680c1af59a0026b900c2f83d83694.jpg",
    "https://i.pinimg.com/736x/0b/36/cf/0b36cfb4667038e65f2d5d0f4679c013.jpg",
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % CAROUSEL_IMAGES.length), 4000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-[1fr_560px]">
      {/* LEFT — hero carousel with brand copy (external images, no local assets or logo) */}
      <div className="relative hidden lg:flex lg:flex-col lg:justify-between overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={CAROUSEL_IMAGES[index]}
            alt={`Hero ${index + 1}`}
            className="h-full w-full object-cover opacity-90 transition-opacity duration-700"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = CAROUSEL_IMAGES[(index + 1) % CAROUSEL_IMAGES.length]; }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#021028]/80 via-[#08273a]/50 to-transparent" />
        </div>

        <div className="relative z-10 p-12 flex flex-col justify-between h-full">
          <div>
            <div className="mt-8 max-w-lg">
              <h2 className="font-display text-5xl font-extrabold text-white leading-tight">Encuentra tu próximo par</h2>
              <p className="mt-4 text-sm text-slate-200">Únete a la comunidad y accede a lanzamientos exclusivos, envíos rápidos y pares verificados.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-white/10 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-sky-300" />
              </div>
              <span className="text-sm text-slate-200">Pagos seguros</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-white/10 flex items-center justify-center">
                <Truck className="h-4 w-4 text-sky-300" />
              </div>
              <span className="text-sm text-slate-200">Envíos a todo Quito</span>
            </div>
          </div>

          <span className="text-xs text-slate-300">© {new Date().getFullYear()} · Quito, Ecuador</span>
        </div>
      </div>

      {/* RIGHT — form panel */}
      <div className="flex items-center justify-center px-4 sm:px-6 py-6 sm:py-12 bg-[#f8faff] dark:bg-[#0a0c10]">
        <div className="w-full max-w-[480px]">
          {/* Mobile: no static logo or project public images per user request */}

          <div className="rounded-2xl bg-white dark:bg-[#12151c] text-slate-900 dark:text-white p-5 sm:p-8 shadow-lg border border-slate-100 dark:border-[#222732]">
            <h1 className="font-display text-2xl font-bold mb-1 text-slate-900 dark:text-white">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{subtitle}</p>}
            <div>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
