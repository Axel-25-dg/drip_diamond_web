import { cn } from "@/presentation/utils/cn";
import type { HTMLAttributes, ReactNode } from "react";

interface PageShellProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}

export function PageShell({ title, description, children, className, ...props }: PageShellProps) {
  return (
    <main className={cn("min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f3f8ff_100%)] px-4 py-8 sm:px-6 lg:px-8", className)} {...props}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {(title || description) && (
          <header className="space-y-2">
            {title && <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>}
            {description && <p className="max-w-2xl text-base leading-7 text-slate-600">{description}</p>}
          </header>
        )}
        {children}
      </div>
    </main>
  );
}
