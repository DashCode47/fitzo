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
          DEFAULT: "#C5A356",
          light: "#D4B96A",
          dark: "#A8873E",
          bright: "#FFD700",
        },
        dark: {
          DEFAULT: "#000000",
          card: "#111111",
          surface: "#1A1A1A",
          border: "rgba(255,255,255,0.08)",
        },
        flame: "#FF4500",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #C5A356 0%, #FFD700 50%, #A8873E 100%)",
        "dark-gradient": "linear-gradient(180deg, #000000 0%, #0d0d0d 50%, #000000 100%)",
        "hero-gradient": "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(197,163,86,0.25) 0%, transparent 70%)",
        "card-gradient": "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      },
      boxShadow: {
        gold: "0 0 30px rgba(197,163,86,0.3)",
        "gold-sm": "0 0 15px rgba(197,163,86,0.2)",
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
