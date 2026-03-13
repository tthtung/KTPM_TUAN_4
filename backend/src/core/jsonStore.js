import fs from 'node:fs/promises';
import path from 'node:path';

function ensureDirForFile(filePath) {
  return fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Minimal JSON store with an in-process write queue.
 */
export class JsonStore {
  /** @param {{filePath: string, initialData: any}} opts */
  constructor({ filePath, initialData }) {
    this.filePath = filePath;
    this.initialData = initialData;
    this._writeQueue = Promise.resolve();
  }

  async init() {
    await ensureDirForFile(this.filePath);
    if (!(await exists(this.filePath))) {
      await fs.writeFile(this.filePath, JSON.stringify(this.initialData, null, 2), 'utf8');
    }
  }

  async read() {
    await this.init();
    const raw = await fs.readFile(this.filePath, 'utf8');
    return JSON.parse(raw);
  }

  /** @param {(data:any)=>any|Promise<any>} mutator */
  async write(mutator) {
    this._writeQueue = this._writeQueue.then(async () => {
      const data = await this.read();
      const next = await mutator(data);
      const finalData = next === undefined ? data : next;

      const tmpPath = `${this.filePath}.${Date.now()}.tmp`;
      await fs.writeFile(tmpPath, JSON.stringify(finalData, null, 2), 'utf8');
      try {
        // On Windows, rename may fail if destination exists.
        await fs.rm(this.filePath, { force: true });
      } catch {
        // ignore
      }
      await fs.rename(tmpPath, this.filePath);
    });

    return this._writeQueue;
  }
}
