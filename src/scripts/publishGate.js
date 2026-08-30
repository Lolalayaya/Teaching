import { readUnlock } from './siteGate.js';

// detail 頁面用:「還沒公開」的內容預設鎖住,只有老師模式才看得到完整內容。
export function initPublishGate() {
  if (readUnlock()?.mode !== 'teacher') return;
  document.querySelectorAll('[data-publish-gate]').forEach((wrapper) => {
    const notice = wrapper.querySelector('[data-publish-locked]');
    const content = wrapper.querySelector('[data-publish-content]');
    if (notice) notice.hidden = true;
    if (content) content.hidden = false;
  });
}
