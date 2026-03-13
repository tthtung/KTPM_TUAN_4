import { nanoid } from 'nanoid';

export class AttachmentRepo {
  /** @param {{store: import('../../store.js').store}} deps */
  constructor({ store }) {
    this.store = store;
  }

  async listByLectureId(lectureId) {
    const db = await this.store.read();
    return db.attachments
      .filter((a) => a.lectureId === lectureId)
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getById(id) {
    const db = await this.store.read();
    return db.attachments.find((a) => a.id === id) ?? null;
  }

  async create(input) {
    const now = new Date().toISOString();
    const attachment = {
      id: nanoid(),
      lectureId: input.lectureId,
      originalName: input.originalName,
      storedName: input.storedName,
      mimeType: input.mimeType,
      size: input.size,
      createdAt: now
    };

    await this.store.write((db) => {
      db.attachments.push(attachment);
      return db;
    });

    return attachment;
  }

  async remove(id) {
    let removed = null;
    await this.store.write((db) => {
      const idx = db.attachments.findIndex((a) => a.id === id);
      if (idx === -1) return db;
      removed = db.attachments[idx];
      db.attachments.splice(idx, 1);
      return db;
    });
    return removed;
  }
}
