import type { Component } from "vue";

export interface AdminMenuItem {
  label: string;
  to: string;
  capability?: string;
}

/**
 * UI-specific extension points for admin plugins — deliberately NOT part of
 * @selftaught/core (that package has no Vue/UI concerns at all). A plugin's
 * setup() runs server-side (see plugins.config.ts); its editor-panel
 * component gets registered separately here by app/plugins/load-plugins.ts,
 * which runs in the browser/SSR Vue app context where components actually
 * make sense.
 */
class AdminUIRegistryImpl {
  private readonly menuItems: AdminMenuItem[] = [];
  private readonly editorPanels = new Map<string, Component[]>();

  registerMenuItem(item: AdminMenuItem) {
    this.menuItems.push(item);
  }

  /**
   * Idempotent on purpose: this registry is a module-level singleton that
   * outlives any single request (it's populated by a Nuxt app plugin that
   * re-runs on every SSR render), so without a dedup check the SAME panel
   * component would get pushed again on every request a plugin stays
   * enabled for, rendering duplicated panels. This also means disabling a
   * plugin can't un-register an already-registered panel within the SAME
   * running process -- that's why the toggle needs an actual process
   * restart to take effect, matching the server-side hook/capability
   * toggle's own limitation (see Phase 21 CLAUDE.md notes).
   */
  registerEditorPanel(contentType: string, component: Component) {
    const list = this.editorPanels.get(contentType) ?? [];
    if (list.includes(component)) return;
    list.push(component);
    this.editorPanels.set(contentType, list);
  }

  getMenuItems(): AdminMenuItem[] {
    return this.menuItems;
  }

  getEditorPanels(contentType: string): Component[] {
    return this.editorPanels.get(contentType) ?? [];
  }
}

export const adminUIRegistry = new AdminUIRegistryImpl();
