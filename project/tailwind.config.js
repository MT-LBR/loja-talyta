/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#090909',
          soft: '#151515',
          muted: '#202020',
        },
        pearl: {
          DEFAULT: '#F8F7F4',
          pure: '#FFFFFF',
          warm: '#F2EFEA',
        },
        stone: {
          DEFAULT: '#8D8A86',
          light: '#E8E6E2',
          border: '#D8D5D0',
        },
        nude: {
          DEFAULT: '#C9B8A7',
          light: '#E8DDD3',
          deep: '#A89485',
        },
        sand: '#EDE7DE',
        clay: '#B8A28E',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(2.5rem, 6vw, 5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'hero': ['clamp(2rem, 5vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-up': 'fadeUp 0.7s ease-out forwards',
        'fade-up-slow': 'fadeUp 1s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'slide-in': 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 1.6s infinite linear',
        'marquee': 'marquee 30s linear infinite',
        'reveal': 'reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        slideIn: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        reveal: { '0%': { opacity: '0', transform: 'scale(1.05) translateY(20px)' }, '100%': { opacity: '1', transform: 'scale(1) translateY(0)' } },
      },
      boxShadow: {
        'soft': '0 4px 24px -8px rgba(9,9,9,0.08)',
        'card': '0 8px 40px -12px rgba(9,9,9,0.12)',
        'lift': '0 16px 48px -16px rgba(9,9,9,0.18)',
        'editorial': '0 24px 60px -20px rgba(9,9,9,0.25)',
      },
      transitionTimingFunction: {
        'editorial': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
