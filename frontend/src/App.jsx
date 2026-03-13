import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PublicListPage from './pages/PublicListPage.jsx';
import PublicLecturePage from './pages/PublicLecturePage.jsx';
import AdminListPage from './pages/AdminListPage.jsx';
import AdminLectureFormPage from './pages/AdminLectureFormPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import { isLoggedIn } from './auth.js';

function RequireAuth({ children }) {
  const loc = useLocation();
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicListPage />} />
      <Route path="/lecture/:id" element={<PublicLecturePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<RequireAuth><AdminListPage /></RequireAuth>} />
      <Route path="/admin/new" element={<RequireAuth><AdminLectureFormPage /></RequireAuth>} />
      <Route path="/admin/edit/:id" element={<RequireAuth><AdminLectureFormPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
