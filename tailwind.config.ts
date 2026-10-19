import type { Config } from "tailwindcss";

// Tokens from DESIGN.md (Caldera)
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ember: "#fc5000",
        plasma: "#524ae9",
        sulfur: "#f5f28e",
        limestone: "#f7f6f2",
        pumice: "#e2e2df",
        obsidian: "#070607",
        chalk: "#ffffff",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "40px",
      },
      maxWidth: {
        page: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
