import type { ReactNode } from "react";
import { cn } from "@/presentation/utils/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent" | "gold";

const tones: Record<Tone, string> = {
  neutral:
    "bg-gradient-to-br from-[rgba(148,163,184,0.10)] to-[rgba(100,116,139,0.08)] " +
    "text-slate-700 border border-slate-300/40",
  success:
    "bg-gradient-to-br from-[rgba(5,150,105,0.12)] to-[rgba(16,185,129,0.08)] " +
    "text-emerald-800 border border-emerald-400/30",
  warning:
    "bg-gradient-to-br from-[rgba(217,119,6,0.12)] to-[rgba(245,158,11,0.08)] " +
    "text-amber-800 border border-amber-400/30",
  danger:
    "bg-gradient-to-br from-[rgba(220,38,38,0.10)] to-[rgba(239,68,68,0.06)] " +
    "text-rose-700 border border-rose-400/30",
  info:
    "bg-gradient-to-br from-[rgba(59,130,246,0.12)] to-[rgba(14,165,233,0.08)] " +
    "text-sky-800 border border-sky-400/30",
  accent:
    "bg-gradient-to-br from-[rgba(14,165,233,0.15)] via-[rgba(59,130,246,0.12)] to-[rgba(99,102,241,0.10)] " +
    "text-sky-800 border border-sky-400/35",
  gold:
    "bg-gradient-to-br from-[rgba(212,175,55,0.18)] to-[rgba(157,123,27,0.10)] " +
    "text-yellow-900 border border-yellow-500/35",
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
        "relative inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_0_0_1px_rgba(15,23,42,0.02)]",
        tones[tone],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
