/**
 * 第四週・抉擇任務 個人複習測驗 —— Google Apps Script，自動建立「一份」共用Google表單
 * 學生先選自己這組的主題，表單會依照選擇自動跳到對應的5題（個資保護／資訊安全／
 * 資訊科技合理使用原則），全班共用同一份表單、同一張回覆試算表，方便老師核對誰還沒填。
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案
 * 2. 把這個檔案的內容整個貼到編輯器裡（取代預設的 myFunction）
 * 3. 上方選單選 createForm 這個函式，按執行（第一次會要求授權，允許即可）
 * 4. 執行完成後，左下角「執行紀錄」會印出：
 *    - 編輯用網址（自己修改題目用）
 *    - 填答/嵌入用網址（要貼回 week4-7-intro.md frontmatter 的 embeds.url）
 * 5. 把印出來的「填答/嵌入用網址」貼回 week4-7-intro.md，
 *    對應 title「個人複習測驗」的 embeds.url（後面接上 &embedded=true）
 * 6. 建議另外把表單的「回覆」分頁連結到一張Google試算表（表單編輯畫面右上角「回覆」
 *    分頁 → 綠色試算表圖示），這樣就能直接對照班級座號姓名，核對誰還沒填。
 *
 * 配分：第一題「班級座號姓名」文字題85分（用來對應到姓名，不是真的評分內容）；
 * 第二題主題選擇題不計分，純粹用來跳頁；跳過去之後對應主題的5題單選各3分。
 * 85 + 3×5 = 100分，答完自動送出，不會看到其他主題的題目。
 */
function createForm() {
  var form = FormApp.create('W4-7-抉擇任務・個人複習測驗');
  form.setIsQuiz(true);
  form.setDescription(
    '讀完講義裡你們這組對應主題的案例之後，填這份測驗。第一步請先選你們這組的主題，' +
      '表單會自動跳到對應的5題。'
  );

  form
    .addTextItem()
    .setTitle('請輸入 班級座號姓名（格式：班級_座號_姓名，例如 701_05_王小明）')
    .setHelpText('格式：班級_座號_姓名，例如 701_05_王小明。')
    .setRequired(true)
    .setPoints(85);

  var topicItem = form.addMultipleChoiceItem();
  topicItem.setTitle('你們這組選的主題是？').setRequired(true);

  // 先建立三個分頁（依序對應三個主題），每個分頁裡放該主題的5題，
  // 最後把每個分頁設成「答完就送出」，不會接著跑到下一個主題的題目。
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
    '這兩位學生是在哪些地方發表不當言論？',
    ['只有LINE群組', 'LINE群組和IG限時動態', '只有IG限時動態', '學校公佈欄'],
    'LINE群組和IG限時動態'
  );
  addScoredChoice(
    form,
    '法院認定這些言論構成什麼？',
    ['不構成任何法律責任', '公然侮辱、侵害名譽權', '只是言論自由，沒有問題', '僅違反校規，與法律無關'],
    '公然侮辱、侵害名譽權'
  );
  addScoredChoice(
    form,
    '最後判決誰要負賠償責任？',
    ['只有兩位學生', '只有家長', '兩位學生和家長都要', '沒有人需要賠償'],
    '兩位學生和家長都要'
  );
  addScoredChoice(form, '賠償金額大約是多少？', ['1千5百元', '1萬5千元', '15萬元', '150萬元'], '1萬5千元');
  addScoredChoice(
    form,
    '這個案例主要提醒我們什麼？',
    ['在群組裡說的話不會有人知道', '網路發言即使覺得只是抱怨，也可能要負法律責任', '只有公開貼文才算數，群組內不算', '未成年人不需要負任何法律責任'],
    '網路發言即使覺得只是抱怨，也可能要負法律責任'
  );
  responsibleUsePage.setGoToPage(FormApp.PageNavigationType.SUBMIT);

  // 回到第一題「主題選擇」，設定依照選擇跳到對應分頁（要等三個分頁都建立好，
  // 才能拿到它們的參照）。
  topicItem.setChoices([
    topicItem.createChoice('個資保護', personalDataPage),
    topicItem.createChoice('資訊安全', cyberSecurityPage),
    topicItem.createChoice('資訊科技合理使用原則', responsibleUsePage),
  ]);

  Logger.log('編輯用網址（自己改題目用）：' + form.getEditUrl());
  Logger.log('填答/嵌入用網址（貼回 week4-7-intro.md）：' + form.getPublishedUrl());
}

/** 新增一題單選題，設成3分、有標準答案（測驗模式下才會自動評分）。 */
function addScoredChoice(form, title, options, correctOption) {
  var item = form.addMultipleChoiceItem();
  item.setTitle(title).setPoints(3).setRequired(true);
  item.setChoices(
    options.map(function (opt) {
      return item.createChoice(opt, opt === correctOption);
    })
  );
}
