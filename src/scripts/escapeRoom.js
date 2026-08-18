const STORAGE_KEY = 'teaching-site:escape-room';

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
}

/**
 * Loads progress for the given content version. If nothing is stored, or the
 * stored version doesn't match (teacher bumped `version` in the content file
 * and redeployed), progress is wiped and a fresh state is returned — this is
 * the "force everyone back to the start" mechanism between class periods.
 */
export function loadOrResetProgress(currentVersion) {
  const stored = readProgress();
  if (!stored || stored.version !== currentVersion) {
    const fresh = { version: currentVersion, currentLevel: 0, fragments: [] };
    saveProgress(fresh.version, fresh.currentLevel, fresh.fragments);
    return fresh;
  }
  return stored;
}

function normalize(input) {
  return String(input ?? '').trim().toLowerCase();
}

// Strips common punctuation (keeps letters, numbers, spaces) for the
// "case matters, punctuation doesn't" checks.
function stripPunctuation(input) {
  return String(input ?? '')
    .replace(/[!,.?;:'"()\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Order-independent, case-insensitive match of a fixed set of single letters. */
export function checkLetters(inputs, answers) {
  const got = inputs.map(normalize).filter(Boolean).sort();
  const want = answers.map(normalize).sort();
  return got.length === want.length && got.every((v, i) => v === want[i]);
}

/** Single choice, case/whitespace-insensitive, against one or several accepted answers. */
export function checkChoice(input, acceptedAnswers) {
  const got = normalize(input);
  const accepted = (Array.isArray(acceptedAnswers) ? acceptedAnswers : [acceptedAnswers]).map(normalize);
  return accepted.includes(got);
}

/** Multi-select: the chosen set must exactly match the required set (order-independent). */
export function checkChoiceMulti(selected, required) {
  const got = selected.map(normalize).filter(Boolean).sort();
  const want = required.map(normalize).sort();
  return got.length === want.length && got.every((v, i) => v === want[i]);
}

/** All pairs in a matching-question must be correct. `answersByLeft` is { left: chosenValue }. */
export function checkMatchPairs(pairs, answersByLeft) {
  return pairs.every((pair) => normalize(answersByLeft[pair.left]) === normalize(pair.answer));
}

/** Plain case-insensitive text compare (level 8/9 style short answers). */
export function checkText(input, answer) {
  return normalize(input) === normalize(answer);
}

// Punctuation AND whitespace both dropped entirely (not just collapsed) —
// only the sequence of letters/case has to match.
function stripPunctuationAndSpace(input) {
  return stripPunctuation(input).replace(/\s+/g, '');
}

/** Case-SENSITIVE, but punctuation and spacing are both ignored (level 4-3's retyped sentence). */
export function checkTextNoPunctCaseSensitive(input, answer) {
  return stripPunctuationAndSpace(input) === stripPunctuationAndSpace(answer);
}

/** Fully strict: case, punctuation, and spacing must match exactly (level 10's final sentence). */
export function checkTextExactStrict(input, answer) {
  return String(input ?? '').trim() === String(answer ?? '').trim();
}

function hexToRgb(hex) {
  const clean = String(hex ?? '').trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/** Per-channel tolerance match against a target hex color. */
export function checkHexColor(input, targetHex, tolerance) {
  const got = hexToRgb(input);
  const want = hexToRgb(targetHex);
  if (!got || !want) return false;
  return (
    Math.abs(got.r - want.r) <= tolerance &&
    Math.abs(got.g - want.g) <= tolerance &&
    Math.abs(got.b - want.b) <= tolerance
  );
}
