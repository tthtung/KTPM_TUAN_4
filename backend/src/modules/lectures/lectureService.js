import { HttpError } from '../../core/errors.js';

export class LectureService {
  /** @param {{lectureRepo: any, attachmentService: any}} deps */
  constructor({ lectureRepo, attachmentService }) {
    this.lectureRepo = lectureRepo;
    this.attachmentService = attachmentService;
  }

  async _attach(lecture) {
    const attachments = await this.attachmentService.listByLectureId(lecture.id);
    return { ...lecture, attachments };
  }

  async listAll() {
    const lectures = await this.lectureRepo.listAll();
    return Promise.all(lectures.map((l) => this._attach(l)));
  }

  async listAllFiltered(query) {
    const items = await this.listAll();
    return this._filter(items, query);
  }

  async listPublic() {
    const lectures = await this.lectureRepo.listPublic();
    return Promise.all(lectures.map((l) => this._attach(l)));
  }

  async listPublicFiltered(query) {
    const items = await this.listPublic();
    return this._filter(items, query);
  }

  _filter(items, query) {
    if (!query) return items;
    const q = query.q ? String(query.q).toLowerCase() : '';

    return items.filter((l) => {
      if (query.week !== undefined && Number(l.week) !== Number(query.week)) return false;
      if (query.courseId !== undefined && String(l.courseId || '') !== String(query.courseId)) return false;
      if (query.status !== undefined && String(l.status) !== String(query.status)) return false;

      if (q) {
        const hay = `${l.title || ''} ${l.chapter || ''} ${l.content || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }

  async getById(id, { allowHidden = true } = {}) {
    const lecture = await this.lectureRepo.getById(id);
    if (!lecture) throw new HttpError(404, 'Lecture not found');
    if (!allowHidden && lecture.status !== 'published') throw new HttpError(404, 'Lecture not found');
    return this._attach(lecture);
  }

  async create(input) {
    const lecture = await this.lectureRepo.create(input);
    return this._attach(lecture);
  }

  async update(id, patch) {
    const updated = await this.lectureRepo.update(id, patch);
    if (!updated) throw new HttpError(404, 'Lecture not found');
    return this._attach(updated);
  }

  async remove(id) {
    const existing = await this.lectureRepo.getById(id);
    if (!existing) throw new HttpError(404, 'Lecture not found');

    await this.attachmentService.removeByLectureId(id);
    await this.lectureRepo.remove(id);
    return { ok: true };
  }
}
