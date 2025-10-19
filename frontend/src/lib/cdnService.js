const backendUrl = import.meta.env.VITE_BACKEND_URL;

function getAuthHeaders() {
  const sessionData = localStorage.getItem('auth0_session');
  if (sessionData) {
    const session = JSON.parse(sessionData);
    const token = session.tokens?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  return {};
}

async function presignUpload({ filename, contentType, prefix }) {
  const res = await fetch(`${backendUrl}/api/s3/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ filename, contentType, prefix }),
  });
  if (!res.ok) throw new Error(`Presign failed: ${res.status}`);
  return res.json();
}

export async function uploadImageToS3(file, options = {}) {
  if (!file) throw new Error('No file provided');
  const contentType = file.type || 'application/octet-stream';
  const { key, url } = await presignUpload({
    filename: file.name,
    contentType,
    prefix: options.prefix,
  });

  const putRes = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  if (!putRes.ok) throw new Error(`Upload failed: ${putRes.status}`);
  return { key };
}

export async function listS3Images({ prefix, token } = {}) {
  const params = new URLSearchParams();
  if (prefix) params.set('prefix', prefix);
  if (token) params.set('token', token);
  const res = await fetch(`${backendUrl}/api/s3/images?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
}

export async function deleteS3Files(keys) {
  const arr = Array.isArray(keys) ? keys.filter(Boolean) : [keys].filter(Boolean);
  if (arr.length === 0) throw new Error('No keys provided for deletion');

  const res = await fetch(`${backendUrl}/api/s3/file`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ keys: arr }),
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.error || res.statusText || `Delete failed: ${res.status}`;
    const err = new Error(msg);
    if (data?.rejected) err.rejected = data.rejected;
    if (data?.errors) err.errors = data.errors;
    throw err;
  }

  return data;
}

export const deleteS3File = (key) => deleteS3Files([key]);
