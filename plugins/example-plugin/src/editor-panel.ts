// TS's `declare module "*.vue"` wildcard shim only matches import specifiers
// that literally end in ".vue" — it never sees through a package.json subpath
// export like "@selftaught/example-plugin/editor-panel" down to the .vue file
// it resolves to. Re-exporting through this .ts file (which DOES literally
// import "./EditorPanel.vue", matching the shim inside this package's own
// compilation) is the standard workaround — matches how packages/blocks/src/
// index.ts re-exports BlockRenderer.vue the same way.
export { default } from "./EditorPanel.vue";
