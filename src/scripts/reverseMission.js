// Pure logic for the 8th-grade W11 "反轉行動" puzzle page — progress storage,
// answer checking for its level types, and the three guessing strategies the
// race widget simulates. Kept free of DOM access so it can be exercised in Node.
import { checkChoice, checkText } from './escapeRoom.js';

export { checkChoice, checkChoiceMulti } from './escapeRoom.js';

const STORAGE_KEY = 'teaching-site:reverse-mission';
const COMPLETED_KEY = 'teaching-site:reverse-mission-completed';

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

export function saveProgress(version, currentLevel, fragments) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version, currentLevel, fragments }));
}

export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
  clearCompleted();
}

/** Same "bump `version` in the config to send everyone back to the start" mechanism as the other puzzle pages. */
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

/** Number answers: fullwidth digits (Chinese IME) and stray commas/spaces are accepted. */
export function checkNumber(input, answer) {
  const cleaned = String(input ?? '').replace(/[,，\s　]/g, '');
  return checkText(cleaned, String(answer));
}

/**
 * Classify level: `chosen` maps item index → chosen bin index (or undefined).
 * Returns how many items are unanswered or in the wrong bin.
 */
export function countClassifyMistakes(items, chosen) {
  return items.reduce((n, item, i) => (chosen[i] === item.bin ? n : n + 1), 0);
}

/**
 * Order level: `sequence` is the list of item ids the student placed. Every
 * item must be placed, and every `{ before, after }` rule must hold — rules
 * express data dependencies only, so steps with no dependency (e.g. the
 * counter) may go anywhere. Returns null when correct, otherwise the first
 * broken rule's message (or a generic one when items are still missing).
 */
export function checkOrder(itemIds, rules, sequence) {
  if (sequence.length !== itemIds.length) {
    return '還有積木沒有排進迴圈裡喔！';
  }
  for (const rule of rules) {
    if (sequence.indexOf(rule.before) > sequence.indexOf(rule.after)) {
      return rule.message;
    }
  }
  return null;
}

/** Quiz level: returns the 1-based numbers of the questions answered wrong. */
export function findWrongQuestions(questions, answers) {
  const wrong = [];
  questions.forEach((q, i) => {
    const ok = q.kind === 'number' ? checkNumber(answers[i], q.answer) : checkChoice(answers[i] ?? '', q.answer);
    if (!ok) wrong.push(i + 1);
  });
  return wrong;
}

/** Trace level: each row needs the right hint and the right counter value. Returns 1-based wrong row numbers. */
export function findWrongTraceRows(rows, answers) {
  const wrong = [];
  rows.forEach((row, i) => {
    const a = answers[i] ?? {};
    if (!checkChoice(a.hint ?? '', row.hint) || !checkNumber(a.count, row.count)) wrong.push(i + 1);
  });
  return wrong;
}

// --- Guessing strategies (race widget) --------------------------------------

/** 依序猜: 1, 2, 3, … until the answer. */
export function playSequential(answer, low = 1) {
  const guesses = [];
  for (let g = low; g <= answer; g += 1) guesses.push(g);
  return guesses;
}

/** 猜中間: always the middle of what's still possible, rounded down — binary search. */
export function playBinary(answer, low = 1, high = 100) {
  const guesses = [];
  let lo = low;
  let hi = high;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    guesses.push(mid);
    if (mid === answer) break;
    if (mid > answer) hi = mid - 1;
    else lo = mid + 1;
  }
  return guesses;
}

/** 亂猜: any number that's still possible given the hints so far. `rand` is injectable for tests. */
export function playRandom(answer, low = 1, high = 100, rand = Math.random) {
  const guesses = [];
  let lo = low;
  let hi = high;
  while (lo <= hi) {
    const g = lo + Math.floor(rand() * (hi - lo + 1));
    guesses.push(g);
    if (g === answer) break;
    if (g > answer) hi = g - 1;
    else lo = g + 1;
  }
  return guesses;
}

/** Worst-case guess count for binary search over 1..n: ⌈log₂(n+1)⌉, computed by halving. */
export function binaryWorstCase(n) {
  let k = 0;
  let remaining = n;
  while (remaining >= 1) {
    remaining /= 2;
    k += 1;
  }
  return k;
}
