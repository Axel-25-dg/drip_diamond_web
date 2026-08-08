import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/presentation/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, iconLeft, iconRight, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-secondary"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "group relative flex items-center rounded-[14px] border-[1.5px] transition-all duration-200",
            "bg-[var(--input-bg)]",
            error
              ? "border-danger focus-within:border-danger focus-within:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]"
              : "border-[var(--input-border)] hover:border-[var(--bg-border-strong)] focus-within:border-[var(--input-border-focus)] focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.14)] focus-within:bg-[var(--bg-surface)]"
          )}
        >
          {iconLeft && (
            <span className="pointer-events-none pl-3.5 pr-1 text-muted-t transition-colors group-focus-within:text-accent">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-[50px] w-full flex-1 bg-transparent px-4 text-[14px] text-primary outline-none",
              "placeholder:text-muted-t placeholder:opacity-80",
              iconLeft && "pl-1",
              iconRight && "pr-1",
              className
            )}
            {...props}
          />
          {iconRight && (
            <span className="pointer-events-none pl-1 pr-3.5 text-muted-t transition-colors group-focus-within:text-accent">
              {iconRight}
            </span>
          )}
        </div>
        {hint && !error && <span className="text-[11px] text-muted-t leading-relaxed">{hint}</span>}
        {error && <span className="text-[11px] font-semibold text-danger leading-relaxed">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
