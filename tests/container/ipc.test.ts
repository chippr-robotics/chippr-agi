import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { IPC } from '../../src/container/ipc.js';

describe('IPC', () => {
  let ipcDir: string;

  beforeEach(() => {
    ipcDir = join(tmpdir(), `chippr-test-ipc-${Date.now()}`);
  });

  afterEach(() => {
    if (existsSync(ipcDir)) {
      rmSync(ipcDir, { recursive: true, force: true });
    }
  });

  it('creates IPC directory if not exists', () => {
    expect(existsSync(ipcDir)).toBe(false);
    new IPC(ipcDir);
    expect(existsSync(ipcDir)).toBe(true);
  });

  it('writes and reads request files', () => {
    const ipc = new IPC(ipcDir);
    ipc.sendRequest('req-1', { action: 'run', args: ['hello'] });

    const data = ipc.readRequest('req-1');
    expect(data).toEqual({ action: 'run', args: ['hello'] });
  });

  it('writes and reads response files', () => {
    const ipc = new IPC(ipcDir);
    ipc.writeResponse('resp-1', { status: 'ok', result: 42 });

    const data = ipc.readResponse('resp-1');
    expect(data).toEqual({ status: 'ok', result: 42 });
  });

  it('returns null for missing response', () => {
    const ipc = new IPC(ipcDir);
    expect(ipc.readResponse('nonexistent')).toBeNull();
  });

  it('returns null for missing request', () => {
    const ipc = new IPC(ipcDir);
    expect(ipc.readRequest('nonexistent')).toBeNull();
  });

  it('round-trips complex JSON data', () => {
    const ipc = new IPC(ipcDir);
    const complex = {
      nested: { deeply: { value: [1, 2, 3] } },
      unicode: '日本語',
      special: 'hello\nworld\ttab',
    };
    ipc.sendRequest('complex', complex);
    expect(ipc.readRequest('complex')).toEqual(complex);
  });
});
