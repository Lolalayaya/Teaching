const CHINESE_DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

export function arabicToChineseWeek(n) {
  if (n <= 0 || n > 30) return String(n);
  if (n < 10) return CHINESE_DIGITS[n];
  if (n === 10) return '十';
  if (n < 20) return `十${CHINESE_DIGITS[n - 10]}`;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${CHINESE_DIGITS[tens]}十${ones === 0 ? '' : CHINESE_DIGITS[ones]}`;
}

export function nextUnitNumber(existingTitles) {
  const nums = existingTitles
    .map((t) => /任務檔案\s*(\d{3})/.exec(t || ''))
    .filter(Boolean)
    .map((m) => Number(m[1]));
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

export function buildUnitTitle({ week, unitNumber, codename, topic, variant }) {
  const weekCn = arabicToChineseWeek(week);
  const num = String(unitNumber).padStart(3, '0');
  const suffix = variant === 'recap' ? `〔檔案回顧〕${topic}` : `｜${topic}`;
  return `第${weekCn}週 任務檔案 ${num}・${codename}${suffix}`;
}
