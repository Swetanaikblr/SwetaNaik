/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        brand: 'rgb(var(--brand) / <alpha-value>)',
        'brand-soft': 'rgb(var(--brand-soft) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft) / <alpha-value>)',
        parent: 'rgb(var(--parent) / <alpha-value>)',
        'parent-soft': 'rgb(var(--parent-soft) / <alpha-value>)',
        note: 'rgb(var(--note) / <alpha-value>)',
        'note-soft': 'rgb(var(--note-soft) / <alpha-value>)',
        ai: 'rgb(var(--ai) / <alpha-value>)',
        'ai-soft': 'rgb(var(--ai-soft) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['ui-rounded', '"SF Pro Rounded"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '1.25rem' },
    },
  },
  plugins: [],
};
