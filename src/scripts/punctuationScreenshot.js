export { checkChoice, checkChoiceMulti, checkTextExactStrict } from './escapeRoom.js';

const STORAGE_KEY = 'teaching-site:punctuation-screenshot';
const COMPLETED_KEY = 'teaching-site:punctuation-screenshot-completed';

/** Marked the moment the finale is reached — read by the recap lecture page to unlock itself. */
export function markCompleted() {
  localStorage.setItem(COMPLETED_KEY, '1');
}

function clearCompleted() {
  localStorage.removeItem(COMPLETED_KEY);
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

export function saveProgress(version, currentLevel, fragments, quoteAssignment) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version, currentLevel, fragments, quoteAssignment }));
}

export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
  clearCompleted();
}

/**
 * Loads progress for the given content version. If nothing is stored, or the
 * stored version doesn't match, progress is wiped and a fresh state is
 * returned — same "force everyone back to the start" mechanism as the
 * escape room.
 */
export function loadOrResetProgress(currentVersion) {
  const stored = readProgress();
  if (!stored || stored.version !== currentVersion) {
    const fresh = { version: currentVersion, currentLevel: 0, fragments: [], quoteAssignment: {} };
    saveProgress(fresh.version, fresh.currentLevel, fresh.fragments, fresh.quoteAssignment);
    clearCompleted();
    return fresh;
  }
  if (!stored.quoteAssignment) stored.quoteAssignment = {};
  return stored;
}

/**
 * Draws one quote per `levelIds`, without repeats, from `quotes` — so the
 * same student never has to retype the same quote twice across the three
 * punctuation-method levels. Drawn once per student (on first load) and
 * persisted in their saved progress, not re-rolled on every render.
 */
export function pickQuoteAssignment(quotes, levelIds) {
  const pool = [...quotes];
  const assignment = {};
  levelIds.forEach((id) => {
    const idx = Math.floor(Math.random() * pool.length);
    assignment[id] = pool.splice(idx, 1)[0].id;
  });
  return assignment;
}
