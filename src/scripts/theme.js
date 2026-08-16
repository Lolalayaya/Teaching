const STORAGE_KEY = 'teaching-site:theme';

function getSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
}

function getEffectiveTheme() {
  const saved = getSavedTheme();
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function initThemeToggle() {
  const button = document.querySelector('[data-theme-toggle]');
  if (!button) return;

  function updateLabel(theme) {
    button.textContent = theme === 'dark' ? '切換為淺色' : '切換為深色';
  }

  updateLabel(getEffectiveTheme());

  button.addEventListener('click', () => {
    const next = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage unavailable — theme still applies for this page view */
    }
    updateLabel(next);
  });
}
