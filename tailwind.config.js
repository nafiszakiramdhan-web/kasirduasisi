/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pos: {
          bg: '#121212',
          surface: '#1e1e1e',
          card: '#27272a',
          border: '#333338',
          accent: '#f59e0b',
          'accent-hover': '#d97706',
          success: '#10b981',
          'success-dark': '#059669',
          danger: '#ef4444',
          'danger-dark': '#dc2626',
          muted: '#9ca3af',
          subtle: '#71717a'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'pos-card': '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
        'pos-glow': '0 0 15px rgba(245, 158, 11, 0.25)',
        'pos-danger-glow': '0 0 15px rgba(239, 68, 68, 0.25)',
        'pos-success-glow': '0 0 15px rgba(16, 185, 129, 0.25)',
      }
    },
  },
  plugins: [],
}
