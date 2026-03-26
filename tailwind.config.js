/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
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
          50:  '#f6f7f6',
          100: '#e3e7e3',
          200: '#c7d0c8',
          300: '#a0b0a2',
          400: '#748a77',
          500: '#576e5a',
          600: '#445748',
          700: '#37463a',
          800: '#2e3930',
          900: '#272f28',
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
