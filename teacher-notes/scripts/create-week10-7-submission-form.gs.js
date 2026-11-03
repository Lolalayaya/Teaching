/**
 * 第十週・比對行動 繳交表單（七年級） —— Google Apps Script，自動建立Google表單並自動批改
 *
 * 學生把第九週算出的「我們班」數字，和全年級、全國調查做比較表、算差距，寫出「我們發現」
 * （見 week10-7-intro.md）。這份表單收他們選來寫結論的那一題，自動給分：
 *   1. 班級座號姓名（60分）
 *   2. 組別、選哪一題（不計分，用來找對應的標準答案）
 *   3. 3題數字各5分（15分）：
 *      - 我們班的比例：跟答案總表該班的數字比對
 *      - 比較對象的比例：等於全年級或全國數字（下面 NATIONAL）其中一個就算對
 *      - 差距：用學生自己填的兩個數字相減來比對，前面填錯不會連帶扣這題；正負號都算對
 *   4.「我們發現」句子（10分，簡單用關鍵字判斷）：有兩個以上的數字4分、有比較詞（高／低／多／少）
 *      3分、有注意事項（不過／但是）3分。只是粗略檢查，老師要細看時直接看回覆
 *   5. 情境題2題各5分（10分）：判斷一個比較哪裡不公平
 *   6. 檢查自己組的比較（複選，5分）：沒有標準答案，有選就給分
 *   60 + 15 + 10 + 10 + 5 = 100分
 *
 * 全年級數字和各班數字都讀第九週的「答案總表（老師用）」，707、708補上之後重跑
 * backfillGrades() 就會重算，不用改這份腳本。
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案，把這個檔案的內容整個貼進去
 * 2. 選 createForm 執行（第一次會要求授權，允許即可）
 * 3. 執行紀錄會印出：
 *    - 編輯用網址（貼到下面 FORM_EDIT_URL，backfillGrades() 要用）
 *    - 填答/嵌入用網址（貼回 week10-7-intro.md frontmatter 的 embeds.url，取代
 *      PLACEHOLDER_W10_7_FORM_ID 那一整串，已經加好 ?embedded=true）
 * 4. 建議把表單的「回覆」分頁連結到一張Google試算表。
 *
 * createForm() 已經自動設定：收集電子郵件、限制每人只能回覆1次、測驗模式。
 * 以下幾項要自己到表單右上角⚙️（設定）手動確認一次：
 * 1.「回覆」分頁：「收集電子郵件地址」選「已驗證」；「傳送回覆者回覆副本」選「一律」。
 * 2.「測驗」分頁：「成績發布」選「提交後立即公布」；「回覆者可以看到」三個都勾選。
 *
 * 上課結束後，手動重跑一次 backfillGrades()（可重複執行，不會出錯）。執行紀錄會印出
 * 每一題的答對人數和答錯的人。
 */
function createForm() {
  var form = FormApp.create('W10-7-比對行動・繳交表單');
  form.setIsQuiz(true);
  form.setDescription(
    '從Q1、Q2裡選一題你寫進「我們發現」的題目，把比較表上的數字填進來。' +
      '比例可以寫成像 25% 這樣，小數點後面幾位都可以。'
  );
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);

  addNameIdItem(form, 60);

  form.addListItem().setTitle(GROUP_TITLE).setRequired(true).setChoiceValues(GROUPS);
  form.addMultipleChoiceItem().setTitle(QUESTION_TITLE).setRequired(true).setChoiceValues(['Q1', 'Q2']);

  form
    .addPageBreakItem()
    .setTitle('比較表上的數字')
    .setHelpText('打開你的試算表，看你做的比較表，照下面的題目抄數字。');

  NUMBER_ITEMS.forEach(function (spec) {
    form
      .addTextItem()
      .setTitle(spec.title)
      .setHelpText(spec.help)
      .setPoints(5)
      .setRequired(true)
      .setValidation(
        FormApp.createTextValidation()
          .setHelpText('請只填數字，比例可以加 %，例如 25%；差距是負的可以加 -')
          .requireTextMatchesPattern(NUMBER_PATTERN)
          .build()
      );
  });

  form
    .addParagraphTextItem()
    .setTitle(FINDING_TITLE)
    .setHelpText(
      '照講義的句型寫：我們班有○%的人⋯，比〔全國調查／全年級〕的○%〔高／低〕○個百分點，所以⋯。' +
        '不過，⋯（注意事項）。'
    )
    .setPoints(10)
    .setRequired(true);

  form
    .addPageBreakItem()
    .setTitle('這樣比公平嗎？')
    .setHelpText('想一想第一節的四個問題：誰被問？什麼時候問？問法一樣嗎？問了多少人？');

  SCENARIOS.forEach(function (spec) {
    var item = form.addMultipleChoiceItem();
    item
      .setTitle(spec.title)
      .setPoints(5)
      .setRequired(true)
      .setChoices(
        spec.choices.map(function (text, i) {
          return item.createChoice(text, i === spec.answer);
        })
      );
  });

  form
    .addCheckboxItem()
    .setTitle(SELF_CHECK_TITLE)
    .setHelpText('沒有標準答案，照你們這組的實際情況勾選。')
    .setPoints(5)
    .setRequired(true)
    .setChoiceValues(SELF_CHECK_CHOICES);

  installAutoGradeTrigger(form);

  Logger.log('編輯用網址（自己改題目用，也貼到 FORM_EDIT_URL）：' + form.getEditUrl());
  // 一定要加 ?embedded=true，不然嵌入iframe會被Google擋掉（顯示「docs.google.com拒絕連線」）
  Logger.log('填答/嵌入用網址（貼到 week10-7-intro.md 的 embeds.url）：' + form.getPublishedUrl() + '?embedded=true');
}

/** 第九週的答案總表（create-week9-7-practice-sheets.gs.js 產生），跟 W9 繳交表單用同一份 */
var ANSWER_KEY_SPREADSHEET_ID = '1xMt9GGxerXecZHDTw-uMPyH63kqU7nZEsepGlw_aQsA';

/** 執行過一次 createForm() 之後，把印出的「編輯用網址」貼在這裡，backfillGrades() 才能重新打開這份表單 */
var FORM_EDIT_URL = '';

// 跟 create-week9-7-practice-sheets.gs.js 的 GROUPS 名稱、順序一致（答案總表靠順序找欄位）
var GROUPS = ['個資保護・第一組', '個資保護・第二組', '資訊安全・第一組', '資訊安全・第二組', '合理使用・第一組', '合理使用・第二組'];
var GROUP_TITLE = '你是哪一組？';
var QUESTION_TITLE = '你的「我們發現」用的是哪一題？';
var FINDING_TITLE = '寫下你的「我們發現」';
var SELF_CHECK_TITLE = '你們這組用來比較的資料，跟我們班有哪些不一樣？（可複選）';

// 全國調查數字（0~1），null＝沒有合適的調查，改比全年級。來源見 teacher-notes/week6-7-參考數據來源.md
var NATIONAL = [
  [0.41, 0.277], // 個資1：兒盟2023 給網友個資／兒盟2020 開GPS定位
  [0.2, 0.424], // 個資2：兒盟2020 姓名手機不用保密／兒盟2026 假年齡註冊
  [0.4, 0.5], // 資安1：家扶 近4成遇過網路詐騙／近5成沒有查證習慣
  [0.3, null], // 資安2：家扶 近3成被騙後不告訴別人／（成人調查不採用）
  [null, null], // 合理使用1
  [null, null], // 合理使用2
];

var NUMBER_ITEMS = [
  { title: '我們班的比例', help: '比較表「我們班」那一格', kind: 'ours' },
  { title: '比較對象的比例', help: '有全國數字填全國，沒有的填全年級', kind: 'compare' },
  { title: '差距（百分點）', help: '比較表「差距」那一格，例如高了9.6個百分點就填 9.6', kind: 'diff' },
];
var NUMBER_PATTERN = '^\\s*[-－]?\\s*[0-9０-９]+([.．][0-9０-９]+)?\\s*[%％]?\\s*$';

var SCENARIOS = [
  {
    title:
      '某班20個人裡，有11個人（55%）謊報年齡註冊；兒福聯盟2026年調查11,920位國中生，是42.4%。' +
      '他們寫「我們班的人比全國國中生更愛說謊」。這樣寫最大的問題是什麼？',
    choices: [
      '人數很少，只要一兩個人答得不一樣，比例就會差很多，不能說得這麼肯定',
      '調查的對象是大人，不是國中生',
      '兩份調查問的是完全不同的問題',
      '沒有問題，55%比42.4%高，就可以這樣寫',
    ],
    answer: 0,
  },
  {
    title:
      '某組發現全年級有60%的人跟陌生訊息互動過；一份「台灣人」的詐騙調查是52%。' +
      '他們寫「國中生比大人更容易上當」。這樣寫最大的問題是什麼？',
    choices: [
      '60%和52%差太少，看不出差別',
      '那份調查問的是所有年紀的台灣人，大部分是大人，不能直接拿來跟國中生比',
      '全年級人數太多，應該只看自己班',
      '沒有問題，60%比52%高，就可以這樣寫',
    ],
    answer: 1,
  },
];

var SELF_CHECK_CHOICES = [
  '問的對象年紀不一樣（例如包含高中生）',
  '調查的年份不一樣',
  '問的人數差很多',
  '題目的問法不太一樣',
  '找不到全國數字，我們比的是全年級',
];

/** 讀答案總表，回傳 { '701': [整列數字], ..., '全年級': [...] } */
function readAnswerKey() {
  var sheet = SpreadsheetApp.openById(ANSWER_KEY_SPREADSHEET_ID).getSheets()[0];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var key = {};
  rows.forEach(function (row) {
    key[String(row[0])] = row;
  });
  return key;
}

/** 把學生填的字換成百分比數字：全形轉半形、去掉%；沒寫%又小於1的（例如0.095）當成小數換成9.5。
 *  raw 為 true 時不做小數換算（差距可能真的不到1個百分點，例如0.5） */
function toPercent(text, raw) {
  var s = String(text)
    .replace(/[０-９．－]/g, function (ch) {
      if (ch === '．') return '.';
      if (ch === '－') return '-';
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
    })
    .replace(/\s/g, '');
  var hasPercent = /[%％]/.test(s);
  var value = parseFloat(s.replace(/[%％]/g, ''));
  if (!raw && !hasPercent && Math.abs(value) < 1 && value !== 0) value *= 100;
  return value;
}

/** 兩個百分比差0.6以內算對（四捨五入到整數最多差0.5） */
function near(a, b) {
  return !isNaN(a) && Math.abs(a - b) <= 0.6;
}

/** 「我們發現」的粗略分數：兩個以上數字4分、比較詞3分、注意事項3分 */
function scoreFinding(text) {
  var s = String(text);
  var numbers = s.match(/[0-9０-９]+([.．][0-9０-９]+)?/g) || [];
  var score = 0;
  if (numbers.length >= 2) score += 4;
  if (/[高低多少]/.test(s)) score += 3;
  if (/不過|但是|但|可是|然而/.test(s)) score += 3;
  return score;
}

/**
 * 批改一份回覆。回傳 { graded, result }，result 記錄每題對錯，給 backfillGrades() 統計用。
 * 找不到該班答案時，「我們班的比例」先給0分，等答案總表補上後重跑 backfillGrades() 就會重算。
 */
function gradeResponse(form, response, key) {
  var items = form.getItems();
  function findItem(title) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].getTitle() === title) return items[i];
    }
    throw new Error('找不到題目：' + title + '（題目標題是否被改過？）');
  }
  function answerOf(title) {
    return response.getResponseForItem(findItem(title)).getResponse();
  }
  function setScore(item, score) {
    var itemResponse = response.getGradableResponseForItem(item);
    itemResponse.setScore(score);
    response.withItemGrade(itemResponse);
  }

  var idItem = form.getItems(FormApp.ItemType.TEXT)[0];
  var id = String(response.getResponseForItem(idItem).getResponse());
  var g = GROUPS.indexOf(String(answerOf(GROUP_TITLE)));
  var q = answerOf(QUESTION_TITLE) === 'Q2' ? 1 : 0;
  var row = key[id.slice(0, 3)];
  var grade = key['全年級'];
  // 答案總表每組5欄：Q1人數、Q1比例、Q2人數、Q2比例、Q3平均
  var col = 2 + g * 5 + (q === 0 ? 1 : 3);

  setScore(idItem, 60);

  var ours = toPercent(answerOf(NUMBER_ITEMS[0].title));
  var compare = toPercent(answerOf(NUMBER_ITEMS[1].title));
  var diffText = answerOf(NUMBER_ITEMS[2].title);
  var diffRaw = Math.abs(toPercent(diffText, true));
  var diff = Math.abs(ours - compare);
  var targets = [];
  if (grade && g >= 0) targets.push(grade[col] * 100);
  if (g >= 0 && NATIONAL[g][q] !== null) targets.push(NATIONAL[g][q] * 100);

  var correct = [
    !!row && g >= 0 && near(ours, row[col] * 100),
    targets.some(function (t) { return near(compare, t); }),
    // 差距一般填 9.6 或 9.6%；沒按%按鈕直接抄小數的會是 0.096
    near(diffRaw, diff) || near(diffRaw * 100, diff),
  ];
  NUMBER_ITEMS.forEach(function (spec, i) {
    setScore(findItem(spec.title), correct[i] ? 5 : 0);
  });

  var findingScore = scoreFinding(answerOf(FINDING_TITLE));
  setScore(findItem(FINDING_TITLE), findingScore);
  setScore(findItem(SELF_CHECK_TITLE), 5);

  return { graded: response, result: { id: id, missingKey: !row, correct: correct, findingScore: findingScore } };
}

/** 綁定「表單提交時」觸發條件，讓 autoGrade 在每次送出時批改。
 *  多人同時送出時常常收到 Google 端暫時性的伺服器錯誤而沒批到，
 *  所以每次上完課都要手動重跑一次 backfillGrades()，不要只依賴這個即時觸發。 */
function installAutoGradeTrigger(form) {
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return trigger.getHandlerFunction() === 'autoGrade' && trigger.getTriggerSourceId() === form.getId();
    })
    .forEach(function (trigger) {
      ScriptApp.deleteTrigger(trigger);
    });
  ScriptApp.newTrigger('autoGrade').forForm(form).onFormSubmit().create();
}

/** 表單提交時觸發：批改這一份回覆 */
function autoGrade(e) {
  try {
    var out = gradeResponse(e.source, e.response, readAnswerKey());
    e.source.submitGrades([out.graded]);
    Logger.log('已批改：' + out.result.id);
  } catch (err) {
    Logger.log('自動評分失敗：' + err.message);
  }
}

/** 重新批改所有回覆：建議每次上完課手動重跑一次（重複執行也不會出錯），
 *  執行紀錄會印出每題答對人數、答錯的人，以及「我們發現」沒拿滿分的人。 */
function backfillGrades() {
  var form = FormApp.openByUrl(FORM_EDIT_URL);
  var key = readAnswerKey();
  var graded = [];
  var correctCounts = NUMBER_ITEMS.map(function () { return 0; });

  form.getResponses().forEach(function (response) {
    var out = gradeResponse(form, response, key);
    graded.push(out.graded);
    if (out.result.missingKey) Logger.log(out.result.id + '：答案總表沒有這班，「我們班的比例」先給0分');
    var wrong = [];
    out.result.correct.forEach(function (ok, i) {
      if (ok) correctCounts[i]++;
      else wrong.push(NUMBER_ITEMS[i].title);
    });
    if (wrong.length > 0) Logger.log(out.result.id + '：答錯 ' + wrong.join('、'));
    if (out.result.findingScore < 10) Logger.log(out.result.id + '：「我們發現」' + out.result.findingScore + '分，可以點開看');
  });

  form.submitGrades(graded);
  Logger.log('共批改 ' + graded.length + ' 份');
  NUMBER_ITEMS.forEach(function (spec, i) {
    Logger.log(spec.title + '：答對 ' + correctCounts[i] + ' 人');
  });
}

/** 「班級座號姓名」格式：班級(17開頭)+班級編號(01~10)_座號(01~27)_姓名(2~4個中文字)。
 *  這個函式跟其他 create-week*.gs.js 裡的重複——每個 Apps Script 專案是各自獨立
 *  的檔案，沒辦法跨檔案共用函式，所以每份腳本各自複製一份。 */
var NAME_ID_PATTERN = '^[1278](0[1-9]|10)_(0[1-9]|1[0-9]|2[0-7])_[一-龥]{2,4}$';

/** 新增「班級座號姓名」文字題，用正規表示法擋格式，送出後由 autoGrade 打60分 */
function addNameIdItem(form, points) {
  var item = form.addTextItem();
  item
    .setTitle('請輸入 班級座號姓名（格式：班級_座號_姓名，例如 710_16_王小明）')
    .setHelpText('格式：班級_座號_姓名，例如 710_16_王小明。')
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .setHelpText('格式錯誤，請依照 班級_座號_姓名 輸入，例如 710_16_王小明。')
        .requireTextMatchesPattern(NAME_ID_PATTERN)
        .build()
    );
  if (points) {
    item.setPoints(points);
  }
  return item;
}
