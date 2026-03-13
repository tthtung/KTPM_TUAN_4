import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

function toForm(lecture) {
  return {
    title: lecture?.title || '',
    week: lecture?.week ?? 1,
    courseId: lecture?.courseId || '',
    chapter: lecture?.chapter || '',
    content: lecture?.content || '',
    status: lecture?.status || 'draft'
  };
}

export default function AdminLectureFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lecture, setLecture] = useState(null);
  const [form, setForm] = useState(toForm(null));
  const [uploading, setUploading] = useState(false);
  const [courses, setCourses] = useState([]);

  const attachments = useMemo(() => lecture?.attachments || [], [lecture]);

  async function loadLecture() {
    if (!isEdit) return;
    setLoading(true);
    setError('');
    try {
      const [courseList, data] = await Promise.all([
        api.listCourses(),
        api.getLecture(id)
      ]);
      setCourses(courseList);
      setLecture(data);
      setForm(toForm(data));
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const courseList = await api.listCourses();
        setCourses(courseList);
      } catch {
        // ignore
      }
      await loadLecture();
    })();
  }, [id]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Tiêu đề không được rỗng');
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        const updated = await api.updateLecture(id, {
          title: form.title,
          week: Number(form.week),
          courseId: form.courseId || undefined,
          chapter: form.chapter,
          content: form.content,
          status: form.status
        });
        setLecture(updated);
      } else {
        const created = await api.createLecture({
          title: form.title,
          week: Number(form.week),
          courseId: form.courseId || undefined,
          chapter: form.chapter,
          content: form.content,
          status: form.status
        });
        navigate(`/admin/edit/${created.id}`);
      }
    } catch (e2) {
      setError(e2.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function onUploadFile(file) {
    if (!file) return;
    setError('');
    try {
      setUploading(true);
      await api.uploadAttachment(id, file);
      await loadLecture();
    } catch (e) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onDeleteAttachment(att) {
    const ok = confirm(`Xoá file "${att.originalName}"?`);
    if (!ok) return;
    setError('');
    try {
      await api.deleteAttachment(att.id);
      await loadLecture();
    } catch (e) {
      setError(e.message || 'Delete failed');
    }
  }

  return (
    <div className="card">
      <div className="topRow">
        <Link to="/admin" className="link">← Quản trị</Link>
        <Link to="/" className="link">Public</Link>
      </div>

      <h1>{isEdit ? 'Sửa bài giảng' : 'Tạo bài giảng'}</h1>

      {loading && <p>Đang tải...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && (
        <form onSubmit={onSubmit} className="form">
          <label className="field">
            <div className="label">Tiêu đề</div>
            <input value={form.title} onChange={(e) => updateField('title', e.target.value)} />
          </label>

          <div className="row">
            <label className="field">
              <div className="label">Môn học</div>
              <select value={form.courseId} onChange={(e) => updateField('courseId', e.target.value)}>
                <option value="">(chưa chọn)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <div className="label">Tuần</div>
              <input
                type="number"
                min="1"
                value={form.week}
                onChange={(e) => updateField('week', e.target.value)}
              />
            </label>

            <label className="field">
              <div className="label">Chương/Mục</div>
              <input value={form.chapter} onChange={(e) => updateField('chapter', e.target.value)} />
            </label>

            <label className="field">
              <div className="label">Trạng thái</div>
              <select value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                <option value="draft">draft</option>
                <option value="pending">pending</option>
                <option value="published">published</option>
              </select>
            </label>
          </div>

          <label className="field">
            <div className="label">Nội dung</div>
            <textarea
              rows={10}
              value={form.content}
              onChange={(e) => updateField('content', e.target.value)}
              placeholder="Có thể dán nội dung bài giảng (plain text)"
            />
          </label>

          <div className="actions">
            <button className="button" disabled={saving} type="submit">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      )}

      {isEdit && !loading && (
        <div className="section">
          <h2>File đính kèm</h2>
          <div className="row">
            <input
              type="file"
              onChange={(e) => onUploadFile(e.target.files?.[0])}
              disabled={uploading}
            />
            <span className="muted small">{uploading ? 'Đang upload...' : 'Tối đa 25MB/file'}</span>
          </div>

          {attachments.length === 0 ? (
            <p className="muted">(Chưa có file)</p>
          ) : (
            <ul className="list">
              {attachments.map((a) => (
                <li key={a.id} className="listItem spaced">
                  <a className="link" href={api.attachmentDownloadUrl(a.id)}>
                    {a.originalName}
                  </a>
                  <div className="actions">
                    <button className="button danger" onClick={() => onDeleteAttachment(a)} type="button">
                      Xoá
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
