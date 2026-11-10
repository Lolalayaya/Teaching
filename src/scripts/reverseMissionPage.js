import config from '../content/reverse-mission.config.json';
import {
  readProgress,
  saveProgress,
  clearProgress,
  loadOrResetProgress,
  markCompleted,
  checkChoiceMulti,
  countClassifyMistakes,
  checkOrder,
  findWrongQuestions,
  findWrongTraceRows,
  playSequential,
  playRandom,
  playBinary,
} from './reverseMission.js';

const STEPS = config.levels;

const introScreen = document.querySelector('[data-intro-screen]');
const finaleScreen = document.querySelector('[data-finale-screen]');
const levelSections = [...document.querySelectorAll('[data-level-index]')];
const bannerChars = [...document.querySelectorAll('[data-progress-banner] [data-idx]')];

function render(index) {
  introScreen.hidden = index !== -1;
  levelSections.forEach((el) => {
    el.hidden = Number(el.dataset.levelIndex) !== index;
  });

  const showFinale = index === STEPS.length;
  finaleScreen.hidden = !showFinale;
  if (showFinale) {
    markCompleted();
    revealFinale();
  }
  window.scrollTo({ top: 0 });
}

function setBannerChar(i, ch, animate) {
  const span = bannerChars[i];
  if (!span) return;
  span.textContent = ch;
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

// --- Reading answers out of the DOM -----------------------------------------

function selectedValue(container) {
  return container.querySelector('[data-choice-option].selected')?.dataset.value ?? '';
}

function readQuizAnswers(section, level) {
  return level.questions.map((q, i) => {
    const box = section.querySelector(`[data-question="${i}"]`);
    return q.kind === 'number' ? box.querySelector('[data-number-input]').value : selectedValue(box);
  });
}

function wrongListMessage(numbers, unit) {
  return `第 ${numbers.join('、')} ${unit}還不對，再想想看！`;
}

/** Returns `true` when solved, or a message string explaining what's still wrong. */
function validateLevel(level, section) {
  switch (level.type) {
    case 'classify': {
      const chosen = level.items.map((_, i) => {
        const btn = section.querySelector(`[data-classify-row="${i}"] .bin-btn.selected`);
        return btn ? Number(btn.dataset.bin) : undefined;
      });
      if (chosen.some((c) => c === undefined)) return '每一件事都要選一個分類喔！';
      const n = countClassifyMistakes(level.items, chosen);
      return n === 0 ? true : level.wrongMessage.replace('{n}', n);
    }
    case 'choice-multi': {
      const chosen = [...section.querySelectorAll('[data-choice-option].selected')].map((b) => b.dataset.value);
      return checkChoiceMulti(chosen, level.answers) ? true : level.wrongMessage;
    }
    case 'order': {
      const sequence = [...section.querySelectorAll('[data-order-slots] [data-order-item]')].map((b) => b.dataset.orderItem);
      const message = checkOrder(level.items.map((it) => it.id), level.rules, sequence);
      return message ?? true;
    }
    case 'trace': {
      const answers = level.rows.map((_, i) => {
        const row = section.querySelector(`[data-trace-row="${i}"]`);
        return { hint: row.querySelector('[data-trace-hint]').value, count: row.querySelector('[data-trace-count]').value };
      });
      const wrong = findWrongTraceRows(level.rows, answers);
      return wrong.length === 0 ? true : wrongListMessage(wrong, '列');
    }
    case 'quiz': {
      const wrong = findWrongQuestions(level.questions, readQuizAnswers(section, level));
      return wrong.length === 0 ? true : wrongListMessage(wrong, '題');
    }
    default:
      return false;
  }
}

function handleSubmit(index) {
  const level = STEPS[index];
  const section = levelSections[index];
  const feedback = section.querySelector('[data-feedback]');

  // Guard against a double submit during the 500ms transition double-pushing
  // this level's fragment (same guard as the other puzzle pages).
  if (section.dataset.solved === 'true') return;

  const result = validateLevel(level, section);
  section.classList.remove('shake');

  if (result === true) {
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
    feedback.textContent = typeof result === 'string' ? result : '再想想看，這個答案不太對喔！';
    feedback.classList.remove('correct');
    feedback.classList.add('wrong');
    void section.offsetWidth;
    section.classList.add('shake');
  }
}

// --- Race widget --------------------------------------------------------------

const MAX_CHIPS = 14;

function renderLane(name, guesses) {
  const lane = document.createElement('div');
  lane.className = 'lane';

  const head = document.createElement('div');
  head.className = 'lane-head';
  const label = document.createElement('span');
  label.textContent = name;
  const count = document.createElement('span');
  count.className = 'lane-count';
  count.textContent = `猜了 ${guesses.length} 次`;
  head.append(label, count);

  const chips = document.createElement('div');
  chips.className = 'lane-chips';
  const shown =
    guesses.length > MAX_CHIPS ? [...guesses.slice(0, 8), null, ...guesses.slice(-4)] : guesses;
  shown.forEach((g, i) => {
    const chip = document.createElement('span');
    if (g === null) {
      chip.className = 'chip gap';
      chip.textContent = `…中間還有 ${guesses.length - 12} 次…`;
    } else {
      chip.className = i === shown.length - 1 ? 'chip hit' : 'chip';
      chip.textContent = g;
    }
    chips.append(chip);
  });

  lane.append(head, chips);
  return lane;
}

function initRace(section) {
  const race = section.querySelector('[data-race]');
  if (!race) return;
  const input = race.querySelector('[data-race-input]');
  const status = race.querySelector('[data-race-status]');
  const lanes = race.querySelector('[data-race-lanes]');

  const run = () => {
    const normalized = String(input.value).replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0)).trim();
    const answer = Number(normalized);
    if (!Number.isInteger(answer) || answer < 1 || answer > 100) {
      status.textContent = '請輸入1～100之間的整數。';
      return;
    }
    status.textContent = '';
    lanes.replaceChildren(
      renderLane('依序猜', playSequential(answer)),
      renderLane('亂猜', playRandom(answer)),
      renderLane('猜中間', playBinary(answer)),
    );
  };

  race.querySelector('[data-race-start]').addEventListener('click', run);
  race.querySelector('[data-race-random]').addEventListener('click', () => {
    input.value = 1 + Math.floor(Math.random() * 100);
    run();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') run();
  });
}

// --- Wiring ---------------------------------------------------------------------

levelSections.forEach((section, index) => {
  const level = STEPS[index];
  section.querySelector('[data-submit-btn]').addEventListener('click', () => handleSubmit(index));

  // Choice groups: single-select within each group, except the multi-select level.
  section.querySelectorAll('[data-choice-group]').forEach((group) => {
    group.querySelectorAll('[data-choice-option]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (level.type === 'choice-multi') {
          btn.classList.toggle('selected');
        } else {
          group.querySelectorAll('[data-choice-option]').forEach((b) => b.classList.remove('selected'));
          btn.classList.add('selected');
        }
      });
    });
  });

  // Classify: one bin per row.
  section.querySelectorAll('[data-classify-row]').forEach((row) => {
    row.querySelectorAll('.bin-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        row.querySelectorAll('.bin-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  });

  // Order: clicking a block moves it between the pool and the end of the loop body.
  const slots = section.querySelector('[data-order-slots]');
  const pool = section.querySelector('[data-order-pool]');
  if (slots && pool) {
    const emptyHint = slots.querySelector('[data-order-empty]');
    const syncEmpty = () => {
      emptyHint.hidden = slots.querySelector('[data-order-item]') !== null;
    };
    section.querySelectorAll('[data-order-item]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.closest('[data-order-slots]')) {
          const li = btn.parentElement;
          pool.append(btn);
          li.remove();
        } else {
          const li = document.createElement('li');
          li.append(btn);
          slots.append(li);
        }
        syncEmpty();
      });
    });
  }

  section.querySelectorAll('input[type="text"]:not([data-race-input])').forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSubmit(index);
    });
  });

  initRace(section);
});

// --- Finale -----------------------------------------------------------------------

function playCelebrationChime() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const notes = [523.25, 659.25, 783.99, 1046.5];
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

  finaleScreen.classList.add('stamped');
  const show = () => {
    finaleTextEl.hidden = false;
    recapLink.hidden = false;
    audioBtn.hidden = false;
  };
  if (reduceMotion) show();
  else setTimeout(show, 550);
}

// --- Initial load -----------------------------------------------------------------

const state = loadOrResetProgress(config.version);

let acc = 0;
state.fragments.forEach((frag) => {
  revealFragment(frag, acc, false);
  acc += frag.length;
});

const isFreshStart = state.currentLevel === 0 && state.fragments.length === 0;
render(isFreshStart ? -1 : state.currentLevel);

document.querySelector('[data-start-btn]').addEventListener('click', () => {
  const current = readProgress() ?? { currentLevel: 0 };
  render(current.currentLevel);
});

document.querySelector('[data-reset-btn]').addEventListener('click', () => {
  if (window.confirm('確定要重新開始嗎？目前的進度會被清空。')) {
    clearProgress();
    location.reload();
  }
});
