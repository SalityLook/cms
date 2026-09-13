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

  registerEditorPanel(contentType: string, component: Component) {
    const list = this.editorPanels.get(contentType) ?? [];
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
