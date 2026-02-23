import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'entel-orange': '#ff6b35',
        'entel-amber': '#f7931e',
        'entel-dark': '#0a0a0f',
        'entel-card': 'rgba(255, 255, 255, 0.03)',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
