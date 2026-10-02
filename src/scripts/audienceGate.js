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
