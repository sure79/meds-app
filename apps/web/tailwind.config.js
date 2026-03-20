/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a1628',
          800: '#0d1f35',
          700: '#112a45',
          600: '#1e3a5f',
          500: '#2a4a7f',
        },
        accent: {
          DEFAULT: '#4fc3f7',
          hover: '#29b6f6',
        },
        success: '#4caf50',
        warning: '#ffd54f',
        danger: '#f44336',
        emergency: '#ff6b35',
        motor: '#ce93d8',
        transformer: '#ffb74d',
      },
    },
  },
  plugins: [],
}
