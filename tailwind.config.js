/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        neon: {
          cyan: '#00f2fe',
          blue: '#4facfe',
          purple: '#b827fc',
          pink: '#f107a3',
          emerald: '#10b981',
          amber: '#f59e0b',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        receipt: ['"Courier New"', 'Courier', 'monospace'],
      },
      animation: {
        'receipt-roll': 'receiptRoll 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scanline': 'scanline 4s linear infinite',
        'reticle': 'spinSlow 12s linear infinite',
      },
      keyframes: {
        receiptRoll: {
          '0%': { transform: 'translateY(-100%) scaleY(0.2)', opacity: '0' },
          '60%': { transform: 'translateY(10px) scaleY(1.02)', opacity: '1' },
          '100%': { transform: 'translateY(0) scaleY(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
