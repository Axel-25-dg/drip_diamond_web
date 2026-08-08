import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/presentation/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "glass" | "gold";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[#0a0c12] text-white hover:bg-[#1a1f2e] " +
    "shadow-[0_10px_30px_-12px_rgba(10,12,18,0.45),0_0_0_1px_rgba(10,12,18,0.10)] " +
    "hover:shadow-[0_18px_40px_-16px_rgba(10,12,18,0.55),0_0_0_1px_rgba(10,12,18,0.18)]",
  secondary:
    "bg-gradient-to-br from-[#0ea5e9] via-[#3b82f6] to-[#6366f1] text-white font-bold " +
    "shadow-[0_10px_30px_-12px_rgba(14,165,233,0.55),0_0_0_1px_rgba(14,165,233,0.18)] " +
    "hover:shadow-[0_18px_45px_-15px_rgba(99,102,241,0.55),0_0_0_1px_rgba(14,165,233,0.28)] " +
    "hover:from-[#0284c7] hover:via-[#2563eb] hover:to-[#4f46e5] " +
    "hover:-translate-y-0.5 active:translate-y-0",
  gold:
    "bg-gradient-to-br from-[#f4cf57] via-[#d4af37] to-[#9d7b1b] text-[#1a1200] font-bold " +
    "shadow-[0_10px_30px_-12px_rgba(212,175,55,0.55),0_0_0_1px_rgba(212,175,55,0.28)] " +
    "hover:shadow-[0_18px_45px_-15px_rgba(212,175,55,0.65),0_0_0_1px_rgba(212,175,55,0.38)] " +
    "hover:-translate-y-0.5 active:translate-y-0",
  outline:
    "border-[1.5px] border-theme-s bg-surf text-primary " +
    "hover:bg-surf2 hover:border-[color:var(--card-border-hover)] " +
    "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_0_0_1px_rgba(15,23,42,0.02)] " +
    "hover:shadow-[0_10px_25px_-15px_rgba(14,165,233,0.25),0_0_0_1px_rgba(14,165,233,0.15)]",
  ghost:
    "text-secondary hover:bg-surf2 hover:text-primary " +
    "hover:shadow-[0_6px_20px_-12px_rgba(15,23,42,0.25)]",
  danger:
    "bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white font-semibold " +
    "shadow-[0_10px_30px_-12px_rgba(239,68,68,0.55),0_0_0_1px_rgba(220,38,38,0.18)] " +
    "hover:shadow-[0_18px_45px_-15px_rgba(220,38,38,0.55),0_0_0_1px_rgba(220,38,38,0.28)] " +
    "hover:from-[#dc2626] hover:to-[#b91c1c] hover:-translate-y-0.5 active:translate-y-0",
  glass:
    "bg-white/12 text-white border-[1.5px] border-white/25 backdrop-blur-xl " +
    "hover:bg-white/20 hover:border-white/40 " +
    "shadow-[0_10px_40px_-20px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)]",
};

const sizes: Record<Size, string> = {
  xs: "h-8 px-3 text-[11px] gap-1 rounded-[10px]",
  sm: "h-10 px-4 text-[13px] gap-1.5 rounded-[12px]",
  md: "h-11 px-5 text-sm gap-2 rounded-[14px]",
  lg: "h-13 px-7 text-sm gap-2.5 rounded-[16px]",
  xl: "h-15 px-10 text-base gap-3 rounded-[18px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", isLoading, fullWidth, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "relative inline-flex items-center justify-center font-semibold",
          "tracking-tight transition-all duration-250 ease-out",
          "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0",
          "active:scale-[0.98] focus-visible:outline-none",
          "focus-visible:ring-[3px] focus-visible:ring-sky-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          "overflow-hidden select-none",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
          style={{
            backgroundImage:
              "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)",
            backgroundSize: "200% 100%",
            animation:
              variant === "secondary" || variant === "gold" || variant === "danger"
                ? "shine 3.5s linear infinite"
                : undefined,
          }}
        />
        <span className="relative z-10 inline-flex items-center justify-center gap-[inherit]">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {children}
        </span>
      </button>
    );
  }
);
Button.displayName = "Button";
