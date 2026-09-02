import { fetchFile, putFile, deleteFile, listDir, getToken } from './githubApi.js';
import { parseMarkdownFile, stringifyMarkdownFile } from './frontmatter.js';
import { renderPreview } from './markdownPreview.js';
import { buildUnitTitle, nextUnitNumber, arabicToChineseWeek } from './titleAssembly.js';
import { initEmbedsField } from './embedsField.js';
import { renderGradeCheckboxes, getSelectedGrades, renderClassGrid, getSelectedClasses } from './classGrid.js';
import { findCurrentConflicts } from './currentConflicts.js';

const DIR = 'src/content/lectures';
const KNOWN_UNLOCK_KEYS = ['teaching-site:escape-room-completed', 'teaching-site:punctuation-screenshot-completed'];

function setStatus(el, message, isError) {
  el.textContent = message;
  el.classList.toggle('error', Boolean(isError));
}

export function initLecturesTab() {
  const panel = document.querySelector('[data-tab-panel][data-tab="lectures"]');
  panel.innerHTML = `
    <h2>講義列表</h2>
    <button type="button" data-refresh-list-btn>重新整理列表</button>
    <ul data-list class="admin-list"></ul>

    <h2 data-form-heading>新增講義</h2>
    <form data-form>
      <fieldset>
        <legend>標題輔助（可略過，直接在下面標題欄位手動打字也可以）</legend>
        <div>
          <label style="flex-direction:row;align-items:center;gap:0.4rem;">
            <input type="radio" name="variant" value="intro" data-variant checked /> 單元講義
          </label>
          <label style="flex-direction:row;align-items:center;gap:0.4rem;">
            <input type="radio" name="variant" value="recap" data-variant /> 複習講義
          </label>
        </div>
        <div>
          <label>週次 <input type="number" min="1" max="30" data-week /></label>
          <label>單元序號 0XX <input type="number" min="1" max="999" data-unit-number /></label>
          <label>行動代號 <input type="text" data-codename /></label>
          <label>主題 <input type="text" data-topic /></label>
        </div>
        <button type="button" data-assemble-title-btn>套用到標題與單元欄位</button>
      </fieldset>
      <label>標題 <input type="text" data-title required /></label>
      <label>單元（frontmatter 的 unit 欄位） <input type="text" data-unit required placeholder="第一單元 / 第一單元複習" /></label>
      <label>排序 order <input type="number" data-order required /></label>
      <label>檔名 <input type="text" data-filename required /></label>
      <label>日期 <input type="date" data-date required /></label>
      <label>標籤（選填，逗號分隔） <input type="text" data-tags placeholder="複習, 密室逃脫" /></label>
      <label>摘要 summary（選填） <input type="text" data-summary /></label>
      <label>學期（選填，例如 115-1） <input type="text" data-semester placeholder="115-1" /></label>
      <label style="flex-direction:row;align-items:center;gap:0.5rem;">
        <input type="checkbox" data-current /> 顯示在首頁「本堂課」提示框
      </label>
      <label style="flex-direction:row;align-items:center;gap:0.5rem;">
        <input type="checkbox" data-published checked /> 已公開（取消勾選 = 學生完全看不到，標題也不會出現在列表；老師模式一律看得到）
      </label>
      <fieldset><legend>適用年級（不勾 = 全年級可見）</legend><div data-grade-checkboxes></div></fieldset>
      <fieldset><legend>適用班級（不勾 = 全班可見）</legend><div data-class-grid></div></fieldset>
      <fieldset><legend>嵌入連結</legend><div data-embeds-container></div></fieldset>
      <details data-unlock-details>
        <summary>進階設定：解鎖條件（選填，讓這篇內容鎖住直到某個時間點或學生完成挑戰）</summary>
        <label>解鎖日期（選填） <input type="date" data-unlock-after /></label>
        <label>解鎖 key（選填）
          <select data-unlock-key-select>
            <option value="">（不使用，只靠日期或都不設）</option>
            <option value="teaching-site:escape-room-completed">密室逃脫完成（teaching-site:escape-room-completed）</option>
            <option value="teaching-site:punctuation-screenshot-completed">特務闖關完成（teaching-site:punctuation-screenshot-completed）</option>
            <option value="__custom__">其他（自訂）</option>
          </select>
        </label>
        <input type="text" data-unlock-key-custom hidden placeholder="teaching-site:..." />
        <label>鎖住時顯示的訊息（選填） <input type="text" data-unlock-message /></label>
      </details>
      <label>內文（markdown）
        <textarea data-body rows="14"></textarea>
      </label>
      <p>即時預覽：</p>
      <div data-body-preview class="preview-body"></div>
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
  const unitInput = form.querySelector('[data-unit]');
  const filenameInput = form.querySelector('[data-filename]');
  const bodyInput = form.querySelector('[data-body]');
  const bodyPreview = form.querySelector('[data-body-preview]');
  const gradeContainer = form.querySelector('[data-grade-checkboxes]');
  const classContainer = form.querySelector('[data-class-grid]');
  const embedsContainer = form.querySelector('[data-embeds-container]');
  const saveStatus = form.querySelector('[data-save-status]');
  const currentWarning = form.querySelector('[data-current-warning]');
  const cancelBtn = form.querySelector('[data-cancel-edit-btn]');
  const unlockKeySelect = form.querySelector('[data-unlock-key-select]');
  const unlockKeyCustom = form.querySelector('[data-unlock-key-custom]');

  let embedsApi = initEmbedsField(embedsContainer, []);
  renderGradeCheckboxes(gradeContainer, []);
  renderClassGrid(classContainer, []);
  let editingPath = null;
  let editingSha = null;
  let cachedItems = [];

  bodyInput.addEventListener('input', () => renderPreview(bodyPreview, bodyInput.value));

  unlockKeySelect.addEventListener('change', () => {
    unlockKeyCustom.hidden = unlockKeySelect.value !== '__custom__';
  });

  function currentVariant() {
    return form.querySelector('input[data-variant]:checked').value;
  }

  form.querySelector('[data-assemble-title-btn]').addEventListener('click', () => {
    const week = Number(form.querySelector('[data-week]').value);
    const unitNumber = Number(form.querySelector('[data-unit-number]').value);
    const codename = form.querySelector('[data-codename]').value.trim();
    const topic = form.querySelector('[data-topic]').value.trim();
    if (!week || !unitNumber || !codename || !topic) return;
    const variant = currentVariant();
    titleInput.value = buildUnitTitle({ week, unitNumber, codename, topic, variant });
    unitInput.value = `第${arabicToChineseWeek(unitNumber)}單元${variant === 'recap' ? '複習' : ''}`;
    if (filenameInput.dataset.userEdited !== 'true' && !editingPath) {
      filenameInput.value = `unit${String(unitNumber).padStart(2, '0')}-${variant}.md`;
    }
  });

  filenameInput.addEventListener('input', () => {
    filenameInput.dataset.userEdited = 'true';
  });

  function resetForm() {
    form.reset();
    filenameInput.dataset.userEdited = '';
    unlockKeyCustom.hidden = true;
    editingPath = null;
    editingSha = null;
    embedsApi = initEmbedsField(embedsContainer, []);
    renderGradeCheckboxes(gradeContainer, []);
    renderClassGrid(classContainer, []);
    bodyPreview.innerHTML = '';
    currentWarning.hidden = true;
    formHeading.textContent = '新增講義';
    cancelBtn.hidden = true;
    const nums = cachedItems.map((i) => i.title);
    const suggested = nextUnitNumber(nums);
    if (suggested) form.querySelector('[data-unit-number]').value = suggested;
    const maxOrder = cachedItems.reduce((max, i) => Math.max(max, Number(i.order) || 0), 0);
    form.querySelector('[data-order]').value = maxOrder + 1;
  }

  cancelBtn.addEventListener('click', resetForm);

  async function refreshList() {
    const token = getToken();
    if (!token) return setStatus(saveStatus, '請先在上方儲存 GitHub Token。', true);
    setStatus(saveStatus, '');
    const entries = await listDir(DIR, token);
    const files = entries.filter((e) => e.type === 'file' && e.name.endsWith('.md'));
    const items = await Promise.all(
      files.map(async (f) => {
        const file = await fetchFile(f.path, token);
        const { data } = parseMarkdownFile(file.content);
        return { path: f.path, sha: file.sha, ...data };
      })
    );
    items.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    cachedItems = items;
    listEl.innerHTML = items
      .map(
        (it) => `
        <li>
          <strong>${it.unit} · ${it.title}</strong> — order ${it.order}${it.current ? ' · <em>本堂課</em>' : ''}${it.published === false ? ' · <em>未公開</em>' : ''}
          <button type="button" data-edit="${it.path}">編輯</button>
          <button type="button" data-delete="${it.path}">刪除</button>
        </li>`
      )
      .join('');
    listEl.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => loadForEdit(btn.dataset.edit)));
    listEl.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => handleDelete(btn.dataset.delete)));
  }
  panel.querySelector('[data-refresh-list-btn]').addEventListener('click', refreshList);

  async function loadForEdit(path) {
    const token = getToken();
    const file = await fetchFile(path, token);
    const { data, body } = parseMarkdownFile(file.content);
    editingPath = path;
    editingSha = file.sha;
    formHeading.textContent = `編輯：${data.title}`;
    cancelBtn.hidden = false;
    titleInput.value = data.title || '';
    unitInput.value = data.unit || '';
    form.querySelector('[data-order]').value = data.order ?? '';
    filenameInput.value = path.split('/').pop();
    filenameInput.dataset.userEdited = 'true';
    form.querySelector('[data-date]').value = data.date || '';
    form.querySelector('[data-tags]').value = (data.tags || []).join(', ');
    form.querySelector('[data-summary]').value = data.summary || '';
    form.querySelector('[data-semester]').value = data.semester || '';
    form.querySelector('[data-current]').checked = Boolean(data.current);
    form.querySelector('[data-published]').checked = data.published !== false;
    form.querySelector(`input[data-variant][value="${(data.unit || '').includes('複習') ? 'recap' : 'intro'}"]`).checked = true;
    renderGradeCheckboxes(gradeContainer, data.grades || []);
    renderClassGrid(classContainer, data.classes || []);
    embedsApi = initEmbedsField(embedsContainer, data.embeds || []);

    const unlock = data.unlock || {};
    form.querySelector('[data-unlock-after]').value = unlock.after || '';
    form.querySelector('[data-unlock-message]').value = unlock.message || '';
    if (unlock.storageKey && KNOWN_UNLOCK_KEYS.includes(unlock.storageKey)) {
      unlockKeySelect.value = unlock.storageKey;
      unlockKeyCustom.hidden = true;
      unlockKeyCustom.value = '';
    } else if (unlock.storageKey) {
      unlockKeySelect.value = '__custom__';
      unlockKeyCustom.hidden = false;
      unlockKeyCustom.value = unlock.storageKey;
    } else {
      unlockKeySelect.value = '';
      unlockKeyCustom.hidden = true;
      unlockKeyCustom.value = '';
    }

    bodyInput.value = body;
    renderPreview(bodyPreview, body);
    currentWarning.hidden = true;
    window.scrollTo({ top: form.offsetTop, behavior: 'smooth' });
  }

  async function handleDelete(path) {
    if (!confirm(`確定要刪除「${path}」嗎？這個動作無法復原（但 git 歷史紀錄還留著）。`)) return;
    const token = getToken();
    const item = cachedItems.find((i) => i.path === path);
    try {
      await deleteFile(path, item.sha, `lectures: delete ${path}`, token);
      if (editingPath === path) resetForm();
      refreshList();
    } catch (err) {
      setStatus(saveStatus, err.message, true);
    }
  }

  form.querySelector('[data-save-btn]').addEventListener('click', async () => {
    const token = getToken();
    if (!token) return setStatus(saveStatus, '請先在上方儲存 GitHub Token。', true);
    if (
      !titleInput.value.trim() ||
      !unitInput.value.trim() ||
      !filenameInput.value.trim() ||
      !form.querySelector('[data-date]').value ||
      form.querySelector('[data-order]').value === ''
    ) {
      return setStatus(saveStatus, '標題、單元、排序、檔名、日期是必填欄位。', true);
    }

    const grades = getSelectedGrades(gradeContainer);
    const classes = getSelectedClasses(classContainer);
    const data = {
      title: titleInput.value.trim(),
      unit: unitInput.value.trim(),
      order: Number(form.querySelector('[data-order]').value),
      date: form.querySelector('[data-date]').value,
    };
    const tags = form
      .querySelector('[data-tags]')
      .value.split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length) data.tags = tags;
    const summary = form.querySelector('[data-summary]').value.trim();
    if (summary) data.summary = summary;
    const semester = form.querySelector('[data-semester]').value.trim();
    if (semester) data.semester = semester;
    if (grades.length) data.grades = grades;
    if (classes.length) data.classes = classes;
    const embeds = embedsApi.getValue();
    if (embeds.length) data.embeds = embeds;
    if (form.querySelector('[data-current]').checked) data.current = true;
    if (!form.querySelector('[data-published]').checked) data.published = false;

    const after = form.querySelector('[data-unlock-after]').value;
    const storageKey = unlockKeySelect.value === '__custom__' ? unlockKeyCustom.value.trim() : unlockKeySelect.value;
    const message = form.querySelector('[data-unlock-message]').value.trim();
    if (after || storageKey || message) {
      data.unlock = {};
      if (after) data.unlock.after = after;
      if (storageKey) data.unlock.storageKey = storageKey;
      if (message) data.unlock.message = message;
    }

    currentWarning.hidden = true;
    if (data.current) {
      try {
        const conflicts = await findCurrentConflicts(token, { grades, classes, excludePath: editingPath });
        if (conflicts.length) {
          currentWarning.hidden = false;
          currentWarning.textContent = `注意：以下項目也標記為本堂課，且班級範圍有重疊：${conflicts
            .map((c) => c.title)
            .join('、')}（仍會繼續儲存，只是提醒你）`;
        }
      } catch {
        // conflict-check failure shouldn't block saving
      }
    }

    const newContent = stringifyMarkdownFile(data, bodyInput.value);
    const newPath = `${DIR}/${filenameInput.value.trim()}`;
    try {
      setStatus(saveStatus, '送出中…');
      if (editingPath && editingPath !== newPath) {
        await putFile(newPath, newContent, null, `lectures: rename to ${filenameInput.value}`, token);
        await deleteFile(editingPath, editingSha, 'lectures: remove old file after rename', token);
      } else {
        await putFile(newPath, newContent, editingPath ? editingSha : null, `lectures: save ${filenameInput.value}`, token);
      }
      setStatus(saveStatus, '已送出，網站正在重新部署（約1-3分鐘）。');
      resetForm();
      refreshList();
    } catch (err) {
      setStatus(saveStatus, err.message, true);
    }
  });

  resetForm();
}
