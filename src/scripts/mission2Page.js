import config from '../content/mission-2.config.json';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
  readProgress,
  saveProgress,
  clearProgress,
  loadOrResetProgress,
  markCompleted,
  pickQuoteAssignment,
  checkChoice,
  checkChoiceMulti,
  checkTextExactStrict,
} from './mission2.js';

const STEPS = config.levels;
const QUOTE_LEVEL_IDS = STEPS.filter((l) => l.type === 'quote-exact').map((l) => l.id);

const introScreen = document.querySelector('[data-intro-screen]');
const finaleScreen = document.querySelector('[data-finale-screen]');
const levelSections = [...document.querySelectorAll('[data-level-index]')];
const bannerChars = [...document.querySelectorAll('[data-progress-banner] [data-idx]')];

function getAssignedQuoteText(levelId) {
  const progress = readProgress();
  const quoteId = progress?.quoteAssignment?.[levelId];
  const quote = config.quoteBank.quotes.find((q) => q.id === quoteId);
  return quote ? quote.text : '';
}

function render(index) {
  introScreen.hidden = index !== -1;
  levelSections.forEach((el) => {
    const i = Number(el.dataset.levelIndex);
    el.hidden = i !== index;
    if (i !== index) return;

    const level = STEPS[i];
    if (level.type === 'quote-exact') {
      const slot = el.querySelector('[data-quote-slot]');
      if (slot) slot.textContent = getAssignedQuoteText(level.id);
    }
    if (level.type === 'qr-paste') {
      const canvas = el.querySelector('[data-qr-canvas]');
      if (canvas) QRCode.toCanvas(canvas, level.secret, { width: 180, margin: 1 }, () => {});
    }
  });

  const showFinale = index === STEPS.length;
  finaleScreen.hidden = !showFinale;
  if (showFinale) {
    markCompleted();
    revealFinale();
  }
}

function setBannerChar(i, ch, animate) {
  const span = bannerChars[i];
  if (!span) return;
  span.textContent = ch === ' ' ? ' ' : ch;
  if (animate) {
    requestAnimationFrame(() => span.classList.add('revealed'));
  } else {
    span.classList.add('revealed');
  }
}

function revealFragment(fragment, startIndex, animate) {
  [...fragment].forEach((ch, i) => {
    if (animate) {
      setTimeout(() => setBannerChar(startIndex + i, ch, true), i * 55);
    } else {
      setBannerChar(startIndex + i, ch, false);
    }
  });
}

/** Decodes a QR code out of a clipboard image item; returns the encoded text or null. */
async function decodeQrFromClipboardItem(item) {
  const blob = await item.getAsFile();
  if (!blob) return null;
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(imageData.data, imageData.width, imageData.height);
  return result ? result.data : null;
}

function validateLevel(level, index) {
  const section = levelSections[index];
  switch (level.type) {
    case 'choice': {
      const chosen = section.querySelector('[data-choice-option].selected');
      return chosen ? checkChoice(chosen.dataset.value, level.answer) : false;
    }
    case 'choice-multi': {
      const chosen = [...section.querySelectorAll('[data-choice-option].selected')].map((b) => b.dataset.value);
      return checkChoiceMulti(chosen, level.answers);
    }
    case 'text-exact-strict':
      return checkTextExactStrict(section.querySelector('[data-text-input]').value, level.answer);
    case 'quote-exact':
      return checkTextExactStrict(section.querySelector('[data-text-input]').value, getAssignedQuoteText(level.id));
    case 'search-query':
      return new RegExp(level.pattern).test(section.querySelector('[data-text-input]').value.trim());
    case 'qr-paste': {
      const zone = section.querySelector('[data-paste-zone]');
      const decoded = zone?.dataset.decoded || '';
      if (!decoded) {
        return { ok: false, message: '請先把截圖貼進上面的蒐證欄，成功讀到密語之後才能確認。' };
      }
      return { ok: checkTextExactStrict(decoded, level.secret) };
    }
    case 'filename-upload':
      return section.querySelector('[data-file-input]')?.dataset.valid === '1';
    default:
      return false;
  }
}

function handleSubmit(index) {
  const level = STEPS[index];
  const section = levelSections[index];
  const feedback = section.querySelector('[data-feedback]');

  // See the matching guard in escapeRoomPage.js: without this, submitting an
  // already-correct level a second time during the 500ms transition window
  // (Enter, then also clicking submit; a fast double-click) double-pushes
  // this level's fragment, which shifts every later fragment past the
  // fixed-length reveal banner and drops them silently.
  if (section.dataset.solved === 'true') return;

  const result = validateLevel(level, index);
  const ok = typeof result === 'boolean' ? result : result.ok;
  const customMessage = typeof result === 'object' ? result.message : null;

  section.classList.remove('shake');

  if (ok) {
    section.dataset.solved = 'true';
    feedback.textContent = '答對了！';
    feedback.classList.remove('wrong');
    feedback.classList.add('correct');
    section.classList.add('flash-correct');

    const state = readProgress() ?? { version: config.version, currentLevel: index, fragments: [], quoteAssignment: {} };
    const fragments = [...state.fragments];
    if (level.fragment) {
      const startIndex = fragments.join('').length;
      fragments.push(level.fragment);
      revealFragment(level.fragment, startIndex, true);
    }
    const nextIndex = index + 1;
    saveProgress(config.version, nextIndex, fragments, state.quoteAssignment);

    setTimeout(() => {
      section.classList.remove('flash-correct');
      render(nextIndex);
    }, 500);
  } else {
    feedback.textContent = customMessage || '再想想看，這個答案不太對喔！';
    feedback.classList.remove('correct');
    feedback.classList.add('wrong');
    void section.offsetWidth;
    section.classList.add('shake');
  }
}

levelSections.forEach((section, index) => {
  section.querySelector('[data-submit-btn]').addEventListener('click', () => handleSubmit(index));

  section.querySelectorAll('[data-choice-option]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (STEPS[index].type === 'choice-multi') {
        btn.classList.toggle('selected');
      } else {
        section.querySelectorAll('[data-choice-option]').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
      }
    });
  });

  section.querySelectorAll('input[type="text"]').forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSubmit(index);
    });

    // These levels test whether you can actually produce the punctuation/emoji
    // yourself — pasting it in would skip the whole point of the exercise.
    // The emoji level (text-exact-strict) is always locked — there's no
    // legitimate reason to paste a single emoji. The punctuation levels
    // (quote-exact) respect `allowPaste`, a teacher-side escape hatch (admin
    // panel) for when a student is genuinely stuck and needs the block lifted.
    const isEmojiLevel = STEPS[index].type === 'text-exact-strict';
    const isPunctuationLevel = STEPS[index].type === 'quote-exact';
    if (isEmojiLevel || (isPunctuationLevel && !config.allowPaste)) {
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const feedback = section.querySelector('[data-feedback]');
        feedback.textContent = '這一關要自己打出來，這裡沒辦法貼上喔！';
        feedback.classList.remove('correct');
        feedback.classList.add('wrong');
      });
    }
  });

  section.querySelectorAll('[data-paste-zone]').forEach((zone) => {
    zone.addEventListener('paste', async (e) => {
      e.preventDefault();
      const status = section.querySelector('[data-paste-status]');
      const items = [...(e.clipboardData?.items ?? [])];
      const imageItem = items.find((it) => it.type.startsWith('image/'));

      if (!imageItem) {
        zone.dataset.decoded = '';
        status.textContent = '⚠️ 沒有偵測到圖片，請確認你貼上的是剛剛截的圖，不是文字。';
        status.classList.remove('correct');
        status.classList.add('wrong');
        return;
      }

      status.textContent = '解讀中…';
      status.classList.remove('correct', 'wrong');

      const decoded = await decodeQrFromClipboardItem(imageItem);
      if (!decoded) {
        zone.dataset.decoded = '';
        status.textContent = '⚠️ 沒有偵測到完整的 QR code，請確認截圖有完整框住 QR code、沒有裁切到邊緣，再截一次貼上一次。';
        status.classList.add('wrong');
        return;
      }

      zone.dataset.decoded = decoded;
      status.textContent = '✅ 已讀取到密語，請按下方按鈕確認。';
      status.classList.remove('wrong');
      status.classList.add('correct');
    });
  });

  section.querySelectorAll('[data-file-input]').forEach((input) => {
    input.addEventListener('change', () => {
      const status = section.querySelector('[data-file-status]');
      const file = input.files && input.files[0];
      if (!file) return;
      const pattern = new RegExp(STEPS[index].pattern, 'i');
      const ok = pattern.test(file.name);
      input.dataset.valid = ok ? '1' : '0';
      status.textContent = ok
        ? `✅ 檔名格式正確：${file.name}`
        : '❌ 檔名格式不對，請對照上面的表格檢查每一段，例如 701_05_王小明_0907截圖任務.png';
      status.classList.toggle('correct', ok);
      status.classList.toggle('wrong', !ok);
    });
  });
});

document.querySelector('[data-start-btn]').addEventListener('click', () => {
  const state = readProgress() ?? { version: config.version, currentLevel: 0, fragments: [] };
  render(state.currentLevel);
});

document.querySelector('[data-reset-btn]').addEventListener('click', () => {
  if (window.confirm('確定要重新開始嗎？目前的進度會被清空。')) {
    clearProgress();
    location.reload();
  }
});

// --- Finale --------------------------------------------------------------

function playCelebrationChime() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.55);
  });
}

document.querySelector('[data-play-audio-btn]').addEventListener('click', playCelebrationChime);

function revealFinale() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finaleTextEl = document.querySelector('[data-finale-text]');
  const bridgeCard = document.querySelector('[data-bridge-card]');
  const recapLink = document.querySelector('[data-recap-link]');
  const audioBtn = document.querySelector('[data-play-audio-btn]');

  if (reduceMotion) {
    finaleScreen.classList.add('stamped');
    finaleTextEl.hidden = false;
    bridgeCard.hidden = false;
    recapLink.hidden = false;
    audioBtn.hidden = false;
    return;
  }

  finaleScreen.classList.add('stamped');
  setTimeout(() => {
    finaleTextEl.hidden = false;
    recapLink.hidden = false;
    audioBtn.hidden = false;
  }, 550);
  setTimeout(() => {
    bridgeCard.hidden = false;
  }, 900);
}

// --- Initial load ----------------------------------------------------------

const state = loadOrResetProgress(config.version);
if (QUOTE_LEVEL_IDS.length && Object.keys(state.quoteAssignment).length === 0) {
  state.quoteAssignment = pickQuoteAssignment(config.quoteBank.quotes, QUOTE_LEVEL_IDS);
  saveProgress(state.version, state.currentLevel, state.fragments, state.quoteAssignment);
}

let acc = 0;
state.fragments.forEach((frag) => {
  revealFragment(frag, acc, false);
  acc += frag.length;
});

const isFreshStart = state.currentLevel === 0 && state.fragments.length === 0;
render(isFreshStart ? -1 : state.currentLevel);
