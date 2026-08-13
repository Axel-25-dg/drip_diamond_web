import { formatCurrency } from "@/presentation/utils/format";
import { cn } from "@/presentation/utils/cn";

export function PriceTag({
  base,
  offer,
  size = "md",
  className,
}: {
  base: number;
  offer?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const hasOffer = offer != null && offer < base;
  const sizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-bold text-slate-900 dark:text-white", sizes[size])}>{formatCurrency(hasOffer ? offer! : base)}</span>
      {hasOffer && <span className="text-sm text-slate-400 dark:text-slate-500 line-through">{formatCurrency(base)}</span>}
    </div>
  );
}
