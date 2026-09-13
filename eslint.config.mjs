import nuxt from "@nuxt/eslint-config/flat";

export default [
  ...nuxt(),
  {
    ignores: [
      "**/dist/**",
      "**/.nuxt/**",
      "**/.output/**",
      "**/node_modules/**",
      "**/drizzle/**"
    ]
  }
];
