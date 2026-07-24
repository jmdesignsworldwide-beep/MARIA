import type { Config } from "tailwindcss";

// Tanda 1 — configuración base. El sistema de diseño completo
// "Grafito & Ámbar" (tokens de color, tipografía, animaciones) se
// define en la Tanda 2. Aquí solo dejamos el cableado listo.
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
