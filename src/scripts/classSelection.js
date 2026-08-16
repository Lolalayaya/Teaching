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

export function applyClassFilter() {
  const selection = readSelection();
  const items = document.querySelectorAll('[data-audience]');
  const notice = document.querySelector('[data-filter-notice]');

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

    item.classList.toggle('is-filtered-out', !(gradeMatches && classMatches));
  });

  if (notice) {
    notice.hidden = false;
    notice.textContent = `目前只顯示 ${selection.grade} 年級 ${Number(selection.cls)} 班的內容(篩選功能,不是存取限制,任何人都能看到全部內容)。`;
  }
}

export function renderNavBadge(base) {
  const badge = document.querySelector('[data-nav-class-badge]');
  if (!badge) return;
  const selection = readSelection();
  if (selection) {
    badge.innerHTML = `你的班級:${selection.grade} 年 ${Number(selection.cls)} 班 · <a href="${base}select-class/">更改</a>`;
  } else {
    badge.innerHTML = `<a href="${base}select-class/">尚未選擇班級</a>`;
  }
}
