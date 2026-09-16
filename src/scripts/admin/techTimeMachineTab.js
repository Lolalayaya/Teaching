import { fetchFile, putFile, getToken, fetchLatestCommitDate, formatCommitTime } from './githubApi.js';

const FILE_PATH = 'src/content/tech-time-machine.config.json';
const PROGRESS_KEY = 'teaching-site:tech-time-machine';
const BUMP_MESSAGE_PREFIX = 'tech-time-machine: bump version to ';

export function initTechTimeMachineTab() {
  const panel = document.querySelector('[data-tab-panel][data-tab="tech-time-machine"]');
  panel.innerHTML = `
    <h2>目前狀態</h2>
    <button type="button" data-load-btn>讀取目前內容</button>
    <p data-status class="status"></p>
    <p>目前版本號：<strong data-version-display>—</strong>（上次 +1 的時間：<strong data-version-time-display>—</strong>）</p>

    <h2>快速重置所有學生進度</h2>
    <p>版本號 +1 並發布，網站重新部署完成後，所有學生下次打開科技生活時光機頁面時，進度會自動清空重新開始。</p>
    <button type="button" data-bump-version-btn>版本號 +1 並發布</button>

    <h2>跳到特定關卡（僅影響這台裝置）</h2>
    <p>這個工具只會改變<strong>目前這台瀏覽器</strong>的解謎進度，不會影響任何學生的裝置——純粹方便你自己測試某一關的畫面，不用每次都從頭解過去。</p>
    <label>
      選擇關卡
      <select data-jump-select></select>
    </label>
    <button type="button" data-jump-btn>跳到這一關（並補上前面的密文片段）</button>
    <p data-jump-status class="status"></p>

    <h2>完整內容編輯</h2>
    <p>直接編輯下面的JSON（題目、答案、線索片段、表單網址都在裡面），改完按「儲存並發布」會直接提交到repo並觸發網站重新部署，大約1-3分鐘後正式上線。</p>
    <textarea data-content-editor rows="28" class="content-editor" spellcheck="false"></textarea>
    <button type="button" data-save-content-btn>儲存並發布</button>
  `;

  const statusEl = panel.querySelector('[data-status]');
  const versionDisplay = panel.querySelector('[data-version-display]');
  const versionTimeDisplay = panel.querySelector('[data-version-time-display]');
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
      setStatus(statusEl, '讀取成功。');
      versionTimeDisplay.textContent = '讀取中…';
      fetchLatestCommitDate(FILE_PATH, BUMP_MESSAGE_PREFIX, token)
        .then((date) => {
          versionTimeDisplay.textContent = formatCommitTime(date);
        })
        .catch(() => {
          versionTimeDisplay.textContent = '未知';
        });
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
      const result = await putFile(FILE_PATH, newContent, currentSha, `${BUMP_MESSAGE_PREFIX}${parsed.version}`, token);
      currentSha = result.sha;
      currentConfig = parsed;
      editor.value = newContent;
      versionDisplay.textContent = parsed.version;
      versionTimeDisplay.textContent = formatCommitTime(new Date().toISOString());
      populateJumpSelect(parsed);
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
      const result = await putFile(FILE_PATH, newContent, currentSha, 'tech-time-machine: update content via admin panel', token);
      currentSha = result.sha;
      currentConfig = parsed;
      versionDisplay.textContent = parsed.version;
      populateJumpSelect(parsed);
      setStatus(statusEl, '已送出，網站正在重新部署（約1-3分鐘）。');
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
    // 跳關屬於重新測試流程,順便清掉「表單已完成／任務已完成」這兩個殘留旗標,
    // 不然之後玩到最後一關會直接跳過表單畫面(這兩個旗標一旦設定就會永久留著,
    // 只有 reset 按鈕或版本號+1才會清)。
    localStorage.removeItem('teaching-site:tech-time-machine-form-done');
    localStorage.removeItem('teaching-site:tech-time-machine-completed');
    setStatus(jumpStatus, `已將這台裝置的進度跳到「${currentConfig.levels[targetIndex].title}」（並清掉表單/完成旗標）。重新整理科技生活時光機頁面即可看到。`);
  });

  // 如果已經存好 Token,一開啟頁面就自動讀取目前內容,不用等老師手動按「讀取」
  // 關卡下拉選單才會有東西可以選(punctuation-screenshot 那邊本來就有這行,這裡是補齊)。
  if (getToken()) loadContent();
}
