import { readSelection, writeSelection, clearSelection, classCode } from './classSelection.js';
import { CLASS_PASSWORDS, TEACHER_PASSWORD, GATE_SESSION_VERSION } from './classPasswords.js';
import { TAUGHT_CLASSES } from './classOptions.js';

// 必須跟 BaseLayout.astro 裡 <head> 那段 is:inline 的檢查用同一把 key，
// 否則畫面一開始會先閃一下沒鎖定的內容。
const UNLOCK_KEY = 'teaching-site:unlock';

// 學生的班級解鎖超過這個時間就要自動登出；老師模式不受影響，永遠不會過期。
// BaseLayout.astro 的 is:inline 預先檢查也有複製一份同樣的邏輯，兩邊要保持一致。
const CLASS_SESSION_MS = 60 * 60 * 1000; // 1 小時

// 逾時，或老師把 classPasswords.js 的 GATE_SESSION_VERSION 改過（用來一次
// 踢掉所有已登入的班級裝置）——兩種情況都視為這筆班級登入已經失效。
function isClassSessionInvalid(unlock) {
  const expired = !unlock.unlockedAt || Date.now() - unlock.unlockedAt > CLASS_SESSION_MS;
  const staleVersion = unlock.gateVersion !== GATE_SESSION_VERSION;
  return expired || staleVersion;
}

export function readUnlock() {
  try {
    const raw = localStorage.getItem(UNLOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || (parsed.mode !== 'class' && parsed.mode !== 'teacher')) return null;
    if (parsed.mode === 'class' && isClassSessionInvalid(parsed)) {
      localStorage.removeItem(UNLOCK_KEY);
      clearSelection();
      return null;
    }
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
  localStorage.setItem(
    UNLOCK_KEY,
    JSON.stringify({ mode: 'class', grade, cls, unlockedAt: Date.now(), gateVersion: GATE_SESSION_VERSION })
  );
  writeSelection(grade, cls);
}

// 讓「留在同一頁超過一小時沒有重新整理」的班級解鎖也會被踢出去，
// 不用等到下次重新整理才發現已經過期。老師模式不會被排程。
export function scheduleClassSessionExpiry() {
  const raw = localStorage.getItem(UNLOCK_KEY);
  if (!raw) return;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }
  if (!parsed || parsed.mode !== 'class') return;

  const remaining = CLASS_SESSION_MS - (Date.now() - (parsed.unlockedAt ?? 0));
  if (remaining <= 0) {
    lock();
    window.location.reload();
    return;
  }
  setTimeout(() => {
    lock();
    window.location.reload();
  }, remaining);
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

  scheduleClassSessionExpiry();

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
