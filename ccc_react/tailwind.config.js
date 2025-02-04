/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#ffffff",
          dark: "#1a1a1a",
        },
        secondary: {
          light: "#f3f4f6",
          dark: "#2d2d2d",
        },
        text: {
          light: "#111827",
          dark: "#e5e7eb",
        },
        accent: {
          light: "#3b82f6",
          dark: "#60a5fa",
        },
      },
    },
  },
  plugins: [],
};
