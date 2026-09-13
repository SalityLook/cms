import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  extends: ["../../themes/default"],
  modules: ["@nuxt/eslint"],
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()]
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? "http://localhost:3001"
    }
  }
});
