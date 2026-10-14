/** @type {import('tailwindcss').Config} */

// Colors that change with the surface are CSS variables (see src/styles/index.css):
// the same class reads well on the felt board and on a sheet of paper pinned to it.
const surface = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ['./public/index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Official colors of the Inatel cas@viva logo
        brand: {
          orange: '#E87000',
          // Orange for text: light on the board, darker on paper (AA on both)
          'orange-light': surface('accent'),
          blue: '#004898',
          'blue-light': surface('link'),
        },
        // The investigation board: blue felt, derived from the brand blue
        board: {
          DEFAULT: '#0B2F5E',
          deep: '#08213F',
          thread: '#E87000',
        },
        // Dark text for orange backgrounds (6:1)
        night: '#08213F',
        // Surfaces and lines, from the deepest to the lightest edge
        ink: {
          950: surface('ink-950'),
          900: surface('ink-900'),
          850: surface('ink-850'),
          800: surface('ink-800'),
          700: surface('ink-700'),
          600: surface('ink-600'),
        },
        fg: {
          DEFAULT: surface('fg'),
          muted: surface('fg-muted'),
          subtle: surface('fg-subtle'),
        },
        // Documents inside the challenges (dossier, case files, certificate)
        paper: {
          DEFAULT: '#F5F2EA',
          line: '#DDD6C6',
          ink: '#1B2233',
        },
        // Sticky note
        note: {
          DEFAULT: '#FFD9A8',
          ink: '#3B2A10',
        },
        success: surface('success'),
        danger: surface('danger'),
        warning: surface('warning'),
      },
      fontFamily: {
        // Wide, heavy grotesque: label-maker tape and titles
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['"Libre Franklin"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        // The investigator's handwriting, used sparingly
        hand: ['Kalam', 'cursive'],
      },
      // Paper and tape have barely rounded corners
      borderRadius: {
        lg: '3px',
        xl: '4px',
        '2xl': '4px',
        '3xl': '6px',
      },
      boxShadow: {
        // A sheet pinned to the board, lifted at the bottom
        card: '0 1px 1px rgba(0,0,0,0.12), 0 14px 22px -14px rgba(0,0,0,0.7)',
        paper: '0 1px 1px rgba(0,0,0,0.12), 0 18px 28px -16px rgba(0,0,0,0.75)',
        // Selection ring (no neon glow)
        glow: '0 0 0 3px #E87000',
        tape: '0 2px 0 rgba(0,0,0,0.18), 0 6px 10px -6px rgba(0,0,0,0.55)',
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
        stamp: {
          '0%': { opacity: '0', transform: 'scale(1.8) rotate(-14deg)' },
          '70%': { opacity: '1', transform: 'scale(0.96) rotate(-8deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(-8deg)' },
        },
        // The thread being pulled taut between two pins
        thread: {
          from: { strokeDashoffset: 'var(--thread-length, 600)' },
          to: { strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.3s ease-out both',
        shake: 'shake 0.4s ease-in-out',
        pop: 'pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        stamp: 'stamp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s both',
        thread: 'thread 0.9s cubic-bezier(0.65, 0, 0.35, 1) both',
      },
    },
  },
  plugins: [],
};
