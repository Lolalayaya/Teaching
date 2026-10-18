// 講義用「借暫存交換」分步動畫：借用河內塔的三根柱子，規則改成「每根柱子
// 最多放一個盤子」，對應「清單的一格／一個變數一次只能放一個值」。
// 在講義 .md 裡放：
//   <div class="swap-demo" data-swap-demo data-first="790" data-second="980"></div>
// data-first＝第「輪次」項原本的值，data-second＝第「最大值位置」項的最大值。
// 刻意做成按一下走一步、不自動播放：老師投影時要能停在每一步講解，學生自學時也能自己控制速度。

const PEG_X = [16.667, 50, 83.333]; // 三根柱子的水平位置（%）：第輪次項／暫存／第最大值位置項
const REST = 26; // 盤子放在底座上時的 bottom（px）
const LIFT = 128; // 盤子舉起越過柱頂時的 bottom（px）
const DISK_H = 34;

const BLOCKS = [
  { kind: 'var', html: '將「暫存」設為 清單的第「輪次」項' },
  { kind: 'list', html: '把清單的第「輪次」項 替換成 清單的第「最大值位置」項' },
  { kind: 'list', html: '把清單的第「最大值位置」項 替換成「暫存」' },
];

function buildSteps(a, b) {
  return [
    {
      title: '準備交換',
      text: `第1輪打完擂台，找到最大值 ${b} 在第2名，要跟第1名的 ${a} 交換位置。規則：每根柱子最多只能放一個盤子，一次只能搬一個。中間那根空柱子，就是變數「暫存」。`,
      pos: [0, 2],
      block: -1,
    },
    {
      title: `步驟1：先把 ${a} 搬到暫存`,
      text: `第1名的 ${a} 先移到空柱子暫放，第1名的位置才空得出來。`,
      note: `在 Scratch 裡這一步其實是「複製」：第1名的 ${a} 還留在原地，只是下一步會被蓋掉。用搬盤子比較容易看出先後順序。`,
      pos: [1, 2],
      block: 0,
      move: { disk: 0, to: 1 },
    },
    {
      title: `步驟2：把 ${b} 搬到第1名`,
      text: `第1名已經空出來了，最大值 ${b} 可以放進去。`,
      pos: [1, 0],
      block: 1,
      move: { disk: 1, to: 0 },
    },
    {
      title: `步驟3：把暫存的 ${a} 搬到第2名`,
      text: `最後把暫放在中間的 ${a} 放進第2名。交換完成！第1名是 ${b}、第2名是 ${a}。三步剛好對應三個積木，順序不能對調。`,
      pos: [2, 0],
      block: 2,
      move: { disk: 0, to: 2 },
    },
  ];
}

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function waitTransition(el, prop, ms) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.removeEventListener('transitionend', onEnd);
      resolve();
    };
    const onEnd = (e) => {
      if (e.target === el && e.propertyName === prop) finish();
    };
    el.addEventListener('transitionend', onEnd);
    // 值沒變時 transitionend 不會觸發，用逾時當保險
    setTimeout(finish, ms + 80);
  });
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function lift(disk, bottom) {
  disk.style.bottom = `${bottom}px`;
  if (!reduceMotion()) await waitTransition(disk, 'bottom', 320);
}

async function slide(disk, peg) {
  disk.style.left = `${PEG_X[peg]}%`;
  if (!reduceMotion()) await waitTransition(disk, 'left', 420);
}

function initOne(root) {
  const a = root.dataset.first ?? '790';
  const b = root.dataset.second ?? '980';
  const steps = buildSteps(a, b);
  const big = Number(b) >= Number(a) ? 1 : 0; // 分數大的盤子畫大一點，保留一點河內塔的味道

  root.innerHTML = `
    <div class="swap-demo-stage" aria-hidden="true">
      ${PEG_X.map((x) => `<div class="swap-demo-peg" style="left:${x}%"></div>`).join('')}
      <div class="swap-demo-base"></div>
      <div class="swap-demo-disk swap-demo-disk-a" style="width:${big === 0 ? 27 : 22}%">${a}</div>
      <div class="swap-demo-disk swap-demo-disk-b" style="width:${big === 1 ? 27 : 22}%">${b}</div>
    </div>
    <div class="swap-demo-labels">
      <div>第「輪次」項<small>第1名</small></div>
      <div>暫存<small>空柱子</small></div>
      <div>第「最大值位置」項<small>第2名</small></div>
    </div>
    <div class="swap-demo-caption" aria-live="polite">
      <p class="swap-demo-title"></p>
      <p class="swap-demo-text"></p>
      <p class="swap-demo-note"></p>
    </div>
    <ol class="swap-demo-blocks">
      ${BLOCKS.map((blk) => `<li class="swap-demo-block swap-demo-block-${blk.kind}">${blk.html}</li>`).join('')}
    </ol>
    <div class="swap-demo-controls">
      <button type="button" data-act="prev">◀ 上一步</button>
      <button type="button" data-act="next" class="swap-demo-primary">下一步 ▶</button>
      <button type="button" data-act="reset">↺ 重來</button>
      <button type="button" data-act="wrong" class="swap-demo-wrong-btn">如果不用暫存？</button>
    </div>
  `;

  const disks = [root.querySelector('.swap-demo-disk-a'), root.querySelector('.swap-demo-disk-b')];
  const titleEl = root.querySelector('.swap-demo-title');
  const textEl = root.querySelector('.swap-demo-text');
  const noteEl = root.querySelector('.swap-demo-note');
  const caption = root.querySelector('.swap-demo-caption');
  const blockEls = [...root.querySelectorAll('.swap-demo-block')];
  const btn = (act) => root.querySelector(`[data-act="${act}"]`);

  let step = 0;
  let busy = false;

  function placeInstant(i) {
    disks.forEach((d, k) => {
      d.classList.add('swap-demo-instant');
      d.style.left = `${PEG_X[steps[i].pos[k]]}%`;
      d.style.bottom = `${REST}px`;
      void d.offsetWidth; // 強制套用，再把 transition 開回來
      d.classList.remove('swap-demo-instant');
    });
  }

  function render() {
    const s = steps[step];
    caption.classList.remove('swap-demo-caption-wrong');
    titleEl.textContent = s.title;
    textEl.textContent = s.text;
    noteEl.textContent = s.note ?? '';
    noteEl.hidden = !s.note;
    blockEls.forEach((el, k) => {
      el.classList.toggle('is-active', k === s.block);
      el.classList.toggle('is-done', k < s.block);
    });
    btn('prev').disabled = busy || step === 0;
    btn('next').disabled = busy || step === steps.length - 1;
    btn('reset').disabled = busy;
    btn('wrong').disabled = busy;
  }

  function setBusy(v) {
    busy = v;
    render();
  }

  async function next() {
    if (busy || step >= steps.length - 1) return;
    const { move } = steps[step + 1];
    setBusy(true);
    const disk = disks[move.disk];
    disk.classList.add('is-moving');
    await lift(disk, LIFT);
    await slide(disk, move.to);
    await lift(disk, REST);
    disk.classList.remove('is-moving');
    step += 1;
    setBusy(false);
  }

  function prev() {
    if (busy || step === 0) return;
    step -= 1;
    placeInstant(step);
    render();
  }

  function reset() {
    if (busy) return;
    step = 0;
    placeInstant(0);
    render();
  }

  // 錯誤示範：不借暫存，直接把最大值搬去第1名 → 柱子上已經有盤子，放不下
  async function wrong() {
    if (busy) return;
    step = 0;
    placeInstant(0);
    setBusy(true);
    const disk = disks[1];
    disk.classList.add('is-moving');
    await lift(disk, LIFT);
    await slide(disk, 0);
    await lift(disk, REST + DISK_H + 6);
    disk.classList.add('is-shaking');
    caption.classList.add('swap-demo-caption-wrong');
    titleEl.textContent = '放不下！';
    textEl.textContent = `第1名的柱子上已經有 ${a} 了，${b} 放不進去。一定要先把 ${a} 移到空柱子暫放。`;
    noteEl.textContent = `在 Scratch 裡不會「放不下」：直接寫「把清單的第「輪次」項替換成 清單的第「最大值位置」項」，${b} 會直接把 ${a} 蓋掉，${a} 就永遠不見了，而且程式不會有任何提示。這就是為什麼要先把 ${a} 存進「暫存」。`;
    noteEl.hidden = false;
    await pause(reduceMotion() ? 0 : 450);
    disk.classList.remove('is-shaking');
    await pause(1400);
    await lift(disk, LIFT);
    await slide(disk, 2);
    await lift(disk, REST);
    disk.classList.remove('is-moving');
    busy = false;
    // 保留錯誤說明在畫面上，只更新按鈕狀態
    btn('prev').disabled = true;
    btn('next').disabled = false;
    btn('reset').disabled = false;
    btn('wrong').disabled = false;
  }

  root.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'next') next();
    else if (act === 'prev') prev();
    else if (act === 'reset') reset();
    else if (act === 'wrong') wrong();
  });

  placeInstant(0);
  render();
}

export function initSwapDemos() {
  document.querySelectorAll('[data-swap-demo]').forEach((root) => {
    if (root.dataset.swapDemoReady) return;
    root.dataset.swapDemoReady = '1';
    initOne(root);
  });
}
