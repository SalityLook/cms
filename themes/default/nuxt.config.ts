import { createResolver } from "@nuxt/kit";
import tailwindcss from "@tailwindcss/vite";

const { resolve } = createResolver(import.meta.url);

// Nuxt Layer — default/reference theme for the public frontend.
// apps/frontend consumes this via `extends: ['../../themes/default']`.
//
// CSS and the Tailwind Vite plugin are declared HERE (not in apps/frontend)
// so the theme owns its own styling end-to-end — a different theme could use
// a completely different CSS approach without touching apps/frontend at all.
// A plain `~/...` string here resolves against the CONSUMING app's srcDir,
// not this layer's own — createResolver(import.meta.url) is the documented
// way to reference a layer's own files from its own nuxt.config.ts.
export default defineNuxtConfig({
  modules: ["@nuxt/fonts"],
  css: [resolve("./app/assets/css/main.css")],
  fonts: {
    families: [
      { name: "Inter", provider: "google", weights: [400, 500, 600, 700] },
      { name: "Lora", provider: "google", weights: [500, 600, 700] }
    ]
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
