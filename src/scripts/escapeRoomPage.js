import config from '../content/escape-room.config.json';
import {
  readProgress,
  saveProgress,
  clearProgress,
  loadOrResetProgress,
  checkLetters,
  checkChoice,
  checkChoiceMulti,
  checkMatchPairs,
  checkText,
  checkTextNoPunctCaseSensitive,
  checkTextExactStrict,
  checkHexColor,
} from './escapeRoom.js';

const STEPS = config.levels;
const DECRYPT_STEP_INDEX = STEPS.findIndex((l) => l.id === '10-2');

const introScreen = document.querySelector('[data-intro-screen]');
const doorScreen = document.querySelector('[data-door-screen]');
const levelSections = [...document.querySelectorAll('[data-level-index]')];
const bannerChars = [...document.querySelectorAll('[data-progress-banner] [data-idx]')];

function render(index) {
  introScreen.hidden = index !== -1;
  levelSections.forEach((el) => {
    el.hidden = Number(el.dataset.levelIndex) !== index;
  });
  const showDoor = index === STEPS.length;
  doorScreen.hidden = !showDoor;
  if (showDoor) revealDoor();
}

function setBannerChar(i, ch, animate) {
  const span = bannerChars[i];
  if (!span) return;
  span.textContent = ch === ' ' ? ' ' : ch;
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

// Once the cipher is decrypted (level "10-2"), the banner "flips" from the
// raw ciphertext to the plain decrypted sentence for the rest of the game —
// seeing gibberish after you've already cracked it would read as a bug, not
// a puzzle.
function revealDecryptedBanner(animate) {
  [...config.finalSentenceEn].forEach((ch, i) => {
    if (animate) {
      setTimeout(() => setBannerChar(i, ch, true), i * 35);
    } else {
      setBannerChar(i, ch, false);
    }
  });
}

function validateLevel(level, index) {
  const section = levelSections[index];
  switch (level.type) {
    case 'letters': {
      const inputs = [...section.querySelectorAll('[data-letter-input]')].map((el) => el.value);
      return checkLetters(inputs, level.answers);
    }
    case 'match': {
      const answersByLeft = {};
      section.querySelectorAll('[data-match-left]').forEach((sel) => {
        answersByLeft[sel.dataset.matchLeft] = sel.value;
      });
      return checkMatchPairs(level.pairs, answersByLeft);
    }
    case 'choice': {
      const chosen = section.querySelector('[data-choice-option].selected');
      const accepted = level.acceptedAnswers ?? [level.answer];
      return chosen ? checkChoice(chosen.dataset.value, accepted) : false;
    }
    case 'choice-multi': {
      const chosen = [...section.querySelectorAll('[data-choice-option].selected')].map((b) => b.dataset.value);
      return checkChoiceMulti(chosen, level.answers);
    }
    case 'text':
    case 'number':
      return checkText(section.querySelector('[data-text-input]').value, level.answer);
    case 'text-nopunct-casesensitive':
      return checkTextNoPunctCaseSensitive(section.querySelector('[data-text-input]').value, level.answer);
    case 'text-exact-strict':
      return checkTextExactStrict(section.querySelector('[data-text-input]').value, level.answer);
    case 'hex-color':
      return checkHexColor(section.querySelector('[data-hex-input]').value, config.doorHex, config.doorHexTolerance);
    default:
      return false;
  }
}

function handleSubmit(index) {
  const level = STEPS[index];
  const section = levelSections[index];
  const feedback = section.querySelector('[data-feedback]');
  const ok = validateLevel(level, index);

  section.classList.remove('shake');

  if (ok) {
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
    if (index === DECRYPT_STEP_INDEX) {
      revealDecryptedBanner(true);
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
    // Force a reflow so a rapid re-click restarts the shake instead of no-op-ing.
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

  const hexInput = section.querySelector('[data-hex-input]');
  const colorInput = section.querySelector('[data-color-input]');
  if (hexInput && colorInput) {
    colorInput.addEventListener('input', () => {
      hexInput.value = colorInput.value;
    });
  }

  section.querySelectorAll('input[type="text"]').forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSubmit(index);
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

// --- Door finale --------------------------------------------------------

function spawnConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['var(--color-accent)', 'var(--color-accent-hover)', 'var(--color-correct)', 'var(--color-paper)'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    doorScreen.appendChild(piece);
    const anim = piece.animate(
      [
        { transform: 'translateY(-10vh) rotate(0deg)', opacity: 1 },
        { transform: `translateY(110vh) rotate(${360 + Math.random() * 360}deg)`, opacity: 1 },
      ],
      { duration: 2200 + Math.random() * 1200, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards' }
    );
    anim.onfinish = () => piece.remove();
  }
}

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

function revealDoor() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    doorScreen.classList.add('opening');
    setTimeout(() => {
      document.querySelector('[data-finale-text]').hidden = false;
      document.querySelector('[data-play-audio-btn]').hidden = false;
    }, 300);
    return;
  }

  // A brief rattle — like the lock struggling — before the big swing, so the
  // door doesn't just glide open flatly. This is the one page on the site
  // allowed this kind of theatrical build-up (see design.md's delight budget).
  doorScreen.classList.add('rattling');
  setTimeout(() => {
    doorScreen.classList.remove('rattling');
    doorScreen.classList.add('opening');
    setTimeout(() => {
      document.querySelector('[data-finale-text]').hidden = false;
      document.querySelector('[data-play-audio-btn]').hidden = false;
      spawnConfetti();
    }, 1000);
  }, 380);
}

// --- Initial load ---------------------------------------------------------

const state = loadOrResetProgress(config.version);

if (state.currentLevel > DECRYPT_STEP_INDEX) {
  revealDecryptedBanner(false);
} else {
  let acc = 0;
  state.fragments.forEach((frag) => {
    revealFragment(frag, acc, false);
    acc += frag.length;
  });
}

const isFreshStart = state.currentLevel === 0 && state.fragments.length === 0;
render(isFreshStart ? -1 : state.currentLevel);
