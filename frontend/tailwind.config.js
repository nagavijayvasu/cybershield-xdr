/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#090d16',
        darkCard: '#0f172a',
        darkBorder: '#1e293b',
        cyberGreen: '#10b981',
        cyberRed: '#ef4444',
      }
    },
  },
  plugins: [],
}
