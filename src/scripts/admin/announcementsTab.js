import { fetchFile, putFile, deleteFile, listDir, getToken } from './githubApi.js';
import { parseMarkdownFile, stringifyMarkdownFile } from './frontmatter.js';
import { renderPreview } from './markdownPreview.js';
import { buildUnitTitle, nextUnitNumber } from './titleAssembly.js';
import { initEmbedsField } from './embedsField.js';
import { renderGradeCheckboxes, getSelectedGrades, renderClassGrid, getSelectedClasses } from './classGrid.js';
import { findCurrentConflicts } from './currentConflicts.js';

const DIR = 'src/content/announcements';
const CATEGORIES = ['作業', '課程進度', '公告'];

function slugify(title) {
  return (
    title
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'untitled'
  );
}

function setStatus(el, message, isError) {
  el.textContent = message;
  el.classList.toggle('error', Boolean(isError));
}

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
        <div>
          <label>週次 <input type="number" min="1" max="30" data-week /></label>
          <label>任務編號 0XX <input type="number" min="1" max="999" data-unit-number /></label>
          <label>行動代號 <input type="text" data-codename /></label>
          <label>主題 <input type="text" data-topic /></label>
        </div>
        <button type="button" data-assemble-title-btn>套用到標題欄位</button>
      </fieldset>
      <label>標題 <input type="text" data-title required /></label>
      <label>檔名 <input type="text" data-filename required /></label>
      <label>日期 <input type="date" data-date required /></label>
      <label>分類
        <select data-category>${CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join('')}</select>
      </label>
      <label>截止日（選填） <input type="date" data-due-date /></label>
      <label>學期（選填，例如 115-1） <input type="text" data-semester placeholder="115-1" /></label>
      <label style="flex-direction:row;align-items:center;gap:0.5rem;">
        <input type="checkbox" data-current /> 顯示在首頁「本堂課」提示框
      </label>
      <fieldset><legend>適用年級（不勾 = 全年級可見）</legend><div data-grade-checkboxes></div></fieldset>
      <fieldset><legend>適用班級（不勾 = 全班可見）</legend><div data-class-grid></div></fieldset>
      <fieldset><legend>嵌入連結</legend><div data-embeds-container></div></fieldset>
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

  titleInput.addEventListener('blur', () => {
    if (filenameInput.dataset.userEdited === 'true' || editingPath) return;
    const date = form.querySelector('[data-date]').value || 'draft';
    filenameInput.value = `${date}-${slugify(titleInput.value)}.md`;
  });
  filenameInput.addEventListener('input', () => {
    filenameInput.dataset.userEdited = 'true';
  });

  function resetForm() {
    form.reset();
    filenameInput.dataset.userEdited = '';
    editingPath = null;
    editingSha = null;
    embedsApi = initEmbedsField(embedsContainer, []);
    renderGradeCheckboxes(gradeContainer, []);
    renderClassGrid(classContainer, []);
    bodyPreview.innerHTML = '';
    currentWarning.hidden = true;
    formHeading.textContent = '新增公告';
    cancelBtn.hidden = true;
    const nums = cachedItems.map((i) => i.title);
    const suggested = nextUnitNumber(nums);
    if (suggested) form.querySelector('[data-unit-number]').value = suggested;
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
    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    cachedItems = items;
    listEl.innerHTML = items
      .map(
        (it) => `
        <li>
          <strong>${it.title}</strong> — ${it.date}${it.current ? ' · <em>本堂課</em>' : ''}
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
    filenameInput.value = path.split('/').pop();
    filenameInput.dataset.userEdited = 'true';
    form.querySelector('[data-date]').value = data.date || '';
    form.querySelector('[data-category]').value = data.category || CATEGORIES[0];
    form.querySelector('[data-due-date]').value = data.dueDate || '';
    form.querySelector('[data-semester]').value = data.semester || '';
    form.querySelector('[data-current]').checked = Boolean(data.current);
    renderGradeCheckboxes(gradeContainer, data.grades || []);
    renderClassGrid(classContainer, data.classes || []);
    embedsApi = initEmbedsField(embedsContainer, data.embeds || []);
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
      await deleteFile(path, item.sha, `announcements: delete ${path}`, token);
      if (editingPath === path) resetForm();
      refreshList();
    } catch (err) {
      setStatus(saveStatus, err.message, true);
    }
  }

  form.querySelector('[data-save-btn]').addEventListener('click', async () => {
    const token = getToken();
    if (!token) return setStatus(saveStatus, '請先在上方儲存 GitHub Token。', true);
    if (!titleInput.value.trim() || !filenameInput.value.trim() || !form.querySelector('[data-date]').value) {
      return setStatus(saveStatus, '標題、檔名、日期是必填欄位。', true);
    }

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
        await putFile(newPath, newContent, null, `announcements: rename to ${filenameInput.value}`, token);
        await deleteFile(editingPath, editingSha, 'announcements: remove old file after rename', token);
      } else {
        await putFile(newPath, newContent, editingPath ? editingSha : null, `announcements: save ${filenameInput.value}`, token);
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
