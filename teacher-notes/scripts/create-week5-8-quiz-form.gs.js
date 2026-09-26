/**
 * 第五週・擂台行動 小測驗（八年級） —— Google Apps Script，自動建立Google表單
 *
 * 分兩段：前5題是「迴圈、條件式」複習題（去年Scratch學過的內容，這堂課會先帶學生
 * 複習一次，下週要正式在Scratch裡用到），後5題是今天打擂台法的步驟、比較次數(n-1)、
 * 跟之後排序的關係。
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案
 * 2. 把這個檔案的內容整個貼到編輯器裡（取代預設的 myFunction）
 * 3. 上方選單選 createForm 這個函式，按執行（第一次會要求授權，允許即可）
 * 4. 執行完成後，左下角「執行紀錄」會印出：
 *    - 編輯用網址（自己修改題目用）
 *    - 填答/嵌入用網址（要貼回 week5-8-intro.md frontmatter 的 embeds.url，取代
 *      PLACEHOLDER_FORM_ID，已經加好 ?embedded=true 可以直接貼上）
 * 5. 建議把表單的「回覆」分頁連結到一張Google試算表，方便看整班作答狀況。
 *
 * 第一題「班級座號姓名」文字題用正規表示法擋格式（例如 801_05_王小明），格式不對無法
 * 送出；執行 createForm() 時會順便建立一個「表單提交時」的觸發條件，格式一通過驗證，
 * 送出後就自動打80分，不用手動批改（第一次執行會多跳出一次授權要求，允許即可）。
 * 其餘10題（診斷5題＋擂台行動5題）單選各2分，80 + 2×10 = 100分。
 *
 * createForm() 已經自動設定：收集電子郵件、限制每人只能回覆1次、問題順序隨機、
 * 測驗模式（setIsQuiz）。以下幾項 Google Forms 目前沒有開放 Apps Script 用程式
 * 設定，執行完 createForm() 之後，麻煩自己到表單右上角⚙️（設定）手動確認/勾選一次：
 * 1.「回覆」分頁：「收集電子郵件地址」確認是選「已驗證」，不是「回覆者輸入」；
 *    「傳送回覆者回覆副本」選「一律」。
 * 2.「測驗」分頁：「成績發布」選「提交後立即公布」；「回覆者可以看到」三個都勾選
 *    （漏答的題目、正確答案、分數）。
 * 3. 每一題單選題右下角有個「隨機排列選項順序」的洗牌圖示，需要每一題手動點開
 *    （Apps Script 沒有提供程式化設定選項洗牌的方法，這份表單共10題都要點）。
 *
 * 上課結束後，建議手動重跑一次 backfillGrades()，補齊即時觸發沒成功打到分的回覆：
 * 先把 createForm() 印出的「編輯用網址」貼到下面 FORM_EDIT_URL，上方選單選
 * backfillGrades 執行即可（可重複執行，不會重複扣分或出錯）。
 */
function createForm() {
  var form = FormApp.create('W5-8-擂台行動・小測驗');
  form.setIsQuiz(true);
  form.setDescription(
    '前5題考剛剛複習過的迴圈、條件式概念（去年Scratch學過的內容，下週要正式在Scratch' +
      '裡用到）。完成小組打擂台活動之後，接著做後5題，考今天學到的打擂台法步驟與比較次數。'
  );
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);
  form.setShuffleQuestions(true);

  addNameIdItem(form, 80);

  form.addPageBreakItem().setTitle('迴圈、條件式診斷');

  addScoredChoice(
    form,
    '在Scratch裡，想要「重複執行同一組積木10次」，會用哪一種積木？',
    ['重複執行10次', '如果...那麼', '等待10秒', '廣播訊息'],
    '重複執行10次'
  );

  addScoredChoice(
    form,
    '「重複無限次」這種迴圈積木，程式會怎麼樣？',
    ['執行一次就結束', '一直重複執行，除非被停止', '完全不會執行', '只在按下空白鍵時執行一次'],
    '一直重複執行，除非被停止'
  );

  addScoredChoice(
    form,
    '「如果...那麼...否則...」這個積木的作用是？',
    ['讓程式根據條件是否成立，執行不同的動作', '讓程式重複執行固定次數', '讓角色移動到指定位置', '讓程式停止執行'],
    '讓程式根據條件是否成立，執行不同的動作'
  );

  addScoredChoice(
    form,
    '想要判斷「分數是不是大於60」，要用哪一種積木來寫這個條件？',
    ['重複積木', '比較運算子（大於）', '廣播積木', '清單積木'],
    '比較運算子（大於）'
  );

  addScoredChoice(
    form,
    '一個迴圈裡面又放了一個「如果...那麼」積木，這種寫法叫做什麼？',
    ['巢狀（迴圈裡面包條件式）', '錯誤寫法，不能這樣做', '迴圈提前結束', '變數覆蓋'],
    '巢狀（迴圈裡面包條件式）'
  );

  form.addPageBreakItem().setTitle('擂台行動小測驗');

  addScoredChoice(
    form,
    '打擂台法時，兩張卡比較後，分數比較高的那張卡接下來會怎麼樣？',
    ['留在擂台上，繼續跟下一張卡比', '被淘汰放到一旁', '直接排到最後一名', '兩張卡都保留，並列第一'],
    '留在擂台上，繼續跟下一張卡比'
  );

  addScoredChoice(
    form,
    '如果有6張分數卡，用打擂台法找出最大值，總共需要比較幾次？',
    ['4次', '5次', '6次', '7次'],
    '5次'
  );

  addScoredChoice(
    form,
    '打擂台法最後留在擂台上的那張卡，代表什麼？',
    ['這批資料裡的最大值', '這批資料裡的最小值', '隨機一張卡', '所有資料的平均值'],
    '這批資料裡的最大值'
  );

  addScoredChoice(
    form,
    '如果排行榜有100位玩家，用打擂台法從頭比到尾，需要比較幾次？',
    ['99次', '100次', '50次', '10000次'],
    '99次'
  );

  addScoredChoice(
    form,
    '這學期後面會學到的「排序」，跟今天的打擂台法有什麼關係？',
    [
      '排序時每一輪都要用打擂台法，從剩下的資料裡找出最大值',
      '完全沒關係，是兩件不同的事',
      '排序不需要比較大小',
      '打擂台法只能用來找最大值，不能用在排序上',
    ],
    '排序時每一輪都要用打擂台法，從剩下的資料裡找出最大值'
  );

  installAutoGradeTrigger(form);

  Logger.log('編輯用網址（自己改題目用）：' + form.getEditUrl());
  // 一定要加 ?embedded=true，不然嵌入iframe會被Google擋掉（顯示「docs.google.com拒絕連線」）
  Logger.log('填答/嵌入用網址（可直接貼到 week5-8-intro.md 的 embeds.url）：' + form.getPublishedUrl() + '?embedded=true');
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

/** 綁定「表單提交時」觸發條件，讓 autoGradeIdField（見下方）在每次送出時打80分。
 *  之前用的是 onFormSubmit + formResponse.withItemGrades(...).submit()，但正式
 *  上課多人同時送出時，這個寫法常常收到 Google 端暫時性的伺服器錯誤而沒打成分；
 *  改用 autoGradeIdField 這個 getGradableResponseForItem + form.submitGrades()
 *  的寫法比較能成功觸發，但仍建議每次上完課手動重跑一次 backfillGrades()（見下方）
 *  補齊漏掉的分數，不要只依賴這個即時觸發。 */
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
    var items = form.getItems(FormApp.ItemType.TEXT);
    if (items.length === 0) {
      Logger.log('沒有找到任何簡答題項目');
      return;
    }
    var idItem = items[0];
    var itemResponse = response.getGradableResponseForItem(idItem);
    itemResponse.setScore(80);
    var gradedResponse = response.withItemGrade(itemResponse);
    form.submitGrades([gradedResponse]);
    Logger.log('已成功給分：80分，回覆時間 ' + response.getTimestamp());
  } catch (err) {
    Logger.log('自動評分失敗：' + err.message);
  }
}

/** 執行過一次 createForm() 之後，把印出的「編輯用網址」貼在這裡，backfillGrades()
 *  才能重新打開這份表單、補打分數。 */
var FORM_EDIT_URL = '';

/** 補打所有回覆的80分：建議每次上完課手動重跑一次，確保沒有回覆漏掉自動評分
 *  （重複執行也不會出錯，同一份回覆分數就是重打一次80分而已）。 */
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
