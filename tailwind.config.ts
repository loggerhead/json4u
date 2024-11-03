import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  safelist: [
    "hidden",
    "invisible",
    "text-hl-key",
    "text-hl-string",
    "text-hl-number",
    "text-hl-boolean",
    "text-hl-null",
    "text-hl-empty",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      spacing: {
        "page-header": "var(--max-header-width)",
        search: "var(--search-width)",
        "search-h": "var(--search-height)",
        header: "var(--container-height)",
        statusbar: "var(--statusbar-height)",
        "max-key": "var(--max-key-length)",
      },
      backgroundColor: {
        "hl-key": "var(--bg-key)",
        "btn-active": "var(--btn-bg-active)",
      },
      colors: {
        "hl-key": "var(--hl-key)",
        "hl-string": "var(--hl-string)",
        "hl-number": "var(--hl-number)",
        "hl-boolean": "var(--hl-null)",
        "hl-null": "var(--hl-null)",
        "hl-empty": "var(--hl-empty)",
        "hl-index": "var(--hl-index)",
        "btn-input": "var(--btn-input)",
        error: "var(--parse-error)",
        "error-foreground": "var(--parse-error-foreground)",
        btn: "var(--btn-text-color)",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        search: "0 0 0 1px hsla(0, 0%, 0%, 0.1),0 4px 11px hsla(0, 0%, 0%, 0.1)",
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
  plugins: [
    require("tailwindcss-animate"),
    require("tailwind-scrollbar")({ nocompatible: true, preferredStrategy: "pseudoelements" }),
  ],
} satisfies Config;

export default config;
