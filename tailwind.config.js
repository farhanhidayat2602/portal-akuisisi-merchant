/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mandiri: {
          50:  '#E8F0FA',
          100: '#C5D8F3',
          200: '#9EBDEB',
          300: '#77A2E3',
          400: '#508FDE',
          500: '#0064B4',
          600: '#004F8E',
          700: '#003B79',
          800: '#002A57',
          900: '#001935',
          yellow: '#F5A623',
          'yellow-light': '#FFC84A',
          'yellow-dark': '#D4880A',
          green:  '#00A651',
          red:    '#E53935',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12)',
        'mandiri': '0 4px 20px rgba(0,59,121,0.2)',
      },
    },
  },
  plugins: [],
}
