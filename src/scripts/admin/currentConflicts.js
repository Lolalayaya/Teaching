import { listDir, fetchFile } from './githubApi.js';
import { parseMarkdownFile } from './frontmatter.js';

function overlaps(a = [], b = []) {
  if (a.length === 0 || b.length === 0) return true;
  return a.some((x) => b.includes(x));
}

async function loadCurrentItems(dir, token) {
  const entries = await listDir(dir, token);
  const files = entries.filter((e) => e.type === 'file' && e.name.endsWith('.md'));
  const results = await Promise.all(
    files.map(async (f) => {
      const file = await fetchFile(f.path, token);
      if (!file) return null;
      const { data } = parseMarkdownFile(file.content);
      if (!data.current) return null;
      return { path: f.path, title: data.title, grades: data.grades || [], classes: data.classes || [] };
    })
  );
  return results.filter(Boolean);
}

export async function findCurrentConflicts(token, { grades = [], classes = [], excludePath }) {
  const [lectureItems, announcementItems] = await Promise.all([
    loadCurrentItems('src/content/lectures', token),
    loadCurrentItems('src/content/announcements', token),
  ]);
  return [...lectureItems, ...announcementItems].filter(
    (item) => item.path !== excludePath && overlaps(item.grades, grades) && overlaps(item.classes, classes)
  );
}
