import { setToken, getToken } from './githubApi.js';

export function initGate({ password, onUnlock }) {
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

  document.querySelector('[data-save-pat-btn]')?.addEventListener('click', () => {
    const patInput = document.querySelector('[data-pat-input]');
    setToken(patInput.value.trim());
    const status = document.querySelector('[data-pat-status]');
    if (status) status.textContent = 'Token 已儲存在這台電腦（其他電腦要各自輸入一次,所有分頁共用同一組）。';
  });
}
