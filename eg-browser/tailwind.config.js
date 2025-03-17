/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#5F6368',
        'secondary': '#E8DEF8',
        'tint': '#75697A',
        'alert': '#307868'
      },
    },
  },
  plugins: [],
}
