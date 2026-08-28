const REPO_OWNER = 'Lolalayaya';
const REPO_NAME = 'Teaching';
const BRANCH = 'master';
const PAT_KEY = 'teaching-site:admin-pat';
const LEGACY_PAT_KEY = 'teaching-site:escape-room-pat';

function contentsUrl(path) {
  return `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
}

export function getToken() {
  const current = localStorage.getItem(PAT_KEY);
  if (current) return current;
  const legacy = localStorage.getItem(LEGACY_PAT_KEY);
  if (legacy) {
    localStorage.setItem(PAT_KEY, legacy);
    return legacy;
  }
  return '';
}

export function setToken(token) {
  localStorage.setItem(PAT_KEY, token);
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToUtf8(b64) {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function fetchFile(path, token) {
  const res = await fetch(`${contentsUrl(path)}?ref=${BRANCH}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`讀取失敗（HTTP ${res.status}）：請檢查 Token 是否正確、是否有這個 repo 的 Contents 讀寫權限`);
  }
  const data = await res.json();
  return { content: base64ToUtf8(data.content), sha: data.sha };
}

export async function putFile(path, contentString, sha, message, token) {
  const res = await fetch(contentsUrl(path), {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    body: JSON.stringify({ message, content: utf8ToBase64(contentString), sha: sha ?? undefined, branch: BRANCH }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`儲存失敗（HTTP ${res.status}）：${err.message || '請檢查 Token 權限'}`);
  }
  const data = await res.json();
  return { sha: data.content.sha };
}

export async function deleteFile(path, sha, message, token) {
  const res = await fetch(contentsUrl(path), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`刪除失敗（HTTP ${res.status}）：${err.message || '請檢查 Token 權限'}`);
  }
}

export async function listDir(path, token) {
  const res = await fetch(`${contentsUrl(path)}?ref=${BRANCH}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error(`列出檔案失敗（HTTP ${res.status}）：請檢查 Token 權限`);
  }
  return res.json();
}
