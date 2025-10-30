/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          50: "#1a1a1f",
          100: "#1f1f26",
          200: "#25252e",
          300: "#2a2a35",
          400: "#2f2f3d",
          500: "#353544",
          600: "#3a3a4a",
          700: "#404051",
          800: "#454558",
          900: "#4b4b5f",
        },
        gray: {
          50: "#0f0f13",
          100: "#15151a",
          200: "#1a1a1f",
          300: "#202025",
          400: "#25252a",
          500: "#2a2a30",
          600: "#303035",
          700: "#35353a",
          800: "#3a3a40",
          900: "#404045",
        },
        accent: {
          blue: "#4a90e2",
          purple: "#8b5cf6",
          cyan: "#06b6d4",
          emerald: "#10b981",
          green: "#34d399",
        },
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      fontFamily: {
        // You can add custom fonts here
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-dark": "linear-gradient(135deg, #1a1a1f 0%, #0f0f13 100%)",
        "gradient-card":
          "linear-gradient(135deg, rgba(26, 26, 31, 0.9) 0%, rgba(15, 15, 19, 0.95) 100%)",
        "gradient-accent": "linear-gradient(135deg, #06b6d4 0%, #10b981 100%)",
        "texture-overlay": "url(/texture-overlay.png)",
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};
