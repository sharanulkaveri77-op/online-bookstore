const TOKEN_KEY = 'booknook_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export async function api(path, { method = 'GET', body, token, headers = {} } = {}) {
  const authToken = token !== undefined ? token : getToken();
  const response = await fetch('/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (response.status === 401 && authToken && onUnauthorized) {
    onUnauthorized();
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data.error || 'Request failed');
      error.details = data.details;
      error.status = response.status;
      throw error;
    }
    return data;
  }
  if (!response.ok) {
    throw new Error('Request failed');
  }
  return response;
}

export async function downloadPdf(path) {
  const response = await api(path, { headers: { Accept: 'application/pdf' } });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = path.split('/').filter(Boolean).pop().replace('/', '-') + '.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function money(n) {
  const value = Number(n || 0);
  return (
    '₹' +
    value.toLocaleString('en-IN', {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2
    })
  );
}
