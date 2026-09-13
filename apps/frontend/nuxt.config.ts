// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  extends: ["../../themes/default"],
  modules: ["@nuxt/eslint"],
  routeRules: {
    "/blog/**": { swr: 60 },
    "/category/**": { swr: 60 },
    "/tag/**": { swr: 60 }
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? "http://localhost:3001"
    }
  }
});
