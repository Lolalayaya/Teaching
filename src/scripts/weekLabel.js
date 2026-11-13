// 把講義標題開頭的「第○週」拆出來，另外做成醒目的週次標籤。
// 易用性測試時8年級有15人把別週講義的資料抄成答案：標題裡的「第○週」
// 跟後面一長串任務代號擠在一起，不容易一眼認出現在看的是哪一週。
const WEEK_PREFIX = /^(第[一二三四五六七八九十]+週)\s*(.*)$/;

export function splitWeek(title) {
  const match = title.match(WEEK_PREFIX);
  return match ? { week: match[1], rest: match[2] } : { week: null, rest: title };
}
