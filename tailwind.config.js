/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts}"],
  theme: {
    extend: {
      colors: {
        theme: {
          primary: "var(--theme-primary)",
          surface: "var(--theme-surface)",
          text: "var(--theme-text)",
        },
      },
    },
  },
  plugins: [],
};
