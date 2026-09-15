// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  extends: ["../../themes/default"],
  modules: ["@nuxt/eslint", "nuxt-auth-utils"],
  routeRules: {
    "/blog/**": { swr: 60 },
    "/category/**": { swr: 60 },
    "/tag/**": { swr: 60 }
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Own cookie name (distinct from admin's default "nuxt-session") and own
    // password (NUXT_FRONTEND_SESSION_PASSWORD, not the admin's
    // NUXT_SESSION_PASSWORD) -- this session is deliberately NOT shared with
    // the admin app. Two Nitro processes with the same cookie name would
    // also collide in local dev, since browser cookies aren't port-scoped
    // (only admin/frontend's different subdomains save that in production).
    session: {
      name: "selftaught-frontend-session",
      password: process.env.NUXT_FRONTEND_SESSION_PASSWORD
    },
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? "http://localhost:3001"
    }
  }
});
