import { readSelection, writeSelection, clearSelection, classCode } from './classSelection.js';
import { CLASS_PASSWORDS, TEACHER_PASSWORD } from './classPasswords.js';
import { TAUGHT_CLASSES } from './classOptions.js';

// 必須跟 BaseLayout.astro 裡 <head> 那段 is:inline 的檢查用同一把 key，
// 否則畫面一開始會先閃一下沒鎖定的內容。
const UNLOCK_KEY = 'teaching-site:unlock';

export function readUnlock() {
  try {
    const raw = localStorage.getItem(UNLOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || (parsed.mode !== 'class' && parsed.mode !== 'teacher')) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function unlockAsTeacher() {
  localStorage.setItem(UNLOCK_KEY, JSON.stringify({ mode: 'teacher' }));
  clearSelection();
}

export function unlockAsClass(grade, cls) {
  localStorage.setItem(UNLOCK_KEY, JSON.stringify({ mode: 'class', grade, cls }));
  writeSelection(grade, cls);
}

export function lock() {
  localStorage.removeItem(UNLOCK_KEY);
  clearSelection();
}

// 回傳 'teacher'、'class' 或 null（密碼錯誤）。
export function checkPassword(grade, cls, password) {
  if (password && password === TEACHER_PASSWORD) return 'teacher';
  if (!grade || !cls) return null;
  const code = classCode({ grade, cls });
  if (password && CLASS_PASSWORDS[code] && password === CLASS_PASSWORDS[code]) return 'class';
  return null;
}

export function renderNavBadge(base) {
  const badge = document.querySelector('[data-nav-class-badge]');
  if (!badge) return;

  const unlock = readUnlock();
  if (unlock?.mode === 'teacher') {
    badge.innerHTML = `老師模式（顯示全部內容） · <button type="button" data-lock-btn>登出</button>`;
  } else if (unlock?.mode === 'class') {
    badge.innerHTML = `你的班級：${unlock.grade} 0 ${Number(unlock.cls)} <button type="button" data-lock-btn>登出／換班級</button>`;
  } else {
    const selection = readSelection();
    badge.innerHTML = selection
      ? `你的班級：${selection.grade} 0 ${Number(selection.cls)} `
      : '尚未選擇班級';
    return;
  }

  badge.querySelector('[data-lock-btn]')?.addEventListener('click', () => {
    lock();
    window.location.href = base;
  });
}

export function initSiteGate() {
  const gate = document.querySelector('[data-site-gate]');
  const shell = document.querySelector('[data-site-shell]');
  if (!gate || !shell) return;

  if (readUnlock()) return; // 已解鎖，CSS 已經在顯示 shell 了，不用再做事。

  const form = gate.querySelector('[data-gate-form]');
  const gradeSelect = gate.querySelector('[data-gate-grade]');
  const classSelect = gate.querySelector('[data-gate-class]');
  const passwordInput = gate.querySelector('[data-gate-password]');
  const error = gate.querySelector('[data-gate-error]');

  gradeSelect?.addEventListener('change', () => {
    const classNumbers = TAUGHT_CLASSES[gradeSelect.value] ?? [];
    classSelect.innerHTML =
      '<option value="" disabled selected>請選擇</option>' +
      classNumbers.map((c) => `<option value="${c}">${Number(c)} 班</option>`).join('');
    classSelect.disabled = classNumbers.length === 0;
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const grade = String(data.get('grade') ?? '');
    const cls = String(data.get('cls') ?? '');
    const password = String(data.get('password') ?? '');

    const result = checkPassword(grade, cls, password);
    if (result === 'teacher') {
      unlockAsTeacher();
      window.location.reload();
    } else if (result === 'class') {
      unlockAsClass(grade, cls);
      window.location.reload();
    } else {
      error.hidden = false;
    }
  });
}
