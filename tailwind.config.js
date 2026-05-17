/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0b',
        surface: '#141416',
        border: '#26262a',
        text: '#e6e6e6',
        muted: '#8a8a92',
        primary: '#facc15',
        accent: '#22d3ee'
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
}
