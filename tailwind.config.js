// Relative-color syntax so opacity modifiers (e.g. bg-muted/50, bg-primary/10)
// work on our CSS-variable tokens without converting them to channel triplets.
// `<alpha-value>` is substituted by Tailwind (1 for solid, 0.5 for /50, …).
const a = (v) => `rgb(from var(${v}) r g b / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Kept plain (not alpha-wrapped): none of these are ever used with a
        // Tailwind opacity modifier, so they don't need channel-resolvable form.
        border: "var(--border)",
        input: "var(--input)",
        "input-background": "var(--input-background)",
        ring: a("--ring"),
        background: a("--background"),
        foreground: a("--foreground"),
        primary: {
          DEFAULT: a("--primary"),
          foreground: a("--primary-foreground"),
        },
        secondary: {
          DEFAULT: a("--secondary"),
          foreground: a("--secondary-foreground"),
        },
        destructive: {
          DEFAULT: a("--destructive"),
          foreground: a("--destructive-foreground"),
        },
        muted: {
          DEFAULT: a("--muted"),
          foreground: a("--muted-foreground"),
        },
        accent: {
          DEFAULT: a("--accent"),
          foreground: a("--accent-foreground"),
        },
        popover: {
          DEFAULT: a("--popover"),
          foreground: a("--popover-foreground"),
        },
        card: {
          DEFAULT: a("--card"),
          foreground: a("--card-foreground"),
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
