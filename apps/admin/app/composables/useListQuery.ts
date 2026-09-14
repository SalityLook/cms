/**
 * Shared search + status filter + page state for admin list pages, synced
 * to the URL query string (so links/back-button/refresh all work), plus
 * row-selection state for bulk actions. Search is debounced and resets
 * page back to 1 on change (a fresh search from page 3 should not silently
 * stay on page 3 of the new result set).
 */
export function useListQuery(debounceMs = 400) {
  const route = useRoute();
  const router = useRouter();

  const search = ref(typeof route.query.search === "string" ? route.query.search : "");
  const status = ref(typeof route.query.status === "string" ? route.query.status : "");
  const page = ref(Number(route.query.page) > 0 ? Number(route.query.page) : 1);
  const selectedIds = ref<Set<string>>(new Set());

  function syncQuery() {
    router.replace({
      query: {
        ...route.query,
        search: search.value || undefined,
        status: status.value || undefined,
        page: page.value > 1 ? String(page.value) : undefined
      }
    });
  }

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  watch(search, () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      page.value = 1;
      syncQuery();
    }, debounceMs);
  });

  watch(status, () => {
    page.value = 1;
    syncQuery();
  });

  watch(page, () => {
    selectedIds.value = new Set();
    syncQuery();
  });

  function clearSelection() {
    selectedIds.value = new Set();
  }

  // Row-select/select-all toggling lives in AdminDataTable.vue itself
  // (it emits the full next Set) -- this composable only owns the
  // search/status/page/selection STATE, not the toggle logic.
  return { search, status, page, selectedIds, clearSelection };
}
