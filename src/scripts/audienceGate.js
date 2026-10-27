import { readUnlock } from './siteGate.js';
import { readSelection, classCode } from './classSelection.js';

// detail 頁面用:lecture frontmatter 設了 `classes`(例如還沒輪到的班級不能提早
// 看到下一週內容/作業)時,預設鎖住,只有班級符合或老師模式才看得到完整內容。
export function initAudienceGate() {
  const isTeacher = readUnlock()?.mode === 'teacher';
  const selection = readSelection();
  const code = selection ? classCode(selection) : null;

  document.querySelectorAll('[data-audience-gate]').forEach((wrapper) => {
    const classes = (wrapper.dataset.audienceClasses ?? '').split(',').filter(Boolean);
    const allowed = isTeacher || (code !== null && classes.includes(code));
    if (!allowed) return;

    const notice = wrapper.querySelector('[data-audience-locked]');
    const content = wrapper.querySelector('[data-audience-content]');
    if (notice) notice.hidden = true;
    if (content) content.hidden = false;
  });
}

// 講義內文用:每班各自一份的內容(例如每班不同的練習檔連結)標上
// `data-only-class="701"` 並預設 hidden,只有登入班級相符的學生看得到,老師模式全部顯示。
// 跟上面的 classes 一樣只是擋住大部分學生,連結本身還是在頁面原始碼裡。
export function initClassOnlyBlocks() {
  const isTeacher = readUnlock()?.mode === 'teacher';
  const selection = readSelection();
  const code = selection ? classCode(selection) : null;

  document.querySelectorAll('[data-only-class]').forEach((el) => {
    if (isTeacher || el.dataset.onlyClass === code) el.hidden = false;
  });
}
