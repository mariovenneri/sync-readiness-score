/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
      sans: ['-apple-system', 'BlinkMacOSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
    },
      colors: {
        purple: {
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
        }
      },
      animation: {
        fadeIn: 'fadeIn 1.5s ease-out forwards',
        fadeOut: 'fadeOut 1s ease-in forwards',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOut: {
          'from': { opacity: '1' },
          'to':   { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}