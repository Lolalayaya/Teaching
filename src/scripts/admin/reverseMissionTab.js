import { fetchFile, putFile, getToken, fetchLatestCommitDate, formatCommitTime } from './githubApi.js';

const FILE_PATH = 'src/content/reverse-mission.config.json';
const PROGRESS_KEY = 'teaching-site:reverse-mission';
const COMPLETED_KEY = 'teaching-site:reverse-mission-completed';
const BUMP_MESSAGE_PREFIX = 'reverse-mission: bump version to ';

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** One line per answer, so the teacher can help a stuck student without opening the JSON. */
function answerLines(level) {
  switch (level.type) {
    case 'classify':
      return level.bins.map((bin, b) => {
        const items = level.items.filter((it) => it.bin === b).map((it) => it.text);
        return `${bin}：${items.join('／')}`;
      });
    case 'choice-multi':
      return [`要選：${level.answers.join('、')}`];
    case 'order': {
      const byId = Object.fromEntries(level.items.map((it) => [it.id, it.text]));
      return [
        '只檢查下面的先後關係，其他步驟放哪裡都可以：',
        ...level.rules
          .filter((r, i, all) => all.findIndex((x) => x.before === r.before && x.after === r.after) === i)
          .map((r) => `「${byId[r.before]}」要在「${byId[r.after]}」前面`),
      ];
    }
    case 'trace':
      return level.rows.map((row, i) => `第${i + 1}次 猜${row.guess}：${row.hint}，次數 ${row.count}`);
    case 'quiz':
      return level.questions.map((q, i) => `${i + 1}. ${q.prompt} → ${q.answer}`);
    default:
      return [];
  }
}

function renderAnswers(config) {
  return config.levels
    .map(
      (level, i) => `
      <details>
        <summary>第 ${i + 1} 關・${escapeHtml(level.title)}（${escapeHtml(level.stage)}）</summary>
        <ul>${answerLines(level).map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>
      </details>`
    )
    .join('');
}

export function initReverseMissionTab() {
  const panel = document.querySelector('[data-tab-panel][data-tab="reverse-mission"]');
  panel.innerHTML = `
    <h2>目前狀態</h2>
    <button type="button" data-load-btn>讀取目前內容</button>
    <p data-status class="status"></p>
    <p>目前版本號：<strong data-version-display>—</strong>（上次 +1 的時間：<strong data-version-time-display>—</strong>）</p>

    <h2>快速重置所有學生進度</h2>
    <p>版本號 +1 並發布，網站重新部署完成後，所有學生下次打開反轉行動闖關頁面時，進度會自動清空重新開始（複習頁也會重新上鎖）。</p>
    <button type="button" data-bump-version-btn>版本號 +1 並發布</button>

    <h2>各關答案一覽</h2>
    <p>學生卡關時可以對照這裡，不用打開下面的JSON。讀取目前內容後才會顯示。</p>
    <div data-answers class="answers-list"></div>

    <h2>跳到特定關卡（僅影響這台裝置）</h2>
    <p>這個工具只會改變<strong>目前這台瀏覽器</strong>的闖關進度，不會影響任何學生的裝置，方便你自己測試某一關的畫面，不用每次都從頭玩。</p>
    <label>
      選擇關卡
      <select data-jump-select></select>
    </label>
    <button type="button" data-jump-btn>跳到這一關（並補上前面的密碼片段）</button>
    <p data-jump-status class="status"></p>
    <p><a href="${import.meta.env.BASE_URL}reverse-mission/" target="_blank" rel="noopener">開啟反轉行動闖關頁面 →</a></p>

    <h2>完整內容編輯</h2>
    <p>直接編輯下面的JSON（題目、選項、答案、密碼片段都在裡面），改完按「儲存並發布」會直接提交到repo並觸發網站重新部署，大約1-3分鐘後正式上線。改了題目或答案，建議再按一次上面的「版本號 +1」，讓已經玩到一半的學生重新開始。</p>
    <textarea data-content-editor rows="28" class="content-editor" spellcheck="false"></textarea>
    <button type="button" data-save-content-btn>儲存並發布</button>
  `;

  const statusEl = panel.querySelector('[data-status]');
  const versionDisplay = panel.querySelector('[data-version-display]');
  const versionTimeDisplay = panel.querySelector('[data-version-time-display]');
  const answersEl = panel.querySelector('[data-answers]');
  const editor = panel.querySelector('[data-content-editor]');
  const jumpSelect = panel.querySelector('[data-jump-select]');
  const jumpStatus = panel.querySelector('[data-jump-status]');
  let currentSha = null;
  let currentConfig = null;

  function setStatus(el, message, isError) {
    el.textContent = message;
    el.classList.toggle('error', Boolean(isError));
  }

  function refreshDerived(config) {
    versionDisplay.textContent = config.version;
    jumpSelect.innerHTML = [
      ...config.levels.map((lvl, i) => `<option value="${i}">第 ${i + 1} 關 · ${escapeHtml(lvl.title)}</option>`),
      `<option value="${config.levels.length}">通關畫面</option>`,
    ].join('');
    answersEl.innerHTML = renderAnswers(config);
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
        setStatus(statusEl, '找不到這個檔案（如果新的闖關還沒推上GitHub，這裡會讀不到）。', true);
        return false;
      }
      currentSha = result.sha;
      currentConfig = JSON.parse(result.content);
      editor.value = result.content;
      refreshDerived(currentConfig);
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
      versionTimeDisplay.textContent = formatCommitTime(new Date().toISOString());
      refreshDerived(parsed);
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
      const result = await putFile(FILE_PATH, newContent, currentSha, 'reverse-mission: update content via admin panel', token);
      currentSha = result.sha;
      currentConfig = parsed;
      refreshDerived(parsed);
      setStatus(statusEl, '已送出，網站正在重新部署（約1-3分鐘）。');
    } catch (err) {
      setStatus(statusEl, err.message, true);
    }
  });

  panel.querySelector('[data-jump-btn]').addEventListener('click', () => {
    if (!currentConfig) return setStatus(jumpStatus, '請先讀取目前內容。', true);
    const targetIndex = Number(jumpSelect.value);
    const fragments = currentConfig.levels.slice(0, targetIndex).map((lvl) => lvl.fragment ?? '');
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ version: currentConfig.version, currentLevel: targetIndex, fragments }));
    // Jumping back into the levels is a re-test, so the recap should lock
    // again until the finale is reached for real (the finale itself re-sets it).
    localStorage.removeItem(COMPLETED_KEY);
    const label = targetIndex === currentConfig.levels.length ? '通關畫面' : `第 ${targetIndex + 1} 關「${currentConfig.levels[targetIndex].title}」`;
    setStatus(jumpStatus, `已將這台裝置的進度跳到${label}。重新整理反轉行動闖關頁面即可看到。`);
  });

  if (getToken()) loadContent();
}
