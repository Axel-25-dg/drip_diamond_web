import { cn } from "@/presentation/utils/cn";
import type { HTMLAttributes, ReactNode } from "react";

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Surface({ children, className, ...props }: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-blue-100/80 bg-white text-slate-800 shadow-[0_10px_35px_-20px_rgba(37,99,235,0.28)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
