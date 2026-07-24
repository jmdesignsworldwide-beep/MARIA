"use client";

/**
 * Límite de error de nivel raíz (reemplaza todo el documento si algo
 * falla muy arriba). Mantiene un aspecto sobrio y no una pantalla rota.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es-DO">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#0A0C0F",
          color: "#F2F4F7",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
            Ocurrió un error
          </h1>
          <p style={{ color: "#98A2B3", marginBottom: 20, fontSize: 14 }}>
            Algo falló al cargar la aplicación.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#E8A33D",
              color: "#1A1204",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
