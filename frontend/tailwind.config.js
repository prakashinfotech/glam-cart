/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        glamcart: {
          primary: '#ff5c8d',
          'primary-dark': '#d84373',
          'primary-light': '#ffacc5',
          'primary-pale': '#fff0f5',
          gold: '#c5a028',
          dark: '#1a1a1a',
          gray: '#666666',
          'light-gray': '#f5f5f5',
          border: '#e8e8e8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      });
    },
  ],
};
