/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Official colors extracted from the Inatel cas@viva logo
        brand: {
          orange: '#E87000',
          'orange-light': '#FF9A3D',
          blue: '#004898',
          'blue-light': '#5B9BF0',
        },
        // Investigation console surfaces: derived from the brand blue
        ink: {
          950: '#050D22',
          900: '#081631',
          850: '#0C1D3E',
          800: '#11264D',
          700: '#1B3563',
          600: '#29497F',
        },
        fg: {
          DEFAULT: '#EEF3FF',
          muted: '#AEBBD8',
          subtle: '#8394B8',
        },
        paper: {
          DEFAULT: '#F5F2EA',
          line: '#DDD6C6',
          ink: '#1B2233',
        },
        success: '#3DD68C',
        danger: '#FF7A7A',
        warning: '#FFC266',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 40px -24px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(232,112,0,0.4), 0 12px 32px -12px rgba(232,112,0,0.45)',
        paper: '0 24px 48px -24px rgba(0,0,0,0.7)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '60%': { opacity: '1', transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(232,112,0,0.55)' },
          '100%': { boxShadow: '0 0 0 12px rgba(232,112,0,0)' },
        },
        stamp: {
          '0%': { opacity: '0', transform: 'scale(1.6) rotate(-14deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(-8deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.3s ease-out both',
        shake: 'shake 0.4s ease-in-out',
        pop: 'pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
        stamp: 'stamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both',
      },
    },
  },
  plugins: [],
};
