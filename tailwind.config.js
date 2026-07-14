/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx"
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F172A',
        },
        emerald: {
          500: '#10B981',
        }
      },
    },
  },
  plugins: [],
}
