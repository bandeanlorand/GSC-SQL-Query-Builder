/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    daisyui: { themes: ['corporate','garden','bumblebee','light','emerald','forest','dark', { gsc: {/* tokens */} }] }
  },
}
// tailwind.config.js
