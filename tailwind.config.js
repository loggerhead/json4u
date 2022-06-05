module.exports = {
  mode: "jit",
  content: ["./public/**/*.html", "./src/**/*.{astro,js,jsx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      height: {
        editor: "calc(100vh - 6rem)",
        editor_full: "calc(100vh - 3.5rem)",
      },
    },
  },
  plugins: [require("daisyui"), require("@tailwindcss/typography")],
  daisyui: {
    themes: ["emerald"],
  },
};
