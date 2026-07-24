// Tanda 1 — Cimientos. Página de estado de la infraestructura.
// SIN sistema de diseño todavía (eso es la Tanda 2). Solo confirma
// que el andamiaje está en pie y desplegado.

const cimientos = [
  "Next.js 15 · App Router · TypeScript estricto",
  "Tailwind CSS + PostCSS (tokens de diseño en Tanda 2)",
  "Supabase: clientes de navegador y servidor separados",
  "Cliente administrativo (service_role) aislado con server-only",
  "Middleware de refresco de sesión",
  "Cabeceras de seguridad Fort Knox (CSP, HSTS, nosniff…)",
  "Validación de entorno con Zod · .env.example con placeholders",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
          Tanda 1 · Cimientos
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          JM Facturación
        </h1>
        <p className="text-neutral-500">
          Sistema de cotización, facturación y control financiero. La
          infraestructura está desplegada y lista para construir sobre ella.
        </p>
      </header>

      <section
        aria-label="Cimientos verificados"
        className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/40"
      >
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Andamiaje en pie
        </h2>
        <ul className="space-y-3">
          {cimientos.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm">
              <span
                aria-hidden
                className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              >
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="text-xs text-neutral-400">
        Próxima tanda: sistema de diseño «Grafito &amp; Ámbar», modo
        claro/oscuro y autenticación.
      </footer>
    </main>
  );
}
