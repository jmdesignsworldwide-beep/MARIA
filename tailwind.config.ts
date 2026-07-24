import type { Config } from "tailwindcss";

/**
 * Sistema de diseño "Grafito & Ámbar".
 * Los colores mapean a variables CSS definidas en globals.css, así el
 * modo claro/oscuro se resuelve sin recompilar. El ámbar (accent) solo
 * acentúa; nunca se usa como fondo grande.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        line: "var(--border)",
        "line-soft": "var(--border-soft)",
        fg: "var(--text-primary)",
        muted: "var(--text-muted)",
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
          contrast: "var(--accent-contrast)",
        },
        success: { DEFAULT: "var(--success)", soft: "var(--success-soft)" },
        warning: { DEFAULT: "var(--warning)", soft: "var(--warning-soft)" },
        danger: { DEFAULT: "var(--danger)", soft: "var(--danger-soft)" },
        info: { DEFAULT: "var(--info)", soft: "var(--info-soft)" },
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      ringColor: {
        DEFAULT: "var(--ring)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      borderRadius: {
        field: "8px",
        card: "12px",
        modal: "16px",
      },
      boxShadow: {
        // Sombras suaves y largas, nunca duras.
        soft: "0 1px 2px hsl(var(--shadow-color) / 0.25), 0 4px 16px -4px hsl(var(--shadow-color) / 0.35)",
        card: "0 1px 3px hsl(var(--shadow-color) / 0.2), 0 12px 32px -12px hsl(var(--shadow-color) / 0.45)",
        elevated:
          "0 8px 24px -6px hsl(var(--shadow-color) / 0.45), 0 24px 60px -20px hsl(var(--shadow-color) / 0.55)",
        "accent-glow": "0 0 0 1px var(--accent), 0 8px 28px -8px var(--accent)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
