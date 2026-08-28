import { marked } from 'marked';

export function renderPreview(container, markdownText) {
  container.innerHTML = marked.parse(markdownText || '');
}
