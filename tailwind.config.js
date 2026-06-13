/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mint: {
          50:  '#f0fdf8',
          100: '#dcfcef',
          200: '#bbf7df',
          300: '#86efC4',
          400: '#4ade9e',
          500: '#22c77a',
          600: '#16a35f',
          700: '#15804d',
          800: '#166640',
          900: '#145436',
        },
        sage: {
          50:  '#f7f8fa',
          100: '#eef0f4',
          200: '#d8dde5',
          300: '#b0b9c6',
          400: '#828e9f',
          500: '#647082',
          600: '#4c5667',
          700: '#3a4251',
          800: '#232b3a',
          900: '#151b27',
          950: '#0b0e15',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'var(--font-pretendard)', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
