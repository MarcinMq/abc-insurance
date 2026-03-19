/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        card: '#161617',
        cardhover: '#1c1c1e',
        primary: '#0a84ff',
        textmain: '#f5f5f7',
        textmuted: '#86868b',
        border: 'rgba(255, 255, 255, 0.06)'
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

