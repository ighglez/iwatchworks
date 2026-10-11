import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta IWatchWorks
        // "gold" es el color de acento de la marca: burdeos.
        gold: { DEFAULT: "#7A1F2E", dark: "#641826", light: "#DDBFC3", soft: "#F5ECEA" },
        champagne: { DEFAULT: "#C6A664", light: "#E3D3AC" },
        ivory: { DEFAULT: "#F9F9F7", dark: "#EFEDE6" },
        stone: "#F3F0EA",
        // Bandas de color intenso (club, menú móvil, popups): burdeos profundo.
        night: { DEFAULT: "#4E1420", soft: "#5E1A28", line: "#6E2A37" },
        ink: { DEFAULT: "#141413", soft: "#4D4B46", muted: "#7C7972" },
        line: "#E2DFD6",
      },
      fontFamily: {
        display: ['"Inter Variable"', "system-ui", "sans-serif"],
        sans: ['"Inter Variable"', "system-ui", "sans-serif"],
      },
      letterSpacing: { luxe: "0.28em" },
      boxShadow: {
        soft: "0 20px 60px -30px rgba(20,20,19,0.25)",
      },
      keyframes: {
        "slide-in": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        rise: { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
      },
      animation: {
        "slide-in": "slide-in .45s cubic-bezier(.2,.8,.2,1)",
        "fade-in": "fade-in .3s ease-out",
        rise: "rise .6s cubic-bezier(.2,.8,.2,1) both",
        float: "float 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
