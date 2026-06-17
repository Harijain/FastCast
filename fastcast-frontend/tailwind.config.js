/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8F7F5",
        surface: "#FFFFFF",
        border: "#E8E6E1",
        accent: "#1D9E75",
        "accent-hover": "#178a64",
        "text-primary": "#1A1A1A",
        "text-secondary": "#6B6A67",
        "text-hint": "#A09E9A",
        "status-ready": "#1D9E75",
        "status-processing": "#BA7517",
        "status-failed": "#A32D2D",
        "status-uploaded": "#888780",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display",
               "Segoe UI", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
}