import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password?: string;
}

export function PasswordStrengthMeter({ password = "" }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const hasLength = password.length >= 8;
  const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasUpper = /[A-Z]/.test(password);

  const score = [hasLength, hasNumberOrSymbol, hasUpper].filter(Boolean).length;

  const label =
    score === 0 || score === 1
      ? "Débil"
      : score === 2
      ? "Media"
      : "Fuerte";

  const colorClass =
    score === 0 || score === 1
      ? "bg-rose-500"
      : score === 2
      ? "bg-amber-500"
      : "bg-emerald-500";

  const textColorClass =
    score === 0 || score === 1
      ? "text-rose-500"
      : score === 2
      ? "text-amber-500"
      : "text-emerald-500";

  return (
    <div className="mt-2 space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs">
      <div className="flex items-center justify-between font-semibold">
        <span className="text-slate-600 dark:text-slate-300">Seguridad de la clave:</span>
        <span className={textColorClass}>{label}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${(score / 3) * 100}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 gap-1 text-[11px] pt-1">
        <div className={`flex items-center gap-1.5 ${hasLength ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400"}`}>
          {hasLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>Al menos 8 caracteres</span>
        </div>
        <div className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400"}`}>
          {hasUpper ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>Al menos una letra mayúscula (A-Z)</span>
        </div>
        <div className={`flex items-center gap-1.5 ${hasNumberOrSymbol ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400"}`}>
          {hasNumberOrSymbol ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>Al menos un número o símbolo (0-9, #, !)</span>
        </div>
      </div>
    </div>
  );
}
