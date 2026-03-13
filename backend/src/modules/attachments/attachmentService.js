import fs from 'node:fs/promises';
import path from 'node:path';
import { HttpError } from '../../core/errors.js';

export class AttachmentService {
  /**
   * @param {{attachmentRepo: any, lectureRepo: any, uploadsDir: string}} deps
   */
  constructor({ attachmentRepo, lectureRepo, uploadsDir }) {
    this.attachmentRepo = attachmentRepo;
    this.lectureRepo = lectureRepo;
    this.uploadsDir = uploadsDir;
  }

  async listByLectureId(lectureId) {
    return this.attachmentRepo.listByLectureId(lectureId);
  }

  async getById(id) {
    const a = await this.attachmentRepo.getById(id);
    if (!a) throw new HttpError(404, 'Attachment not found');
    return a;
  }

  /** @param {{lectureId: string, file: Express.Multer.File}} input */
  async createForLecture({ lectureId, file }) {
    const lecture = await this.lectureRepo.getById(lectureId);
    if (!lecture) throw new HttpError(404, 'Lecture not found');

    return this.attachmentRepo.create({
      lectureId,
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size
    });
  }

  async remove(id) {
    const a = await this.attachmentRepo.remove(id);
    if (!a) throw new HttpError(404, 'Attachment not found');

    const filePath = path.join(this.uploadsDir, a.storedName);
    try {
      await fs.rm(filePath, { force: true });
    } catch {
      // ignore
    }

    return a;
  }

  async removeByLectureId(lectureId) {
    const attachments = await this.attachmentRepo.listByLectureId(lectureId);
    for (const a of attachments) {
      await this.remove(a.id);
    }
  }

  getDownloadPath(attachment) {
    return path.join(this.uploadsDir, attachment.storedName);
  }
}
