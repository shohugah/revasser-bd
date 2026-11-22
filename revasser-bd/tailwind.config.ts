import type { Config } from "tailwindcss";

const colour = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/components/**/*.{ts,tsx}", "./src/app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: colour("accent"),
        "accent-hover": colour("accent-hover"),
        ink: colour("ink"),
        page: colour("page"),
        soft: colour("soft"),
        campaign: colour("campaign"),
        // Secondary text: 5.9:1 on ivory, 4.9:1 on beige.
        muted: "#5F5A53",
      },
      fontFamily: {
        serif: ["var(--font-heading)", "Didot", "Georgia", "serif"],
        sans: ["var(--font-body)", "Futura", "system-ui", "sans-serif"],
      },
      screens: { "3xl": "1800px" },
      transitionTimingFunction: { silk: "cubic-bezier(.22,.8,.24,1)" },
    },
  },
  plugins: [],
};
export default config;
