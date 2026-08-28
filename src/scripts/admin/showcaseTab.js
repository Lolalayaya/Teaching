import { fetchFile, putFile, deleteFile, listDir, getToken } from './githubApi.js';
import { parseMarkdownFile, stringifyMarkdownFile } from './frontmatter.js';
import { renderPreview } from './markdownPreview.js';
import { initEmbedsField } from './embedsField.js';
import { renderGradeCheckboxes, getSelectedGrades, renderClassGrid, getSelectedClasses } from './classGrid.js';
import { GRADES } from '../classOptions.js';

const DIR = 'src/content/showcase';

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

export function initShowcaseTab() {
  const panel = document.querySelector('[data-tab-panel][data-tab="showcase"]');
  panel.innerHTML = `
    <h2>作品集列表</h2>
    <button type="button" data-refresh-list-btn>重新整理列表</button>
    <ul data-list class="admin-list"></ul>

    <h2 data-form-heading>新增作品</h2>
    <form data-form>
      <label>標題 <input type="text" data-title required /></label>
      <label>檔名 <input type="text" data-filename required /></label>
      <label>日期 <input type="date" data-date required /></label>
      <label>年級標籤（選填，僅顯示用，不影響誰看得到）
        <select data-grade>
          <option value="">（不填）</option>
          ${GRADES.map((g) => `<option value="${g}">${g} 年級</option>`).join('')}
        </select>
      </label>
      <label>credit 標籤（選填） <input type="text" data-credit-label /></label>
      <label>簡短描述（選填） <input type="text" data-description /></label>
      <fieldset><legend>適用年級（不勾 = 全年級可見）</legend><div data-grade-checkboxes></div></fieldset>
      <fieldset><legend>適用班級（不勾 = 全班可見）</legend><div data-class-grid></div></fieldset>
      <fieldset><legend>嵌入連結</legend><div data-embeds-container></div></fieldset>
      <label>內文（markdown）
        <textarea data-body rows="14"></textarea>
      </label>
      <p>即時預覽：</p>
      <div data-body-preview class="preview-body"></div>
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
  const cancelBtn = form.querySelector('[data-cancel-edit-btn]');

  let embedsApi = initEmbedsField(embedsContainer, []);
  renderGradeCheckboxes(gradeContainer, []);
  renderClassGrid(classContainer, []);
  let editingPath = null;
  let editingSha = null;
  let cachedItems = [];

  bodyInput.addEventListener('input', () => renderPreview(bodyPreview, bodyInput.value));

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
    formHeading.textContent = '新增作品';
    cancelBtn.hidden = true;
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
          <strong>${it.title}</strong> — ${it.date}
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
    form.querySelector('[data-grade]').value = data.grade || '';
    form.querySelector('[data-credit-label]').value = data.creditLabel || '';
    form.querySelector('[data-description]').value = data.description || '';
    renderGradeCheckboxes(gradeContainer, data.grades || []);
    renderClassGrid(classContainer, data.classes || []);
    embedsApi = initEmbedsField(embedsContainer, data.embeds || []);
    bodyInput.value = body;
    renderPreview(bodyPreview, body);
    window.scrollTo({ top: form.offsetTop, behavior: 'smooth' });
  }

  async function handleDelete(path) {
    if (!confirm(`確定要刪除「${path}」嗎？這個動作無法復原（但 git 歷史紀錄還留著）。`)) return;
    const token = getToken();
    const item = cachedItems.find((i) => i.path === path);
    try {
      await deleteFile(path, item.sha, `showcase: delete ${path}`, token);
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
    };
    const grade = form.querySelector('[data-grade]').value;
    if (grade) data.grade = grade;
    const creditLabel = form.querySelector('[data-credit-label]').value.trim();
    if (creditLabel) data.creditLabel = creditLabel;
    const description = form.querySelector('[data-description]').value.trim();
    if (description) data.description = description;
    if (grades.length) data.grades = grades;
    if (classes.length) data.classes = classes;
    const embeds = embedsApi.getValue();
    if (embeds.length) data.embeds = embeds;

    const newContent = stringifyMarkdownFile(data, bodyInput.value);
    const newPath = `${DIR}/${filenameInput.value.trim()}`;
    try {
      setStatus(saveStatus, '送出中…');
      if (editingPath && editingPath !== newPath) {
        await putFile(newPath, newContent, null, `showcase: rename to ${filenameInput.value}`, token);
        await deleteFile(editingPath, editingSha, 'showcase: remove old file after rename', token);
      } else {
        await putFile(newPath, newContent, editingPath ? editingSha : null, `showcase: save ${filenameInput.value}`, token);
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
