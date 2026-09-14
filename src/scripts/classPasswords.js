import { TAUGHT_CLASSES } from './classOptions.js';

// 老師密碼：輸入這組密碼可以直接看到全站所有班級的內容，也是 /admin 後台的密碼。
// 上線前請務必修改成別人猜不到的密碼。
export const TEACHER_PASSWORD = 'teacherlola';

// 想強制把「所有班級」目前已經登入的裝置一次踢下線時，把這個數字 +1、
// commit 並部署即可——不影響老師模式。下次那些裝置載入頁面時，會發現自己
// 存的登入版本跟這裡對不上，就會被當成過期、跳回輸入密碼的畫面。
export const GATE_SESSION_VERSION = 1;

// 拉丁文數字字根，年級代碼、班號代碼共用同一張表（index 對應數字本身）。
// 1 uni・2 bi・3 tri・4 quad・5 quint・6 sex・7 sept・8 oct・9 non・10 dec
const NUMBER_ROOTS = ['', 'uni', 'bi', 'tri', 'quad', 'quint', 'sex', 'sept', 'oct', 'non', 'dec'];

// 每班固定不變的部分：年級字根 + 班號字根，例如 7 年級 5 班＝sept＋quint＝
// 'septquint'。這部分規則是公開的（猜得到也沒關係，只求擋住大部分學生），
// 不需要每學期重新想，看到班級代號當場就能心算出來。
function classRootCode(grade, cls) {
  return NUMBER_ROOTS[Number(grade)] + NUMBER_ROOTS[Number(cls)];
}

// 每週密語：每周變化
export const WEEKLY_CODE = {
  7: 'w3',
  8: 'w3',
};

function buildClassPasswords() {
  const passwords = {};
  for (const grade of Object.keys(TAUGHT_CLASSES)) {
    for (const cls of TAUGHT_CLASSES[grade]) {
      const code = `${grade}${cls}`;
      passwords[code] = classRootCode(grade, cls) + WEEKLY_CODE[grade];
    }
  }
  return passwords;
}

// 各班的進站密碼，key 是「年級+班號」（例如 7 年級 1 班是 '701'，8 年級 8 班是
// '808'），由上面的班級字根＋每週密語自動組成——不用手動維護 18 組密碼，每週
// 只要改 WEEKLY_CODE 就好。
export const CLASS_PASSWORDS = buildClassPasswords();
