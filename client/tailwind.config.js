/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        imposter: {
          dark: '#0f172a',
          card: '#1e293b',
          accent: '#ef4444',     // Crimson imposter red
          civilian: '#3b82f6',   // Cyan/Blue civilian
          gold: '#eab308',
          purple: '#8b5cf6'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-short': 'bounce 0.5s ease infinite',
      }
    },
  },
  plugins: [],
}
