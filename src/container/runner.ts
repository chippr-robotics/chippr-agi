import { spawn } from 'node:child_process';

export type ContainerRuntime = 'docker' | 'apple-container';

export interface ContainerConfig {
  runtime: ContainerRuntime;
  image: string;
  mountPaths: string[];
  writablePaths?: string[];
  env?: Record<string, string>;
  networkEnabled?: boolean;
}

export interface ContainerResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export function runInContainer(
  config: ContainerConfig,
  command: string[],
): Promise<ContainerResult> {
  return new Promise((resolve, reject) => {
    const args: string[] = ['run', '--rm'];

    if (!config.networkEnabled) {
      args.push('--network', 'none');
    }

    for (const path of config.mountPaths) {
      args.push('-v', `${path}:${path}:ro`);
    }

    for (const path of config.writablePaths ?? []) {
      args.push('-v', `${path}:${path}:rw`);
    }

    for (const [key, value] of Object.entries(config.env ?? {})) {
      args.push('-e', `${key}=${value}`);
    }

    args.push(config.image, ...command);

    const bin = config.runtime === 'docker' ? 'docker' : 'container';
    const proc = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on('error', reject);
    proc.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode: exitCode ?? 1 });
    });
  });
}
