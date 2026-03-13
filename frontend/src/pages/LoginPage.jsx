import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { setSession } from '../auth';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/admin';

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const result = await api.login(username, password);
      setSession(result);
      navigate(from, { replace: true });
    } catch (e2) {
      setError(e2.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="topRow">
        <Link to="/" className="link">← Public</Link>
      </div>

      <h1>Đăng nhập</h1>
      <p className="muted">Tài khoản demo: admin/admin123, editor/editor123, student/student123</p>

      {error && <p className="error">{error}</p>}

      <form onSubmit={onSubmit} className="form">
        <label className="field">
          <div className="label">Username</div>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>

        <label className="field">
          <div className="label">Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        <div className="actions">
          <button className="button" disabled={loading} type="submit">
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </div>
      </form>
    </div>
  );
}
