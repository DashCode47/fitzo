import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#7B2FF7",
          light: "#A855F7",
          dark: "#5B1FCF",
          bright: "#A855F7",
        },
        dark: {
          DEFAULT: "#050505",
          card: "#111111",
          surface: "#1A1A1A",
          border: "rgba(255,255,255,0.08)",
        },
        flame: "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #7B2FF7 0%, #A855F7 100%)",
        "dark-gradient": "linear-gradient(180deg, #050505 0%, #0d0d0d 50%, #050505 100%)",
        "hero-gradient": "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(123,47,247,0.25) 0%, transparent 70%)",
        "card-gradient": "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      },
      boxShadow: {
        gold: "0 0 30px rgba(123,47,247,0.35)",
        "gold-sm": "0 0 15px rgba(123,47,247,0.25)",
        glass: "0 8px 32px rgba(0,0,0,0.6)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.8s ease-out forwards",
        float: "float 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
