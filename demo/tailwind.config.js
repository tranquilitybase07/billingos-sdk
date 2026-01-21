/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../src/**/*.{js,ts,jsx,tsx}', // Include SDK source
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
