/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: '#09090b', // Zinc 950
        surface: '#18181b',    // Zinc 900
        surfaceHighlight: '#27272a', // Zinc 800
        border: '#27272a',
        
        primary: {
          DEFAULT: '#3b82f6', // Blue 500
          glow: 'rgba(59, 130, 246, 0.5)'
        },
        accent: {
          DEFAULT: '#f59e0b', // Amber 500
          glow: 'rgba(245, 158, 11, 0.5)'
        },
        success: {
          DEFAULT: '#10b981', // Emerald 500
          glow: 'rgba(16, 185, 129, 0.5)'
        },
        danger: {
          DEFAULT: '#ef4444', // Red 500
          glow: 'rgba(239, 68, 68, 0.5)'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

