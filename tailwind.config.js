/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Stone brand
        brand: {
          DEFAULT: '#00D26A',
          hover:   '#00B85B',
          dark:    '#003F1F',
          deep:    '#0D3125',
          soft:    '#C2EAC9',
          tint:    'rgba(0,210,106,0.10)',
        },
        // Surfaces / borders / ink
        ink:        '#0A0E0C',
        muted:      '#5B6B66',
        subtle:     '#97A3A0',
        line:       'rgba(15,23,23,0.08)',
        'line-strong': 'rgba(15,23,23,0.14)',
        // Kanban columns (kept)
        'col-waiting': '#F59E0B',
        'col-coord':   '#3B82F6',
        'col-gestor':  '#8B5CF6',
        'col-diretor': '#EF4444',
        'col-done':    '#10B981',
        'col-canceled':'#6B7280',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,23,0.04), 0 1px 1px rgba(15,23,23,0.02)',
        card: '0 1px 3px rgba(15,23,23,0.05), 0 1px 2px rgba(15,23,23,0.03)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
