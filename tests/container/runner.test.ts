import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInContainer, type ContainerConfig } from '../../src/container/runner.js';
import { EventEmitter } from 'node:events';
import type { ChildProcess } from 'node:child_process';

vi.mock('node:child_process', () => {
  return {
    spawn: vi.fn(),
  };
});

import { spawn } from 'node:child_process';

function mockProcess(stdout = '', stderr = '', exitCode = 0): ChildProcess {
  const proc = new EventEmitter() as ChildProcess;
  const stdoutEmitter = new EventEmitter();
  const stderrEmitter = new EventEmitter();
  (proc as any).stdout = stdoutEmitter;
  (proc as any).stderr = stderrEmitter;

  // Schedule data emission and close
  setTimeout(() => {
    if (stdout) stdoutEmitter.emit('data', Buffer.from(stdout));
    if (stderr) stderrEmitter.emit('data', Buffer.from(stderr));
    proc.emit('close', exitCode);
  }, 0);

  return proc;
}

describe('runInContainer', () => {
  const baseConfig: ContainerConfig = {
    runtime: 'docker',
    image: 'test-image:latest',
    mountPaths: [],
  };

  beforeEach(() => {
    vi.mocked(spawn).mockReset();
  });

  it('spawns docker with correct args', async () => {
    vi.mocked(spawn).mockReturnValue(mockProcess('hello'));
    const result = await runInContainer(baseConfig, ['echo', 'hello']);

    expect(spawn).toHaveBeenCalledWith(
      'docker',
      ['run', '--rm', '--network', 'none', 'test-image:latest', 'echo', 'hello'],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    expect(result.stdout).toBe('hello');
    expect(result.exitCode).toBe(0);
  });

  it('spawns apple-container with container binary', async () => {
    vi.mocked(spawn).mockReturnValue(mockProcess());
    await runInContainer({ ...baseConfig, runtime: 'apple-container' }, ['ls']);

    expect(spawn).toHaveBeenCalledWith(
      'container',
      expect.any(Array),
      expect.any(Object),
    );
  });

  it('handles read-only and writable mounts', async () => {
    vi.mocked(spawn).mockReturnValue(mockProcess());
    await runInContainer(
      { ...baseConfig, mountPaths: ['/data'], writablePaths: ['/output'] },
      ['run'],
    );

    const args = vi.mocked(spawn).mock.calls[0][1];
    expect(args).toContain('-v');
    expect(args).toContain('/data:/data:ro');
    expect(args).toContain('/output:/output:rw');
  });

  it('passes environment variables', async () => {
    vi.mocked(spawn).mockReturnValue(mockProcess());
    await runInContainer(
      { ...baseConfig, env: { FOO: 'bar', BAZ: 'qux' } },
      ['test'],
    );

    const args = vi.mocked(spawn).mock.calls[0][1];
    expect(args).toContain('-e');
    expect(args).toContain('FOO=bar');
    expect(args).toContain('BAZ=qux');
  });

  it('returns stdout, stderr, exitCode', async () => {
    vi.mocked(spawn).mockReturnValue(mockProcess('out', 'err', 1));
    const result = await runInContainer(baseConfig, ['fail']);
    expect(result).toEqual({ stdout: 'out', stderr: 'err', exitCode: 1 });
  });

  it('rejects on spawn error', async () => {
    const proc = new EventEmitter() as ChildProcess;
    (proc as any).stdout = new EventEmitter();
    (proc as any).stderr = new EventEmitter();
    vi.mocked(spawn).mockReturnValue(proc);

    const promise = runInContainer(baseConfig, ['bad']);
    setTimeout(() => proc.emit('error', new Error('spawn ENOENT')), 0);

    await expect(promise).rejects.toThrow('spawn ENOENT');
  });

  it('enables network when networkEnabled is true', async () => {
    vi.mocked(spawn).mockReturnValue(mockProcess());
    await runInContainer({ ...baseConfig, networkEnabled: true }, ['test']);

    const args = vi.mocked(spawn).mock.calls[0][1];
    expect(args).not.toContain('--network');
  });
});
