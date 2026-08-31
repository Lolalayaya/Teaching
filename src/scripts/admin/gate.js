import { setToken, getToken } from './githubApi.js';

export function initGate({ password, onUnlock, autoUnlock = false }) {
  const gate = document.querySelector('[data-gate]');
  const shell = document.querySelector('[data-admin-shell]');
  const gateError = document.querySelector('[data-gate-error]');
  const passwordInput = document.querySelector('[data-password-input]');
  const unlockBtn = document.querySelector('[data-unlock-btn]');

  function unlock() {
    gate.hidden = true;
    shell.hidden = false;
    const patInput = document.querySelector('[data-pat-input]');
    if (patInput) patInput.value = getToken();
    onUnlock();
  }

  // 已經在全站門用老師密碼解鎖過了，這裡就不用再問一次密碼。
  if (autoUnlock) {
    unlock();
    return;
  }

  unlockBtn.addEventListener('click', () => {
    if (passwordInput.value === password) {
      unlock();
    } else {
      gateError.hidden = false;
    }
  });
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') unlockBtn.click();
  });

  function savePat() {
    const patInput = document.querySelector('[data-pat-input]');
    if (!patInput) return;
    setToken(patInput.value.trim());
    const status = document.querySelector('[data-pat-status]');
    if (status) status.textContent = '✅ Token 已儲存在這台電腦（其他電腦要各自輸入一次,所有分頁共用同一組）。';
  }

  document.querySelector('[data-save-pat-btn]')?.addEventListener('click', savePat);
  // 密碼欄位按 Enter 可以直接解鎖,Token 欄位補上同樣的習慣,
  // 否則貼上 Token 後按 Enter 什麼都不會發生,使用者容易誤以為存好了、
  // 重新整理後才發現其實從頭到尾沒存進 localStorage。
  document.querySelector('[data-pat-input]')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') savePat();
  });
}
