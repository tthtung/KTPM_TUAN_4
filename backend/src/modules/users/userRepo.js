import { nanoid } from 'nanoid';

export class UserRepo {
  /** @param {{store: import('../../store.js').store}} deps */
  constructor({ store }) {
    this.store = store;
  }

  async listAll() {
    const db = await this.store.read();
    return (db.users || []).slice().sort((a, b) => (a.username || '').localeCompare(b.username || ''));
  }

  async getById(id) {
    const db = await this.store.read();
    return (db.users || []).find((u) => u.id === id) ?? null;
  }

  async getByUsername(username) {
    const db = await this.store.read();
    return (db.users || []).find((u) => u.username.toLowerCase() === String(username).toLowerCase()) ?? null;
  }

  async create(input) {
    const now = new Date().toISOString();
    const user = {
      id: nanoid(),
      username: input.username,
      passwordHash: input.passwordHash,
      role: input.role,
      createdAt: now
    };

    await this.store.write((db) => {
      db.users = db.users || [];
      db.users.push(user);
      return db;
    });

    return user;
  }
}
