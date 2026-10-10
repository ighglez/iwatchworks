import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: "#C6A664", dark: "#A88A4A", light: "#E6D5AE", soft: "#F4EDDD" },
        ivory: { DEFAULT: "#F9F9F7", dark: "#F0EFEA" },
        ink: { DEFAULT: "#1A1A1A", soft: "#4A4A4A", muted: "#8A8A85" },
        line: "#E5E3DC",
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Inter Variable"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -15px rgba(26,26,26,0.15)",
      },
      keyframes: {
        "slide-in": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "rise": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        "slide-in": "slide-in .35s cubic-bezier(.2,.8,.2,1)",
        "fade-in": "fade-in .25s ease-out",
        rise: "rise .35s cubic-bezier(.2,.8,.2,1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
