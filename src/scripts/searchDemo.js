// 講義用「搜尋」互動元件，第九週（8年級）用。三種，在講義 .md 裡放：
//   <div class="search-demo" data-guess-game></div>
//     猜數字 1～100：範圍條會跟著縮小，猜中後可以看「每次猜中間」要幾次。
//   <div class="search-demo" data-search-race></div>
//     循序搜尋 vs 二分搜尋：同一份排好的排行榜、同一個目標，按一下兩邊各走一步。
//   <div class="search-demo" data-search-practice data-mode="unsorted"></div>
//   <div class="search-demo" data-search-practice data-mode="sorted"></div>
//     換你來翻：unsorted＝亂序榜單、隨便翻；sorted＝排好的榜單，一定要翻中間那張。
// 二分搜尋的變數刻意叫「左」「右」「中間」，跟第十週 Scratch 要用的變數名稱一致。
// 跟 swapDemo.js 一樣做成按一下走一步：老師投影時要能停在每一步講解。

// 排好的排行榜（由高到低），講義的範例表格也用這一份
const SORTED = [990, 965, 940, 912, 890, 868, 845, 820, 797, 775, 750, 726, 703, 680, 655];
const SORTED_MISSING = [800, 930, 700, 860, 760];
// 亂序榜單刻意用另一批數字，避免學生背下來
const UNSORTED = [812, 945, 668, 731, 889, 905, 640, 777, 852, 698, 960, 723, 834, 615, 878];
const UNSORTED_MISSING = [800, 900, 750, 690];

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mid = (l, r) => Math.floor((l + r) / 2);

function cardHtml(rank, { tag = 'div' } = {}) {
  return `<${tag} class="search-card" data-rank="${rank}"${tag === 'button' ? ' type="button"' : ''}>
    <span class="search-card-value">?</span><span class="search-card-rank">第${rank}名</span>
  </${tag}>`;
}

// state: hidden（還沒翻）/ open（翻過、不是）/ current（這一步翻的）/ found / out（已排除）
function setCard(card, state, value) {
  card.dataset.state = state;
  const showValue = state !== 'hidden' && !(state === 'out' && !card.dataset.seen);
  card.querySelector('.search-card-value').textContent = showValue ? value : '?';
  if (state === 'current' || state === 'found') {
    card.dataset.seen = '1';
    if (!reduceMotion()) {
      card.classList.remove('is-flipping');
      void card.offsetWidth;
      card.classList.add('is-flipping');
    }
  }
  const rank = card.dataset.rank;
  card.setAttribute('aria-label', showValue ? `第${rank}名，分數${value}` : `第${rank}名，還沒翻開`);
}

function resetCards(cards) {
  cards.forEach((c) => {
    delete c.dataset.seen;
    c.classList.remove('is-flipping');
    setCard(c, 'hidden');
  });
}

/* ---------- 猜數字 ---------- */

function binaryGuesses(secret, lo = 1, hi = 100) {
  const out = [];
  let l = lo;
  let r = hi;
  while (l <= r) {
    const m = mid(l, r);
    if (m === secret) {
      out.push({ guess: m, result: '猜中了！', l, r });
      break;
    }
    out.push({ guess: m, result: m < secret ? '太小了' : '太大了', l, r });
    if (m < secret) l = m + 1;
    else r = m - 1;
  }
  return out;
}

function initGuessGame(root) {
  const MIN = 1;
  const MAX = 100;
  root.innerHTML = `
    <p class="search-demo-lead">我心裡想好一個 ${MIN}～${MAX} 的整數，猜猜看是多少？每猜一次，我會告訴你太大還是太小。</p>
    <form class="guess-form">
      <label>你猜：<input type="number" min="${MIN}" max="${MAX}" step="1" inputmode="numeric" required /></label>
      <button type="submit" class="search-demo-primary">猜</button>
    </form>
    <div class="guess-range" aria-hidden="true"><div class="guess-range-fill"></div></div>
    <div class="guess-range-labels"><span>${MIN}</span><span class="guess-range-text"></span><span>${MAX}</span></div>
    <p class="search-demo-caption" aria-live="polite"></p>
    <ul class="guess-log"></ul>
    <div class="search-demo-replay" hidden></div>
    <div class="search-demo-controls">
      <button type="button" data-act="reveal" hidden>每次都猜中間，要幾次？</button>
      <button type="button" data-act="new">↺ 換一個數字</button>
    </div>
  `;
  const form = root.querySelector('form');
  const input = form.querySelector('input');
  const submit = form.querySelector('button');
  const fill = root.querySelector('.guess-range-fill');
  const rangeText = root.querySelector('.guess-range-text');
  const caption = root.querySelector('.search-demo-caption');
  const logEl = root.querySelector('.guess-log');
  const replay = root.querySelector('.search-demo-replay');
  const revealBtn = root.querySelector('[data-act="reveal"]');

  let secret;
  let lo;
  let hi;
  let count;

  function drawRange() {
    fill.style.left = `${((lo - MIN) / (MAX - MIN + 1)) * 100}%`;
    fill.style.width = `${((hi - lo + 1) / (MAX - MIN + 1)) * 100}%`;
    rangeText.textContent = lo === hi ? `答案就是 ${lo}` : `答案在 ${lo}～${hi} 之間（還剩 ${hi - lo + 1} 個）`;
  }

  function newGame() {
    secret = MIN + Math.floor(Math.random() * (MAX - MIN + 1));
    lo = MIN;
    hi = MAX;
    count = 0;
    logEl.innerHTML = '';
    caption.textContent = '';
    caption.classList.remove('is-correct');
    replay.hidden = true;
    replay.innerHTML = '';
    revealBtn.hidden = true;
    input.disabled = false;
    submit.disabled = false;
    input.value = '';
    drawRange();
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const g = Number(input.value);
    if (!Number.isInteger(g) || g < MIN || g > MAX) {
      caption.textContent = `請輸入 ${MIN}～${MAX} 的整數。`;
      return;
    }
    count += 1;
    const wasted = g < lo || g > hi;
    let result;
    if (g === secret) result = '猜中了！';
    else if (g < secret) {
      result = '太小了';
      lo = Math.max(lo, g + 1);
    } else {
      result = '太大了';
      hi = Math.min(hi, g - 1);
    }
    const li = document.createElement('li');
    const emoji = { 太大了: '💪', 太小了: '🤏', '猜中了！': '🎉' }[result];
    li.innerHTML = `<span class="guess-log-n">第 ${count} 次</span><strong>${g}</strong>${result}${emoji}`;
    logEl.append(li);
    if (g === secret) {
      lo = hi = secret;
      drawRange();
      caption.classList.add('is-correct');
      caption.textContent = `猜中了！答案是 ${secret}，你用了 ${count} 次。`;
      input.disabled = true;
      submit.disabled = true;
      revealBtn.hidden = false;
      return;
    }
    drawRange();
    caption.textContent = wasted
      ? `${result}。提醒：前面的提示已經知道答案只可能在 ${lo}～${hi} 之間，這次等於白猜了。`
      : `${result}，再猜一次。`;
    input.value = '';
    input.focus();
  });

  revealBtn.addEventListener('click', () => {
    const steps = binaryGuesses(secret, MIN, MAX);
    replay.innerHTML = `
      <p><strong>同一個答案 ${secret}，每次都猜「範圍的正中間」：</strong></p>
      <ul>${steps
        .map((s, i) => `<li>第 ${i + 1} 次：範圍 ${s.l}～${s.r}，猜中間 ${s.guess} → ${s.result}</li>`)
        .join('')}</ul>
      <p>用了 ${steps.length} 次。不管答案是 ${MIN}～${MAX} 的哪一個，每次猜中間<strong>最多只要 7 次</strong>，因為每猜一次，剩下的範圍就少一半：100 → 50 → 25 → 12 → 6 → 3 → 1。</p>
    `;
    replay.hidden = false;
    revealBtn.hidden = true;
  });

  root.querySelector('[data-act="new"]').addEventListener('click', newGame);
  newGame();
}

/* ---------- 循序搜尋 vs 二分搜尋 ---------- */

function initSearchRace(root) {
  const scores = SORTED;
  const n = scores.length;
  const targets = (root.dataset.targets ?? '726,703,990,800').split(',').map(Number);

  const lane = (key, name, hint) => `
    <section class="search-lane" data-lane="${key}">
      <div class="search-lane-head"><strong>${name}</strong><span class="search-lane-hint">${hint}</span><span class="search-lane-count">已翻 0 張</span></div>
      <div class="search-cards">${scores.map((_, k) => cardHtml(k + 1)).join('')}</div>
      <p class="search-lane-vars"></p>
      <p class="search-lane-caption"></p>
    </section>`;

  root.innerHTML = `
    <div class="search-demo-toolbar">
      <label>要找的分數：<select>${targets
        .map((t) => `<option value="${t}">${t}${scores.includes(t) ? '' : '（不在榜上）'}</option>`)
        .join('')}</select></label>
    </div>
    ${lane('seq', '循序搜尋', '從第1名開始，一張一張翻')}
    ${lane('bin', '二分搜尋', '每次翻範圍正中間那張')}
    <p class="search-demo-caption search-race-summary" aria-live="polite"></p>
    <div class="search-demo-controls">
      <button type="button" data-act="next" class="search-demo-primary">下一步 ▶</button>
      <button type="button" data-act="run">一次跑完 ⏩</button>
      <button type="button" data-act="reset">↺ 重來</button>
    </div>
  `;

  const select = root.querySelector('select');
  const seqEl = root.querySelector('[data-lane="seq"]');
  const binEl = root.querySelector('[data-lane="bin"]');
  const seqCards = [...seqEl.querySelectorAll('.search-card')];
  const binCards = [...binEl.querySelectorAll('.search-card')];
  const summary = root.querySelector('.search-race-summary');
  const btn = (act) => root.querySelector(`[data-act="${act}"]`);

  let target;
  let seq; // { i, flips, done, found }
  let bin; // { l, r, flips, done, found }
  let timer = null;

  const q = (laneEl, sel) => laneEl.querySelector(sel);

  function drawSeq(text) {
    q(seqEl, '.search-lane-count').textContent = `已翻 ${seq.flips} 張`;
    q(seqEl, '.search-lane-vars').textContent = seq.done ? '' : `下一張要翻：i = ${seq.i}`;
    if (text !== undefined) q(seqEl, '.search-lane-caption').textContent = text;
    seqEl.classList.toggle('is-done', seq.done);
  }

  function drawBin(text) {
    q(binEl, '.search-lane-count').textContent = `已翻 ${bin.flips} 張`;
    q(binEl, '.search-lane-vars').textContent = bin.done
      ? ''
      : `左 = ${bin.l}　右 = ${bin.r}　中間 = (${bin.l}＋${bin.r})÷2 = ${mid(bin.l, bin.r)}`;
    if (text !== undefined) q(binEl, '.search-lane-caption').textContent = text;
    binEl.classList.toggle('is-done', bin.done);
  }

  function drawSummary() {
    const over = seq.done && bin.done;
    btn('next').disabled = over || timer !== null;
    btn('run').disabled = over || timer !== null;
    select.disabled = timer !== null;
    if (!over) {
      summary.textContent = '';
      return;
    }
    const what = scores.includes(target) ? `找到 ${target}` : `確定 ${target} 不在榜上`;
    summary.textContent =
      seq.flips <= bin.flips
        ? `${what}：這次循序搜尋翻了 ${seq.flips} 張，比二分搜尋的 ${bin.flips} 張還少，因為目標剛好排在最前面。但二分搜尋不管找哪一個，最多都只要 4 張；循序搜尋最多要 ${n} 張。`
        : `${what}：循序搜尋翻了 ${seq.flips} 張，二分搜尋只翻了 ${bin.flips} 張。`;
  }

  function stepSeq() {
    if (seq.done) return;
    const k = seq.i - 1;
    seqCards.forEach((c, j) => {
      if (c.dataset.state === 'current') setCard(c, 'open', scores[j]);
    });
    seq.flips += 1;
    if (scores[k] === target) {
      setCard(seqCards[k], 'found', scores[k]);
      seq.done = true;
      drawSeq(`第${seq.i}名是 ${scores[k]}，找到了！`);
      return;
    }
    setCard(seqCards[k], 'current', scores[k]);
    if (seq.i === n) {
      seq.done = true;
      drawSeq(`第${n}名是 ${scores[k]}，不是。${n}張全部翻完都沒有，才能確定 ${target} 不在榜上。`);
      return;
    }
    seq.i += 1;
    drawSeq(`第${seq.i - 1}名是 ${scores[k]}，不是 ${target}，繼續翻下一張。`);
  }

  function stepBin() {
    if (bin.done) return;
    const m = mid(bin.l, bin.r);
    const v = scores[m - 1];
    bin.flips += 1;
    binCards.forEach((c, j) => {
      if (c.dataset.state === 'current') setCard(c, 'out', scores[j]);
    });
    if (v === target) {
      setCard(binCards[m - 1], 'found', v);
      bin.done = true;
      drawBin(`中間是第${m}名，分數 ${v}，找到了！`);
      return;
    }
    setCard(binCards[m - 1], 'current', v);
    let text;
    if (target > v) {
      text = `中間第${m}名是 ${v}。${target} 比 ${v} 高，分數高的排在前面，所以答案只可能在前半段：右 = ${m}－1 = ${m - 1}。`;
      bin.r = m - 1;
    } else {
      text = `中間第${m}名是 ${v}。${target} 比 ${v} 低，分數低的排在後面，所以答案只可能在後半段：左 = ${m}＋1 = ${m + 1}。`;
      bin.l = m + 1;
    }
    binCards.forEach((c, j) => {
      const rank = j + 1;
      if ((rank < bin.l || rank > bin.r) && c.dataset.state === 'hidden') setCard(c, 'out', scores[j]);
    });
    if (bin.l > bin.r) {
      bin.done = true;
      text += ` 左 > 右，範圍空了，確定 ${target} 不在榜上。`;
    }
    drawBin(text);
  }

  function step() {
    stepSeq();
    stepBin();
    drawSummary();
  }

  function stopTimer() {
    if (timer !== null) clearInterval(timer);
    timer = null;
  }

  function reset() {
    stopTimer();
    target = Number(select.value);
    seq = { i: 1, flips: 0, done: false };
    bin = { l: 1, r: n, flips: 0, done: false };
    resetCards(seqCards);
    resetCards(binCards);
    drawSeq('按「下一步」，兩邊會各翻一張。');
    drawBin('按「下一步」，兩邊會各翻一張。');
    drawSummary();
  }

  function run() {
    if (timer !== null) return;
    if (reduceMotion()) {
      while (!(seq.done && bin.done)) step();
      return;
    }
    timer = setInterval(() => {
      step();
      if (seq.done && bin.done) {
        stopTimer();
        drawSummary();
      }
    }, 650);
    drawSummary();
  }

  root.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'next') step();
    else if (act === 'run') run();
    else if (act === 'reset') reset();
  });
  select.addEventListener('change', reset);
  reset();
}

/* ---------- 換你來翻 ---------- */

function initSearchPractice(root) {
  const sorted = root.dataset.mode === 'sorted';
  const scores = sorted ? SORTED : UNSORTED;
  const missing = sorted ? SORTED_MISSING : UNSORTED_MISSING;
  const n = scores.length;

  root.innerHTML = `
    <p class="search-demo-lead">${
      sorted
        ? '這份排行榜<strong>已經依分數由高到低排好</strong>。用二分搜尋：每次都要點範圍正中間那張。'
        : '這份排行榜<strong>沒有排好</strong>，分數是亂的。點任何一張牌就能翻開它。'
    }</p>
    <p class="search-practice-goal">目標：找出 <strong class="search-practice-target"></strong>，或確定它不在榜上</p>
    <div class="search-cards">${scores.map((_, k) => cardHtml(k + 1, { tag: 'button' })).join('')}</div>
    ${sorted ? '<p class="search-lane-vars"></p>' : ''}
    <p class="search-demo-caption" aria-live="polite"></p>
    ${
      sorted
        ? `<table class="search-practice-log" hidden>
            <thead><tr><th>第幾次</th><th>左</th><th>右</th><th>中間</th><th>翻到</th><th>接下來</th></tr></thead>
            <tbody></tbody>
          </table>`
        : ''
    }
    <div class="search-demo-controls">
      <span class="search-practice-count">已翻 0 張</span>
      <button type="button" data-act="new" class="search-demo-primary">↺ 換一題</button>
    </div>
  `;

  const cards = [...root.querySelectorAll('.search-card')];
  const targetEl = root.querySelector('.search-practice-target');
  const caption = root.querySelector('.search-demo-caption');
  const countEl = root.querySelector('.search-practice-count');
  const varsEl = root.querySelector('.search-lane-vars');
  const logTable = root.querySelector('.search-practice-log');
  const logBody = logTable?.querySelector('tbody');

  let target;
  let flips;
  let l;
  let r;
  let done;

  function say(text, tone) {
    caption.textContent = text;
    caption.classList.toggle('is-correct', tone === 'correct');
    caption.classList.toggle('is-wrong', tone === 'wrong');
  }

  function drawVars() {
    countEl.textContent = `已翻 ${flips} 張`;
    if (varsEl) varsEl.textContent = done ? '' : `目前範圍：第${l}名～第${r}名（左 = ${l}，右 = ${r}）`;
    cards.forEach((c) => {
      c.disabled = done;
    });
  }

  function newRound() {
    // 大約四題出一題不在榜上的，而且不要跟上一題一樣
    let next;
    do {
      next = Math.random() < 0.25
        ? missing[Math.floor(Math.random() * missing.length)]
        : scores[Math.floor(Math.random() * n)];
    } while (next === target);
    target = next;
    targetEl.textContent = target;
    flips = 0;
    l = 1;
    r = n;
    done = false;
    resetCards(cards);
    if (logTable) {
      logTable.hidden = true;
      logBody.innerHTML = '';
    }
    say(sorted ? `範圍是第1～${n}名，中間是第幾張？點它。` : '點一張牌開始翻。');
    drawVars();
  }

  function clickUnsorted(k) {
    const card = cards[k];
    if (card.dataset.state !== 'hidden') {
      say(`第${k + 1}名已經翻過了，是 ${scores[k]}。`);
      return;
    }
    flips += 1;
    if (scores[k] === target) {
      setCard(card, 'found', scores[k]);
      done = true;
      say(`找到了！第${k + 1}名就是 ${target}。這次翻了 ${flips} 張，下一題可能運氣好、也可能運氣差，因為分數是亂的，從哪裡開始翻都一樣。`, 'correct');
    } else {
      setCard(card, 'open', scores[k]);
      if (flips === n) {
        done = true;
        say(`${n}張全部翻完了，都不是 ${target}。亂序的榜單一定要每一張都看過，才能確定它不在榜上。`, 'correct');
      } else {
        say(`第${k + 1}名是 ${scores[k]}，不是。還有 ${n - flips} 張沒翻。`);
      }
    }
    drawVars();
  }

  function clickSorted(k) {
    const rank = k + 1;
    const m = mid(l, r);
    if (rank < l || rank > r) {
      say(`第${rank}名已經被排除了，答案只可能在第${l}～${r}名之間。`, 'wrong');
      return;
    }
    if (rank !== m) {
      say(
        `還不對喔：現在範圍是第${l}～${r}名，中間是 (${l}＋${r})÷2 = ${m}${(l + r) % 2 ? '（有小數就捨去）' : ''}，請點第${m}名。每次都翻正中間，不管結果是高還是低，都能一次排除一半。`,
        'wrong',
      );
      return;
    }
    const v = scores[k];
    const lBefore = l;
    const rBefore = r;
    flips += 1;
    const row = document.createElement('tr');
    let next;
    cards.forEach((c, j) => {
      if (c.dataset.state === 'current') setCard(c, 'out', scores[j]);
    });
    if (v === target) {
      setCard(cards[k], 'found', v);
      done = true;
      next = '找到了！';
      say(`找到了！第${rank}名就是 ${target}，只翻了 ${flips} 張。`, 'correct');
    } else {
      setCard(cards[k], 'current', v);
      if (target > v) {
        r = m - 1;
        next = `${target} 比較高 → 往前找，右 = ${r}`;
      } else {
        l = m + 1;
        next = `${target} 比較低 → 往後找，左 = ${l}`;
      }
      cards.forEach((c, j) => {
        const rk = j + 1;
        if ((rk < l || rk > r) && c.dataset.state === 'hidden') setCard(c, 'out', scores[j]);
      });
      if (l > r) {
        done = true;
        next += '，範圍空了';
        say(`左 > 右，範圍空了，確定 ${target} 不在榜上。只翻了 ${flips} 張就能確定，不用把${n}張全部看完。`, 'correct');
      } else {
        say(`第${rank}名是 ${v}。${target > v ? `${target} 比 ${v} 高，往前找` : `${target} 比 ${v} 低，往後找`}，範圍剩第${l}～${r}名，中間是第幾張？`);
      }
    }
    row.innerHTML = `<td>${flips}</td><td>${lBefore}</td><td>${rBefore}</td><td>${m}</td><td>${v}</td><td>${next}</td>`;
    logTable.hidden = false;
    logBody.append(row);
    drawVars();
  }

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-act="new"]')) {
      newRound();
      return;
    }
    const card = e.target.closest('.search-card');
    if (!card || done) return;
    const k = Number(card.dataset.rank) - 1;
    if (sorted) clickSorted(k);
    else clickUnsorted(k);
  });

  newRound();
}

export function initSearchDemos() {
  const kinds = [
    ['[data-guess-game]', initGuessGame],
    ['[data-search-race]', initSearchRace],
    ['[data-search-practice]', initSearchPractice],
  ];
  kinds.forEach(([sel, init]) => {
    document.querySelectorAll(sel).forEach((root) => {
      if (root.dataset.searchDemoReady) return;
      root.dataset.searchDemoReady = '1';
      init(root);
    });
  });
}
