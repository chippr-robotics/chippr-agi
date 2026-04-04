import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createTestEngine } from '../helpers.js';
import { loadSystems } from '../../src/systems/loader.js';
import type { Engine } from '../../src/ecs/engine.js';
import type { Store } from '../../src/store/db.js';

describe('loadSystems', () => {
  let engine: Engine;
  let store: Store;
  let systemsDir: string;

  beforeEach(() => {
    ({ engine, store } = createTestEngine());
    systemsDir = join(tmpdir(), `chippr-test-systems-${Date.now()}`);
    mkdirSync(systemsDir, { recursive: true });
  });

  afterEach(() => {
    store.close();
    rmSync(systemsDir, { recursive: true, force: true });
  });

  it('loads and registers system files from directory', async () => {
    writeFileSync(
      join(systemsDir, 'test-system.js'),
      `export default function(engine) {
        return {
          name: 'TestSystem',
          version: '1.0.0',
          type: 'system',
          description: 'A test system',
          init() {},
          async handleEvent() {},
        };
      }`,
    );

    await loadSystems(engine, systemsDir);
    expect(engine.getSystem('TestSystem')).toBeDefined();
  });

  it('skips loader.ts itself', async () => {
    writeFileSync(join(systemsDir, 'loader.ts'), 'export default function() {}');
    writeFileSync(join(systemsDir, 'loader.js'), 'export default function() {}');

    // Should not throw and should not register anything
    await loadSystems(engine, systemsDir);
    expect(engine.getSystems().size).toBe(0);
  });

  it('handles modules without default export', async () => {
    writeFileSync(
      join(systemsDir, 'no-default.js'),
      `export const foo = 'bar';`,
    );

    // Should not throw
    await loadSystems(engine, systemsDir);
    expect(engine.getSystems().size).toBe(0);
  });

  it('handles empty directory', async () => {
    await loadSystems(engine, systemsDir);
    expect(engine.getSystems().size).toBe(0);
  });
});
