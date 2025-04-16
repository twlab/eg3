/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': '#5F6368',
        'secondary': '#E8DEF8',
        'tint': '#75697A',
        'alert': '#307868',
        dark: {
          'primary': '#FFFFFF',
          'secondary': '#39245B',
          'background': '#1c191f',
          'surface': '#333333',
          'tint': '#775CA2',
        }
      },
    },
  },
  plugins: [],
}
