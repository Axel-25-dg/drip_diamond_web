import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/presentation/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "glass";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink/80 shadow-sm",
  secondary:
    "bg-gradient-to-br from-sky-400 to-sky-600 text-white font-bold " +
    "shadow-md shadow-sky-500/25 hover:shadow-lg hover:shadow-sky-500/30 " +
    "hover:from-sky-300 hover:to-sky-500",
  outline:
    "border border-slate-200 bg-white text-ink hover:bg-slate-50 hover:border-slate-300 shadow-sm",
  ghost: "text-ink/70 hover:bg-slate-100 hover:text-ink",
  danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20",
  glass:
    "bg-white/10 text-white border border-white/20 backdrop-blur-md " +
    "hover:bg-white/20 hover:border-white/30",
};

const sizes: Record<Size, string> = {
  xs: "h-7 px-3 text-xs gap-1",
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-sm gap-2",
  xl: "h-14 px-10 text-base gap-2.5",
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
          "inline-flex items-center justify-center rounded-xl font-semibold",
          "tracking-tight transition-all duration-200",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "active:scale-[0.97] focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
