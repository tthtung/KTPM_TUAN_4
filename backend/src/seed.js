import bcrypt from 'bcryptjs';

export async function ensureSeedData({ store, courseRepo, userRepo }) {
  const db = await store.read();

  // Seed courses
  if (!db.courses || db.courses.length === 0) {
    await courseRepo.create({ code: 'ARCH', name: 'Kiến trúc phần mềm', description: 'Tài liệu môn Kiến trúc phần mềm' });
  }

  // Seed users
  if (!db.users || db.users.length === 0) {
    const adminHash = await bcrypt.hash('admin123', 10);
    const editorHash = await bcrypt.hash('editor123', 10);
    const studentHash = await bcrypt.hash('student123', 10);

    await userRepo.create({ username: 'admin', passwordHash: adminHash, role: 'admin' });
    await userRepo.create({ username: 'editor', passwordHash: editorHash, role: 'editor' });
    await userRepo.create({ username: 'student', passwordHash: studentHash, role: 'student' });
  }
}
