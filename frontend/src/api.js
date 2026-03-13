import { getToken } from './auth';

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(path, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}

export const api = {
  login(username, password) {
    return apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  listCourses() {
    return apiFetch('/api/courses');
  },
  listPublicLectures(params) {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return apiFetch(`/api/public/lectures${qs}`);
  },
  getPublicLecture(id) {
    return apiFetch(`/api/public/lectures/${id}`);
  },
  listLectures(params) {
    const qs = params ? `?${new URLSearchParams(params)}` : '';
    return apiFetch(`/api/lectures${qs}`);
  },
  getLecture(id) {
    return apiFetch(`/api/lectures/${id}`);
  },
  createLecture(input) {
    return apiFetch('/api/lectures', { method: 'POST', body: JSON.stringify(input) });
  },
  updateLecture(id, patch) {
    return apiFetch(`/api/lectures/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
  },
  deleteLecture(id) {
    return apiFetch(`/api/lectures/${id}`, { method: 'DELETE' });
  },
  async uploadAttachment(lectureId, file) {
    const fd = new FormData();
    fd.append('file', file);
    return apiFetch(`/api/lectures/${lectureId}/attachments`, { method: 'POST', body: fd });
  },
  deleteAttachment(id) {
    return apiFetch(`/api/attachments/${id}`, { method: 'DELETE' });
  },
  attachmentDownloadUrl(id) {
    return `/api/attachments/${id}/download`;
  }
};
