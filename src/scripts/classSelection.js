const STORAGE_KEY = 'teaching-site:class';

export function readSelection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.grade || !parsed.cls) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSelection(grade, cls) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ grade, cls }));
}

export function clearSelection() {
  localStorage.removeItem(STORAGE_KEY);
}

export function classCode(selection) {
  return `${selection.grade}${selection.cls}`;
}

// 跟 src/pages/lectures/[...slug].astro 內頁的解鎖判斷邏輯一致：
// 沒有設定解鎖條件 = 一直都看得到；有設定的話，日期到了或 localStorage 有對應 key 才算解鎖。
function isUnlocked(item) {
  const after = item.dataset.unlockAfter;
  const key = item.dataset.unlockKey;
  if (!after && !key) return true;
  const dateOk = Boolean(after) && new Date() >= new Date(after);
  const keyOk = Boolean(key) && Boolean(localStorage.getItem(key));
  return dateOk || keyOk;
}

export function applyClassFilter() {
  const selection = readSelection();
  const items = document.querySelectorAll('[data-audience]');
  const notice = document.querySelector('[data-filter-notice]');

  // 沒有班級選擇代表是老師模式(見 siteGate.js)，全部內容都看得到，
  // 包含還沒發布(data-published="false")的項目。
  if (!selection) {
    items.forEach((item) => item.classList.remove('is-filtered-out'));
    if (notice) notice.hidden = true;
    return;
  }

  const code = classCode(selection);

  items.forEach((item) => {
    const grades = (item.dataset.grades ?? '').split(',').filter(Boolean);
    const classes = (item.dataset.classes ?? '').split(',').filter(Boolean);

    const gradeMatches = grades.length === 0 || grades.includes(selection.grade);
    const classMatches = classes.length === 0 || classes.includes(code);
    const published = item.dataset.published !== 'false';
    const unlocked = isUnlocked(item);

    item.classList.toggle('is-filtered-out', !(gradeMatches && classMatches && published && unlocked));
  });

  if (notice) {
    notice.hidden = false;
    notice.textContent = `目前只顯示 ${selection.grade} 年級 ${Number(selection.cls)} 班的內容。`;
  }
}
