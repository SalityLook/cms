// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/ui", "nuxt-auth-utils", "@nuxt/eslint", "@nuxt/fonts"],
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      title: "SelfTaught CMS",
      link: [{ rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" }]
    }
  },
  fonts: {
    families: [{ name: "Inter", provider: "google", weights: [400, 500, 600, 700] }]
  },
  nitro: {
    experimental: { tasks: true },
    scheduledTasks: {
      "* * * * *": ["content:publish-scheduled"]
    }
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    session: {
      password: process.env.NUXT_SESSION_PASSWORD
    },
    public: {
      // Same var the frontend app reads (root .env) — used only for the
      // "Lihat situs" link in the admin layout, not for anything functional.
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? "http://localhost:3001"
    }
  }
});
