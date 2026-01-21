/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0A0A0A',
          lighter: '#1A1A1A',
          card: '#151515',
        },
        gold: {
          DEFAULT: '#FFD700',
          light: '#FFED4E',
          dark: '#D4AF37',
        },
        whatsapp: '#25D366',
      },
      fontFamily: {
        sans: ['Britanica', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['Britanica', 'Poppins', 'sans-serif'],
        britanica: ['Britanica', 'sans-serif'],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
      animation: {
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'cell-ripple': 'cell-ripple var(--duration, 200ms) ease-out forwards',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'cell-ripple': {
          '0%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
          '100%': { opacity: '0.4' },
        },
      },
      backgroundImage: {
        'radial-gold': 'radial-gradient(circle at center, rgba(255, 215, 0, 0.15) 0%, transparent 70%)',
        'glass-shine': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

