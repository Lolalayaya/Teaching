/**
 * 第四週・防線任務 個人複習測驗 —— Google Apps Script，自動建立Google表單
 *
 * 這份表單考的是「觀念」，不是這週案例（TikTok、高雄詐騙SIM卡）的細節——
 * 用不同的情境／直接問觀念的方式出題，個資保護、資訊安全各5題，全班每個人
 * 都寫全部10題，不跳轉。
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案
 * 2. 把這個檔案的內容整個貼到編輯器裡（取代預設的 myFunction）
 * 3. 上方選單選 createForm 這個函式，按執行（第一次會要求授權，允許即可）
 * 4. 執行完成後，左下角「執行紀錄」會印出：
 *    - 編輯用網址（自己修改題目用）
 *    - 填答/嵌入用網址（要貼回 week4-7-intro.md frontmatter 的 embeds.url，
 *      後面接上 &embedded=true）
 * 5. 建議把表單的「回覆」分頁連結到一張Google試算表（表單編輯畫面右上角「回覆」
 *    分頁 → 綠色試算表圖示），方便對照班級座號姓名，核對誰還沒填。
 *
 * 第一題「班級座號姓名」文字題用正規表示法擋格式（例如 701_05_王小明），格式不對無法
 * 送出；執行 createForm() 時會順便建立一個「表單提交時」的觸發條件，格式一通過驗證，
 * 送出後就自動打80分，不用手動批改（第一次執行會多跳出一次授權要求，允許即可）。
 * 其餘10題單選各2分，80 + 2×10 = 100分。
 *
 * createForm() 已經自動設定：收集電子郵件、限制每人只能回覆1次、問題順序隨機。
 * 以下幾項 Google Forms 目前沒有開放 Apps Script 用程式設定，執行完 createForm()
 * 之後，麻煩自己到表單右上角⚙️（設定）手動確認/勾選一次：
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
  var form = FormApp.create('W4-7-防線任務・個人複習測驗');
  form.setIsQuiz(true);
  form.setDescription('考的是這週學的個資保護、資訊安全觀念，不是課堂案例的細節，10題都要寫。');
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);
  form.setShuffleQuestions(true);

  addNameIdItem(form, 80);

  // 個資保護觀念題（5題），不考TikTok案例細節。
  addScoredChoice(
    form,
    '下列何者屬於個資法規定的「特種個人資料」，需要更嚴格保護？',
    ['姓名', '電話號碼', '病歷', '居住地址'],
    '病歷'
  );
  addScoredChoice(
    form,
    '機關或公司蒐集個人資料時，除了要有特定目的、經過當事人同意，還必須做到什麼？',
    ['不用讓當事人知道', '明確告知蒐集目的與用途', '可以無限期保存不用理會當事人', '不用理會當事人反對'],
    '明確告知蒐集目的與用途'
  );
  addScoredChoice(
    form,
    '下列何者「不是」個資當事人依法享有的權利？',
    ['請求查詢或閱覽', '請求刪除', '請求對方付費才能繼續使用', '請求補充或更正'],
    '請求對方付費才能繼續使用'
  );
  addScoredChoice(
    form,
    '「蒐集與利用個資不能超過達成目的的必要範圍」，這個原則叫做什麼？',
    ['比例原則', '平等原則', '誠信原則', '公開原則'],
    '比例原則'
  );
  addScoredChoice(
    form,
    '使用完公用電腦後，離開前應該怎麼做才能保護自己的個資？',
    ['直接關螢幕就好', '登出帳號、清除瀏覽紀錄，或使用無痕模式', '留著帳號方便下次使用', '不用特別處理'],
    '登出帳號、清除瀏覽紀錄，或使用無痕模式'
  );

  // 資訊安全觀念題（5題），不考高雄詐騙案例細節。
  addScoredChoice(
    form,
    '資訊安全的CIA三要素不包含下列何者？',
    ['機密性', '完整性', '可用性', '創造性'],
    '創造性'
  );
  addScoredChoice(
    form,
    '駭客沒有竊取任何資料，只是灌爆網站流量讓伺服器癱瘓、無法正常服務，這主要破壞了CIA的哪一項？',
    ['機密性', '完整性', '可用性', '以上皆是'],
    '可用性'
  );
  addScoredChoice(
    form,
    '網址開頭是HTTPS而不是HTTP，代表什麼？',
    ['網站比較新', '資料傳輸過程有加密', '網站載入比較快', '不會出現廣告'],
    '資料傳輸過程有加密'
  );
  addScoredChoice(
    form,
    '下列何者是網路釣魚郵件常見的可疑特徵？',
    ['寄件時間是平常上班時間', '標題聳動、製造急迫感（例如帳號即將被停用）', '完全沒有附上任何連結', '內容非常簡短'],
    '標題聳動、製造急迫感（例如帳號即將被停用）'
  );
  addScoredChoice(
    form,
    '「利用人性弱點或信任關係，不需要任何程式技巧就能騙到帳號密碼」，這種手法叫做什麼？',
    ['防火牆攻擊', '社交工程', '資料加密', '數位浮水印'],
    '社交工程'
  );

  installAutoGradeTrigger(form);

  Logger.log('編輯用網址（自己改題目用）：' + form.getEditUrl());
  // 一定要加 ?embedded=true，不然嵌入iframe會被Google擋掉（顯示「docs.google.com拒絕連線」）
  Logger.log('填答/嵌入用網址（可直接貼到 week4-7-intro.md 的 embeds.url）：' + form.getPublishedUrl() + '?embedded=true');
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

/** 「班級座號姓名」格式：班級(17開頭)+班級編號(01~10)_座號(01~27)_姓名(2~4個中文字)。 */
var NAME_ID_PATTERN = '^[1278](0[1-9]|10)_(0[1-9]|1[0-9]|2[0-7])_[一-龥]{2,4}$';

/**
 * 新增「班級座號姓名」文字題，用正規表示法擋格式；格式一通過驗證，
 * onFormSubmit 觸發條件送出時就會自動打滿分（見下方 installAutoGradeTrigger）。
 */
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
