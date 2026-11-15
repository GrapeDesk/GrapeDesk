const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  safelist: ['p-LOW', 'p-MEDIUM', 'p-HIGH', 'p-CRITICAL', 's-OPEN', 's-IN_PROGRESS', 's-WAITING', 's-RESOLVED', 's-CLOSED'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4800b7', dark: '#3a0095', 50: '#f3ecff', 100: '#efe6ff', 200: '#e6dcfb' },
        ink: '#1a1a1a',
        muted: '#6b6b7b',
        line: '#dcdce4',
        surface: '#f8f8fb',
        danger: '#b42318',
      },
      fontFamily: { sans: ['Poppins', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: '0 2px 10px rgba(30, 20, 70, .07)',
        pop: '0 10px 30px rgba(0, 0, 0, .2)',
        bar: '0 3px 14px rgba(30, 20, 70, .08)',
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => addVariant('hc', 'html.hc &')),
  ],
};
