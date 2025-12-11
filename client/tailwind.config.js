/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        surfaceHighlight: 'rgb(var(--surface-highlight) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        textMuted: 'rgb(var(--text-muted) / <alpha-value>)',
        
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          glow: 'rgba(var(--primary), 0.5)'
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          glow: 'rgba(var(--accent), 0.5)'
        },
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          glow: 'rgba(var(--success), 0.5)'
        },
        danger: {
          DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
          glow: 'rgba(var(--danger), 0.5)'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
