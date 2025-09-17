// tailwind.config.js
export default {
  content: ["./index.html", "./**/*.php", "./js/**/*.js"],
  theme: { extend: {} },
  safelist: ['splash', 'splash--intro', 'splash--outro', 'splash--hidden', 'splash__logo'],
  plugins: [require("daisyui")],
  daisyui: {
    themes: ['corporate','garden','bumblebee','light','emerald','forest','dark', { gsc: {} }],
  },
};
