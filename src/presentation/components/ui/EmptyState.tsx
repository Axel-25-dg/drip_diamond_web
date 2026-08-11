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
        "border border-dashed border-blue-100 bg-white px-6 py-16 text-center",
        "shadow-[0_1px_3px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-400">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-xl text-gray-900">{title}</h3>
        {description && (
          <p className="max-w-sm text-sm text-gray-500 leading-relaxed">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
