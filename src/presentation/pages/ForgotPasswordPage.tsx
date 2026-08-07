import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCases } from "@/infrastructure/factories/useCases.factory";
import { Input } from "@/presentation/components/ui/Input";
import { Button } from "@/presentation/components/ui/Button";
import { AuthShell } from "@/presentation/components/auth/AuthShell";
import { cn } from "@/presentation/utils/cn";

type Step = "correo" | "otp" | "password";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("correo");
  const [correo, setCorreo] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <AuthShell title="Recuperar contraseña" subtitle={stepSubtitle(step)}>
      <StepIndicator step={step} />

      {step === "correo" && (
        <RequestCodeForm
          isSubmitting={isSubmitting}
          onSubmit={async (email) => {
            setIsSubmitting(true);
            try {
              await useCases.requestPasswordReset.execute(email);
              setCorreo(email);
              toast.success("Te enviamos un código de 6 dígitos a tu correo.");
              setStep("otp");
            } catch (err: any) {
              toast.error(err?.message || "No se pudo enviar el código.");
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      )}

      {step === "otp" && (
        <VerifyOtpForm
          correo={correo}
          isSubmitting={isSubmitting}
          onBack={() => setStep("correo")}
          onSubmit={async (codigo) => {
            setIsSubmitting(true);
            try {
              const { resetToken } = await useCases.verifyOtp.execute(correo, codigo);
              setResetToken(resetToken);
              toast.success("Código verificado.");
              setStep("password");
            } catch (err: any) {
              toast.error(err?.message || "Código incorrecto o expirado.");
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      )}

      {step === "password" && (
        <NewPasswordForm
          isSubmitting={isSubmitting}
          onSubmit={async (password) => {
            setIsSubmitting(true);
            try {
              await useCases.confirmPasswordReset.execute(resetToken, password);
              toast.success("Contraseña actualizada. Inicia sesión.");
              navigate("/login");
            } catch (err: any) {
              toast.error(err?.message || "No se pudo actualizar la contraseña.");
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      )}
    </AuthShell>
  );
}

function stepSubtitle(step: Step) {
  if (step === "correo") return "Ingresa tu correo y te enviaremos un código de verificación.";
  if (step === "otp") return "Ingresa el código de 6 dígitos que enviamos a tu correo.";
  return "Elige tu nueva contraseña.";
}

function StepIndicator({ step }: { step: Step }) {
  const steps: Step[] = ["correo", "otp", "password"];
  const currentIndex = steps.indexOf(step);
  return (
    <div className="mb-6 flex items-center gap-2">
      {steps.map((_, i) => (
        <div
          key={i}
          className={cn("h-1.5 flex-1 rounded-full", i <= currentIndex ? "bg-ink" : "bg-black/10")}
        />
      ))}
    </div>
  );
}

function RequestCodeForm({ onSubmit, isSubmitting }: { onSubmit: (correo: string) => void; isSubmitting: boolean }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ correo: string }>();

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v.correo))} className="flex flex-col gap-4">
      <Input
        label="Correo electrónico"
        type="email"
        placeholder="tucorreo@ejemplo.com"
        error={errors.correo?.message}
        {...register("correo", { required: "Ingresa tu correo" })}
      />
      <Button type="submit" size="lg" variant="secondary" fullWidth isLoading={isSubmitting}>
        Enviar código
      </Button>
    </form>
  );
}

function VerifyOtpForm({
  correo,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  correo: string;
  onSubmit: (codigo: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ codigo: string }>();

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v.codigo))} className="flex flex-col gap-4">
      <p className="text-sm text-ink/60">
        Enviado a <span className="font-semibold text-ink">{correo}</span>
      </p>
      <Input
        label="Código de 6 dígitos"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        className="text-center text-lg tracking-[0.5em]"
        error={errors.codigo?.message}
        {...register("codigo", {
          required: "Ingresa el código",
          minLength: { value: 6, message: "Debe tener 6 dígitos" },
          maxLength: { value: 6, message: "Debe tener 6 dígitos" },
        })}
      />
      <p className="text-xs text-ink/40">Tienes hasta 5 intentos y el código expira en 10 minutos.</p>
      <Button type="submit" size="lg" variant="secondary" fullWidth isLoading={isSubmitting}>
        Verificar código
      </Button>
      <button type="button" onClick={onBack} className="text-xs font-semibold text-ink/50 hover:text-ink">
        Usar otro correo
      </button>
    </form>
  );
}

function NewPasswordForm({ onSubmit, isSubmitting }: { onSubmit: (password: string) => void; isSubmitting: boolean }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{ password: string; confirmPassword: string }>();
  const password = watch("password");

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v.password))} className="flex flex-col gap-4">
      <Input
        label="Nueva contraseña"
        type="password"
        error={errors.password?.message}
        {...register("password", { required: "Requerido", minLength: { value: 8, message: "Mínimo 8 caracteres" } })}
      />
      <Input
        label="Confirmar contraseña"
        type="password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword", {
          required: "Requerido",
          validate: (v) => v === password || "Las contraseñas no coinciden",
        })}
      />
      <Button type="submit" size="lg" variant="secondary" fullWidth isLoading={isSubmitting}>
        Guardar nueva contraseña
      </Button>
    </form>
  );
}
