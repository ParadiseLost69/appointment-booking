/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0b0b0b',
        surface: '#131313',
        'surface-2': '#1a1a1a',
        border: '#242424',
        faint: '#1e1e1e',
        ivory: '#f0ebe1',
        muted: '#58534c',
        gold: '#c9a55e',
        'gold-light': '#d4b572',
        'gold-dim': '#c9a55e1a',
      },
      fontFamily: {
        cormorant: ['var(--font-cormorant)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
