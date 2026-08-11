import type { ReactNode } from "react";
import { cn } from "@/presentation/utils/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent" | "gold";

/**
 * Paleta: blanco/azul/celeste + semánticos legibles en modo claro.
 * Contraste mínimo 4.5:1 para texto sobre fondo de badge.
 */
const tones: Record<Tone, string> = {
  neutral:
    "bg-gray-100 text-gray-700 border border-gray-200",

  info:
    "bg-sky-50 text-sky-700 border border-sky-200",

  accent:
    "bg-blue-50 text-blue-700 border border-blue-200",

  success:
    "bg-emerald-50 text-emerald-700 border border-emerald-200",

  warning:
    "bg-amber-50 text-amber-700 border border-amber-200",

  danger:
    "bg-red-50 text-red-700 border border-red-200",

  gold:
    "bg-amber-50 text-amber-800 border border-amber-200",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  pulse,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
        "text-[11px] font-bold uppercase tracking-wide",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        tones[tone],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
