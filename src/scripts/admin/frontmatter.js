import * as yaml from 'js-yaml';

// js-yaml auto-parses unquoted date-like scalars (e.g. `date: 2026-08-31`,
// the style every existing content file uses) into JS Date objects. The
// admin forms want plain 'YYYY-MM-DD' strings (to feed <input type="date">
// and to round-trip back through stringifyMarkdownFile unchanged), so walk
// the parsed object graph and convert every Date instance back to a string.
function normalizeDates(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return value.map(normalizeDates);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalizeDates(v)]));
  }
  return value;
}

export function parseMarkdownFile(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, body: raw };
  const data = normalizeDates(yaml.load(match[1]) || {});
  return { data, body: match[2] };
}

export function stringifyMarkdownFile(data, body) {
  const yamlText = yaml.dump(data, { lineWidth: -1 }).trimEnd();
  return `---\n${yamlText}\n---\n\n${body.trim()}\n`;
}
