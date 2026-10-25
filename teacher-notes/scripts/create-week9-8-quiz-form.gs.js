/**
 * 第九週・鎖定行動 小測驗（八年級） —— Google Apps Script，自動建立Google表單
 *
 * 這堂課的計分表單：
 *   1. 班級座號姓名（80分，自動給分）
 *   2. 循序搜尋／二分搜尋小測驗：10題單選各2分，80 + 2×10 = 100分
 *
 * 題目對應 week9-8-intro.md：第1~2題循序搜尋、第3~7題二分搜尋的規則與步驟、
 * 第8~10題次數比較（含猜數字）。第6~7題刻意用講義和互動元件都沒出現過的
 * 7筆排行榜，避免學生直接照抄練習時看過的答案。
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案
 * 2. 把這個檔案的內容整個貼到編輯器裡（取代預設的 myFunction）
 * 3. 上方選單選 createForm 這個函式，按執行（第一次會要求授權，允許即可）
 * 4. 執行完成後，左下角「執行紀錄」會印出：
 *    - 編輯用網址（自己修改題目用，也要貼到下面 FORM_EDIT_URL）
 *    - 填答/嵌入用網址（貼回 week9-8-intro.md frontmatter 的 embeds.url，取代
 *      PLACEHOLDER_FORM_ID，已經加好 ?embedded=true 可以直接貼上）
 * 5. 建議把表單的「回覆」分頁連結到一張Google試算表。
 *
 * createForm() 已經自動設定：收集電子郵件、限制每人只能回覆1次、測驗模式。
 * 以下幾項要自己到表單右上角⚙️（設定）手動確認/勾選一次：
 * 1.「回覆」分頁：「收集電子郵件地址」選「已驗證」；「傳送回覆者回覆副本」選「一律」。
 * 2.「測驗」分頁：「成績發布」選「提交後立即公布」；「回覆者可以看到」三個都勾選。
 * 3. 10題單選題，各自點右下角「隨機排列選項順序」。
 *
 * 上課結束後，手動重跑一次 backfillGrades() 補齊即時觸發沒打到的80分
 * （可重複執行，不會出錯）。
 */
function createForm() {
  var form = FormApp.create('W9-8-鎖定行動・小測驗');
  form.setIsQuiz(true);
  form.setDescription('循序搜尋與二分搜尋小測驗，共10題。題目裡的排行榜都是「第1名分數最高」，由高到低排列。');
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);

  addNameIdItem(form, 80);

  form.addPageBreakItem().setTitle('鎖定行動小測驗');

  addScoredChoice(
    form,
    '一份有15名玩家的排行榜，用循序搜尋找某個分數，最多要翻幾張？',
    ['4張', '8張', '15張', '30張'],
    '15張'
  );

  addScoredChoice(
    form,
    '排行榜的分數是亂的（沒有排好），要確定某個分數「不在榜上」，至少要翻幾張？',
    ['1張就夠了', '翻到一半就能確定', '4張', '全部都要翻過'],
    '全部都要翻過'
  );

  addScoredChoice(
    form,
    '使用二分搜尋之前，資料一定要符合什麼條件？',
    ['資料要先依大小排好順序', '資料要少於15筆', '要找的目標一定要在資料裡', '資料筆數一定要是偶數'],
    '資料要先依大小排好順序'
  );

  addScoredChoice(
    form,
    '排好的排行榜有15名玩家，用二分搜尋，第一次要翻第幾名？',
    ['第1名', '第7名', '第8名', '第15名'],
    '第8名'
  );

  addScoredChoice(
    form,
    '用二分搜尋找 900 分，翻開中間那張是 820 分。接下來要怎麼做？',
    [
      '往前面（名次數字小的那半）找，右 = 中間－1',
      '往後面（名次數字大的那半）找，左 = 中間＋1',
      '改回從第1名開始一張一張翻',
      '已經可以確定 900 不在榜上',
    ],
    '往前面（名次數字小的那半）找，右 = 中間－1'
  );

  addScoredChoice(
    form,
    '排好的排行榜：第1名950、第2名910、第3名880、第4名840、第5名790、第6名760、第7名720。' +
      '用二分搜尋找 760，依序會翻到哪幾張？',
    ['840 → 760', '840 → 790 → 760', '880 → 760', '950 → 910 → 880 → 840 → 790 → 760'],
    '840 → 760'
  );

  addScoredChoice(
    form,
    '同一份排行榜：第1名950、第2名910、第3名880、第4名840、第5名790、第6名760、第7名720。' +
      '用二分搜尋找 900，要翻幾張才能確定 900 不在榜上？',
    ['1張', '3張', '4張', '7張'],
    '3張'
  );

  addScoredChoice(
    form,
    '排好的資料有31筆，用二分搜尋最多要比幾次？',
    ['5次', '15次', '16次', '31次'],
    '5次'
  );

  addScoredChoice(
    form,
    '玩猜數字（1～100），每次都猜剩下範圍的正中間，最多要猜幾次一定能猜中？',
    ['5次', '7次', '10次', '50次'],
    '7次'
  );

  addScoredChoice(
    form,
    '排好的資料從1,000筆變成2,000筆，二分搜尋最多需要的次數會怎麼變？',
    ['只多1次', '變成2倍', '多1,000次', '完全不變'],
    '只多1次'
  );

  installAutoGradeTrigger(form);

  Logger.log('編輯用網址（自己改題目用，也貼到 FORM_EDIT_URL）：' + form.getEditUrl());
  // 一定要加 ?embedded=true，不然嵌入iframe會被Google擋掉（顯示「docs.google.com拒絕連線」）
  Logger.log('填答/嵌入用網址（貼到 week9-8-intro.md 的 embeds.url）：' + form.getPublishedUrl() + '?embedded=true');
}

/** 新增一題單選題，設成2分、有標準答案（測驗模式下才會自動評分）。 */
function addScoredChoice(form, title, options, correctOption) {
  var item = form.addMultipleChoiceItem();
  item.setTitle(title).setPoints(2).setRequired(true);
  item.setChoices(
    options.map(function (opt) {
      return item.createChoice(opt, opt === correctOption);
    })
  );
}

/** 「班級座號姓名」格式：班級(17開頭)+班級編號(01~10)_座號(01~27)_姓名(2~4個中文字)。
 *  這個函式跟其他 create-week*.gs.js 裡的重複——每個 Apps Script 專案是各自獨立
 *  的檔案，沒辦法跨檔案共用函式，所以每份腳本各自複製一份。 */
var NAME_ID_PATTERN = '^[1278](0[1-9]|10)_(0[1-9]|1[0-9]|2[0-7])_[一-龥]{2,4}$';

/**
 * 新增「班級座號姓名」文字題，用正規表示法擋格式；格式一通過驗證，
 * onFormSubmit 觸發條件送出時就會自動打滿分（見下方 installAutoGradeTrigger）。
 */
function addNameIdItem(form, points) {
  var item = form.addTextItem();
  item
    .setTitle('請輸入 班級座號姓名（格式：班級_座號_姓名，例如 810_16_王小明）')
    .setHelpText('格式：班級_座號_姓名，例如 810_16_王小明。')
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .setHelpText('格式錯誤，請依照 班級_座號_姓名 輸入，例如 810_16_王小明。')
        .requireTextMatchesPattern(NAME_ID_PATTERN)
        .build()
    );
  if (points) {
    item.setPoints(points);
  }
  return item;
}

/** 綁定「表單提交時」觸發條件，讓 autoGradeIdField 在每次送出時打80分。
 *  多人同時送出時常常收到 Google 端暫時性的伺服器錯誤而沒打成分，
 *  所以每次上完課都要手動重跑一次 backfillGrades()，不要只依賴這個即時觸發。 */
function installAutoGradeTrigger(form) {
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return trigger.getHandlerFunction() === 'autoGradeIdField' && trigger.getTriggerSourceId() === form.getId();
    })
    .forEach(function (trigger) {
      ScriptApp.deleteTrigger(trigger);
    });
  ScriptApp.newTrigger('autoGradeIdField').forForm(form).onFormSubmit().create();
}

/** 表單提交時觸發：直接給「班級座號姓名」（唯一的簡答題）打80分。 */
function autoGradeIdField(e) {
  try {
    var form = e.source;
    var response = e.response;
    var idItem = form.getItems(FormApp.ItemType.TEXT)[0];
    var itemResponse = response.getGradableResponseForItem(idItem);
    itemResponse.setScore(80);
    form.submitGrades([response.withItemGrade(itemResponse)]);
    Logger.log('已成功給分：80分，回覆時間 ' + response.getTimestamp());
  } catch (err) {
    Logger.log('自動評分失敗：' + err.message);
  }
}

/** 執行過一次 createForm() 之後，把印出的「編輯用網址」貼在這裡，backfillGrades()
 *  才能重新打開這份表單。 */
var FORM_EDIT_URL = 'https://docs.google.com/forms/d/1Lho6YfMQpsDj2EoZoxkCQdCyFlMoMWRJbrX7BorInLI/edit';

/** 補打所有回覆的80分：建議每次上完課手動重跑一次（重複執行也不會出錯）。 */
function backfillGrades() {
  var form = FormApp.openByUrl(FORM_EDIT_URL);
  var idItem = form.getItems(FormApp.ItemType.TEXT)[0];
  var responses = form.getResponses();
  var gradedResponses = [];
  for (var i = 0; i < responses.length; i++) {
    var itemResponse = responses[i].getGradableResponseForItem(idItem);
    itemResponse.setScore(80);
    gradedResponses.push(responses[i].withItemGrade(itemResponse));
  }
  form.submitGrades(gradedResponses);
  Logger.log('已補上 ' + gradedResponses.length + ' 份回覆的80分');
}
