import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { clearSession, getUser } from '../auth';

export default function AdminListPage() {
  const [lectures, setLectures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [q, setQ] = useState('');
  const [week, setWeek] = useState('');
  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const user = getUser();

  async function load(params) {
    setLoading(true);
    setError('');
    try {
      const [courseList, data] = await Promise.all([
        api.listCourses(),
        api.listLectures(params)
      ]);
      setCourses(courseList);
      setLectures(data);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onTogglePublic(l) {
    try {
      setBusyId(l.id);
      const nextStatus = l.status === 'published' ? 'draft' : 'published';
      await api.updateLecture(l.id, { status: nextStatus });
      await applyFilters();
    } catch (e) {
      setError(e.message || 'Failed to update');
    } finally {
      setBusyId('');
    }
  }

  async function onDelete(l) {
    const ok = confirm(`Xoá bài giảng "${l.title}"?`);
    if (!ok) return;
    try {
      setBusyId(l.id);
      await api.deleteLecture(l.id);
      await applyFilters();
    } catch (e) {
      setError(e.message || 'Failed to delete');
    } finally {
      setBusyId('');
    }
  }

  async function applyFilters(e) {
    if (e) e.preventDefault();
    const params = {};
    if (q.trim()) params.q = q.trim();
    if (week) params.week = String(week);
    if (courseId) params.courseId = String(courseId);
    if (status) params.status = String(status);
    await load(params);
  }

  function onLogout() {
    clearSession();
    navigate('/login');
  }

  return (
    <div className="card">
      <div className="topRow">
        <Link to="/" className="link">← Public</Link>
        <div className="actions">
          <span className="muted small">{user ? `${user.username} (${user.role})` : ''}</span>
          <button className="button secondary" onClick={onLogout}>Đăng xuất</button>
          <button className="button" onClick={() => navigate('/admin/new')}>Tạo bài giảng</button>
        </div>
      </div>

      <h1>Quản trị bài giảng</h1>
      <p className="muted">CRUD + bật/tắt công khai + upload file đính kèm.</p>

      {loading && <p>Đang tải...</p>}
      {error && <p className="error">{error}</p>}

      <form className="section" onSubmit={applyFilters}>
        <div className="row">
          <label className="field">
            <div className="label">Tìm kiếm</div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="tiêu đề/chương/nội dung" />
          </label>

          <label className="field">
            <div className="label">Tuần</div>
            <input type="number" min="1" value={week} onChange={(e) => setWeek(e.target.value)} placeholder="(tất cả)" />
          </label>

          <label className="field">
            <div className="label">Môn học</div>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">(tất cả)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <div className="label">Trạng thái</div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">(tất cả)</option>
              <option value="draft">draft</option>
              <option value="pending">pending</option>
              <option value="published">published</option>
            </select>
          </label>

          <div className="actions" style={{ marginTop: 22 }}>
            <button className="button" type="submit" disabled={loading}>Lọc</button>
          </div>
        </div>
      </form>

      {!loading && !error && lectures.length === 0 && <p>Chưa có bài giảng.</p>}

      {!loading && !error && (
        <ul className="list">
          {lectures.map((l) => (
            <li key={l.id} className="listItem spaced">
              <div>
                <div className="titleRow">
                  <strong>{l.title}</strong>
                  <span className={l.status === 'published' ? 'badge green' : 'badge'}>
                    {l.status}
                  </span>
                </div>
                <div className="muted small">Tuần {l.week}{l.chapter ? ` • ${l.chapter}` : ''} • {(l.attachments || []).length} file</div>
              </div>
              <div className="actions">
                <button className="button secondary" disabled={busyId === l.id} onClick={() => onTogglePublic(l)}>
                  {l.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <Link className="button secondary" to={`/admin/edit/${l.id}`}>Sửa</Link>
                <button className="button danger" disabled={busyId === l.id} onClick={() => onDelete(l)}>Xoá</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
