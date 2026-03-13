import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

export default function PublicLecturePage() {
  const { id } = useParams();
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api.getPublicLecture(id);
        if (!alive) return;
        setLecture(data);
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
  }, [id]);

  return (
    <div className="card">
      <div className="topRow">
        <Link to="/" className="link">← Danh sách</Link>
        <Link to="/admin" className="link">Quản trị</Link>
      </div>

      {loading && <p>Đang tải...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && lecture && (
        <>
          <h1>{lecture.title}</h1>
          <div className="muted">Tuần {lecture.week}{lecture.chapter ? ` • ${lecture.chapter}` : ''}</div>

          <div className="section">
            <h2>Nội dung</h2>
            {lecture.content ? (
              <pre className="content">{lecture.content}</pre>
            ) : (
              <p className="muted">(Không có nội dung)</p>
            )}
          </div>

          <div className="section">
            <h2>File đính kèm</h2>
            {(lecture.attachments || []).length === 0 ? (
              <p className="muted">(Không có file)</p>
            ) : (
              <ul className="list">
                {lecture.attachments.map((a) => (
                  <li key={a.id} className="listItem">
                    <a className="link" href={api.attachmentDownloadUrl(a.id)}>
                      {a.originalName}
                    </a>
                    <span className="muted small">{Math.round((a.size || 0) / 1024)} KB</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
