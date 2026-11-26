/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#245C45",
          secondary: "#DCEBDD",
          accent: "#F2A65A",
          border: "#E3E9E1",
        },
        fitness: {
          primary: "#D97736",
          dark: "#F2A65A",
          softLight: "#FDF0E6",
          softDark: "#38281C",
        },
        canvas: {
          light: "#F8FAF5",
          dark: "#141A16",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#1F2822",
        },
        selected: {
          light: "#DCEBDD",
          dark: "#2E3D33",
        },
        ink: {
          light: "#1C241E",
          dark: "#F4F7F1",
        },
        muted: {
          light: "#626E65",
          dark: "#A6B3AA",
        },
        danger: {
          light: "#B93E34",
          dark: "#F4B1A8",
        },
      },
    },
  },
  plugins: [],
};
