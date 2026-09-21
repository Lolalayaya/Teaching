/**
 * 第五週・抉擇任務 個人複習測驗 —— Google Apps Script，自動建立Google表單
 *
 * 前5題考「資訊科技合理使用原則」的觀念（不考乖乖鑰匙圈案的細節，用其他情境／
 * 直接問觀念的方式出題），全班每個人都要寫。接著選「你們這組選定的主題」，表單
 * 會依選擇自動跳到對應主題的5題案例題（個資保護＝TikTok案例／資訊安全＝高雄
 * 詐騙案例／資訊科技合理使用原則＝乖乖鑰匙圈案），只會看到自己那組的5題。
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案
 * 2. 把這個檔案的內容整個貼到編輯器裡（取代預設的 myFunction）
 * 3. 上方選單選 createForm 這個函式，按執行（第一次會要求授權，允許即可）
 * 4. 執行完成後，左下角「執行紀錄」會印出：
 *    - 編輯用網址（自己修改題目用）
 *    - 填答/嵌入用網址（要貼回 week5-7-intro.md frontmatter 的 embeds.url，
 *      後面接上 &embedded=true）
 * 5. 建議把表單的「回覆」分頁連結到一張Google試算表（表單編輯畫面右上角「回覆」
 *    分頁 → 綠色試算表圖示），方便對照班級座號姓名，核對誰還沒填。
 *
 * 第一題「班級座號姓名」文字題用正規表示法擋格式（例如 701_05_王小明），格式不對無法
 * 送出；執行 createForm() 時會順便建立一個「表單提交時」的觸發條件，格式一通過驗證，
 * 送出後就自動打80分，不用手動批改（第一次執行會多跳出一次授權要求，允許即可）。
 * 其餘10題（前5題固定＋跳轉後5題）單選各2分，80 + 2×10 = 100分。
 *
 * 這份表單用「分頁」做主題分流：第一頁是「班級座號姓名＋前5題觀念題＋選主題」，
 * 選完後跳到對應主題那一頁（其餘主題不會看到）。
 *
 * createForm() 已經自動設定：收集電子郵件、限制每人只能回覆1次、問題順序隨機。
 * 以下幾項 Google Forms 目前沒有開放 Apps Script 用程式設定，執行完 createForm()
 * 之後，麻煩自己到表單右上角⚙️（設定）手動確認/勾選一次：
 * 1.「回覆」分頁：「收集電子郵件地址」確認是選「已驗證」，不是「回覆者輸入」；
 *    「傳送回覆者回覆副本」選「一律」。
 * 2.「測驗」分頁：「成績發布」選「提交後立即公布」；「回覆者可以看到」三個都勾選
 *    （漏答的題目、正確答案、分數）。
 * 3. 每一題單選題右下角有個「隨機排列選項順序」的洗牌圖示，需要每一題手動點開
 *    （Apps Script 沒有提供程式化設定選項洗牌的方法，這份表單共20題都要點）。
 *
 * 上課結束後，建議手動重跑一次 backfillGrades()，補齊即時觸發沒成功打到分的回覆：
 * 先把 createForm() 印出的「編輯用網址」貼到下面 FORM_EDIT_URL，上方選單選
 * backfillGrades 執行即可（可重複執行，不會重複扣分或出錯）。
 */
function createForm() {
  var form = FormApp.create('W5-7-抉擇任務・個人複習測驗');
  form.setIsQuiz(true);
  form.setDescription(
    '前5題考這週學的資訊科技合理使用原則觀念，人人都要寫。接著請選你們這組選定的' +
      '主題，表單會自動跳到對應主題的5題案例題。'
  );
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);
  form.setShuffleQuestions(true);

  addNameIdItem(form, 80);

  // 固定5題：資訊科技合理使用原則觀念題，不考乖乖案細節，人人都寫。
  addScoredChoice(form, '著作權法保護的是下列何者？', ['思想', '概念', '表達', '原理'], '表達');
  addScoredChoice(
    form,
    '著作完成後，如果想受到著作權法保護，需要做什麼？',
    ['必須到主管機關登記', '必須在作品上標示©符號', '不需要任何手續，創作完成就自動受保護', '必須向法院申請許可'],
    '不需要任何手續，創作完成就自動受保護'
  );
  addScoredChoice(
    form,
    '「姓名表示權」屬於下列哪一種權利，且不能讓給別人或被繼承？',
    ['著作財產權', '著作人格權', '專利權', '商標權'],
    '著作人格權'
  );
  addScoredChoice(
    form,
    '判斷是否構成「合理使用」，下列何者「不是」法律列出的判斷基準？',
    ['利用的目的及性質', '著作的性質', '創作者的年齡', '對著作市場價值的影響'],
    '創作者的年齡'
  );
  addScoredChoice(
    form,
    '創用CC授權中，「NC」代表什麼意思？',
    ['禁止改作', '姓名標示', '非商業性', '相同方式分享'],
    '非商業性'
  );

  var topicItem = form.addMultipleChoiceItem();
  topicItem.setTitle('你們這組選定的主題是？').setRequired(true);

  // 依選擇跳到對應主題的5題案例題（要等三個分頁都建立好，才能拿到它們的參照）。
  var personalDataPage = form.addPageBreakItem().setTitle('個資保護');
  addScoredChoice(
    form,
    '這次開罰的對象是哪個App？',
    ['Instagram', '抖音（TikTok）', 'Facebook', 'LINE'],
    '抖音（TikTok）'
  );
  addScoredChoice(form, '開罰的機構在哪個國家？', ['台灣', '美國', '愛爾蘭', '日本'], '愛爾蘭');
  addScoredChoice(
    form,
    '調查發現，13到17歲用戶申請帳號時，帳號預設是？',
    ['不公開，只有朋友看得到', '公開，任何人都能看到', '要付費才能設定隱私', '完全無法設定'],
    '公開，任何人都能看到'
  );
  addScoredChoice(
    form,
    '「家長配對」功能出了什麼問題？',
    ['功能根本不存在', '沒有真正驗證對方是不是家長', '只限台灣使用者使用', '需要另外付費'],
    '沒有真正驗證對方是不是家長'
  );
  addScoredChoice(
    form,
    '這個案例最主要在提醒我們什麼？',
    ['App的隱私設定不一定真的能保護你', '所有App都不安全，不要使用', '只有未成年人需要注意隱私設定', '愛爾蘭的法律比台灣嚴格'],
    'App的隱私設定不一定真的能保護你'
  );
  personalDataPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);

  var cyberSecurityPage = form.addPageBreakItem().setTitle('資訊安全');
  addScoredChoice(
    form,
    '這位同學是在哪個平台上看到「免費遊戲帳號」的貼文？',
    ['抖音', 'Facebook', 'YouTube', 'Email'],
    '抖音'
  );
  addScoredChoice(form, '對方一開始用什麼理由要他提供SIM卡？', ['登入遊戲需要', '驗證身分', '辦理退款', '參加抽獎'], '驗證身分');
  addScoredChoice(form, '後來歹徒是假扮什麼身分恐嚇他？', ['老師', '警察', '遊戲公司客服', '家長'], '警察');
  addScoredChoice(
    form,
    '這件事最後是怎麼被阻止的？',
    ['同學自己識破報警', '電信公司因民眾檢舉停話', '遊戲公司凍結帳號', '學校老師發現'],
    '電信公司因民眾檢舉停話'
  );
  addScoredChoice(
    form,
    '這個案例主要提醒我們，詐騙集團常利用什麼手法？',
    ['只用威脅，不會給好處', '先給好處吸引人，再用恐懼逼人聽話', '只鎖定成年人下手', '只透過電話進行，不會用社群平台'],
    '先給好處吸引人，再用恐懼逼人聽話'
  );
  cyberSecurityPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);

  var responsibleUsePage = form.addPageBreakItem().setTitle('資訊科技合理使用原則');
  addScoredChoice(
    form,
    '谷阿莫的影片系列叫什麼名字？',
    ['X分鐘看完電影', '電影解說王', '一分鐘看電影', '電影懶人包'],
    'X分鐘看完電影'
  );
  addScoredChoice(
    form,
    '他的影片主要剪輯了哪些作品的畫面？',
    ['只有國片', '迪士尼、得利影視等5家片商的作品', '只有動畫影集', '自己拍的素材'],
    '迪士尼、得利影視等5家片商的作品'
  );
  addScoredChoice(
    form,
    '檢方認定他的行為屬於什麼，因此不算合理使用？',
    ['引用', '改作', '翻譯', '公開播送'],
    '改作'
  );
  addScoredChoice(
    form,
    '他最後怎麼解決這起訴訟？',
    ['不了了之', '跟5家片商全部和解，賠償超過100萬元', '打贏官司，沒有賠錢', '片商全部撤告不用賠'],
    '跟5家片商全部和解，賠償超過100萬元'
  );
  addScoredChoice(
    form,
    '這個案例告訴我們什麼？',
    ['有加旁白解說就算自己的創作，不算侵權', '網紅名氣越大就越不會被告', '即使是知名創作者，未經授權使用他人作品一樣要負責任', '只要影片很紅就不算侵權'],
    '即使是知名創作者，未經授權使用他人作品一樣要負責任'
  );
  responsibleUsePage.setGoToPage(FormApp.PageNavigationType.SUBMIT);

  topicItem.setChoices([
    topicItem.createChoice('個資保護', personalDataPage),
    topicItem.createChoice('資訊安全', cyberSecurityPage),
    topicItem.createChoice('資訊科技合理使用原則', responsibleUsePage),
  ]);

  installAutoGradeTrigger(form);

  Logger.log('編輯用網址（自己改題目用）：' + form.getEditUrl());
  // 一定要加 ?embedded=true，不然嵌入iframe會被Google擋掉（顯示「docs.google.com拒絕連線」）
  Logger.log('填答/嵌入用網址（可直接貼到 week5-7-intro.md 的 embeds.url）：' + form.getPublishedUrl() + '?embedded=true');
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
