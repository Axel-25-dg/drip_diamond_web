import type { ReactNode } from "react";
import { cn } from "@/presentation/utils/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?:        ReactNode;
  title:        string;
  description?: string;
  action?:      ReactNode;
  className?:   string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl",
        "border border-dashed border-blue-100 dark:border-[#222732] bg-white dark:bg-[#12151c] px-6 py-16 text-center",
        "shadow-sm",
        className
      )}
    >
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-400 dark:text-sky-400">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
        {description && (
          <p className="max-w-sm text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
