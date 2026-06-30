import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#07070B",
        surface: "#111C20",
        surface2: "#16151F",
        line: "#1B1B26",
        ink: "#ECECF2",
        muted: "#8A8AA0",
        violet: "#9C8BFF",
        teal: "#54E0CE",
        pink: "#FF5FA8",
        "risk-low": "#7DE9CE",
        "risk-mid": "#E6C27E",
        "risk-high": "#FF7A8A",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: { wrap: "1120px" },
    },
  },
  plugins: [],
};

export default config;
