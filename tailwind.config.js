/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        body: ["Work Sans", "sans-serif"],
      },
      colors: {
        primary: "#00C853",
        "primary-dark": "#009624",
        "primary-light": "#69F0AE",
        "primary-container": "#ccf5dc",
        "on-primary": "#ffffff",
        background: "#f7f9f7",
        surface: "#f7f9f7",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f0f5f0",
        "surface-container": "#e8f0e8",
        "surface-container-high": "#ddeadd",
        "surface-container-highest": "#d0e4d0",
        "on-surface": "#0a0a0a",
        "on-surface-variant": "#3d4f3d",
        "outline-variant": "#b0ccb0",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#410002",
        scrim: "#000000",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "2rem",
      },
    },
  },
  plugins: [],
};
