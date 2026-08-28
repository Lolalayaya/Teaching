// The actual classes taught this semester (confirmed against the real
// timetable) — 7年級 has 10 classes (701-710), 8年級 has 8 (801-808), no
// 9年級 at all. Grade 8 intentionally stops at 08, not 10 — there is no
// cross-product with a shared class-number range across grades.
export const TAUGHT_CLASSES = {
  7: Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, '0')),
  8: ['01', '02', '03', '04', '05', '06', '07', '08'],
};

export const GRADES = Object.keys(TAUGHT_CLASSES);
