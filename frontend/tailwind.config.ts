import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        agt: {
          bg:      '#0d0f12',
          surface: '#16181c',
          element: '#1e2126',
          border:  '#2a2d35',
          text:    '#ccd0d5',
          muted:   '#6e6f72',
          blue:    '#4a9eca',
          green:   '#92d22e',
          red:     '#ca4a4a',
          pink:    '#ca4a72',
          orange:  '#FF9900',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      }
    }
  },
  plugins: []
} satisfies Config
