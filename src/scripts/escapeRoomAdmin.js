// Lightweight, NON-secure gate (see design.md discussion): this whole file
// ships to the browser, so the password and the fetch/PUT logic are all
// readable via devtools. It's a "please don't" door for curious students,
// not a security boundary. The GitHub token is the real credential, and it
// lives only in this device's localStorage — never commit one to the repo.

const PASSWORD = 'teacherlola';
const PAT_KEY = 'teaching-site:escape-room-pat';
const REPO_OWNER = 'Lolalayaya';
const REPO_NAME = 'Teaching';
const FILE_PATH = 'src/content/escape-room.config.json';
const BRANCH = 'master';

function contentsUrl() {
  return `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
}

function getToken() {
  return localStorage.getItem(PAT_KEY) || '';
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

async function fetchFile(token) {
  const res = await fetch(`${contentsUrl()}?ref=${BRANCH}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (!res.ok) {
    throw new Error(`讀取失敗（HTTP ${res.status}）：請檢查 Token 是否正確、是否有這個repo的Contents讀寫權限`);
  }
  const data = await res.json();
  return { content: base64ToUtf8(data.content), sha: data.sha };
}

async function putFile(token, newContentString, sha, message) {
  const res = await fetch(contentsUrl(), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      message,
      content: utf8ToBase64(newContentString),
      sha,
      branch: BRANCH,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`儲存失敗（HTTP ${res.status}）：${err.message || '請檢查 Token 權限'}`);
  }
  return res.json();
}

export function initAdmin() {
  const gate = document.querySelector('[data-gate]');
  const panel = document.querySelector('[data-admin-panel]');
  const gateError = document.querySelector('[data-gate-error]');
  const passwordInput = document.querySelector('[data-password-input]');

  document.querySelector('[data-unlock-btn]').addEventListener('click', () => {
    if (passwordInput.value === PASSWORD) {
      gate.hidden = true;
      panel.hidden = false;
    } else {
      gateError.hidden = false;
    }
  });
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.querySelector('[data-unlock-btn]').click();
  });

  const patInput = document.querySelector('[data-pat-input]');
  patInput.value = getToken();
  document.querySelector('[data-save-pat-btn]').addEventListener('click', () => {
    localStorage.setItem(PAT_KEY, patInput.value.trim());
    setStatus('Token 已儲存在這台電腦（其他電腦要各自輸入一次）。', false);
  });

  const statusEl = document.querySelector('[data-status]');
  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.classList.toggle('error', Boolean(isError));
  }

  const versionDisplay = document.querySelector('[data-version-display]');
  const editor = document.querySelector('[data-content-editor]');
  let currentSha = null;

  async function loadContent() {
    const token = getToken();
    if (!token) {
      setStatus('請先輸入並儲存 GitHub Token。', true);
      return false;
    }
    try {
      setStatus('讀取中…');
      const { content, sha } = await fetchFile(token);
      currentSha = sha;
      editor.value = content;
      versionDisplay.textContent = JSON.parse(content).version;
      setStatus('讀取成功。');
      return true;
    } catch (err) {
      setStatus(err.message, true);
      return false;
    }
  }

  document.querySelector('[data-load-btn]').addEventListener('click', loadContent);

  document.querySelector('[data-bump-version-btn]').addEventListener('click', async () => {
    const token = getToken();
    if (!token) return setStatus('請先輸入並儲存 GitHub Token。', true);
    if (!currentSha && !(await loadContent())) return;
    let parsed;
    try {
      parsed = JSON.parse(editor.value);
    } catch {
      return setStatus('目前編輯框裡的內容不是合法的JSON，請先修正或重新讀取。', true);
    }
    parsed.version = (Number(parsed.version) || 0) + 1;
    const newContent = `${JSON.stringify(parsed, null, 2)}\n`;
    try {
      setStatus('送出中…');
      const result = await putFile(token, newContent, currentSha, `escape-room: bump version to ${parsed.version}`);
      currentSha = result.content.sha;
      editor.value = newContent;
      versionDisplay.textContent = parsed.version;
      setStatus(
        `已送出，版本號更新為 ${parsed.version}。網站正在重新部署（約1-3分鐘），完成後所有學生下次載入頁面時進度會自動清空重來。`
      );
    } catch (err) {
      setStatus(err.message, true);
    }
  });

  document.querySelector('[data-save-content-btn]').addEventListener('click', async () => {
    const token = getToken();
    if (!token) return setStatus('請先輸入並儲存 GitHub Token。', true);
    let parsed;
    try {
      parsed = JSON.parse(editor.value);
    } catch {
      return setStatus('內容不是合法的JSON格式，請檢查後再試一次（多一個逗號、少一個引號都會失敗）。', true);
    }
    if (!currentSha && !(await loadContent())) return;
    const newContent = `${JSON.stringify(parsed, null, 2)}\n`;
    try {
      setStatus('送出中…');
      const result = await putFile(token, newContent, currentSha, 'escape-room: update content via admin panel');
      currentSha = result.content.sha;
      versionDisplay.textContent = parsed.version;
      setStatus('已送出，網站正在重新部署（約1-3分鐘）。');
    } catch (err) {
      setStatus(err.message, true);
    }
  });
}
