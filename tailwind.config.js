/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ldg: {
          bg:           'var(--ldg-bg)',
          surface:      'var(--ldg-surface)',
          'surface-alt':'var(--ldg-surface-alt)',
          sunken:       'var(--ldg-sunken)',
          line:         'var(--ldg-line)',
          'line-soft':  'var(--ldg-line-soft)',
          ink:          'var(--ldg-ink)',
          'ink-soft':   'var(--ldg-ink-soft)',
          muted:        'var(--ldg-muted)',
          'muted-soft': 'var(--ldg-muted-soft)',
          accent:       'var(--ldg-accent)',
          'accent-soft':'var(--ldg-accent-soft)',
          success:      'var(--ldg-success)',
          'success-soft':'var(--ldg-success-soft)',
          danger:       'var(--ldg-danger)',
          'on-ink':     'var(--ldg-on-ink)',
          'on-ink-soft':'var(--ldg-on-ink-soft)',
        },
      },
    },
  },
  plugins: [],
}
