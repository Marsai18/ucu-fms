/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'ucu': '0 4px 14px -2px rgba(0, 102, 204, 0.2), 0 8px 24px -4px rgba(0, 64, 128, 0.15)',
        'ucu-lg': '0 10px 40px -10px rgba(0, 102, 204, 0.25), 0 20px 50px -15px rgba(0, 64, 128, 0.2)',
        'ucu-glow': '0 0 30px -5px rgba(0, 102, 204, 0.35)',
        'gold': '0 4px 14px -2px rgba(212, 175, 55, 0.25), 0 8px 24px -4px rgba(184, 148, 31, 0.15)',
        'gold-glow': '0 0 30px -5px rgba(212, 175, 55, 0.3)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'mesh-gradient': 'radial-gradient(ellipse 80% 50% at 20% 10%, rgba(0, 102, 204, 0.12) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 90% 5%, rgba(212, 175, 55, 0.08) 0%, transparent 50%), radial-gradient(ellipse 50% 30% at 50% 90%, rgba(0, 102, 204, 0.06) 0%, transparent 50%)',
        'mesh-dark': 'radial-gradient(ellipse 80% 50% at 20% 10%, rgba(0, 102, 204, 0.15) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 90% 5%, rgba(212, 175, 55, 0.1) 0%, transparent 50%), radial-gradient(ellipse 50% 30% at 50% 90%, rgba(0, 102, 204, 0.08) 0%, transparent 50%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(135deg, rgba(0, 102, 204, 0.03) 25%, transparent 25%), linear-gradient(225deg, rgba(212, 175, 55, 0.03) 25%, transparent 25%), linear-gradient(45deg, rgba(0, 102, 204, 0.03) 25%, transparent 25%), linear-gradient(315deg, rgba(212, 175, 55, 0.03) 25%, transparent 25%)',
        'ucu-gradient': 'linear-gradient(135deg, #0066cc 0%, #004080 100%)',
        'ucu-gradient-gold': 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
        'ucu-gradient-soft': 'linear-gradient(135deg, rgba(0, 102, 204, 0.06) 0%, rgba(212, 175, 55, 0.04) 100%)',
        'ucu-gradient-vivid': 'linear-gradient(135deg, #0066cc 0%, #004080 50%, #d4af37 100%)',
      },
      colors: {
        // Semantic design system
        fms: {
          primary: '#2563EB',
          secondary: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          bg: '#F8FAFC',
          'bg-dark': '#0F172A',
          surface: '#1E293B',
        },
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
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

