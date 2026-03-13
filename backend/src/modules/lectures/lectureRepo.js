import { nanoid } from 'nanoid';

export class LectureRepo {
  /** @param {{store: import('../../store.js').store}} deps */
  constructor({ store }) {
    this.store = store;
  }

  _normalize(lecture) {
    const status = lecture.status
      ? lecture.status
      : lecture.isPublic
        ? 'published'
        : 'draft';
    const courseId = lecture.courseId || null;
    return { ...lecture, status, courseId };
  }

  async listAll() {
    const db = await this.store.read();
    return db.lectures.map((l) => this._normalize(l)).slice().sort((a, b) => {
      if (a.week !== b.week) return a.week - b.week;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  async listPublic() {
    const all = await this.listAll();
    return all.filter((l) => l.status === 'published');
  }

  async getById(id) {
    const db = await this.store.read();
    const found = db.lectures.find((l) => l.id === id) ?? null;
    return found ? this._normalize(found) : null;
  }

  async create(input) {
    const now = new Date().toISOString();
    const status = input.isPublic !== undefined ? (input.isPublic ? 'published' : 'draft') : input.status;
    const lecture = {
      id: nanoid(),
      title: input.title,
      week: input.week,
      courseId: input.courseId || null,
      chapter: input.chapter ?? '',
      content: input.content ?? '',
      status,
      // Keep for backward-compat reads
      isPublic: status === 'published',
      createdAt: now,
      updatedAt: now
    };

    await this.store.write((db) => {
      db.lectures.push(lecture);
      return db;
    });

    return lecture;
  }

  async update(id, patch) {
    let updated = null;
    const now = new Date().toISOString();

    const normalizedPatch = { ...patch };
    if (normalizedPatch.isPublic !== undefined && normalizedPatch.status === undefined) {
      normalizedPatch.status = normalizedPatch.isPublic ? 'published' : 'draft';
    }
    if (normalizedPatch.status !== undefined) {
      normalizedPatch.isPublic = normalizedPatch.status === 'published';
    }

    await this.store.write((db) => {
      const idx = db.lectures.findIndex((l) => l.id === id);
      if (idx === -1) return db;
      const next = { ...db.lectures[idx], ...normalizedPatch, updatedAt: now };
      db.lectures[idx] = next;
      updated = this._normalize(next);
      return db;
    });

    return updated;
  }

  async remove(id) {
    let removed = null;
    await this.store.write((db) => {
      const idx = db.lectures.findIndex((l) => l.id === id);
      if (idx === -1) return db;
      removed = db.lectures[idx];
      db.lectures.splice(idx, 1);
      return db;
    });
    return removed;
  }
}
