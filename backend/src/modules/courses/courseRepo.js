import { nanoid } from 'nanoid';

export class CourseRepo {
  /** @param {{store: import('../../store.js').store}} deps */
  constructor({ store }) {
    this.store = store;
  }

  async listAll() {
    const db = await this.store.read();
    return (db.courses || []).slice().sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  }

  async getById(id) {
    const db = await this.store.read();
    return (db.courses || []).find((c) => c.id === id) ?? null;
  }

  async create(input) {
    const now = new Date().toISOString();
    const course = {
      id: nanoid(),
      code: input.code,
      name: input.name,
      description: input.description || '',
      createdAt: now
    };

    await this.store.write((db) => {
      db.courses = db.courses || [];
      db.courses.push(course);
      return db;
    });

    return course;
  }
}
