/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans Arabic"', 'Changa', 'sans-serif'],
        heading: ['"Noto Naskh Arabic"', '"Noto Sans Arabic"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
