# Teacher Admin Backend Implementation Plan

> **For agentic workers:** Executed inline in the current session (single
> engineer, full design context already loaded from a prior grilling
> session — no subagent handoff). Steps use checkbox (`- [ ]`) syntax for
> tracking. This repo has no test framework (`package.json` has no test
> script) — "verify" steps mean running `astro dev --background` and
> checking behavior in a real browser per this repo's `CLAUDE.md`, not
> automated tests.

**Goal:** Build a single `/admin` teacher backend (password + GitHub PAT
gated) with tabs for 密室逃脫 / mission-2 / 公告 / 講義 / 作品集, replacing
the standalone `/escape-room/admin` and the fully-manual git-commit
workflow for content editing.

**Architecture:** Generalize the existing `escapeRoomAdmin.js` pattern
(client-side password gate + GitHub Contents API read/write, committing
straight to `master`) into a shared low-level module
(`src/scripts/admin/githubApi.js`, `gate.js`, `frontmatter.js`,
`markdownPreview.js`), plus small reusable UI-behavior helpers
(`embedsField.js`, `classGrid.js`). Each of the five tabs gets its own
concrete script (no generic "collection descriptor" engine — the three
content collections have different enough field sets that a shared
descriptor-driven form engine would be harder to get right than three
focused files importing the same low-level helpers).

**Tech Stack:** Astro (existing), vanilla client-side JS modules (existing
pattern), `js-yaml` (new dep, for frontmatter parse/stringify), `marked`
(new dep, for the markdown preview pane).

## Global Constraints

- Single shared password (reuse existing `teacherlola`) and single shared
  GitHub PAT (new localStorage key `teaching-site:admin-pat`), across all
  five tabs.
- Repo target: owner `Lolalayaya`, repo `Teaching`, branch `master` (same
  as existing `escapeRoomAdmin.js`).
- No server, no database, no roles — this is a deterrent-only client-side
  gate; the PAT is the real credential and never leaves localStorage.
- Delete = real GitHub API file delete + confirm dialog. No draft/soft-delete.
- Showcase collection gets `grades`/`classes`/`semester` but NOT `current`
  and NOT `unlock`. Its existing singular `grade` field is untouched.
- `current` conflict check only needs to consider lectures + announcements
  (showcase never has `current`).
- `unlock.after` is a plain date (`YYYY-MM-DD`), not a datetime — matches
  every existing file on disk.
- Class checkbox grid reuses the exact same source already in
  `src/pages/select-class.astro` (grades `['7','8','9']` × class numbers
  `'01'`..`'10'`), extracted into a shared constants module so both pages
  read from one place.

---

## File Structure

**New shared modules:**
- `src/scripts/admin/githubApi.js` — token storage + low-level GitHub
  Contents API calls (fetch/put/delete/list), base64/utf8 helpers.
- `src/scripts/admin/gate.js` — shared password gate wiring.
- `src/scripts/admin/frontmatter.js` — parse/stringify `.md` frontmatter
  via `js-yaml`, with date-field normalization.
- `src/scripts/admin/markdownPreview.js` — thin `marked` wrapper.
- `src/scripts/admin/embedsField.js` — repeatable embeds-row UI helper.
- `src/scripts/admin/classGrid.js` — checkbox-grid UI helper + canonical
  `GRADES`/`CLASS_NUMBERS` constants.
- `src/scripts/classOptions.js` — canonical `GRADES`/`CLASS_NUMBERS`
  arrays, imported by both `select-class.astro` (replacing its inline
  literals) and `classGrid.js`.

**New per-tab scripts + the page:**
- `src/pages/admin/index.astro` — the tab shell + all five `<section>`
  panels' markup, imports and calls each tab's `init*()`.
- `src/scripts/admin/escapeRoomTab.js` — relocated/adapted
  `escapeRoomAdmin.js` logic + jump-to-level tool.
- `src/scripts/admin/mission2Tab.js` — new, same pattern as escape-room,
  targeting `mission-2.config.json` + its own jump-to-level tool.
- `src/scripts/admin/announcementsTab.js` — list/create/edit/delete.
- `src/scripts/admin/lecturesTab.js` — list/create/edit/delete +
  unlock advanced section.
- `src/scripts/admin/showcaseTab.js` — list/create/edit/delete (simplest,
  no current/unlock).
- `src/scripts/admin/titleAssembly.js` — shared week/unit-number
  Chinese-numeral helpers used by both announcements and lectures tabs.

**Modified:**
- `src/content.config.ts` — add `grades`/`classes`/`semester` to `showcase`.
- `src/pages/select-class.astro` — use `classOptions.js` instead of inline
  literals (no behavior change).
- `package.json` — add `js-yaml`, `marked`.

**Removed:**
- `src/pages/escape-room/admin.astro` (content moves into
  `src/pages/admin/index.astro`'s 密室逃脫 tab) — replaced with a tiny
  redirect stub at the same path so old bookmarks still land somewhere.
- `src/scripts/escapeRoomAdmin.js` (superseded by `escapeRoomTab.js`).

---

## Task 1: Dependencies + shared low-level modules

**Files:**
- Modify: `package.json`
- Create: `src/scripts/classOptions.js`
- Modify: `src/pages/select-class.astro`
- Create: `src/scripts/admin/githubApi.js`
- Create: `src/scripts/admin/gate.js`
- Create: `src/scripts/admin/frontmatter.js`
- Create: `src/scripts/admin/markdownPreview.js`

**Interfaces (produced, used by every later task):**
```js
// githubApi.js
export function getToken(): string
export function setToken(token: string): void
export async function fetchFile(path: string, token: string): Promise<{content: string, sha: string} | null> // null on 404
export async function putFile(path: string, contentString: string, sha: string | null, message: string, token: string): Promise<{sha: string}>
export async function deleteFile(path: string, sha: string, message: string, token: string): Promise<void>
export async function listDir(path: string, token: string): Promise<Array<{name: string, path: string, sha: string, type: string}>> // [] on 404

// gate.js
export function initGate({ password: string, onUnlock: () => void }): void
// wires [data-gate]/[data-admin-shell]/[data-password-input]/[data-unlock-btn]/[data-gate-error]
// and [data-pat-input]/[data-save-pat-btn]/[data-pat-status], calling githubApi.setToken()

// frontmatter.js
export function parseMarkdownFile(raw: string): { data: object, body: string }
export function stringifyMarkdownFile(data: object, body: string): string
// data field values must be plain strings for date-like fields (caller's job) —
// this module does not silently coerce Date objects on write, only on read.

// markdownPreview.js
export function renderPreview(container: HTMLElement, markdownText: string): void
```

- [ ] **Step 1: Add dependencies**

```bash
npm install js-yaml marked
```

- [ ] **Step 2: Extract canonical class options**

`src/scripts/classOptions.js`:
```js
export const GRADES = ['7', '8', '9'];
export const CLASS_NUMBERS = Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, '0'));
```

Edit `src/pages/select-class.astro`: replace lines 5-6 (`const grades = ...`,
`const classNumbers = ...`) with:
```astro
import { GRADES as grades, CLASS_NUMBERS as classNumbers } from '../scripts/classOptions.js';
```
placed with the other frontmatter imports at the top of the `---` block.

- [ ] **Step 3: `githubApi.js`**

```js
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
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
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
```

- [ ] **Step 4: `gate.js`**

```js
import { setToken, getToken } from './githubApi.js';

export function initGate({ password, onUnlock }) {
  const gate = document.querySelector('[data-gate]');
  const shell = document.querySelector('[data-admin-shell]');
  const gateError = document.querySelector('[data-gate-error]');
  const passwordInput = document.querySelector('[data-password-input]');
  const unlockBtn = document.querySelector('[data-unlock-btn]');

  function unlock() {
    gate.hidden = true;
    shell.hidden = false;
    const patInput = document.querySelector('[data-pat-input]');
    if (patInput) patInput.value = getToken();
    onUnlock();
  }

  unlockBtn.addEventListener('click', () => {
    if (passwordInput.value === password) {
      unlock();
    } else {
      gateError.hidden = false;
    }
  });
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') unlockBtn.click();
  });

  document.querySelector('[data-save-pat-btn]')?.addEventListener('click', () => {
    const patInput = document.querySelector('[data-pat-input]');
    setToken(patInput.value.trim());
    const status = document.querySelector('[data-pat-status]');
    if (status) status.textContent = 'Token 已儲存在這台電腦（其他電腦要各自輸入一次）。';
  });
}
```

- [ ] **Step 5: `frontmatter.js`**

```js
import yaml from 'js-yaml';

export function parseMarkdownFile(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data = yaml.load(match[1]) || {};
  return { data, body: match[2] };
}

export function stringifyMarkdownFile(data, body) {
  const yamlText = yaml.dump(data, { lineWidth: -1 }).trimEnd();
  return `---\n${yamlText}\n---\n\n${body.trim()}\n`;
}
```

- [ ] **Step 6: `markdownPreview.js`**

```js
import { marked } from 'marked';

export function renderPreview(container, markdownText) {
  container.innerHTML = marked.parse(markdownText || '');
}
```

- [ ] **Step 7: Verify (no UI yet — sanity import check)**

Run: `astro dev --background` then `astro dev status`. Expected: dev server
running, no build errors from the new modules (Vite would fail fast on a
syntax error even with nothing importing them yet only if something does —
these aren't imported anywhere yet, so this step is really just "confirm
`npm install` succeeded and `astro dev` still boots"). Run
`astro dev logs` and confirm no dependency-resolution errors.

- [ ] **Step 8: Manually verify `select-class.astro` still works**

Open `http://localhost:4321/Teaching/select-class/` in a browser. Expected:
grade/class dropdowns render exactly as before (7/8/9 grades, 01-10 → "1
班".."10 班"), selecting and submitting still redirects home and sets the
nav badge. This confirms the `classOptions.js` extraction didn't change
behavior.

---

## Task 2: `/admin` page shell + gate wiring, retire `/escape-room/admin`

**Files:**
- Create: `src/pages/admin/index.astro`
- Modify: `src/pages/escape-room/admin.astro` (replace with redirect stub)
- Delete: `src/scripts/escapeRoomAdmin.js` (superseded — done at the end of
  Task 3 once `escapeRoomTab.js` fully replaces it, not here, to avoid a
  broken import mid-task)

**Interfaces:**
- Consumes: `gate.js#initGate`
- Produces: the DOM structure every tab script's `document.querySelector`
  calls target — `[data-gate]`, `[data-admin-shell]`, tab buttons
  `[data-tab-btn][data-tab="escape-room|mission-2|announcements|lectures|showcase"]`,
  panels `[data-tab-panel][data-tab="..."]`.

- [ ] **Step 1: Write the page shell**

`src/pages/admin/index.astro` — reuse the exact gate markup/styles from the
old `escape-room/admin.astro` (lines 8-15 password gate, lines 57-133
`<style>` block), replacing `[data-admin-panel]` with `[data-admin-shell]`
containing a tab bar and five `<section data-tab-panel data-tab="...">`
blocks (bodies filled in by Tasks 3-5). Tab switching is plain
`hidden`-toggling, no router needed:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
---

<BaseLayout title="後台管理" description="教學網站後台（密碼保護，非公開內容）">
  <h1>後台管理</h1>

  <section data-gate class="admin-gate">
    <label>
      密碼
      <input type="password" data-password-input autocomplete="off" />
    </label>
    <button type="button" data-unlock-btn>解鎖</button>
    <p data-gate-error hidden class="gate-error">密碼不對，請再試一次。</p>
  </section>

  <section data-admin-shell hidden class="admin-shell">
    <p class="notice">
      這個頁面沒有真正的伺服器驗證，只是輕量的「請勿進入」門，任何看得懂原始碼的人都能繞過。GitHub Token
      才是真正的憑證，只存在這台裝置的瀏覽器裡——換一台電腦要重新輸入一次，也請不要把Token貼到別的地方。
    </p>

    <h2>GitHub 連線設定</h2>
    <p>
      到 GitHub 的 <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">
        Fine-grained personal access tokens
      </a> 建立一組新token：Repository access 選「Only select repositories」→ 選這個repo（Teaching），
      Permissions 只給 <strong>Contents: Read and write</strong> 這一項就好，不要給其他權限。
    </p>
    <label>
      Personal Access Token
      <input type="password" data-pat-input autocomplete="off" placeholder="github_pat_..." />
    </label>
    <button type="button" data-save-pat-btn>儲存 Token（只存在這台電腦，所有分頁共用）</button>
    <p data-pat-status class="status"></p>

    <nav class="admin-tabs">
      <button type="button" data-tab-btn data-tab="escape-room" class="active">密室逃脫</button>
      <button type="button" data-tab-btn data-tab="mission-2">mission-2</button>
      <button type="button" data-tab-btn data-tab="announcements">公告</button>
      <button type="button" data-tab-btn data-tab="lectures">講義</button>
      <button type="button" data-tab-btn data-tab="showcase">作品集</button>
    </nav>

    <section data-tab-panel data-tab="escape-room"></section>
    <section data-tab-panel data-tab="mission-2" hidden></section>
    <section data-tab-panel data-tab="announcements" hidden></section>
    <section data-tab-panel data-tab="lectures" hidden></section>
    <section data-tab-panel data-tab="showcase" hidden></section>
  </section>
</BaseLayout>

<script>
  import { initGate } from '../../scripts/admin/gate.js';
  import { initEscapeRoomTab } from '../../scripts/admin/escapeRoomTab.js';
  import { initMission2Tab } from '../../scripts/admin/mission2Tab.js';
  import { initAnnouncementsTab } from '../../scripts/admin/announcementsTab.js';
  import { initLecturesTab } from '../../scripts/admin/lecturesTab.js';
  import { initShowcaseTab } from '../../scripts/admin/showcaseTab.js';

  document.querySelectorAll('[data-tab-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('[data-tab-btn]').forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('[data-tab-panel]').forEach((p) => {
        p.hidden = p.dataset.tab !== tab;
      });
    });
  });

  initGate({
    password: 'teacherlola',
    onUnlock: () => {
      initEscapeRoomTab();
      initMission2Tab();
      initAnnouncementsTab();
      initLecturesTab();
      initShowcaseTab();
    },
  });
</script>

<style>
  /* same .admin-gate/.gate-error/.notice/label/input[type=password]/.status/button rules
     as the old escape-room/admin.astro, plus: */
  .admin-tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.5rem;
  }
  .admin-tabs button {
    background: transparent;
    color: var(--color-ink);
    border: 1px solid var(--color-border);
  }
  .admin-tabs button.active {
    background: var(--color-accent);
    color: var(--color-paper);
    border-color: var(--color-accent);
  }
</style>
```

(Copy the full `<style>` block verbatim from the old file for
`.admin-gate`, `.gate-error`, `.notice`, `label`, `input[type='password']`,
`.status`/`.status.error`, `button`/`button:hover`, `.content-editor` — the
per-tab scripts in Tasks 3-5 render their own markup into the panel
`<section>`s and rely on these shared classes.)

Tab-init functions are safe to call before their tab is ever shown — they
just wire up listeners on elements they render into their own panel; no
tab does expensive work until its own buttons are clicked.

- [ ] **Step 2: Retire the old escape-room admin URL**

Replace `src/pages/escape-room/admin.astro` with:
```astro
---
const base = import.meta.env.BASE_URL;
return Astro.redirect(`${base}admin/`, 301);
---
```

- [ ] **Step 3: Verify**

This task's tab-init imports (`escapeRoomTab.js` etc.) don't exist yet —
defer running the dev server until Task 3 Step 1 has at least created
stub files, OR create empty stub files now (`export function
initEscapeRoomTab() {}` etc. in each of the five tab files) purely so
`astro dev --background` boots cleanly, then flesh them out in Tasks 3-5.
Use the stub approach: create all five tab files with an empty exported
init function first, confirm `astro dev --background` + `astro dev logs`
shows no errors and `/admin/` in the browser shows the password gate,
unlocks with `teacherlola`, and switches between five empty tab panels.
Confirm `/escape-room/admin/` redirects to `/admin/`.

---

## Task 3: Escape-room + mission-2 tabs (config editor + jump-to-level)

**Files:**
- Create/replace stub: `src/scripts/admin/escapeRoomTab.js`
- Create/replace stub: `src/scripts/admin/mission2Tab.js`
- Delete: `src/scripts/escapeRoomAdmin.js`
- Delete: `src/pages/escape-room/admin.astro`'s old content already
  replaced in Task 2 — nothing further here.

**Interfaces:**
- Consumes: `githubApi.js` (`fetchFile`, `putFile`, `getToken`)
- Consumes (jump tool only, for escape-room): `readProgress`,
  `saveProgress` are NOT reused directly — the admin panel writes
  `localStorage` itself using the exact same key/shape those modules use,
  documented below, to avoid importing gameplay-input-validation code into
  the admin bundle unnecessarily.
- Produces: `initEscapeRoomTab(): void`, `initMission2Tab(): void`

Both tabs are near-identical; write `mission2Tab.js` second by copying
`escapeRoomTab.js`'s structure with the three differences noted in Step 2.

- [ ] **Step 1: `escapeRoomTab.js` — render panel + wire config editor**

```js
import { fetchFile, putFile, getToken } from './githubApi.js';

const FILE_PATH = 'src/content/escape-room.config.json';
const PROGRESS_KEY = 'teaching-site:escape-room';

export function initEscapeRoomTab() {
  const panel = document.querySelector('[data-tab-panel][data-tab="escape-room"]');
  panel.innerHTML = `
    <h2>目前狀態</h2>
    <button type="button" data-load-btn>讀取目前內容</button>
    <p data-status class="status"></p>
    <p>目前版本號：<strong data-version-display>—</strong></p>

    <h2>快速重置所有學生進度</h2>
    <p>版本號 +1 並發布，網站重新部署完成後，所有學生下次打開密室逃脫頁面時，進度會自動清空重新開始。</p>
    <button type="button" data-bump-version-btn>版本號 +1 並發布</button>

    <h2>跳到特定關卡（僅影響這台裝置）</h2>
    <p>這個工具只會改變<strong>目前這台瀏覽器</strong>的解謎進度,不會影響任何學生的裝置——純粹方便你自己測試某一關的畫面,不用每次都從頭解過去。</p>
    <label>
      選擇關卡
      <select data-jump-select></select>
    </label>
    <button type="button" data-jump-btn>跳到這一關（並補上前面的密文片段）</button>
    <p data-jump-status class="status"></p>

    <h2>完整內容編輯</h2>
    <p>直接編輯下面的JSON（題目、答案、線索片段都在裡面），改完按「儲存並發布」會直接提交到repo並觸發網站重新部署，大約1-3分鐘後正式上線。</p>
    <textarea data-content-editor rows="28" class="content-editor" spellcheck="false"></textarea>
    <button type="button" data-save-content-btn>儲存並發布</button>
  `;

  const statusEl = panel.querySelector('[data-status]');
  const versionDisplay = panel.querySelector('[data-version-display]');
  const editor = panel.querySelector('[data-content-editor]');
  const jumpSelect = panel.querySelector('[data-jump-select]');
  const jumpStatus = panel.querySelector('[data-jump-status]');
  let currentSha = null;
  let currentConfig = null;

  function setStatus(el, message, isError) {
    el.textContent = message;
    el.classList.toggle('error', Boolean(isError));
  }

  function populateJumpSelect(config) {
    jumpSelect.innerHTML = config.levels
      .map((lvl, i) => `<option value="${i}">${lvl.id} · ${lvl.title}</option>`)
      .join('');
  }

  async function loadContent() {
    const token = getToken();
    if (!token) return setStatus(statusEl, '請先在上方儲存 GitHub Token。', true), false;
    try {
      setStatus(statusEl, '讀取中…');
      const result = await fetchFile(FILE_PATH, token);
      if (!result) return setStatus(statusEl, '找不到這個檔案。', true), false;
      currentSha = result.sha;
      currentConfig = JSON.parse(result.content);
      editor.value = result.content;
      versionDisplay.textContent = currentConfig.version;
      populateJumpSelect(currentConfig);
      setStatus(statusEl, '讀取成功。');
      return true;
    } catch (err) {
      setStatus(statusEl, err.message, true);
      return false;
    }
  }

  panel.querySelector('[data-load-btn]').addEventListener('click', loadContent);

  panel.querySelector('[data-bump-version-btn]').addEventListener('click', async () => {
    const token = getToken();
    if (!token) return setStatus(statusEl, '請先在上方儲存 GitHub Token。', true);
    if (!currentSha && !(await loadContent())) return;
    let parsed;
    try {
      parsed = JSON.parse(editor.value);
    } catch {
      return setStatus(statusEl, '目前編輯框裡的內容不是合法的JSON,請先修正或重新讀取。', true);
    }
    parsed.version = (Number(parsed.version) || 0) + 1;
    const newContent = `${JSON.stringify(parsed, null, 2)}\n`;
    try {
      setStatus(statusEl, '送出中…');
      const result = await putFile(FILE_PATH, newContent, currentSha, `escape-room: bump version to ${parsed.version}`, token);
      currentSha = result.sha;
      currentConfig = parsed;
      editor.value = newContent;
      versionDisplay.textContent = parsed.version;
      populateJumpSelect(parsed);
      setStatus(statusEl, `已送出,版本號更新為 ${parsed.version}。網站正在重新部署（約1-3分鐘）,完成後所有學生下次載入頁面時進度會自動清空重來。`);
    } catch (err) {
      setStatus(statusEl, err.message, true);
    }
  });

  panel.querySelector('[data-save-content-btn]').addEventListener('click', async () => {
    const token = getToken();
    if (!token) return setStatus(statusEl, '請先在上方儲存 GitHub Token。', true);
    let parsed;
    try {
      parsed = JSON.parse(editor.value);
    } catch {
      return setStatus(statusEl, '內容不是合法的JSON格式,請檢查後再試一次（多一個逗號、少一個引號都會失敗）。', true);
    }
    if (!currentSha && !(await loadContent())) return;
    const newContent = `${JSON.stringify(parsed, null, 2)}\n`;
    try {
      setStatus(statusEl, '送出中…');
      const result = await putFile(FILE_PATH, newContent, currentSha, 'escape-room: update content via admin panel', token);
      currentSha = result.sha;
      currentConfig = parsed;
      versionDisplay.textContent = parsed.version;
      populateJumpSelect(parsed);
      setStatus(statusEl, '已送出,網站正在重新部署（約1-3分鐘）。');
    } catch (err) {
      setStatus(statusEl, err.message, true);
    }
  });

  panel.querySelector('[data-jump-btn]').addEventListener('click', () => {
    if (!currentConfig) return setStatus(jumpStatus, '請先讀取目前內容。', true);
    const targetIndex = Number(jumpSelect.value);
    const fragments = currentConfig.levels.slice(0, targetIndex).map((lvl) => lvl.fragment ?? '');
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ version: currentConfig.version, currentLevel: targetIndex, fragments })
    );
    setStatus(jumpStatus, `已將這台裝置的進度跳到「${currentConfig.levels[targetIndex].title}」。重新整理密室逃脫頁面即可看到。`);
  });
}
```

- [ ] **Step 2: `mission2Tab.js` — copy with three changes**

Copy Step 1's file verbatim as `mission2Tab.js`, then change:
1. `FILE_PATH = 'src/content/mission-2.config.json'`
2. `PROGRESS_KEY = 'teaching-site:mission-2'`
3. In the jump handler, `saveProgress`'s stored shape needs a fourth field
   (`quoteAssignment`) per `mission2.js:29`, so the jump handler must write:
```js
localStorage.setItem(
  PROGRESS_KEY,
  JSON.stringify({ version: currentConfig.version, currentLevel: targetIndex, fragments, quoteAssignment: {} })
);
```
   (Empty `quoteAssignment` is fine — `mission2.js:52` (`loadOrResetProgress`)
   already defends against a missing one, and the per-level quote text is
   only relevant on the specific `quote-exact` levels; jumping past them
   for a preview doesn't need a real assignment.)

   Also rename all `initEscapeRoomTab`/commit-message-prefix strings (`escape-room: ...` → `mission-2: ...`), and change the section headings' Chinese label from "密室逃脫" to "mission-2" where they appear as button/status copy (the structural HTML stays otherwise identical).

- [ ] **Step 3: Delete the superseded old files**

```bash
git rm src/scripts/escapeRoomAdmin.js
```
(The old `src/pages/escape-room/admin.astro` was already replaced with the
redirect stub in Task 2 Step 2, so nothing to delete there.)

- [ ] **Step 4: Manually verify**

With `astro dev --background` running: open `/admin/`, unlock, switch to
密室逃脫 tab, click "讀取目前內容" (requires a real PAT — use the same
token workflow as before), confirm version number and JSON populate,
confirm the jump-to-level `<select>` lists all levels including `"4-1"`,
`"10-2"` style ids. Click "跳到這一關" for a mid-list level, then open
`/escape-room/` in the same browser and confirm it renders that level with
the cipher banner showing filled-in characters for every prior level.
Repeat for the mission-2 tab against `/mission-2/`.

---

## Task 4: Shared content-editing helpers (title assembly, embeds, class grid, current-conflict check)

**Files:**
- Create: `src/scripts/admin/titleAssembly.js`
- Create: `src/scripts/admin/embedsField.js`
- Create: `src/scripts/admin/classGrid.js`
- Create: `src/scripts/admin/currentConflicts.js`

**Interfaces:**
```js
// titleAssembly.js
export function arabicToChineseWeek(n: number): string // 1 -> '一', 11 -> '十一', supports 1-30
export function nextUnitNumber(existingTitles: string[]): number // scans for /任務檔案\s*(\d{3})/, returns max+1 (or 1)
export function buildUnitTitle({ week: number, unitNumber: number, codename: string, topic: string, variant: 'intro'|'recap' }): string
// intro:  第${week中文}週 任務檔案 ${unitNumber 補零3碼}・${codename}｜${topic}
// recap:  第${week中文}週 任務檔案 ${unitNumber 補零3碼}・${codename}〔檔案回顧〕${topic}

// embedsField.js
export function initEmbedsField(container: HTMLElement, initialEmbeds: Array<{type,title,url}>): { getValue(): Array<{type,title,url}> }

// classGrid.js
export function renderClassGrid(container: HTMLElement, selectedClasses: string[]): void
export function getSelectedClasses(container: HTMLElement): string[]
export function renderGradeCheckboxes(container: HTMLElement, selectedGrades: string[]): void
export function getSelectedGrades(container: HTMLElement): string[]

// currentConflicts.js
export async function findCurrentConflicts(token: string, { grades, classes, excludePath }): Promise<Array<{path: string, title: string}>>
// Fetches both lectures/ and announcements/ dirs, reads each file's frontmatter,
// keeps those with current:true and (path !== excludePath), keeps those whose
// audience overlaps the given grades/classes (empty array on either side = matches everyone).
```

- [ ] **Step 1: `titleAssembly.js`**

```js
const CHINESE_DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

export function arabicToChineseWeek(n) {
  if (n <= 0 || n > 30) return String(n);
  if (n < 10) return CHINESE_DIGITS[n];
  if (n === 10) return '十';
  if (n < 20) return `十${CHINESE_DIGITS[n - 10]}`;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${CHINESE_DIGITS[tens]}十${ones === 0 ? '' : CHINESE_DIGITS[ones]}`;
}

export function nextUnitNumber(existingTitles) {
  const nums = existingTitles
    .map((t) => /任務檔案\s*(\d{3})/.exec(t))
    .filter(Boolean)
    .map((m) => Number(m[1]));
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

export function buildUnitTitle({ week, unitNumber, codename, topic, variant }) {
  const weekCn = arabicToChineseWeek(week);
  const num = String(unitNumber).padStart(3, '0');
  const suffix = variant === 'recap' ? `〔檔案回顧〕${topic}` : `｜${topic}`;
  return `第${weekCn}週 任務檔案 ${num}・${codename}${suffix}`;
}
```

- [ ] **Step 2: `embedsField.js`**

```js
const EMBED_TYPES = ['scratch', 'google-doc', 'google-sheet', 'google-form', 'canva'];

export function initEmbedsField(container, initialEmbeds = []) {
  function renderRow(embed = { type: 'scratch', title: '', url: '' }) {
    const row = document.createElement('div');
    row.className = 'embed-row';
    row.innerHTML = `
      <select data-embed-type>
        ${EMBED_TYPES.map((t) => `<option value="${t}" ${t === embed.type ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
      <input type="text" data-embed-title placeholder="標題" value="${embed.title.replace(/"/g, '&quot;')}" />
      <input type="url" data-embed-url placeholder="https://..." value="${embed.url.replace(/"/g, '&quot;')}" />
      <button type="button" data-remove-row>移除</button>
    `;
    row.querySelector('[data-remove-row]').addEventListener('click', () => row.remove());
    container.appendChild(row);
  }

  container.innerHTML = '';
  initialEmbeds.forEach(renderRow);

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.textContent = '+ 新增嵌入連結';
  addBtn.addEventListener('click', () => renderRow());
  container.parentElement.insertBefore(addBtn, container.nextSibling);

  return {
    getValue() {
      return Array.from(container.querySelectorAll('.embed-row'))
        .map((row) => ({
          type: row.querySelector('[data-embed-type]').value,
          title: row.querySelector('[data-embed-title]').value.trim(),
          url: row.querySelector('[data-embed-url]').value.trim(),
        }))
        .filter((e) => e.title && e.url);
    },
  };
}
```

- [ ] **Step 3: `classGrid.js`**

```js
import { GRADES, CLASS_NUMBERS } from '../classOptions.js';

export function renderGradeCheckboxes(container, selectedGrades = []) {
  container.innerHTML = GRADES.map(
    (g) => `<label><input type="checkbox" value="${g}" ${selectedGrades.includes(g) ? 'checked' : ''} /> ${g} 年級</label>`
  ).join('');
}

export function getSelectedGrades(container) {
  return Array.from(container.querySelectorAll('input:checked')).map((el) => el.value);
}

export function renderClassGrid(container, selectedClasses = []) {
  container.innerHTML = GRADES.map(
    (g) => `
      <fieldset>
        <legend>${g} 年級</legend>
        ${CLASS_NUMBERS.map((c) => {
          const code = `${g}${c}`;
          return `<label><input type="checkbox" value="${code}" ${selectedClasses.includes(code) ? 'checked' : ''} /> ${Number(c)} 班</label>`;
        }).join('')}
      </fieldset>
    `
  ).join('');
}

export function getSelectedClasses(container) {
  return Array.from(container.querySelectorAll('input:checked')).map((el) => el.value);
}
```

- [ ] **Step 4: `currentConflicts.js`**

```js
import { listDir, fetchFile } from './githubApi.js';
import { parseMarkdownFile } from './frontmatter.js';

function overlaps(a = [], b = []) {
  if (a.length === 0 || b.length === 0) return true;
  return a.some((x) => b.includes(x));
}

async function loadCurrentItems(dir, token) {
  const entries = await listDir(dir, token);
  const files = entries.filter((e) => e.type === 'file' && e.name.endsWith('.md'));
  const results = await Promise.all(
    files.map(async (f) => {
      const file = await fetchFile(f.path, token);
      if (!file) return null;
      const { data } = parseMarkdownFile(file.content);
      if (!data.current) return null;
      return { path: f.path, title: data.title, grades: data.grades || [], classes: data.classes || [] };
    })
  );
  return results.filter(Boolean);
}

export async function findCurrentConflicts(token, { grades = [], classes = [], excludePath }) {
  const [lectureItems, announcementItems] = await Promise.all([
    loadCurrentItems('src/content/lectures', token),
    loadCurrentItems('src/content/announcements', token),
  ]);
  return [...lectureItems, ...announcementItems].filter(
    (item) => item.path !== excludePath && overlaps(item.grades, grades) && overlaps(item.classes, classes)
  );
}
```

- [ ] **Step 5: Verify**

No UI wired yet — these are pure/DOM-utility modules. Verify by writing a
throwaway `<script type="module">` snippet is unnecessary; Task 5 wires
all four into the three content tabs, and that task's manual verification
covers these transitively. Skip a standalone check here.

---

## Task 5: Announcements, lectures, showcase tabs

**Files:**
- Fill in stub: `src/scripts/admin/announcementsTab.js`
- Fill in stub: `src/scripts/admin/lecturesTab.js`
- Fill in stub: `src/scripts/admin/showcaseTab.js`
- Modify: `src/content.config.ts` (showcase schema)

**Interfaces:**
- Consumes: everything from Tasks 1 and 4 (`githubApi.js`,
  `frontmatter.js`, `markdownPreview.js`, `titleAssembly.js`,
  `embedsField.js`, `classGrid.js`, `currentConflicts.js`)
- Produces: `initAnnouncementsTab()`, `initLecturesTab()`, `initShowcaseTab()`

- [ ] **Step 1: `src/content.config.ts` — extend showcase schema**

Modify the `showcase` collection definition (around line 61-71): add
`grades`, `classes`, `semester` (reusing the same field defs as
`audienceFields`, but NOT `current`):

```ts
const showcase = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/showcase' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    grade: gradeEnum.optional(),
    creditLabel: z.string().optional(),
    description: z.string().optional(),
    embeds: z.array(embedSchema).optional(),
    grades: z.array(gradeEnum).optional(),
    classes: z.array(z.string()).optional(),
    semester: semesterEnum.optional(),
  }),
});
```

Also modify `src/pages/showcase/index.astro` and
`src/pages/showcase/[...slug].astro` to actually apply the new visibility
fields the same way lectures/announcements do — add `data-audience`/
`data-grades`/`data-classes` attributes to each card in
`showcase/index.astro`'s `<li class="card">` (mirroring
`lectures/index.astro:14-19`) and call `applyClassFilter()` in that page's
script block (mirroring `lectures/index.astro:31-34`). This wasn't in the
original spec's word-for-word wording but is required for the new fields
to have any actual effect — the confirmed spec was "add grades/classes/
semester to the schema" and a schema field that's never read anywhere is
dead weight.

- [ ] **Step 2: `announcementsTab.js`**

```js
import { fetchFile, putFile, deleteFile, listDir, getToken } from './githubApi.js';
import { parseMarkdownFile, stringifyMarkdownFile } from './frontmatter.js';
import { renderPreview } from './markdownPreview.js';
import { buildUnitTitle, nextUnitNumber } from './titleAssembly.js';
import { initEmbedsField } from './embedsField.js';
import { renderGradeCheckboxes, getSelectedGrades, renderClassGrid, getSelectedClasses } from './classGrid.js';
import { findCurrentConflicts } from './currentConflicts.js';

const DIR = 'src/content/announcements';
const CATEGORIES = ['作業', '課程進度', '公告'];

export function initAnnouncementsTab() {
  const panel = document.querySelector('[data-tab-panel][data-tab="announcements"]');
  panel.innerHTML = `
    <h2>公告列表</h2>
    <button type="button" data-refresh-list-btn>重新整理列表</button>
    <ul data-list class="admin-list"></ul>

    <h2 data-form-heading>新增公告</h2>
    <form data-form>
      <fieldset>
        <legend>標題輔助（可略過，直接在下面標題欄位手動打字也可以）</legend>
        <label>週次 <input type="number" min="1" max="30" data-week /></label>
        <label>任務編號 0XX <input type="number" min="1" max="999" data-unit-number /></label>
        <label>行動代號 <input type="text" data-codename /></label>
        <label>主題 <input type="text" data-topic /></label>
        <button type="button" data-assemble-title-btn>套用到標題欄位</button>
      </fieldset>
      <label>標題 <input type="text" data-title required /></label>
      <label>檔名 <input type="text" data-filename required /></label>
      <label>日期 <input type="date" data-date required /></label>
      <label>分類 <select data-category>${CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join('')}</select></label>
      <label>截止日（選填） <input type="date" data-due-date /></label>
      <label>學期（選填，例如 115-1） <input type="text" data-semester /></label>
      <label><input type="checkbox" data-current /> 顯示在首頁「本堂課」提示框</label>
      <fieldset><legend>適用年級（不勾 = 全年級可見）</legend><div data-grade-checkboxes></div></fieldset>
      <fieldset><legend>適用班級（不勾 = 全班可見）</legend><div data-class-grid></div></fieldset>
      <fieldset><legend>嵌入連結</legend><div data-embeds-container></div></fieldset>
      <label>內文（markdown） <textarea data-body rows="14"></textarea></label>
      <div class="preview-pair">
        <div data-body-preview class="preview-body"></div>
      </div>
      <p data-current-warning hidden class="status"></p>
      <p data-save-status class="status"></p>
      <button type="button" data-save-btn>儲存並發布</button>
      <button type="button" data-cancel-edit-btn hidden>取消編輯，改回新增</button>
    </form>
  `;

  const listEl = panel.querySelector('[data-list]');
  const form = panel.querySelector('[data-form]');
  const formHeading = panel.querySelector('[data-form-heading]');
  const titleInput = form.querySelector('[data-title]');
  const filenameInput = form.querySelector('[data-filename]');
  const bodyInput = form.querySelector('[data-body]');
  const bodyPreview = form.querySelector('[data-body-preview]');
  const gradeContainer = form.querySelector('[data-grade-checkboxes]');
  const classContainer = form.querySelector('[data-class-grid]');
  const embedsContainer = form.querySelector('[data-embeds-container]');
  const saveStatus = form.querySelector('[data-save-status]');
  const currentWarning = form.querySelector('[data-current-warning]');
  const cancelBtn = form.querySelector('[data-cancel-edit-btn]');

  let embedsApi = initEmbedsField(embedsContainer, []);
  renderGradeCheckboxes(gradeContainer, []);
  renderClassGrid(classContainer, []);
  let editingPath = null;
  let editingSha = null;
  let cachedItems = [];

  bodyInput.addEventListener('input', () => renderPreview(bodyPreview, bodyInput.value));

  form.querySelector('[data-assemble-title-btn]').addEventListener('click', () => {
    const week = Number(form.querySelector('[data-week]').value);
    const unitNumber = Number(form.querySelector('[data-unit-number]').value);
    const codename = form.querySelector('[data-codename]').value.trim();
    const topic = form.querySelector('[data-topic]').value.trim();
    if (!week || !unitNumber || !codename || !topic) return;
    titleInput.value = buildUnitTitle({ week, unitNumber, codename, topic, variant: 'intro' });
  });

  function slugify(title) {
    return title
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }

  titleInput.addEventListener('blur', () => {
    if (filenameInput.dataset.userEdited === 'true' || editingPath) return;
    const date = form.querySelector('[data-date]').value || 'draft';
    filenameInput.value = `${date}-${slugify(titleInput.value) || 'untitled'}.md`;
  });
  filenameInput.addEventListener('input', () => { filenameInput.dataset.userEdited = 'true'; });

  function resetForm() {
    form.reset();
    filenameInput.dataset.userEdited = '';
    editingPath = null;
    editingSha = null;
    embedsApi = initEmbedsField(embedsContainer, []);
    renderGradeCheckboxes(gradeContainer, []);
    renderClassGrid(classContainer, []);
    bodyPreview.innerHTML = '';
    formHeading.textContent = '新增公告';
    cancelBtn.hidden = true;
    const nums = cachedItems.map((i) => i.title);
    form.querySelector('[data-unit-number]').value = nextUnitNumber(nums) || '';
  }

  cancelBtn.addEventListener('click', resetForm);

  async function refreshList() {
    const token = getToken();
    if (!token) return setStatus(saveStatus, '請先在上方儲存 GitHub Token。', true);
    const entries = await listDir(DIR, token);
    const files = entries.filter((e) => e.type === 'file' && e.name.endsWith('.md'));
    const items = await Promise.all(
      files.map(async (f) => {
        const file = await fetchFile(f.path, token);
        const { data } = parseMarkdownFile(file.content);
        return { path: f.path, sha: file.sha, ...data };
      })
    );
    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    cachedItems = items;
    listEl.innerHTML = items
      .map(
        (it) => `
        <li>
          <strong>${it.title}</strong> — ${it.date} ${it.current ? '· <em>本堂課</em>' : ''}
          <button type="button" data-edit="${it.path}">編輯</button>
          <button type="button" data-delete="${it.path}">刪除</button>
        </li>`
      )
      .join('');
    listEl.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => loadForEdit(btn.dataset.edit)));
    listEl.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => handleDelete(btn.dataset.delete)));
  }
  panel.querySelector('[data-refresh-list-btn]').addEventListener('click', refreshList);

  function setStatus(el, message, isError) {
    el.textContent = message;
    el.classList.toggle('error', Boolean(isError));
  }

  async function loadForEdit(path) {
    const token = getToken();
    const file = await fetchFile(path, token);
    const { data, body } = parseMarkdownFile(file.content);
    editingPath = path;
    editingSha = file.sha;
    formHeading.textContent = `編輯：${data.title}`;
    cancelBtn.hidden = false;
    titleInput.value = data.title || '';
    filenameInput.value = path.split('/').pop();
    filenameInput.dataset.userEdited = 'true';
    form.querySelector('[data-date]').value = String(data.date || '').slice(0, 10);
    form.querySelector('[data-category]').value = data.category || CATEGORIES[0];
    form.querySelector('[data-due-date]').value = data.dueDate ? String(data.dueDate).slice(0, 10) : '';
    form.querySelector('[data-semester]').value = data.semester || '';
    form.querySelector('[data-current]').checked = Boolean(data.current);
    renderGradeCheckboxes(gradeContainer, data.grades || []);
    renderClassGrid(classContainer, data.classes || []);
    embedsApi = initEmbedsField(embedsContainer, data.embeds || []);
    bodyInput.value = body;
    renderPreview(bodyPreview, body);
  }

  async function handleDelete(path) {
    if (!confirm(`確定要刪除「${path}」嗎？這個動作無法復原（但 git 歷史紀錄還留著）。`)) return;
    const token = getToken();
    const item = cachedItems.find((i) => i.path === path);
    await deleteFile(path, item.sha, `announcements: delete ${path}`, token);
    if (editingPath === path) resetForm();
    refreshList();
  }

  form.querySelector('[data-save-btn]').addEventListener('click', async () => {
    const token = getToken();
    if (!token) return setStatus(saveStatus, '請先在上方儲存 GitHub Token。', true);
    const grades = getSelectedGrades(gradeContainer);
    const classes = getSelectedClasses(classContainer);
    const data = {
      title: titleInput.value.trim(),
      date: form.querySelector('[data-date]').value,
      category: form.querySelector('[data-category]').value,
    };
    const dueDate = form.querySelector('[data-due-date]').value;
    if (dueDate) data.dueDate = dueDate;
    const semester = form.querySelector('[data-semester]').value.trim();
    if (semester) data.semester = semester;
    if (grades.length) data.grades = grades;
    if (classes.length) data.classes = classes;
    const embeds = embedsApi.getValue();
    if (embeds.length) data.embeds = embeds;
    if (form.querySelector('[data-current]').checked) data.current = true;

    if (data.current) {
      currentWarning.hidden = true;
      const conflicts = await findCurrentConflicts(token, { grades, classes, excludePath: editingPath });
      if (conflicts.length) {
        currentWarning.hidden = false;
        currentWarning.textContent = `注意：以下項目也標記為本堂課,且班級範圍有重疊：${conflicts.map((c) => c.title).join('、')}（仍會繼續儲存,只是提醒你）`;
      }
    }

    const newContent = stringifyMarkdownFile(data, bodyInput.value);
    const newPath = `${DIR}/${filenameInput.value.trim()}`;
    try {
      setStatus(saveStatus, '送出中…');
      if (editingPath && editingPath !== newPath) {
        await putFile(newPath, newContent, null, `announcements: rename to ${filenameInput.value}`, token);
        await deleteFile(editingPath, editingSha, `announcements: remove old file after rename`, token);
      } else {
        await putFile(newPath, newContent, editingPath ? editingSha : null, `announcements: save ${filenameInput.value}`, token);
      }
      setStatus(saveStatus, '已送出,網站正在重新部署（約1-3分鐘）。');
      resetForm();
      refreshList();
    } catch (err) {
      setStatus(saveStatus, err.message, true);
    }
  });

  resetForm();
}
```

- [ ] **Step 3: `lecturesTab.js`**

Same structure as Step 2 with these differences:
- `DIR = 'src/content/lectures'`
- Extra required fields: `unit` (text, e.g. `第一單元` / `第一單元複習` —
  auto-filled from the same week/unitNumber/variant inputs:
  `第${arabicToChineseWeek(week)}單元${variant === 'recap' ? '複習' : ''}`),
  `order` (number, auto-suggested as `Math.max(...existingOrders, 0) + 1`).
- A variant radio (`data-variant` = `intro`/`recap`) next to the title
  helper fieldset, defaulting to `intro`, driving `buildUnitTitle`'s
  `variant` and the filename pattern:
```js
filenameInput.value = `unit${String(unitNumber).padStart(2, '0')}-${variant}.md`;
```
  (only auto-fills when the user hasn't hand-edited the filename, same
  `dataset.userEdited` guard as announcements).
- `tags` field: `<input type="text" data-tags placeholder="逗號分隔，例如：複習, 密室逃脫" />`,
  parsed with `.split(',').map((t) => t.trim()).filter(Boolean)` on save,
  joined with `', '` on load.
- `summary` field: plain `<input type="text" data-summary />`.
- An advanced `<details>` section for `unlock`:
```html
<details data-unlock-details>
  <summary>進階設定：解鎖條件（選填）</summary>
  <label>解鎖日期 <input type="date" data-unlock-after /></label>
  <label>解鎖 key
    <select data-unlock-key-select>
      <option value="">（不使用，只靠日期或都不設）</option>
      <option value="teaching-site:escape-room-completed">密室逃脫完成（teaching-site:escape-room-completed）</option>
      <option value="teaching-site:mission-2-completed">mission-2 完成（teaching-site:mission-2-completed）</option>
      <option value="__custom__">其他（自訂）</option>
    </select>
    <input type="text" data-unlock-key-custom hidden placeholder="teaching-site:..." />
  </label>
  <label>鎖住時顯示的訊息 <input type="text" data-unlock-message /></label>
</details>
```
  with a `change` listener on `[data-unlock-key-select]` toggling
  `[data-unlock-key-custom]`'s `hidden`. On save, build:
```js
const after = form.querySelector('[data-unlock-after]').value;
const keySelect = form.querySelector('[data-unlock-key-select]').value;
const storageKey = keySelect === '__custom__' ? form.querySelector('[data-unlock-key-custom]').value.trim() : keySelect;
const message = form.querySelector('[data-unlock-message]').value.trim();
if (after || storageKey || message) {
  data.unlock = {};
  if (after) data.unlock.after = after;
  if (storageKey) data.unlock.storageKey = storageKey;
  if (message) data.unlock.message = message;
}
```
  On load-for-edit, reverse this: set `[data-unlock-after]`, set the
  select to `data.unlock?.storageKey` if it matches one of the two known
  values, else `__custom__` + populate the custom input, set the message.
- No `category`/`dueDate` fields (announcements-only) — omit those form
  rows and the corresponding `data.*` assignments entirely.
- List rendering shows `unit`/`order` instead of `category`.

- [ ] **Step 4: `showcaseTab.js`**

Same structure as Step 2, simplified:
- `DIR = 'src/content/showcase'`
- No title-assembly fieldset, no `current` checkbox, no unlock section.
- Fields: `title` (plain text), `date`, `grade` (singular — `<select
  data-grade><option value="">（不填）</option>` + gradeEnum options,
  display-only badge, distinct from the new `grades` checkboxes below),
  `creditLabel` (text), `description` (textarea, short — reuse
  `bodyInput`/preview pattern for the main body content same as others),
  `grades`/`classes`/`semester` visibility fields (same checkboxes/grid as
  announcements/lectures), `embeds`.
- Filename auto-fill: `${date}-${slugify(title)}.md`, same pattern as
  announcements (no unit/intro-recap distinction).

- [ ] **Step 5: Manually verify each tab end-to-end**

With `astro dev --background` running and a real PAT saved:

1. **Announcements:** open 公告 tab → 重新整理列表 shows the 2 existing
   files. Fill the title-helper fieldset (week 3, unit number = next
   suggested, codename, topic) → 套用到標題欄位 → confirm assembled title
   matches the documented format. Save as a new test announcement, confirm
   status shows success, confirm `/announcements/` lists it after a
   redeploy OR at minimum confirm the GitHub API call succeeded (check the
   repo file was created — `git pull` locally or check GitHub web UI).
   Edit that test entry (change title), confirm the rename path (old file
   deleted, new file created). Delete it via the list's 刪除 button,
   confirm the confirm() dialog appears and the file is actually removed.
2. **Lectures:** create a test lecture with `variant=recap`, set
   `unlock.storageKey` via the dropdown, confirm filename comes out as
   `unitNN-recap.md` and `unit` frontmatter reads `第N單元複習`. Confirm
   the advanced `<details>` correctly round-trips on edit (reopen the item
   you just created, confirm the dropdown shows the right selected key).
3. **Showcase:** create a test entry with `grades`/`classes` set but no
   `current` UI present at all (confirm the checkbox genuinely isn't
   rendered, not just hidden). Confirm `grade` (singular) and `grades`
   (plural) both save correctly and don't collide in the frontmatter.
4. **Current-conflict warning:** with two lectures both `current: true`
   and overlapping (or both empty) grades/classes, confirm saving the
   second shows the non-blocking warning listing the first. Then set
   non-overlapping `classes` on both and confirm the warning does NOT
   fire.
5. Delete every test entry created during verification so the repo is
   left clean, and confirm the redeploy pipeline isn't required for any
   of this (GitHub Contents API calls take effect immediately in the
   repo regardless of when the site rebuilds).

---

## Self-Review Notes

- **Spec coverage:** entry/auth (Task 2), content editing for all three
  collections incl. title assembly/filename/preview/embeds/current-warning/
  visibility fields/lecture-advanced-section (Tasks 4-5), showcase schema
  extension without `current`/`unlock` (Task 5 Step 1/4), escape-room +
  mission-2 tabs incl. jump-to-level with fragment backfill (Task 3), old
  URL retirement (Task 2 Step 2) — all covered.
- **Non-goals respected:** no server/login system, no draft/soft-delete,
  no showcase `current`, no student-grade recording anywhere in this plan.
- **Type consistency check:** `initEmbedsField`'s returned `getValue()`
  shape (`{type,title,url}[]`) matches `embedSchema` in
  `content.config.ts` exactly. `findCurrentConflicts`'s `excludePath`
  param is threaded from every tab's `editingPath` variable consistently.
  `PROGRESS_KEY`/localStorage shapes in Task 3 match `escapeRoom.js`/
  `mission2.js`'s `readProgress`/`saveProgress` field names exactly
  (`version`, `currentLevel`, `fragments`, and mission-2's extra
  `quoteAssignment`).
