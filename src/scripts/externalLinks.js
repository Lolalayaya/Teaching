export function markExternalLinks() {
  const host = window.location.hostname;
  document.querySelectorAll('a[href^="http://"], a[href^="https://"]').forEach((link) => {
    if (link.hostname && link.hostname !== host) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });
}
