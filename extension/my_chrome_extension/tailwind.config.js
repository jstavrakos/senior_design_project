module.exports = {
  jit: true,
  purge: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        'primary': '#FF6363',
        'secondary': {
          100: '#E2E2D5',
          200: '#888883',
        }
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
