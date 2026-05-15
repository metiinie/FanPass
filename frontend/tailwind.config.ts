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
        brand: {
          DEFAULT: "#1A7A4A",
          dark: "#080C0A",
          surface: "#101613",
          neon: "#22C55E",
          glow: "rgba(34, 197, 94, 0.4)",
        },
        success: "#22C55E",
        error: "#EF4444",
        surface: "#111827",
        bg: "#0A0F0D",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "sans-serif"],
        outfit: ["var(--font-outfit)", "sans-serif"],
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(34, 197, 94, 0.2)',
        'glow-md': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-brand': '0 4px 20px rgba(26, 122, 74, 0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scan: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
