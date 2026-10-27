/**
 * 第九週・解碼行動 繳交表單（七年級） —— Google Apps Script，自動建立Google表單並自動批改
 *
 * 學生用自己組在第六週設計的3題，在練習檔算出人數、比例、平均（見 week9-7-intro.md）。
 * 這份表單收他們算出來的數字，跟「答案總表（老師用）」比對後自動給分：
 *   1. 班級座號姓名（80分）
 *   2. 組別（不計分，用來找對應的標準答案）
 *   3. 5題數字各4分：Q1總人數、Q1 Yes人數、Q1 Yes比例、Q2 Yes比例、Q3平均
 *      80 + 4×5 = 100分。Q2比例是專門檢查「拖曳複製後有沒有改選項文字」的那一題。
 *   4. 試算表連結（不計分，老師要看圖表時點開）
 *
 * 標準答案不寫死在這裡：每班答案不同，由 create-week9-7-practice-sheets.gs.js 在建練習檔的
 * 同時寫進答案總表，這份腳本批改時才去讀，所以707、708之後補建也不用改這份腳本。
 *
 * 比例的寫法學生可能不一樣（9.52%、9.5、10%、0.095），都換成百分比後，跟標準答案差
 * 0.6以內就算對（四捨五入到整數最多差0.5）。平均差0.06以內算對（四捨五入到小數第1位）。
 *
 * 使用方式：
 * 1. 先執行過 create-week9-7-practice-sheets.gs.js，把印出的答案總表ID貼到下面
 *    ANSWER_KEY_SPREADSHEET_ID
 * 2. 開啟 https://script.google.com/ → 新增專案，把這個檔案的內容整個貼進去
 * 3. 選 createForm 執行（第一次會要求授權，允許即可）
 * 4. 執行紀錄會印出：
 *    - 編輯用網址（貼到下面 FORM_EDIT_URL，backfillGrades() 要用）
 *    - 填答/嵌入用網址（貼回 week9-7-intro.md frontmatter 的 embeds.url，取代
 *      PLACEHOLDER_W9_7_FORM_ID 那一整串，已經加好 ?embedded=true）
 * 5. 建議把表單的「回覆」分頁連結到一張Google試算表。
 *
 * createForm() 已經自動設定：收集電子郵件、限制每人只能回覆1次、測驗模式。
 * 以下幾項要自己到表單右上角⚙️（設定）手動確認一次：
 * 1.「回覆」分頁：「收集電子郵件地址」選「已驗證」；「傳送回覆者回覆副本」選「一律」。
 * 2.「測驗」分頁：「成績發布」選「提交後立即公布」；「回覆者可以看到」三個都勾選。
 * ⚠️ 不打亂題目順序：Q1、Q2、Q3要照順序排，跟練習檔分析區對得起來。
 *
 * 上課結束後，手動重跑一次 backfillGrades()（可重複執行，不會出錯）。它會重新批改
 * 所有回覆，並在執行紀錄印出每一題的答對人數和答錯的人，看得出全班卡在哪一步。
 */
function createForm() {
  var form = FormApp.create('W9-7-解碼行動・繳交表單');
  form.setIsQuiz(true);
  form.setDescription(
    '把你在練習檔分析區算出來的數字填進來。數字照試算表顯示的抄就好，' +
      '比例可以寫成像 25% 這樣，小數點後面幾位都可以。'
  );
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);

  addNameIdItem(form, 80);

  var groupItem = form.addListItem();
  groupItem.setTitle(GROUP_TITLE).setRequired(true);
  groupItem.setChoiceValues(GROUPS);

  form
    .addPageBreakItem()
    .setTitle('你算出來的數字')
    .setHelpText('打開你的練習檔，往下捲到「▼ 分析區」，看你們這組那3欄，照下面的題目抄數字。');

  NUMBER_ITEMS.forEach(function (spec) {
    form
      .addTextItem()
      .setTitle(spec.title)
      .setPoints(4)
      .setRequired(true)
      .setValidation(
        FormApp.createTextValidation()
          .setHelpText('請只填數字，比例可以加 %，例如 25%')
          .requireTextMatchesPattern(NUMBER_PATTERN)
          .build()
      );
  });

  form
    .addTextItem()
    .setTitle(LINK_TITLE)
    .setHelpText('先在試算表右上角「共用」→「知道連結的任何人」→「檢視者」，再按「複製連結」貼上。')
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .setHelpText('請貼上Google試算表的連結（docs.google.com/spreadsheets 開頭）')
        .requireTextContainsPattern('docs.google.com/spreadsheets')
        .build()
    );

  installAutoGradeTrigger(form);

  Logger.log('編輯用網址（自己改題目用，也貼到 FORM_EDIT_URL）：' + form.getEditUrl());
  // 一定要加 ?embedded=true，不然嵌入iframe會被Google擋掉（顯示「docs.google.com拒絕連線」）
  Logger.log('填答/嵌入用網址（貼到 week9-7-intro.md 的 embeds.url）：' + form.getPublishedUrl() + '?embedded=true');
}

/** 執行過一次 createPracticeSheets() 之後，把印出的答案總表ID貼在這裡 */
var ANSWER_KEY_SPREADSHEET_ID = '1xMt9GGxerXecZHDTw-uMPyH63kqU7nZEsepGlw_aQsA';

/** 執行過一次 createForm() 之後，把印出的「編輯用網址」貼在這裡，backfillGrades() 才能重新打開這份表單 */
var FORM_EDIT_URL = 'https://docs.google.com/forms/d/1G3uVzleCHJqBL4-h41oh8EYBaK64BsnuxEDwfwks3eI/edit';

// 跟 create-week9-7-practice-sheets.gs.js 的 GROUPS 名稱、順序一致（答案總表靠順序找欄位）
var GROUPS = ['個資保護・第一組', '個資保護・第二組', '資訊安全・第一組', '資訊安全・第二組', '合理使用・第一組', '合理使用・第二組'];
var GROUP_TITLE = '你是哪一組？';
var LINK_TITLE = '貼上你的試算表連結';

// keyOffset：在答案總表裡，該組5欄（Q1人數、Q1比例、Q2人數、Q2比例、Q3平均）中的位置；
// -1 代表「人數」欄（第2欄，全班共用）。kind 決定比對方式。
var NUMBER_ITEMS = [
  { title: 'Q1「總人數」', keyOffset: -1, kind: 'count' },
  { title: 'Q1「Yes的人數」', keyOffset: 0, kind: 'count', oldTitle: 'Q1「第一個選項的人數」' },
  { title: 'Q1「Yes的比例」', keyOffset: 1, kind: 'percent', oldTitle: 'Q1「第一個選項的比例」' },
  { title: 'Q2「Yes的比例」', keyOffset: 3, kind: 'percent', oldTitle: 'Q2「第一個選項的比例」' },
  { title: 'Q3「平均分數」', keyOffset: 4, kind: 'average' },
];
var NUMBER_PATTERN = '^\\s*[0-9０-９]+([.．][0-9０-９]+)?\\s*[%％]?\\s*$';

/**
 * 2026-10-27 題目從「第一個選項」改成「Yes」：已經建好的表單執行一次這個函式，
 * 把題目標題改成新的（批改靠標題找題目，不改的話 backfillGrades() 會找不到題目）。
 * 已經送出的回覆不受影響，可以重複執行。
 */
function renameItemsToYes() {
  var form = FormApp.openByUrl(FORM_EDIT_URL);
  form.getItems().forEach(function (item) {
    NUMBER_ITEMS.forEach(function (spec) {
      if (spec.oldTitle && item.getTitle() === spec.oldTitle) {
        item.setTitle(spec.title);
        Logger.log('已改名：' + spec.oldTitle + ' → ' + spec.title);
      }
    });
  });
}

/** 讀答案總表，回傳 { '701': [整列數字], ... } */
function readAnswerKey() {
  var sheet = SpreadsheetApp.openById(ANSWER_KEY_SPREADSHEET_ID).getSheets()[0];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var key = {};
  rows.forEach(function (row) {
    key[String(row[0])] = row;
  });
  return key;
}

/** 把學生填的字換成數字：全形轉半形、去掉%，記錄有沒有寫% */
function parseAnswer(text) {
  var s = String(text)
    .replace(/[０-９．]/g, function (ch) {
      return ch === '．' ? '.' : String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
    })
    .replace(/\s/g, '');
  var hasPercent = /[%％]/.test(s);
  return { value: parseFloat(s.replace(/[%％]/g, '')), hasPercent: hasPercent };
}

function isCorrect(kind, answer, expected) {
  if (isNaN(answer.value)) return false;
  if (kind === 'count') return answer.value === expected;
  if (kind === 'average') return Math.abs(answer.value - expected) <= 0.06;
  // percent：答案總表存的是0~1的比例
  var target = expected * 100;
  if (Math.abs(answer.value - target) <= 0.6) return true;
  // 沒按%按鈕，直接抄了小數（例如 0.095）
  return !answer.hasPercent && answer.value <= 1 && Math.abs(answer.value * 100 - target) <= 0.6;
}

/**
 * 批改一份回覆：班級座號姓名80分＋5題數字各4分。回傳 { graded, result }，
 * result 記錄每題對錯，給 backfillGrades() 統計用。找不到該班答案時，數字題先給0分，
 * 等答案總表補上後重跑 backfillGrades() 就會重算。
 */
function gradeResponse(form, response, key) {
  var items = form.getItems();
  function findItem(title) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].getTitle() === title) return items[i];
    }
    throw new Error('找不到題目：' + title + '（題目標題是否被改過？）');
  }
  var idItem = form.getItems(FormApp.ItemType.TEXT)[0];
  var id = String(response.getResponseForItem(idItem).getResponse());
  var group = String(response.getResponseForItem(findItem(GROUP_TITLE)).getResponse());
  var row = key[id.slice(0, 3)];
  var g = GROUPS.indexOf(group);

  var idResponse = response.getGradableResponseForItem(idItem);
  idResponse.setScore(80);
  response.withItemGrade(idResponse);

  var result = { id: id, missingKey: !row, correct: [] };
  NUMBER_ITEMS.forEach(function (spec) {
    var item = findItem(spec.title);
    var itemResponse = response.getGradableResponseForItem(item);
    var ok = false;
    if (row && g >= 0) {
      var expected = spec.keyOffset === -1 ? row[1] : row[2 + g * 5 + spec.keyOffset];
      ok = isCorrect(spec.kind, parseAnswer(itemResponse.getResponse()), expected);
    }
    itemResponse.setScore(ok ? 4 : 0);
    response.withItemGrade(itemResponse);
    result.correct.push(ok);
  });
  return { graded: response, result: result };
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
 *  執行紀錄會印出每題答對人數、答錯的人，以及找不到該班答案的人。 */
function backfillGrades() {
  var form = FormApp.openByUrl(FORM_EDIT_URL);
  var key = readAnswerKey();
  var responses = form.getResponses();
  var graded = [];
  var correctCounts = NUMBER_ITEMS.map(function () { return 0; });

  responses.forEach(function (response) {
    var out = gradeResponse(form, response, key);
    graded.push(out.graded);
    if (out.result.missingKey) {
      Logger.log(out.result.id + '：答案總表沒有這班，數字題先給0分');
      return;
    }
    var wrong = [];
    out.result.correct.forEach(function (ok, i) {
      if (ok) correctCounts[i]++;
      else wrong.push(NUMBER_ITEMS[i].title);
    });
    if (wrong.length > 0) Logger.log(out.result.id + '：答錯 ' + wrong.join('、'));
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

/** 新增「班級座號姓名」文字題，用正規表示法擋格式，送出後由 autoGrade 打80分 */
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
