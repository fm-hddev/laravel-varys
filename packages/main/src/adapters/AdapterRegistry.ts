import type { DataSourceAdapter, HealthReport, ProjectContext, Unsubscribe } from '@varys/core';

const PROBE_TIMEOUT_MS = 2000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Probe timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export class AdapterRegistry {
  private readonly adapters: Map<string, DataSourceAdapter> = new Map();
  private readonly unsubscribes: Unsubscribe[] = [];

  register(adapter: DataSourceAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  getAll(): DataSourceAdapter[] {
    return Array.from(this.adapters.values());
  }

  getById(id: string): DataSourceAdapter | undefined {
    return this.adapters.get(id);
  }

  async probeAll(_ctx: ProjectContext): Promise<HealthReport> {
    const adapters = this.getAll();
    const results = await Promise.allSettled(
      adapters.map(async (adapter) => {
        const result = await withTimeout(adapter.probe(), PROBE_TIMEOUT_MS);
        return { id: adapter.id, name: adapter.name, result };
      }),
    );

    const adapterResults = results.map((settled, i) => {
      const adapter = adapters[i];
      if (settled.status === 'fulfilled') {
        return settled.value;
      }
      const reason =
        settled.reason instanceof Error ? settled.reason.message : String(settled.reason);
      return {
        id: adapter?.id ?? 'unknown',
        name: adapter?.name ?? 'unknown',
        result: { available: false as const, reason },
      };
    });

    return { adapters: adapterResults, probedAt: new Date() };
  }

  addUnsubscribe(unsub: Unsubscribe): void {
    this.unsubscribes.push(unsub);
  }

  async teardown(): Promise<void> {
    for (const unsub of this.unsubscribes) {
      try {
        await unsub();
      } catch {
        // ignore teardown errors
      }
    }
    this.unsubscribes.length = 0;
  }
}
