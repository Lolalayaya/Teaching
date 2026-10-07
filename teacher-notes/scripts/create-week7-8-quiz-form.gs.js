/**
 * 第七週・歸位行動 表單B：小測驗＋Bug排序（八年級） —— Google Apps Script，自動建立Google表單
 *
 * 這堂課的計分表單。分三段：
 *   1. 班級座號姓名（80分，自動給分）
 *   2. 選擇排序小測驗：5題單選各4分，80 + 4×5 = 100分
 *   3. Bug排序（不計分）：學生寫下網站上4個讓他卡住的地方(A~D)＋嚴重度1~5，
 *      再用選擇排序依嚴重度由高到低排，寫下第1~3輪結束後的順序。這是網站易用性
 *      測試的一部分（見 teacher-notes/網站易用性測試計畫.md），同時也能診斷學生是否
 *      真的會選擇排序——上完課可以執行 checkBugSortRounds() 自動檢查。
 *
 * ⚠️ 不打亂題目順序：Google表單的「隨機排列問題順序」會連Bug排序段落一起打亂，
 * 問題A~D、第1~3輪就會亂掉。小測驗5題的選項順序可以手動逐題開「隨機排列選項」。
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案
 * 2. 把這個檔案的內容整個貼到編輯器裡（取代預設的 myFunction）
 * 3. 上方選單選 createForm 這個函式，按執行（第一次會要求授權，允許即可）
 * 4. 執行完成後，左下角「執行紀錄」會印出：
 *    - 編輯用網址（自己修改題目用，也要貼到下面 FORM_EDIT_URL）
 *    - 填答/嵌入用網址（貼回 week7-8-intro.md frontmatter 第二個 embeds.url，取代
 *      PLACEHOLDER_FORM_B_ID，已經加好 ?embedded=true 可以直接貼上）
 * 5. 建議把表單的「回覆」分頁連結到一張Google試算表。
 *
 * createForm() 已經自動設定：收集電子郵件、限制每人只能回覆1次、測驗模式。
 * 以下幾項要自己到表單右上角⚙️（設定）手動確認/勾選一次：
 * 1.「回覆」分頁：「收集電子郵件地址」選「已驗證」；「傳送回覆者回覆副本」選「一律」。
 * 2.「測驗」分頁：「成績發布」選「提交後立即公布」；「回覆者可以看到」三個都勾選。
 * 3. 小測驗5題單選題，各自點右下角「隨機排列選項順序」。
 *
 * 上課結束後，手動重跑一次 backfillGrades() 補齊即時觸發沒打到的80分
 * （可重複執行，不會出錯）。
 */
function createForm() {
  var form = FormApp.create('W7-8-歸位行動・表單B・小測驗＋Bug排序');
  form.setIsQuiz(true);
  form.setDescription(
    '先完成5題選擇排序小測驗，接著把課程網站上讓你卡住的地方，用選擇排序排出最該先修的順序。'
  );
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);

  addNameIdItem(form, 80);

  form.addPageBreakItem().setTitle('歸位行動小測驗');

  addScoredChoice(
    form,
    '選擇排序法每一輪要做的事是什麼？',
    [
      '在剩下的資料裡打擂台找出最大值，再跟這一輪的位置交換',
      '把相鄰的兩張卡一直互換，直到換完為止',
      '把新的資料插進中間，後面的資料全部往後移一位',
      '隨機挑一張卡放到第1名',
    ],
    '在剩下的資料裡打擂台找出最大值，再跟這一輪的位置交換'
  );

  addScoredChoice(
    form,
    '排行榜目前是 700、650、920、860，用選擇排序（由大到小）做完第1輪之後，順序會是？',
    ['920、650、700、860', '920、700、650、860', '920、860、700、650', '650、700、860、920'],
    '920、650、700、860'
  );

  addScoredChoice(
    form,
    '5筆資料用選擇排序排好，總共需要比較幾次？',
    ['4次', '5次', '10次', '25次'],
    '10次'
  );

  addScoredChoice(
    form,
    '某一輪打完擂台，發現最大值已經在這一輪的位置上了，接下來要怎麼做？',
    ['不用交換，直接進行下一輪', '跟最後一名交換', '這一輪重新再比一次', '排序到這裡就結束'],
    '不用交換，直接進行下一輪'
  );

  addScoredChoice(
    form,
    '流程圖裡的「菱形」代表什麼？',
    ['判斷：問一個是非題，依照答案走不同的路', '開始或結束', '要做的一個步驟', '下一步往哪裡走'],
    '判斷：問一個是非題，依照答案走不同的路'
  );

  form
    .addPageBreakItem()
    .setTitle('Bug排序')
    .setHelpText(
      '寫下這個課程網站上讓你卡住或覺得不方便的地方，剛好4個，依照寫下的順序叫做問題A、B、C、D，' +
        '再幫每個問題打嚴重度（1＝有點不方便，5＝完全卡住、做不下去）。這一段不計分，' +
        '請照實際感覺寫，你的批評不會影響成績。'
    );

  BUG_LETTERS.forEach(function (letter) {
    form
      .addParagraphTextItem()
      .setTitle('問題' + letter + '：讓你卡住或不方便的地方')
      .setHelpText('寫具體一點，例如「在哪一頁、想做什麼、結果發生什麼事」。')
      .setRequired(true);
    form
      .addScaleItem()
      .setTitle(severityTitle(letter))
      .setBounds(1, 5)
      .setLabels('有點不方便', '完全卡住')
      .setRequired(true);
  });

  form
    .addPageBreakItem()
    .setTitle('用選擇排序排出修理順序')
    .setHelpText(
      '把A~D依嚴重度從高排到低。用字母寫下每一輪結束後的順序，字母中間空一格，例如：C A B D\n' +
        '同分時，跟打擂台一樣：挑戰者要比擂主高才能上台，排在前面的留下。'
    );

  for (var round = 1; round <= 3; round++) {
    form
      .addTextItem()
      .setTitle(roundTitle(round))
      .setRequired(true)
      .setValidation(
        FormApp.createTextValidation()
          .setHelpText('請用A~D四個字母、中間空一格，例如：C A B D')
          .requireTextMatchesPattern(ROUND_PATTERN)
          .build()
      );
  }

  form
    .addParagraphTextItem()
    .setTitle('🌱 如果你是這個網站的設計師，最想加什麼功能？（選填）')
    .setRequired(false);

  installAutoGradeTrigger(form);

  Logger.log('編輯用網址（自己改題目用，也貼到 FORM_EDIT_URL）：' + form.getEditUrl());
  // 一定要加 ?embedded=true，不然嵌入iframe會被Google擋掉（顯示「docs.google.com拒絕連線」）
  Logger.log('填答/嵌入用網址（貼到 week7-8-intro.md 第二個 embeds.url）：' + form.getPublishedUrl() + '?embedded=true');
}

var BUG_LETTERS = ['A', 'B', 'C', 'D'];
var ROUND_PATTERN = '^[A-Da-d] [A-Da-d] [A-Da-d] [A-Da-d]$';

function severityTitle(letter) {
  return '問題' + letter + '的嚴重度';
}

function roundTitle(round) {
  return '第' + round + '輪結束後的順序';
}

/** 新增一題單選題，設成4分、有標準答案（測驗模式下才會自動評分）。 */
function addScoredChoice(form, title, options, correctOption) {
  var item = form.addMultipleChoiceItem();
  item.setTitle(title).setPoints(4).setRequired(true);
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

/** 表單提交時觸發：直接給「班級座號姓名」（第一題簡答題）打80分。 */
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
 *  跟 checkBugSortRounds() 才能重新打開這份表單。 */
var FORM_EDIT_URL = '';

/** 補打所有回覆的80分：建議每次上完課手動重跑一次（重複執行也不會出錯）。
 *  第一個簡答題就是班級座號姓名（第1~3輪順序也是簡答題，但排在後面）。 */
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

/**
 * 診斷用：依每份回覆填的嚴重度，模擬一次選擇排序（由高到低、同分時前面的留下，
 * 跟講義規則一致），比對學生寫的第1~3輪順序，在執行紀錄印出全對人數與答錯的人。
 * 只讀取回覆、不計分、不修改任何東西，可以重複執行。
 */
function checkBugSortRounds() {
  var form = FormApp.openByUrl(FORM_EDIT_URL);
  var items = form.getItems();
  function findItem(title) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].getTitle() === title) return items[i];
    }
    throw new Error('找不到題目：' + title + '（題目標題是否被改過？）');
  }
  var idItem = form.getItems(FormApp.ItemType.TEXT)[0];
  var severityItems = BUG_LETTERS.map(function (letter) { return findItem(severityTitle(letter)); });
  var roundItems = [1, 2, 3].map(function (round) { return findItem(roundTitle(round)); });

  var responses = form.getResponses();
  var allCorrect = 0;
  responses.forEach(function (response) {
    var severity = {};
    BUG_LETTERS.forEach(function (letter, i) {
      severity[letter] = Number(response.getResponseForItem(severityItems[i]).getResponse());
    });
    var expected = selectionSortRounds(severity);
    var actual = roundItems.map(function (item) {
      return String(response.getResponseForItem(item).getResponse()).toUpperCase().trim();
    });
    var wrongRounds = [];
    for (var r = 0; r < 3; r++) {
      if (actual[r] !== expected[r]) wrongRounds.push('第' + (r + 1) + '輪 寫' + actual[r] + ' 應為' + expected[r]);
    }
    if (wrongRounds.length === 0) {
      allCorrect++;
    } else {
      var id = response.getResponseForItem(idItem).getResponse();
      Logger.log(id + '：' + wrongRounds.join('；'));
    }
  });
  Logger.log('共 ' + responses.length + ' 份，三輪全對 ' + allCorrect + ' 份');
}

/** 由高到低的選擇排序，回傳第1~3輪結束後的順序字串（例如 'B A C D'）。
 *  用「嚴格大於」才換擂主，所以同分時排在前面的留下。 */
function selectionSortRounds(severity) {
  var order = BUG_LETTERS.slice();
  var rounds = [];
  for (var r = 0; r < order.length - 1; r++) {
    var maxIndex = r;
    for (var j = r + 1; j < order.length; j++) {
      if (severity[order[j]] > severity[order[maxIndex]]) maxIndex = j;
    }
    var temp = order[r];
    order[r] = order[maxIndex];
    order[maxIndex] = temp;
    rounds.push(order.join(' '));
  }
  return rounds;
}
