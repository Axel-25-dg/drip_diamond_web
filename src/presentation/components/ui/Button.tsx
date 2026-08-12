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
  primary:
    "bg-[linear-gradient(135deg,#2563eb_0%,#0ea5e9_100%)] text-white font-semibold " +
    "shadow-[0_10px_30px_-12px_rgba(37,99,235,0.45)] " +
    "hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0",

  secondary:
    "border border-blue-200 bg-white text-blue-700 font-semibold " +
    "shadow-[0_8px_24px_-16px_rgba(37,99,235,0.24)] " +
    "hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700 hover:-translate-y-0.5 active:translate-y-0",

  sky:
    "bg-sky-500 text-white font-semibold " +
    "shadow-[0_10px_30px_-12px_rgba(14,165,233,0.45)] " +
    "hover:bg-sky-600 hover:-translate-y-0.5 active:translate-y-0",

  outline:
    "border border-blue-200 bg-transparent text-blue-700 font-semibold " +
    "shadow-[0_4px_16px_-12px_rgba(37,99,235,0.22)] " +
    "hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800",

  ghost:
    "bg-transparent text-blue-700 font-medium " +
    "hover:bg-blue-50 hover:text-blue-800",

  danger:
    "bg-[#dc2626] text-white font-semibold " +
    "shadow-[0_10px_24px_-14px_rgba(220,38,38,0.4)] " +
    "hover:bg-[#b91c1c] hover:-translate-y-0.5 active:translate-y-0",

  gold:
    "bg-[#0f172a] text-white font-semibold " +
    "shadow-[0_10px_24px_-14px_rgba(15,23,42,0.28)] " +
    "hover:bg-[#1e293b] hover:-translate-y-0.5 active:translate-y-0",
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
        "relative inline-flex items-center justify-center select-none overflow-hidden",
        "tracking-tight transition-all duration-200 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-sky-300/50 focus-visible:ring-offset-2",
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
