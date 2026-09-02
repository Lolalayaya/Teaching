export { checkChoice, checkMatchPairs } from './escapeRoom.js';

const STORAGE_KEY = 'teaching-site:tech-time-machine';
const COMPLETED_KEY = 'teaching-site:tech-time-machine-completed';
const FORM_DONE_KEY = 'teaching-site:tech-time-machine-form-done';

/** Marked the moment the finale is reached — read by the recap lecture page to unlock itself. */
export function markCompleted() {
  localStorage.setItem(COMPLETED_KEY, '1');
}

/**
 * The Google Form quiz gate between "all levels solved" and the finale
 * screen. Set either by the student clicking the self-report "I filled it
 * out" button, or automatically on load if the page was opened with the
 * `?done=1` query param (the link Google Forms shows on its post-submission
 * confirmation screen) — see readFormDoneFromUrl().
 */
export function markFormDone() {
  localStorage.setItem(FORM_DONE_KEY, '1');
}

export function readFormDone() {
  return localStorage.getItem(FORM_DONE_KEY) === '1';
}

/** Neither a real verification nor tamper-proof (a student could type the param by hand) — see the admin-panel-adjacent tradeoff note in the teacher notes. */
export function readFormDoneFromUrl() {
  return new URLSearchParams(window.location.search).get('done') === '1';
}

function clearCompleted() {
  localStorage.removeItem(COMPLETED_KEY);
  localStorage.removeItem(FORM_DONE_KEY);
}

export function readProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.currentLevel !== 'number' || !Array.isArray(parsed.fragments)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveProgress(version, currentLevel, fragments) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version, currentLevel, fragments }));
}

export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
  clearCompleted();
}

/**
 * Loads progress for the given content version. If nothing is stored, or the
 * stored version doesn't match, progress is wiped and a fresh state is
 * returned — same "force everyone back to the start" mechanism as the
 * escape room / punctuation-screenshot missions.
 */
export function loadOrResetProgress(currentVersion) {
  const stored = readProgress();
  if (!stored || stored.version !== currentVersion) {
    const fresh = { version: currentVersion, currentLevel: 0, fragments: [] };
    saveProgress(fresh.version, fresh.currentLevel, fresh.fragments);
    clearCompleted();
    return fresh;
  }
  return stored;
}
