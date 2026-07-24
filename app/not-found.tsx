import Link from "next/link";
import { Brand } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button-variants";

/** Página 404 con la identidad de marca. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <Brand size="lg" showName={false} />
      <p className="mt-8 font-display text-6xl font-semibold tracking-tight text-accent">
        404
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold">
        Página no encontrada
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/dashboard"
        className={buttonVariants({ variant: "secondary", className: "mt-6" })}
      >
        Volver al panel
      </Link>
    </div>
  );
}
