import { cn } from "@/presentation/utils/cn";

export function Spinner({ full, className }: { full?: boolean; className?: string }) {
  const spinner = (
    <div
      className={cn(
        "h-9 w-9 rounded-full border-[3px] border-blue-100 border-t-blue-500 animate-spin",
        className
      )}
    />
  );

  if (full) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        {spinner}
        <p className="text-sm font-medium text-gray-400">Cargando...</p>
      </div>
    );
  }

  return spinner;
}
