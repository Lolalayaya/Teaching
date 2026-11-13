// 講義內文編輯框上方的格式按鈕：選取文字後按一下，就套上講義的固定樣式
// （樣式定義在 global.css 的 .example-quote / .explain，用法見 templates/新增課程講義.md）。
// 易用性測試發現學生分不清哪一句是例句、哪一段是說明，所以把這兩種樣式做成按鈕，
// 老師寫講義時不用記 HTML。

const FORMATS = {
  example: {
    label: '例句',
    hint: '學生要參考或抄下來的那一句',
    placeholder: '例句內容',
    wrap: (text) => `<span class="example-quote"><span class="example-label">例句</span>${text}</span>`,
  },
  explain: {
    label: '說明',
    hint: '接在粗體重點後面，會換行並變淡',
    placeholder: '說明文字',
    wrap: (text) => `<span class="explain">${text}</span>`,
  },
};

export function initBodyToolbar(toolbar, textarea) {
  toolbar.innerHTML = Object.entries(FORMATS)
    .map(([key, f]) => `<button type="button" data-format="${key}" title="${f.hint}">${f.label}</button>`)
    .join('');

  toolbar.addEventListener('click', (event) => {
    const button = event.target.closest('[data-format]');
    if (!button) return;
    const format = FORMATS[button.dataset.format];
    const { selectionStart: start, selectionEnd: end, value } = textarea;
    const selected = value.slice(start, end) || format.placeholder;
    const wrapped = format.wrap(selected);
    textarea.setRangeText(wrapped, start, end, 'end');
    // 沒有選取文字時，把預設文字選起來，老師可以直接打字取代
    if (start === end) {
      const textStart = start + wrapped.indexOf(format.placeholder);
      textarea.setSelectionRange(textStart, textStart + format.placeholder.length);
    }
    textarea.focus();
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
