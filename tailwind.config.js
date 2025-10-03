/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        space: {
          900: '#0a0a1e',
          800: '#1a1a3e',
          700: '#2a2a5e',
          600: '#3a3a7e',
          500: '#4a4a9e',
        },
        neon: {
          green: '#00ff88',
          blue: '#00ccff',
          gold: '#ffd700',
          purple: '#8b5cf6',
          orange: '#ff9500',
          red: '#ff6b6b',
        }
      },
      backgroundImage: {
        'gradient-space': 'linear-gradient(135deg, #0a0a1e 0%, #1a1a3e 100%)',
        'gradient-neon': 'linear-gradient(45deg, #00ff88, #00ccff)',
        'gradient-gold': 'linear-gradient(45deg, #ffd700, #ff9500)',
        'gradient-purple': 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 255, 136, 0.6)' },
        },
        shimmer: {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
        twinkle: {
          '0%': { opacity: '0.3' },
          '100%': { opacity: '0.8' },
        },
      },
      fontFamily: {
        'space': ['Orbitron', 'monospace'],
        'game': ['Exo 2', 'sans-serif'],
      }
    },
  },
  plugins: [],
}