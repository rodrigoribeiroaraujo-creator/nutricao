/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f7ee',
          100: '#d9edcf',
          200: '#b0d89a',
          300: '#80be5e',
          400: '#5aa333',
          500: '#3d7a1e',
          600: '#2d5e14',
          700: '#1f430d',
          800: '#142d08',
          900: '#0b1a04',
        },
      },
    },
  },
  plugins: [],
}
