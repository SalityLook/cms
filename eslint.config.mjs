import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.nuxt/**",
      "**/.output/**",
      "**/node_modules/**",
      "**/drizzle/**",
      "apps/**"
    ]
  },
  tseslint.configs.recommended
);
