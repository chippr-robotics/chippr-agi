import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Host ↔ container communication via filesystem.
 * The host writes a request file; the container writes a response file.
 */
export class IPC {
  constructor(private ipcDir: string) {
    if (!existsSync(ipcDir)) {
      mkdirSync(ipcDir, { recursive: true });
    }
  }

  sendRequest(id: string, data: Record<string, unknown>): void {
    writeFileSync(join(this.ipcDir, `${id}.request.json`), JSON.stringify(data));
  }

  readResponse(id: string): Record<string, unknown> | null {
    const path = join(this.ipcDir, `${id}.response.json`);
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>;
  }

  writeResponse(id: string, data: Record<string, unknown>): void {
    writeFileSync(join(this.ipcDir, `${id}.response.json`), JSON.stringify(data));
  }

  readRequest(id: string): Record<string, unknown> | null {
    const path = join(this.ipcDir, `${id}.request.json`);
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>;
  }
}
