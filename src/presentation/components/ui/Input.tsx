import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/presentation/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:      string;
  error?:      string;
  hint?:       string;
  iconLeft?:   React.ReactNode;
  iconRight?:  React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, iconLeft, iconRight, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-bold uppercase tracking-widest text-blue-700 dark:text-sky-400"
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            "group relative flex items-center rounded-xl border transition-all duration-200",
            "bg-white dark:bg-[#12151c]",
            error
              ? "border-red-300 focus-within:border-red-400 focus-within:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]"
              : "border-blue-100 dark:border-[#222732] hover:border-blue-300 dark:hover:border-slate-700 focus-within:border-blue-500 dark:focus-within:border-sky-400 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.16)] focus-within:bg-white dark:focus-within:bg-[#12151c]"
          )}
        >
          {iconLeft && (
            <span className="pointer-events-none pl-3.5 text-gray-400 dark:text-slate-500 transition-colors group-focus-within:text-blue-500 dark:group-focus-within:text-sky-400">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-[46px] w-full flex-1 bg-transparent px-4 text-sm text-gray-900 dark:text-white outline-none",
              "placeholder:text-gray-400 dark:placeholder:text-slate-500",
              iconLeft  && "pl-2",
              iconRight && "pr-2",
              className
            )}
            {...props}
          />
          {iconRight && (
            <span className="pointer-events-none pr-3.5 text-gray-400 dark:text-slate-500 transition-colors group-focus-within:text-blue-500 dark:group-focus-within:text-sky-400">
              {iconRight}
            </span>
          )}
        </div>

        {hint  && !error && <span className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">{hint}</span>}
        {error &&           <span className="text-[11px] font-semibold text-red-600 leading-relaxed">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
