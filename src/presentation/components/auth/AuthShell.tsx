import React, { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck, Truck, Lock, Cookie, Headphones, FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { useInfoPanels } from "@/presentation/store/useInfoPanels";

export function AuthShell({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { openPanel } = useInfoPanels();
  const CAROUSEL_IMAGES = [
    "https://images.asos-media.com/products/zapatillas-bajas-en-azul-y-blanco-air-jordan-1-de-nike/207490884-5?$n_640w$&wid=513&fit=constrain",
    "https://i.pinimg.com/1200x/4d/a6/80/4da680c1af59a0026b900c2f83d83694.jpg",
    "https://i.pinimg.com/736x/0b/36/cf/0b36cfb4667038e65f2d5d0f4679c013.jpg",
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % CAROUSEL_IMAGES.length), 4500);
    return () => clearInterval(id);
  }, [CAROUSEL_IMAGES.length]);

  return (
    <div className="grid min-h-[calc(100vh-68px)] lg:grid-cols-[1.1fr_540px] bg-slate-950">
      {/* LEFT — High-End Hero Showcase with Dark Ambient Glow */}
      <div className="relative hidden lg:flex lg:flex-col lg:justify-between overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <img
            src={CAROUSEL_IMAGES[index]}
            alt={`Drip Sneaker Showcase ${index + 1}`}
            className="h-full w-full object-cover opacity-60 scale-105 transition-all duration-1000 ease-out"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = CAROUSEL_IMAGES[(index + 1) % CAROUSEL_IMAGES.length]; }}
          />
          {/* Subtle Ambient Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#09152b]/70 to-[#030712]/30" />
          <div className="absolute top-1/4 left-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-1/4 right-10 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
        </div>

        <div className="relative z-10 p-12 flex flex-col justify-between h-full">
          {/* Top Brand Tag */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1.5 text-xs font-bold text-sky-300 backdrop-blur-md shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              EDICIÓN EXCLUSIVA · ECUADOR 2026
            </div>

            <div className="mt-8 max-w-lg">
              <h2 className="font-display text-5xl font-black text-white leading-[1.1] tracking-tight">
                Camina con <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">Drip Diamond</span>, siente la diferencia.
              </h2>
              <p className="mt-4 text-base text-slate-300/90 font-medium leading-relaxed">
                Accede a lanzamientos exclusivos, envíos prioritarios en Quito y zapatillas 100% verificadas por expertos.
              </p>
            </div>
          </div>

          {/* Benefits Cards */}
          <div className="grid grid-cols-2 gap-4 max-w-lg my-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm mb-1">
                <ShieldCheck className="h-4 w-4" /> 100% Auténticos
              </div>
              <p className="text-xs text-slate-400">Verificación doble de legitimidad en cada par.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm mb-1">
                <Truck className="h-4 w-4" /> Envío Express
              </div>
              <p className="text-xs text-slate-400">Entregas Servientrega aseguradas a todo el país.</p>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-4">
            <span>© {new Date().getFullYear()} Drip Diamond · Quito, Ecuador</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Tienda Verificada
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT — Dynamic Auth Form Shell */}
      <div className="flex flex-col justify-between px-4 sm:px-8 py-8 sm:py-12 bg-slate-50 dark:bg-[#07090e] transition-colors">
        <div className="w-full max-w-[460px] mx-auto my-auto">
          {/* Card Container with Modern Glassmorphism */}
          <div className="rounded-3xl bg-white dark:bg-[#0f121a] text-slate-900 dark:text-white p-6 sm:p-9 shadow-[0_20px_50px_rgba(8,112,184,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-slate-200/80 dark:border-slate-800/80 relative overflow-hidden">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-600" />

            {/* Header Security Chip */}
            <div className="mb-6 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Lock className="h-3 w-3" /> Conexión 256-Bit SSL Segura
              </span>
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2 text-slate-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                {subtitle}
              </p>
            )}
            <div>{children}</div>
          </div>

          {/* Quick Legal & Support Action Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800/80 pt-5">
            <button
              onClick={() => openPanel("terminos")}
              className="inline-flex items-center gap-1.5 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Términos
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={() => openPanel("privacidad")}
              className="inline-flex items-center gap-1.5 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
              Privacidad
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={() => openPanel("cookies")}
              className="inline-flex items-center gap-1.5 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              <Cookie className="h-3.5 w-3.5 text-slate-400" />
              Cookies
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={() => openPanel("soporte")}
              className="inline-flex items-center gap-1.5 font-bold text-sky-600 dark:text-sky-400 hover:underline transition-colors"
            >
              <Headphones className="h-3.5 w-3.5 text-sky-500" />
              Soporte Directo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
