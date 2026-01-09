/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
        }
      }
    },
  },
  plugins: [],
}