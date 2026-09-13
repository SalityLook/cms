/**
 * WordPress add_action/add_filter equivalent, typed via a module-augmentable
 * ActionMap. Core declares its own hook names below; a plugin can add more
 * without touching core by declaration-merging into this same interface:
 *
 *   declare module "@selftaught/core/server" {
 *     interface ActionMap {
 *       "my-plugin:something": { foo: string };
 *     }
 *   }
 */
export interface ActionMap {
  "content:beforeSave": { contentId: string; type: string; title: string };
  "content:statusChanged": { contentId: string; type: string; from: string; to: string };
  "content:published": { content: { id: string; type: string; slug: string; title: string } };
  "user:registered": { userId: string; email: string };
}

type ActionHandler<P> = (payload: P) => void | Promise<void>;
type FilterHandler<T> = (value: T, ctx?: unknown) => T | Promise<T>;

export class HookBus {
  private readonly actionHandlers = new Map<string, Set<ActionHandler<never>>>();
  private readonly filterHandlers = new Map<string, FilterHandler<never>[]>();

  onAction<K extends keyof ActionMap>(name: K, handler: ActionHandler<ActionMap[K]>): void {
    const key = name as string;
    const set = this.actionHandlers.get(key) ?? new Set();
    set.add(handler as ActionHandler<never>);
    this.actionHandlers.set(key, set);
  }

  async emitAction<K extends keyof ActionMap>(name: K, payload: ActionMap[K]): Promise<void> {
    const handlers = this.actionHandlers.get(name as string);
    if (!handlers) {
      return;
    }
    for (const handler of handlers) {
      await handler(payload as never);
    }
  }

  onFilter<T>(name: string, handler: FilterHandler<T>): void {
    const list = this.filterHandlers.get(name) ?? [];
    list.push(handler as unknown as FilterHandler<never>);
    this.filterHandlers.set(name, list);
  }

  async applyFilter<T>(name: string, value: T, ctx?: unknown): Promise<T> {
    const handlers = this.filterHandlers.get(name) ?? [];
    let result = value;
    for (const handler of handlers) {
      result = await (handler as unknown as FilterHandler<T>)(result, ctx);
    }
    return result;
  }
}

export const hooks = new HookBus();
