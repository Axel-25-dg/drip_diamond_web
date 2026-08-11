import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/presentation/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "sky" | "gold";
type Size    = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant;
  size?:     Size;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  /* Azul institucional sólido — acción principal */
  primary:
    "bg-blue-600 text-white " +
    "shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_16px_-6px_rgba(37,99,235,0.45)] " +
    "hover:bg-blue-700 " +
    "hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_24px_-8px_rgba(37,99,235,0.55)] " +
    "hover:-translate-y-px active:translate-y-0 active:bg-blue-800",

  /* Gradiente azul→celeste — CTA destacado */
  secondary:
    "bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold " +
    "shadow-[0_1px_2px_rgba(15,23,42,0.06),0_6px_20px_-8px_rgba(14,165,233,0.50)] " +
    "hover:from-blue-700 hover:to-sky-600 " +
    "hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_10px_28px_-8px_rgba(14,165,233,0.60)] " +
    "hover:-translate-y-0.5 active:translate-y-0",

  /* Celeste vibrante puro — acción de acento */
  sky:
    "bg-sky-500 text-white font-bold " +
    "shadow-[0_1px_2px_rgba(15,23,42,0.06),0_6px_20px_-8px_rgba(14,165,233,0.50)] " +
    "hover:bg-sky-600 " +
    "hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_10px_28px_-8px_rgba(14,165,233,0.60)] " +
    "hover:-translate-y-0.5 active:translate-y-0",

  /* Borde azul — acción secundaria */
  outline:
    "border border-blue-200 bg-white text-blue-700 font-semibold " +
    "shadow-[0_1px_2px_rgba(15,23,42,0.04)] " +
    "hover:border-blue-400 hover:bg-blue-50 " +
    "hover:shadow-[0_1px_3px_rgba(15,23,42,0.06),0_4px_14px_-6px_rgba(37,99,235,0.20)] " +
    "hover:-translate-y-px active:translate-y-0",

  /* Transparente — acción terciaria */
  ghost:
    "text-blue-700 bg-transparent " +
    "hover:bg-blue-50 hover:text-blue-800 " +
    "active:bg-blue-100",

  /* Peligro */
  danger:
    "bg-red-600 text-white font-semibold " +
    "shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_16px_-6px_rgba(220,38,38,0.40)] " +
    "hover:bg-red-700 " +
    "hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_24px_-8px_rgba(220,38,38,0.50)] " +
    "hover:-translate-y-px active:translate-y-0",

  /* Dorado — mantener para compatibilidad */
  gold:
    "bg-amber-500 text-white font-bold " +
    "shadow-[0_1px_2px_rgba(15,23,42,0.06),0_6px_20px_-8px_rgba(217,119,6,0.50)] " +
    "hover:bg-amber-600 hover:-translate-y-0.5 active:translate-y-0",
};

const sizes: Record<Size, string> = {
  xs: "h-8  px-3   text-[11px] gap-1   rounded-[10px]",
  sm: "h-9  px-4   text-[13px] gap-1.5 rounded-[11px]",
  md: "h-11 px-5   text-sm     gap-2   rounded-[12px]",
  lg: "h-12 px-7   text-sm     gap-2   rounded-[13px]",
  xl: "h-14 px-9   text-base   gap-3   rounded-[14px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, fullWidth, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "relative inline-flex items-center justify-center font-semibold select-none overflow-hidden",
        "tracking-tight transition-all duration-200 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-blue-400/40 focus-visible:ring-offset-2",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {/* Shine sweep en variantes sólidas */}
      {(variant === "secondary" || variant === "sky" || variant === "primary") && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)",
            backgroundSize: "200% 100%",
            animation: "shine 3s linear infinite",
          }}
        />
      )}
      <span className="relative z-10 inline-flex items-center justify-center gap-[inherit]">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </span>
    </button>
  )
);
Button.displayName = "Button";
