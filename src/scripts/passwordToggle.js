const EYE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>`;

const EYE_OFF = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c7 0 10.5 7 10.5 7a13.3 13.3 0 0 1-3.1 3.9"/><path d="M6.6 6.6C3.4 8.6 1.5 12 1.5 12s3.5 7 10.5 7a10.6 10.6 0 0 0 4.1-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>`;

// 每個 [data-toggle-password] 按鈕必須緊接在它要控制的 <input> 後面（同一個 .password-field 裡）。
export function initPasswordToggles(root = document) {
  root.querySelectorAll('[data-toggle-password]').forEach((btn) => {
    const input = btn.previousElementSibling;
    if (!(input instanceof HTMLInputElement)) return;

    btn.innerHTML = EYE;
    btn.setAttribute('aria-label', '顯示密碼');

    btn.addEventListener('click', () => {
      const willShow = input.type === 'password';
      input.type = willShow ? 'text' : 'password';
      btn.innerHTML = willShow ? EYE_OFF : EYE;
      btn.setAttribute('aria-label', willShow ? '隱藏密碼' : '顯示密碼');
    });
  });
}
