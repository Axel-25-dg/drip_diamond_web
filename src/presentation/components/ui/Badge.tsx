import type { ReactNode } from "react";
import { cn } from "@/presentation/utils/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const tones: Record<Tone, string> = {
  neutral: "bg-black/5 text-ink/70",
  success: "bg-success/15 text-success",
  warning: "bg-yellow-400/20 text-yellow-700",
  danger: "bg-danger/15 text-danger",
  info: "bg-blue-500/10 text-blue-700",
  accent: "bg-sky-500/20 text-sky-700 border border-sky-400/30 font-bold",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
