/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: 'rgb(var(--color-cream) / <alpha-value>)',
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        lime: '#D8F36B',
        brand: {
          50: '#F1F8F2',
          100: '#DCF0E2',
          200: '#BCE3C6',
          300: '#8DCE9F',
          400: '#57B176',
          500: '#348F57',
          600: '#247345',
          700: '#1E5B39',
          800: '#1A4930',
          900: '#163C29',
          950: '#0B2117',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 33, 26, 0.04), 0 12px 32px -20px rgba(20, 33, 26, 0.28)',
        float: '0 24px 60px -30px rgba(11, 33, 23, 0.55)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};
