// $fetch is injected globally by Nitro/ofetch at runtime inside any Nuxt app
// that bundles this component — this ambient declaration only exists so this
// package's own standalone `vue-tsc --noEmit` has something to check against.
declare const $fetch: <T = unknown>(url: string, opts?: Record<string, unknown>) => Promise<T>;

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}
