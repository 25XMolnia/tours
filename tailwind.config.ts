import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#002D62",
        cobalt: "#0072DA",
        sky: "#99D3FF",
        pale: "#CFECFF",
        smart: "#FFDE00",
        ember: "#F66939",
        mist: "#F2F9FF",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-body)"],
      },
      boxShadow: {
        lift: "0 10px 30px -12px rgba(0, 45, 98, 0.25)",
        ticket: "0 18px 44px -18px rgba(0, 45, 98, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
