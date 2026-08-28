const EMBED_TYPES = ['scratch', 'google-doc', 'google-sheet', 'google-form', 'canva'];

function escapeAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;');
}

export function initEmbedsField(container, initialEmbeds = []) {
  function renderRow(embed = { type: 'scratch', title: '', url: '' }) {
    const row = document.createElement('div');
    row.className = 'embed-row';
    row.innerHTML = `
      <select data-embed-type>
        ${EMBED_TYPES.map((t) => `<option value="${t}" ${t === embed.type ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
      <input type="text" data-embed-title placeholder="標題" value="${escapeAttr(embed.title)}" />
      <input type="url" data-embed-url placeholder="https://..." value="${escapeAttr(embed.url)}" />
      <button type="button" data-remove-row>移除</button>
    `;
    row.querySelector('[data-remove-row]').addEventListener('click', () => row.remove());
    container.appendChild(row);
  }

  container.innerHTML = '';
  initialEmbeds.forEach(renderRow);

  let addBtn = container.parentElement.querySelector('[data-add-embed-btn]');
  if (!addBtn) {
    addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.dataset.addEmbedBtn = '';
    addBtn.textContent = '+ 新增嵌入連結';
    container.parentElement.insertBefore(addBtn, container.nextSibling);
  }
  addBtn.onclick = () => renderRow();

  return {
    getValue() {
      return Array.from(container.querySelectorAll('.embed-row'))
        .map((row) => ({
          type: row.querySelector('[data-embed-type]').value,
          title: row.querySelector('[data-embed-title]').value.trim(),
          url: row.querySelector('[data-embed-url]').value.trim(),
        }))
        .filter((e) => e.title && e.url);
    },
  };
}
