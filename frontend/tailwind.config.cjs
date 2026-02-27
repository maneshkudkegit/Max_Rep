module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#b65c2d',
        accent: '#1f6f78',
        lime: '#5b7c3d',
      },
      boxShadow: {
        card: '0 12px 30px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
};
