import { fetchFile, putFile, getToken } from './githubApi.js';

const FILE_PATH = 'src/content/punctuation-screenshot.config.json';
const PROGRESS_KEY = 'teaching-site:punctuation-screenshot';

export function initPunctuationScreenshotTab() {
  const panel = document.querySelector('[data-tab-panel][data-tab="punctuation-screenshot"]');
  panel.innerHTML = `
    <h2>目前狀態</h2>
    <button type="button" data-load-btn>讀取目前內容</button>
    <p data-status class="status"></p>
    <p>目前版本號：<strong data-version-display>—</strong></p>

    <h2>快速重置所有學生進度</h2>
    <p>版本號 +1 並發布，網站重新部署完成後，所有學生下次打開特務闖關頁面時，進度會自動清空重新開始。</p>
    <button type="button" data-bump-version-btn>版本號 +1 並發布</button>

    <h2>複製貼上限制</h2>
    <p>標點符號那幾關，預設不能複製貼上答案（逼學生自己動手打）。如果有學生卡關卡太久，可以在這裡臨時解除限制。表情符號那一關不受這個開關影響，永遠不能複製貼上。</p>
    <p>目前狀態：<strong data-paste-status-display>—</strong></p>
    <button type="button" data-toggle-paste-btn>切換複製貼上限制</button>
    <p data-paste-toggle-status class="status"></p>

    <h2>跳到特定關卡（僅影響這台裝置）</h2>
    <p>這個工具只會改變<strong>目前這台瀏覽器</strong>的解謎進度，不會影響任何學生的裝置——純粹方便你自己測試某一關的畫面，不用每次都從頭解過去。</p>
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
  const pasteStatusDisplay = panel.querySelector('[data-paste-status-display]');
  const pasteToggleStatus = panel.querySelector('[data-paste-toggle-status]');
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

  function updatePasteDisplay(config) {
    pasteStatusDisplay.textContent = config.allowPaste ? '可以複製貼上（限制已解除）' : '不能複製貼上（預設）';
  }

  async function loadContent() {
    const token = getToken();
    if (!token) {
      setStatus(statusEl, '請先在上方儲存 GitHub Token。', true);
      return false;
    }
    try {
      setStatus(statusEl, '讀取中…');
      const result = await fetchFile(FILE_PATH, token);
      if (!result) {
        setStatus(statusEl, '找不到這個檔案。', true);
        return false;
      }
      currentSha = result.sha;
      currentConfig = JSON.parse(result.content);
      editor.value = result.content;
      versionDisplay.textContent = currentConfig.version;
      populateJumpSelect(currentConfig);
      updatePasteDisplay(currentConfig);
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
      return setStatus(statusEl, '目前編輯框裡的內容不是合法的JSON，請先修正或重新讀取。', true);
    }
    parsed.version = (Number(parsed.version) || 0) + 1;
    const newContent = `${JSON.stringify(parsed, null, 2)}\n`;
    try {
      setStatus(statusEl, '送出中…');
      const result = await putFile(FILE_PATH, newContent, currentSha, `punctuation-screenshot: bump version to ${parsed.version}`, token);
      currentSha = result.sha;
      currentConfig = parsed;
      editor.value = newContent;
      versionDisplay.textContent = parsed.version;
      populateJumpSelect(parsed);
      updatePasteDisplay(parsed);
      setStatus(
        statusEl,
        `已送出，版本號更新為 ${parsed.version}。網站正在重新部署（約1-3分鐘），完成後所有學生下次載入頁面時進度會自動清空重來。`
      );
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
      return setStatus(statusEl, '內容不是合法的JSON格式，請檢查後再試一次（多一個逗號、少一個引號都會失敗）。', true);
    }
    if (!currentSha && !(await loadContent())) return;
    const newContent = `${JSON.stringify(parsed, null, 2)}\n`;
    try {
      setStatus(statusEl, '送出中…');
      const result = await putFile(FILE_PATH, newContent, currentSha, 'punctuation-screenshot: update content via admin panel', token);
      currentSha = result.sha;
      currentConfig = parsed;
      versionDisplay.textContent = parsed.version;
      populateJumpSelect(parsed);
      updatePasteDisplay(parsed);
      setStatus(statusEl, '已送出，網站正在重新部署（約1-3分鐘）。');
    } catch (err) {
      setStatus(statusEl, err.message, true);
    }
  });

  panel.querySelector('[data-toggle-paste-btn]').addEventListener('click', async () => {
    const token = getToken();
    if (!token) return setStatus(pasteToggleStatus, '請先在上方儲存 GitHub Token。', true);
    if (!currentSha && !(await loadContent())) return;
    let parsed;
    try {
      parsed = JSON.parse(editor.value);
    } catch {
      return setStatus(pasteToggleStatus, '目前編輯框裡的內容不是合法的JSON，請先修正或重新讀取。', true);
    }
    parsed.allowPaste = !parsed.allowPaste;
    const newContent = `${JSON.stringify(parsed, null, 2)}\n`;
    try {
      setStatus(pasteToggleStatus, '送出中…');
      const result = await putFile(
        FILE_PATH,
        newContent,
        currentSha,
        `punctuation-screenshot: ${parsed.allowPaste ? 'allow' : 'disallow'} paste`,
        token
      );
      currentSha = result.sha;
      currentConfig = parsed;
      editor.value = newContent;
      updatePasteDisplay(parsed);
      setStatus(
        pasteToggleStatus,
        `已切換為「${parsed.allowPaste ? '可以複製貼上' : '不能複製貼上'}」，網站正在重新部署（約1-3分鐘）。`
      );
    } catch (err) {
      setStatus(pasteToggleStatus, err.message, true);
    }
  });

  panel.querySelector('[data-jump-btn]').addEventListener('click', () => {
    if (!currentConfig) return setStatus(jumpStatus, '請先讀取目前內容。', true);
    const targetIndex = Number(jumpSelect.value);
    const fragments = currentConfig.levels.slice(0, targetIndex).map((lvl) => lvl.fragment ?? '');
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ version: currentConfig.version, currentLevel: targetIndex, fragments, quoteAssignment: {} })
    );
    setStatus(jumpStatus, `已將這台裝置的進度跳到「${currentConfig.levels[targetIndex].title}」。重新整理特務闖關頁面即可看到。`);
  });

  // Show current version / paste status right away instead of leaving them
  // at "—" until the teacher thinks to click "讀取目前內容" first.
  if (getToken()) loadContent();
}
