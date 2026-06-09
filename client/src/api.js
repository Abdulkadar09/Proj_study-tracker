const API_BASE = import.meta.env.VITE_API_BASE || '';
let accessToken = null;

export function setApiAccessToken(token) {
  accessToken = token;
}

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'API request failed');
  }
  return response.json();
}

export function fetchSubjects() {
  return request('/subjects');
}

export function createSubject(payload) {
  return request('/subjects', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function deleteSubject(id) {
  return request(`/subjects/${id}`, { method: 'DELETE' });
}

export function fetchSessions() {
  return request('/sessions');
}

export function createSession(payload) {
  return request('/sessions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateSession(id, payload) {
  return request(`/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function fetchSummary() {
  return request('/stats/summary');
}

export function fetchSubjectStats() {
  return request('/stats/subjects');
}

export function deleteSession(id) {
  return request(`/sessions/${id}`, { method: 'DELETE' });
}

export function fetchDailyTotals(from, to) {
  return request(`/stats/daily?from=${from}&to=${to}`);
}
