/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#245C45',
          secondary: '#DCEBDD',
          accent: '#F2A65A',
          border: '#E3E9E1',
        },
        canvas: {
          light: '#F8FAF5',
          dark: '#171D19',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#222B25',
        },
        selected: {
          light: '#DCEBDD',
          dark: '#314237',
        },
        ink: {
          light: '#202820',
          dark: '#F4F7F1',
        },
        muted: {
          light: '#68736B',
          dark: '#B4C0B7',
        },
      },
    },
  },
  plugins: [],
};
