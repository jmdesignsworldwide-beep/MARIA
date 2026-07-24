/** @type {import('next').NextConfig} */

// Estándar Fort Knox — cabeceras de seguridad aplicadas a TODAS las rutas.
// La Content-Security-Policy permite conexiones a Supabase (*.supabase.co).
// El endurecimiento con nonces se afina en la Tanda 14 (auditoría final).
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      // Next.js inyecta estilos y scripts en línea; se relaja aquí y se
      // endurece con nonces en la auditoría final.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "font-src 'self' data:",
      "connect-src 'self' blob: data: https://*.supabase.co wss://*.supabase.co",
      "media-src 'self'",
      "worker-src 'self' blob:",
      // Vista previa de PDF (@react-pdf) se renderiza en un iframe blob:.
      "frame-src 'self' blob:",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
