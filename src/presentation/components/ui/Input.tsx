import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/presentation/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wide text-ink/70">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-12 w-full rounded-xl border-2 border-ink/15 bg-white px-4 text-sm text-ink outline-none transition-colors",
            "placeholder:text-ink/40 focus:border-ink",
            error && "border-danger focus:border-danger",
            className
          )}
          {...props}
        />
        {hint && !error && <span className="text-xs text-ink/50">{hint}</span>}
        {error && <span className="text-xs font-medium text-danger">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
