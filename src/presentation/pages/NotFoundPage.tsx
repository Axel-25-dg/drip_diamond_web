import { Link } from "react-router-dom";
import { Button } from "@/presentation/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="container-app flex min-h-[70vh] flex-col items-center justify-center text-center">
      <span className="font-display text-outline text-8xl sm:text-9xl">404</span>
      <h1 className="mt-4 font-display text-3xl">Esta página se perdió el paso</h1>
      <p className="mt-2 max-w-sm text-sm text-ink/50">
        No encontramos lo que buscabas. Vuelve al catálogo y sigue explorando.
      </p>
      <Link to="/" className="mt-6">
        <Button variant="secondary" size="lg">
          Volver al inicio
        </Button>
      </Link>
    </div>
  );
}
