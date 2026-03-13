import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

function groupByWeek(lectures) {
  const map = new Map();
  for (const l of lectures) {
    const week = Number(l.week) || 0;
    if (!map.has(week)) map.set(week, []);
    map.get(week).push(l);
  }
  return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
}

export default function PublicListPage() {
  const [lectures, setLectures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [week, setWeek] = useState('');
  const [courseId, setCourseId] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const [courseList, data] = await Promise.all([
          api.listCourses(),
          api.listPublicLectures()
        ]);
        if (!alive) return;
        setCourses(courseList);
        setLectures(data);
      } catch (e) {
        if (!alive) return;
        setError(e.message || 'Failed to load');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function applyFilters(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      if (week) params.week = String(week);
      if (courseId) params.courseId = String(courseId);
      const data = await api.listPublicLectures(params);
      setLectures(data);
    } catch (e2) {
      setError(e2.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => groupByWeek(lectures), [lectures]);

  return (
    <div className="card">
      <h1>CMS Tài liệu môn học</h1>
      <p className="muted">Chỉ hiển thị bài giảng công khai.</p>

      <form className="section" onSubmit={applyFilters}>
        <div className="row">
          <label className="field">
            <div className="label">Tìm kiếm</div>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="tiêu đề / chương / nội dung" />
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

          <div className="actions" style={{ marginTop: 22 }}>
            <button className="button" type="submit" disabled={loading}>Lọc</button>
          </div>
        </div>
      </form>

      {loading && <p>Đang tải...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && grouped.length === 0 && <p>Chưa có bài giảng công khai.</p>}

      {!loading && !error && grouped.map(([week, items]) => (
        <div key={week} className="section">
          <h2>Tuần {week}</h2>
          <ul className="list">
            {items.map((l) => (
              <li key={l.id} className="listItem">
                <div>
                  <div className="titleRow">
                    <Link to={`/lecture/${l.id}`} className="link">{l.title}</Link>
                    {l.chapter ? <span className="badge">{l.chapter}</span> : null}
                  </div>
                  <div className="muted small">{(l.attachments || []).length} file đính kèm</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="footer">
        <Link to="/admin" className="button">Vào trang quản trị</Link>
      </div>
    </div>
  );
}
