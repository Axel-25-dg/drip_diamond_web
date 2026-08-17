import { cn } from "@/presentation/utils/cn";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  hover?: boolean;
}

export function Card({
  title,
  description,
  footer,
  children,
  className,
  hover = true,
  ...props
}: CardProps) {
  return (
    <section
      className={cn(
        "rounded-[24px] border border-blue-100/80 bg-white p-5 shadow-[0_10px_35px_-20px_rgba(37,99,235,0.28)] dark:border-[#222732] dark:bg-[#12151c] dark:shadow-none",
        hover && "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(14,165,233,0.35)] dark:hover:border-[#313746]",
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="mb-4 space-y-1">
          {title && <h3 className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>}
          {description && <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>}
        </div>
      )}

      <div className="space-y-4">{children}</div>

      {footer && <div className="mt-5 border-t border-blue-100/80 dark:border-[#222732] pt-4">{footer}</div>}
    </section>
  );
}
