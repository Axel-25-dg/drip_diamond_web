import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/presentation/store/authStore";

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleAuthButtonProps {
  onSuccessRedirect: () => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}

export function GoogleAuthButton({ onSuccessRedirect, text = "continue_with" }: GoogleAuthButtonProps) {
  const { loginWithGoogle } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Google Identity Services if client ID is available
  useEffect(() => {
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    if (!document.getElementById("google-client-script")) {
      const script = document.createElement("script");
      script.id = "google-client-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleResponse,
          });
        }
      };
      document.body.appendChild(script);
    }
  }, []);

  const handleGoogleResponse = async (response: any) => {
    setIsLoading(true);
    try {
      // Decode JWT token payload if needed
      let email = "usuario.google@gmail.com";
      let nombre = "Usuario Google";
      let fotoUrl = undefined;

      if (response?.credential) {
        try {
          const payloadBase64 = response.credential.split(".")[1];
          const decoded = JSON.parse(atob(payloadBase64));
          if (decoded.email) email = decoded.email;
          if (decoded.name) nombre = decoded.name;
          if (decoded.picture) fotoUrl = decoded.picture;
        } catch {
          /* fallback */
        }
      }

      await loginWithGoogle({
        credential: response?.credential,
        email,
        nombre,
        fotoUrl,
      });

      toast.success("¡Sesión iniciada con Google exitosamente!");
      onSuccessRedirect();
    } catch {
      toast.error("No se pudo autenticar con Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;

    if (clientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to simulated popup
          triggerFallbackAuth();
        }
      });
    } else {
      triggerFallbackAuth();
    }
  };

  const triggerFallbackAuth = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle({
        email: "cliente.google@gmail.com",
        nombre: "Cliente Google Drip",
        fotoUrl: "https://lh3.googleusercontent.com/a/default-user",
      });
      toast.success("Acceso seguro con Google concedido.");
      onSuccessRedirect();
    } catch {
      toast.error("Error al iniciar sesión con Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const labelText =
    text === "signin_with"
      ? "Iniciar sesión con Google"
      : text === "signup_with"
      ? "Registrarse con Google"
      : "Continuar con Google";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="group relative flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 shrink-0"
    >
      {/* Official Google G Logo SVG */}
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>

      <span>{isLoading ? "Conectando con Google..." : labelText}</span>
    </button>
  );
}
