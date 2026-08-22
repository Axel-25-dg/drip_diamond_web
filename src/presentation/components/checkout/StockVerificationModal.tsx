import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ShieldCheck, PackageCheck, CreditCard, X, Sparkles } from "lucide-react";
import { Button } from "@/presentation/components/ui/Button";

interface StockVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  userPhone?: string;
}

export function StockVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  userPhone,
}: StockVerificationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Backdrop Overlay with High Z-Index */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container: Wider (max-w-3xl) & Shorter Vertical Profile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.08 }}
            className="relative w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl border border-emerald-500/30 dark:border-emerald-500/30 bg-white dark:bg-[#121622] text-slate-900 dark:text-white shadow-2xl shadow-emerald-950/30 z-10 my-auto"
          >
            {/* Ambient Background Gradient Glows */}
            <div className="pointer-events-none absolute -top-20 -left-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-5 py-3.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/25">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="h-3 w-3" /> Verificación de Stock
                    </span>
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    ¡Importante antes de tu pago!
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body - Compact & Horizontal Steps Layout */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              {/* Highlight Notice Box */}
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 dark:from-emerald-950/40 dark:via-[#121622] dark:to-emerald-950/20 p-3.5 shadow-sm">
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  <strong className="font-bold text-emerald-700 dark:text-emerald-400">Antes de enviar tu comprobante de pago</strong>, nos vamos a comunicar contigo por{" "}
                  <span className="inline-flex items-center font-bold text-emerald-600 dark:text-emerald-400 underline decoration-emerald-400 underline-offset-2">
                    WhatsApp
                  </span>{" "}
                  si aún sigue disponible el modelo/par o talla de la zapatilla. Nosotros te contactamos por WhatsApp si la talla se encuentra disponible o el modelo, y cuando te confirmemos usted proceda con su pago y su método de entrega. ¡Muchas gracias!
                </p>
                {userPhone && (
                  <div className="mt-2.5 inline-flex items-center gap-2 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/80 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Te contactaremos al WhatsApp: <span className="font-mono font-bold text-slate-900 dark:text-white">{userPhone}</span>
                  </div>
                )}
              </div>

              {/* Steps Layout in 3 Horizontal Columns on Tablet/Desktop */}
              <div>
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Pasos del proceso:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3 border border-slate-100 dark:border-slate-800/60">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 font-bold text-xs">
                      <PackageCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        1. Verificación
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Confirmamos stock en bodega del modelo y talla.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3 border border-slate-100 dark:border-slate-800/60">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        2. Contacto WhatsApp
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Te notificamos que tu par está disponible.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3 border border-slate-100 dark:border-slate-800/60">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold text-xs">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        3. Pago y Entrega
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Realizas tu pago y acordamos la entrega.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 px-5 py-3 shrink-0">
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={onClose}
                disabled={isSubmitting}
                className="order-2 sm:order-1 text-slate-600 dark:text-slate-300 h-10 text-xs sm:text-sm"
              >
                Revisar mi pedido
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                isLoading={isSubmitting}
                onClick={onConfirm}
                className="order-1 sm:order-2 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white border-none shadow-md shadow-emerald-600/20 gap-2 h-10 text-xs sm:text-sm"
              >
                <ShieldCheck className="h-4 w-4" />
                Entendido, Solicitar Pedido
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
