import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Engine } from '../ecs/engine.js';

export async function loadSystems(engine: Engine, systemsDir: string): Promise<void> {
  const files = readdirSync(systemsDir).filter(
    (f) => (f.endsWith('.ts') || f.endsWith('.js')) && f !== 'loader.ts' && f !== 'loader.js',
  );

  for (const file of files) {
    const mod = await import(resolve(systemsDir, file));
    if (mod.default && typeof mod.default === 'function') {
      const system = mod.default(engine);
      await engine.registerSystem(system);
    }
  }
}
