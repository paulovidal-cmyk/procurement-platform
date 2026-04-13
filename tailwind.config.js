/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'col-waiting': '#F59E0B',
        'col-coord': '#3B82F6',
        'col-gestor': '#8B5CF6',
        'col-diretor': '#EF4444',
        'col-done': '#10B981',
        'col-canceled': '#6B7280',
      },
    },
  },
  plugins: [],
}
