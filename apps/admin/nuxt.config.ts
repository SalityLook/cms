// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/ui", "nuxt-auth-utils"],
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    session: {
      password: process.env.NUXT_SESSION_PASSWORD
    }
  }
});
