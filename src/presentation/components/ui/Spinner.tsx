import { Loader2 } from "lucide-react";
import { cn } from "@/presentation/utils/cn";

export function Spinner({ className, full }: { className?: string; full?: boolean }) {
  if (full) {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center">
        <Loader2 className={cn("h-8 w-8 animate-spin text-ink/40", className)} />
      </div>
    );
  }
  return <Loader2 className={cn("h-5 w-5 animate-spin", className)} />;
}
