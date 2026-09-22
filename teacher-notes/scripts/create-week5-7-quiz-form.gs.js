/**
 * 第五週・抉擇任務 個人複習測驗 —— Google Apps Script，自動建立Google表單
 *
 * 前5題考「資訊科技合理使用原則」的觀念（不考乖乖鑰匙圈案的細節，用其他情境／
 * 直接問觀念的方式出題），全班每個人都要寫。接著選「你們這組選定的主題」，表單
 * 會依選擇自動跳到對應主題的5題案例題（個資保護＝TikTok案例／資訊安全＝高雄
 * 詐騙案例／資訊科技合理使用原則＝乖乖鑰匙圈案），只會看到自己那組的5題。
 *
 * 這5題案例題的答案，故意都不在課本頁面老師寫的案例摘要段落裡，而是藏在
 * 個資保護／資訊安全那週（week4-7-intro.md）或資訊科技合理使用原則這週
 * （week5-7-intro.md）「延伸閱讀：同一件事，不同媒體怎麼報導？」列出的其他
 * 新聞連結裡——逼學生真的點開至少一篇額外報導才能作答，把「橫向閱讀」從口頭
 * 建議變成有分數壓力的實際要求。如果之後案例或延伸閱讀連結換掉，這5題也要
 * 跟著重寫，不能只沿用舊題目。
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
      '主題，表單會自動跳到對應主題的5題案例題——這5題答案不在課本頁面的案例段落' +
      '裡，要回去點開「延伸閱讀：同一件事，不同媒體怎麼報導？」列出的其他新聞連結' +
      '才找得到答案。'
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
  // 以下三個分頁的題目故意不能只看課本頁面的案例段落作答，答案分別藏在上週
  // （個資保護／資訊安全）和這週（資訊科技合理使用原則）「延伸閱讀：同一件事，
  // 不同媒體怎麼報導？」列出的其他新聞連結裡，逼學生真的點開至少一篇額外報導
  // （橫向閱讀），不能只憑頁面上老師寫的案例摘要就作答。
  var personalDataPage = form.addPageBreakItem().setTitle('個資保護');
  addScoredChoice(
    form,
    '負責調查、開罰TikTok的機構全名是？',
    ['愛爾蘭資料保護委員會（DPC）', '歐盟執行委員會', '愛爾蘭警察廳', '愛爾蘭通訊管理局'],
    '愛爾蘭資料保護委員會（DPC）'
  );
  addScoredChoice(
    form,
    '這筆罰款換算成歐元，大約是多少？',
    ['1億歐元', '3.45億歐元', '10億歐元', '5000萬歐元'],
    '3.45億歐元'
  );
  addScoredChoice(
    form,
    '這次裁罰主要依據哪一項歐盟法規？',
    ['著作權法', '一般資料保護規定（GDPR）', '消費者保護法', '網路安全法'],
    '一般資料保護規定（GDPR）'
  );
  addScoredChoice(
    form,
    '根據報導，這是愛爾蘭資料保護委員會第幾次對TikTok開罰？',
    ['第一次', '第三次', '第五次', '這只是例行檢查，不算開罰'],
    '第一次'
  );
  addScoredChoice(
    form,
    'TikTok被要求在多久之內改善還沒解決的違規項目？',
    ['24小時內', '三個月內', '一年內', '沒有限期'],
    '三個月內'
  );
  personalDataPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);

  var cyberSecurityPage = form.addPageBreakItem().setTitle('資訊安全');
  addScoredChoice(
    form,
    '貼文誘餌宣稱贈送的是哪一款遊戲的高級帳號？',
    ['傳說對決', '三角洲行動', '我的世界', '英雄聯盟'],
    '三角洲行動'
  );
  addScoredChoice(
    form,
    '詐騙集團假冒的客服，聲稱自己是哪家遊戲公司的官方客服？',
    ['Garena', 'Sony', '任天堂', '網易'],
    'Garena'
  );
  addScoredChoice(form, '根據報導，這起事件發生在2026年幾月？', ['3月', '6月', '9月', '12月'], '6月');
  addScoredChoice(
    form,
    '詐騙集團拿到SIM卡之後，報導提到除了打詐騙電話，還可能被拿去做什麼？',
    ['註冊不法LINE帳號、發送詐騙簡訊、當洗錢聯絡工具', '賣到國外', '申請信用卡', '開銀行帳戶'],
    '註冊不法LINE帳號、發送詐騙簡訊、當洗錢聯絡工具'
  );
  addScoredChoice(
    form,
    '如果已經把SIM卡寄出去了，報導建議第一步要做什麼？',
    ['先報警就好，電信公司晚點再說', '立刻向電信公司辦理掛失停機', '換一支新手機', '什麼都不用做，等對方主動聯絡'],
    '立刻向電信公司辦理掛失停機'
  );
  cyberSecurityPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);

  var responsibleUsePage = form.addPageBreakItem().setTitle('資訊科技合理使用原則');
  addScoredChoice(
    form,
    '又水整合、華納兄弟、索尼影業、環球影業，哪一家也在提告谷阿莫的5家片商名單中？',
    ['又水整合', '華納兄弟', '索尼影業', '環球影業'],
    '又水整合'
  );
  addScoredChoice(
    form,
    '報導中提到，谷阿莫曾經剪輯介紹過下列哪一部電影？',
    ['屍速列車', '玩具總動員', '復仇者聯盟', '冰雪奇緣'],
    '屍速列車'
  );
  addScoredChoice(
    form,
    '谷阿莫在臉書發的道歉啟事，是特別針對哪一家片商發的？',
    ['迪士尼', '得利影視', '科科電速', '車庫娛樂'],
    '科科電速'
  );
  addScoredChoice(
    form,
    '根據報導，谷阿莫除了「改作」之外，還被認定侵害了下列哪一種權利？',
    ['公開傳輸權', '姓名表示權', '商標權', '專利權'],
    '公開傳輸權'
  );
  addScoredChoice(
    form,
    '下列哪一部電影「不在」報導列出谷阿莫被控剪輯改作的作品名單中？',
    ['復仇者聯盟', '屍速列車', '動物方程式', '二十行不行TWENTY'],
    '復仇者聯盟'
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
