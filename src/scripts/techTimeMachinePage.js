import config from '../content/tech-time-machine.config.json';
import {
  readProgress,
  saveProgress,
  clearProgress,
  loadOrResetProgress,
  markCompleted,
  markFormDone,
  readFormDone,
  readFormDoneFromUrl,
  checkChoice,
  checkMatchPairs,
} from './techTimeMachine.js';

const STEPS = config.levels;

const introScreen = document.querySelector('[data-intro-screen]');
const formGateScreen = document.querySelector('[data-form-gate-screen]');
const finaleScreen = document.querySelector('[data-finale-screen]');
const levelSections = [...document.querySelectorAll('[data-level-index]')];
const bannerChars = [...document.querySelectorAll('[data-progress-banner] [data-idx]')];

function showFinale() {
  formGateScreen.hidden = true;
  finaleScreen.hidden = false;
  markCompleted();
  revealFinale();
}

function showFormGate() {
  formGateScreen.hidden = false;
  finaleScreen.hidden = true;
}

function render(index) {
  introScreen.hidden = index !== -1;
  levelSections.forEach((el) => {
    el.hidden = Number(el.dataset.levelIndex) !== index;
  });

  const allLevelsDone = index === STEPS.length;
  formGateScreen.hidden = !allLevelsDone || readFormDone();
  finaleScreen.hidden = true;

  if (allLevelsDone) {
    if (readFormDone()) {
      showFinale();
    } else {
      showFormGate();
    }
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

function validateLevel(level, index) {
  const section = levelSections[index];
  switch (level.type) {
    case 'match': {
      const answersByLeft = {};
      section.querySelectorAll('[data-match-left]').forEach((sel) => {
        answersByLeft[sel.dataset.matchLeft] = sel.value;
      });
      return checkMatchPairs(level.pairs, answersByLeft);
    }
    case 'choice': {
      const chosen = section.querySelector('[data-choice-option].selected');
      return chosen ? checkChoice(chosen.dataset.value, level.answer) : false;
    }
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
  // double-pushes this level's fragment, which shifts every later fragment
  // past the fixed-length reveal banner and drops them silently.
  if (section.dataset.solved === 'true') return;

  const ok = validateLevel(level, index);

  section.classList.remove('shake');

  if (ok) {
    section.dataset.solved = 'true';
    feedback.textContent = '答對了！';
    feedback.classList.remove('wrong');
    feedback.classList.add('correct');
    section.classList.add('flash-correct');

    const state = readProgress() ?? { version: config.version, currentLevel: index, fragments: [] };
    const fragments = [...state.fragments];
    if (level.fragment) {
      const startIndex = fragments.join('').length;
      fragments.push(level.fragment);
      revealFragment(level.fragment, startIndex, true);
    }
    const nextIndex = index + 1;
    saveProgress(config.version, nextIndex, fragments);

    setTimeout(() => {
      section.classList.remove('flash-correct');
      render(nextIndex);
    }, 500);
  } else {
    feedback.textContent = '再想想看，這個答案不太對喔！';
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
      section.querySelectorAll('[data-choice-option]').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
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

document.querySelector('[data-form-done-btn]').addEventListener('click', () => {
  markFormDone();
  showFinale();
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
  const recapLink = document.querySelector('[data-recap-link]');
  const audioBtn = document.querySelector('[data-play-audio-btn]');

  if (reduceMotion) {
    finaleScreen.classList.add('stamped');
    finaleTextEl.hidden = false;
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
}

// --- Initial load ----------------------------------------------------------

if (readFormDoneFromUrl()) {
  markFormDone();
  // Strip the query string so a page refresh/reset doesn't re-trigger this.
  history.replaceState(null, '', location.pathname + location.hash);
}

const state = loadOrResetProgress(config.version);

let acc = 0;
state.fragments.forEach((frag) => {
  revealFragment(frag, acc, false);
  acc += frag.length;
});

const isFreshStart = state.currentLevel === 0 && state.fragments.length === 0;
render(isFreshStart ? -1 : state.currentLevel);
