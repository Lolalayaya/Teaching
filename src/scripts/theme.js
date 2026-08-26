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

const FAVICON_COLOR = { light: '#6B245F', dark: '#e796f3' };

function faviconSvgMarkup(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none"><g stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><rect x="18" y="22" width="74" height="62" rx="13"/><line x1="18" y1="42" x2="92" y2="42"/><line x1="30" y1="32" x2="58" y2="32"/><path d="M58 68 77.1 113.9 83.9 93.9 103.9 87.1Z"/></g></svg>`;
}

// The static favicon.svg file only follows the OS prefers-color-scheme —
// it can't see this page's manual light/dark override. When the user has
// picked an explicit theme, swap the <link> to a matching data: URI instead;
// with no explicit choice, leave the original file so it keeps auto-following
// the system setting.
let defaultFaviconHref = null;

function applyFavicon(theme, hasSavedTheme) {
  const link = document.querySelector('link[rel="icon"]');
  if (!link) return;
  if (defaultFaviconHref === null) {
    defaultFaviconHref = link.getAttribute('href');
  }
  if (hasSavedTheme) {
    link.setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent(faviconSvgMarkup(FAVICON_COLOR[theme])));
  } else {
    link.setAttribute('href', defaultFaviconHref);
  }
}

export function initThemeToggle() {
  const button = document.querySelector('[data-theme-toggle]');
  applyFavicon(getEffectiveTheme(), getSavedTheme() !== null);
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
    applyFavicon(next, true);
    updateLabel(next);
  });
}
