/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // UCU Brand Colors - Blue (Primary)
        ucu: {
          blue: {
            50: '#e6f2ff',
            100: '#b3d9ff',
            200: '#80bfff',
            300: '#4da6ff',
            400: '#1a8cff',
            500: '#0066cc', // Primary UCU Blue
            600: '#0052a3',
            700: '#003d7a',
            800: '#002952',
            900: '#001429',
          },
          gold: {
            50: '#fff9e6',
            100: '#ffedb3',
            200: '#ffe180',
            300: '#ffd54d',
            400: '#ffc91a',
            500: '#d4af37', // UCU Gold
            600: '#b8941f',
            700: '#9c7907',
            800: '#805e00',
            900: '#644300',
          },
          // Secondary colors
          navy: '#003366',
          royal: '#004080',
          cream: '#f5f5dc',
        },
        primary: {
          50: '#e6f2ff',
          100: '#b3d9ff',
          200: '#80bfff',
          300: '#4da6ff',
          400: '#1a8cff',
          500: '#0066cc',
          600: '#0052a3',
          700: '#003d7a',
          800: '#002952',
          900: '#001429',
        },
        accent: {
          50: '#fff9e6',
          100: '#ffedb3',
          200: '#ffe180',
          300: '#ffd54d',
          400: '#ffc91a',
          500: '#d4af37',
          600: '#b8941f',
          700: '#9c7907',
          800: '#805e00',
          900: '#644300',
        }
      },
      backgroundImage: {
        'ucu-gradient': 'linear-gradient(135deg, #0066cc 0%, #004080 100%)',
        'ucu-gradient-gold': 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
      }
    },
  },
  plugins: [],
}

