/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C1917',
        paper: '#EFE8DB',
        cream: '#F5F0E5',
        rust: '#D4321C',
        sand: '#8B7355',
        umber: '#6B5E4A',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
