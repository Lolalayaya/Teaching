/**
 * 第七週・歸位行動 表單A：網站任務暖身（八年級） —— Google Apps Script，自動建立Google表單
 *
 * 網站易用性測試的一部分（見 teacher-notes/網站易用性測試計畫.md），包裝成上課暖身：
 * 學生到網站上找指定頁面、抄下答案，順便複習前兩週內容。內容分四段：
 *   1. 班級座號姓名（只用來確認有交，不計分——這堂的分數在表單B）
 *   2. 4個網站任務，每題：抄答案＋找到了嗎＋難易度1~5＋卡住的地方（選填）
 *   3. SUS系統易用性量表（國中生改寫版，10題）
 *   4. 旅程情緒：6個接觸點各選😀😐😣
 *
 * ⚠️ 2026-10-06 老師決定這份表單要記名（原計畫是匿名），目的是確認每個學生都有交。
 * 記名會讓學生比較不敢批評網站，所以表單說明跟講義都有特別寫「批評不影響成績」。
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案
 * 2. 把這個檔案的內容整個貼到編輯器裡（取代預設的 myFunction）
 * 3. 先把下面 TASK3_NOTE 確認一下（第3題的標準答案要看 Scratchy 作業名稱，不影響建表單）
 * 4. 上方選單選 createForm 這個函式，按執行（第一次會要求授權，允許即可）
 * 5. 執行完成後，左下角「執行紀錄」會印出：
 *    - 編輯用網址（自己修改題目用，也要貼到下面 FORM_EDIT_URL 給 computeSusScores 用）
 *    - 填答/嵌入用網址（貼回 week7-8-intro.md frontmatter 第一個 embeds.url，取代
 *      PLACEHOLDER_FORM_A_ID，已經加好 ?embedded=true 可以直接貼上）
 * 6. 建議把表單的「回覆」分頁連結到一張Google試算表。
 *
 * 這份表單不是測驗模式、不計分，所以不需要 backfillGrades()。
 * 上完所有班級後，可以執行 computeSusScores() 算出每份回覆的SUS分數跟全體平均
 * （業界平均約68分）。
 *
 * createForm() 已經自動設定：收集電子郵件、限制每人只能回覆1次。不打亂題目順序
 * （任務題跟各自的「找到了嗎」要排在一起）。執行後到⚙️設定手動確認：
 * 「回覆」分頁的「收集電子郵件地址」選「已驗證」。
 */

// 第3題的參考答案：Scratchy「掃描行動」作業頁面最上方顯示的作業名稱，
// 等老師在 Scratchy 建好作業、確認名稱後填這裡，只是給自己對答案用，不影響表單。
var TASK3_NOTE = '（填入Scratchy作業名稱）';

var TASKS = [
  {
    title: '任務1：找到「第五週」的講義，寫下第1組的5張卡總共比較了幾次。',
    answerNote: '4次',
  },
  {
    title: '任務2：找到「第六週」的講義，寫下起始專案清單裡的5個分數。',
    answerNote: '870、650、785、990、920',
  },
  {
    title: '任務3：從第六週講義點進「前往掃描行動任務繳交」的連結，寫下打開的頁面上顯示的作業名稱。',
    answerNote: TASK3_NOTE,
  },
  {
    title: '任務4：找到「課堂規則與自由時間白名單」頁面，寫下一個自由時間可以使用的網站名稱。',
    answerNote: '白名單表格裡任一個網站都算對',
  },
];

// SUS（System Usability Scale）國中生改寫版。奇數題是正面敘述、偶數題是負面敘述，
// 順序不能動，computeSusScores() 靠題號奇偶計分。作品集中註明「兒童改寫版」。
var SUS_ITEMS = [
  '我會想要常常使用這個課程網站。',
  '我覺得這個網站太複雜了，很多地方沒必要弄得那麼麻煩。',
  '我覺得這個網站很好用。',
  '我需要老師或同學幫忙，才會用這個網站。',
  '我覺得網站上的各個部分都安排得很順、很有條理。',
  '我覺得這個網站有很多地方前後不一樣，讓人搞混。',
  '我覺得大部分同學很快就能學會用這個網站。',
  '我覺得這個網站用起來很卡、很不方便。',
  '我用這個網站的時候很有把握，知道自己在做什麼。',
  '我要先學很多東西，才能開始用這個網站。',
];
var SUS_TITLE_PREFIX = 'SUS';

var JOURNEY_ROWS = [
  '進入課程網站',
  '找到這週的講義',
  '閱讀講義內容',
  '使用講義裡的表單或Scratch專案',
  '前往繳交作業（表單或Scratchy）',
  '查成績或看課堂規則',
];

function createForm() {
  var form = FormApp.create('W7-8-歸位行動・表單A・網站任務暖身');
  form.setDescription(
    '到課程網站上找出指定的頁面，把答案抄下來，順便複習前兩週的內容。\n' +
      '請先用「在新視窗開啟」把這份表單開在另一個分頁，再回原本的分頁找答案。\n' +
      '填班級座號姓名只是為了確認你有交；你對網站的任何批評都不會影響成績，' +
      '老師會根據大家的意見改版網站，寫得越具體越有幫助。'
  );
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);

  addNameIdItem(form);

  TASKS.forEach(function (task, index) {
    var n = index + 1;
    form.addPageBreakItem().setTitle('任務' + n);

    form.addTextItem().setTitle(task.title).setRequired(true);

    form
      .addMultipleChoiceItem()
      .setTitle('任務' + n + '：找到了嗎？')
      .setChoiceValues(['順利找到', '找了很久才找到', '找不到'])
      .setRequired(true);

    form
      .addScaleItem()
      .setTitle('任務' + n + '：難不難找？')
      .setBounds(1, 5)
      .setLabels('很好找', '很難找')
      .setRequired(true);

    form
      .addParagraphTextItem()
      .setTitle('任務' + n + '：卡住的地方（選填）')
      .setHelpText('例如：找不到入口、點了沒反應、看不懂按鈕在做什麼……')
      .setRequired(false);
  });

  form
    .addPageBreakItem()
    .setTitle('整體使用感受')
    .setHelpText('想想你這幾週使用課程網站的經驗，選出你同不同意下面每一句話。沒有標準答案。');

  SUS_ITEMS.forEach(function (statement, index) {
    form
      .addScaleItem()
      .setTitle(SUS_TITLE_PREFIX + (index + 1) + '. ' + statement)
      .setBounds(1, 5)
      .setLabels('非常不同意', '非常同意')
      .setRequired(true);
  });

  form
    .addPageBreakItem()
    .setTitle('每一步的感覺')
    .setHelpText('上課時你會用網站做下面這些事，每一步各選一個最接近你感覺的表情。');

  form
    .addGridItem()
    .setTitle('做這些事的時候，你的感覺是？')
    .setRows(JOURNEY_ROWS)
    .setColumns(['😀 很順', '😐 普通', '😣 卡住'])
    .setRequired(true);

  Logger.log('編輯用網址（自己改題目用，也貼到 FORM_EDIT_URL）：' + form.getEditUrl());
  // 一定要加 ?embedded=true，不然嵌入iframe會被Google擋掉（顯示「docs.google.com拒絕連線」）
  Logger.log('填答/嵌入用網址（貼到 week7-8-intro.md 第一個 embeds.url）：' + form.getPublishedUrl() + '?embedded=true');
  Logger.log('參考答案：' + TASKS.map(function (t, i) { return '任務' + (i + 1) + '＝' + t.answerNote; }).join('；'));
}

/** 「班級座號姓名」格式：班級(17開頭)+班級編號(01~10)_座號(01~27)_姓名(2~4個中文字)。
 *  這個函式跟其他 create-week*.gs.js 裡的重複——每個 Apps Script 專案是各自獨立
 *  的檔案，沒辦法跨檔案共用函式，所以每份腳本各自複製一份。 */
var NAME_ID_PATTERN = '^[1278](0[1-9]|10)_(0[1-9]|1[0-9]|2[0-7])_[一-龥]{2,4}$';

/** 新增「班級座號姓名」文字題，用正規表示法擋格式。這份表單不計分，所以不設分數。 */
function addNameIdItem(form) {
  return form
    .addTextItem()
    .setTitle('請輸入 班級座號姓名（格式：班級_座號_姓名，例如 810_16_王小明）')
    .setHelpText('格式：班級_座號_姓名，例如 810_16_王小明。')
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .setHelpText('格式錯誤，請依照 班級_座號_姓名 輸入，例如 810_16_王小明。')
        .requireTextMatchesPattern(NAME_ID_PATTERN)
        .build()
    );
}

/** 執行過一次 createForm() 之後，把印出的「編輯用網址」貼在這裡。 */
var FORM_EDIT_URL = '';

/**
 * 計算每份回覆的SUS分數（0~100）與全體平均。
 * 標準SUS計分：奇數題(正面)＝分數−1，偶數題(負面)＝5−分數，10題加總×2.5。
 * 只讀取回覆、不會修改任何東西，可以重複執行。
 */
function computeSusScores() {
  var form = FormApp.openByUrl(FORM_EDIT_URL);
  var susItems = form.getItems(FormApp.ItemType.SCALE).filter(function (item) {
    return item.getTitle().indexOf(SUS_TITLE_PREFIX) === 0;
  });
  if (susItems.length !== 10) {
    Logger.log('找到 ' + susItems.length + ' 題SUS，應該是10題，請檢查題目標題是否被改過');
    return;
  }

  var responses = form.getResponses();
  var total = 0;
  var counted = 0;
  responses.forEach(function (response) {
    var sum = 0;
    for (var i = 0; i < susItems.length; i++) {
      var itemResponse = response.getResponseForItem(susItems[i]);
      if (!itemResponse) return;
      var value = Number(itemResponse.getResponse());
      sum += i % 2 === 0 ? value - 1 : 5 - value;
    }
    var score = sum * 2.5;
    total += score;
    counted++;
    Logger.log(response.getTimestamp() + '：SUS ' + score);
  });

  if (counted === 0) {
    Logger.log('還沒有完整的SUS回覆');
    return;
  }
  Logger.log('共 ' + counted + ' 份，平均SUS ' + (total / counted).toFixed(1) + '（業界平均約68）');
}
