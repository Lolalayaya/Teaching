/**
 * 第六週・蒐證任務 班級問卷調查 —— Google Apps Script，自動建立Google表單
 *
 * 這是全班正式填答、用來蒐集資料的「總表」，把三個主題（個資保護／資訊安全／
 * 資訊科技合理使用原則）各自第一組、第二組負責的3題（2是非+1量表）合併成一份，
 * 依主題分三頁，共18題。之所以合併成一份而不是6份分開的表單，是因為週8~10教
 * Google試算表時，6份表單會變成6張分散的回應試算表，光是合併資料就要先做一次
 * 苦工，反而模糊了COUNTIF/AVERAGE這個教學重點；合併成一份，全班只填一次，
 * 週8~10直接開一張18欄的試算表，各組挑自己負責的3欄分析即可。
 *
 * 這份表單會收集Email和「班級座號姓名」——這不是為了公開誰答了什麼，純粹是
 * 為了讓老師核對「全班是不是都填了」，確保正式蒐集到的資料是完整的。週8~10
 * 真正拿來做Google試算表分析、交給學生看的資料，只會有18題的答案欄位，
 * 不會包含姓名/座號/Email這幾欄——老師會先把這幾欄拿掉或遮住，確保資料到
 * 學生手上時是去識別化的。（week6-7-intro.md第三節教的「不問任何可以指認身分
 * 的問題」，講的是學生自己設計練習問卷時的原則，不是這份老師控管、僅供後台
 * 核對用的正式問卷。）
 *
 * 這也不是測驗，沒有標準答案，不開測驗模式、不用自動評分——跟
 * create-week4-7-quiz-form.gs.js／create-week5-7-quiz-form.gs.js那種有標準
 * 答案的個人複習測驗是不同性質的表單。
 *
 * 各組實際動手操作的部分是前半堂的「練習建表單」（建自己負責的3題，不用正式
 * 傳送蒐集，純練習），評分依據是「有建出來」；後半堂全班實際填答、拿到真正
 * 班級數據用的，就是這份腳本建出來的總表。
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案
 * 2. 把這個檔案的內容整個貼到編輯器裡（取代預設的 myFunction）
 * 3. 上方選單選 createForm 這個函式，按執行（第一次會要求授權，允許即可）
 * 4. 執行完成後，左下角「執行紀錄」會印出：
 *    - 編輯用網址（自己修改題目用）
 *    - 填答/嵌入用網址（要貼回 week6-7-intro.md frontmatter 的 embeds.url，
 *      後面接上 &embedded=true，不然嵌入iframe會被Google擋掉顯示
 *      「docs.google.com拒絕連線」）
 * 5. 建議把表單的「回覆」分頁連結到一張Google試算表（表單編輯畫面右上角「回覆」
 *    分頁 → 綠色試算表圖示）。這張試算表會同時有姓名/座號/Email欄位和18題答案，
 *    核對完「誰還沒填」之後，交給學生做週8~10 Google試算表分析之前，記得先複製
 *    一份、把姓名/座號/Email那幾欄刪掉或遮住，只留18題答案欄位再給學生用。
 * 6. setCollectEmail(true)之後，建議到表單右上角⚙️（設定）→「回覆」分頁，確認
 *    「收集電子郵件地址」是選「已驗證」（不是「回覆者輸入」），比較不會有人亂填
 *    Email。
 */
function createForm() {
  var form = FormApp.create('W6-7-蒐證任務・班級問卷調查');
  form.setDescription(
    '這是一份班級調查，請依照自己的真實狀況作答就好。班級座號姓名只是用來讓老師核對' +
      '全班是不是都填了，之後真正拿來分析的資料不會包含姓名/座號這幾欄，你的答案不會被' +
      '公開連回你是誰。填完的資料會留到之後做Google試算表分析時使用。'
  );
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);

  addNameIdItem(form);

  // ---- 個資保護 ----
  form.addPageBreakItem().setTitle('個資保護');

  form.addSectionHeaderItem().setTitle('第一組');
  addBinary(form, '你有沒有把電話、地址、學校，告訴一個只在網路上認識、沒見過面的人？', '有', '沒有');
  addBinary(form, '使用手機App或社群平台時，你會不會開啟定位功能，讓對方知道你目前在哪裡？', '會', '不會');
  addScale(
    form,
    '如果一個網路上認識、沒見過面的人跟你要電話或地址，你會有多猶豫？',
    '完全不猶豫，直接給',
    '絕對不會給'
  );

  form.addSectionHeaderItem().setTitle('第二組');
  addBinary(form, '你會不會覺得「姓名」和「手機號碼」其實不算什麼需要保密的重要資料？', '會', '不會');
  addBinary(form, '註冊App或社群帳號時，你有沒有勾選過「我已經符合這個軟體規定的使用年齡」，但其實沒有？', '有', '沒有');
  addScale(form, '你覺得在網路上公開自己的姓名或手機號碼，風險有多高？', '完全沒風險', '非常危險');

  // ---- 資訊安全 ----
  form.addPageBreakItem().setTitle('資訊安全');

  form.addSectionHeaderItem().setTitle('第一組');
  addBinary(form, '你有沒有收過像投票、中獎、包裹通知這類可疑連結，要你點進去、輸入資料？', '有', '沒有');
  addBinary(form, '收到這種可疑連結，你會不會先查證（問家人、上網搜尋、打165）再決定要不要點？', '會', '不會');
  addScale(form, '如果收到「幫我投票」這種連結，你會有多想點進去看？', '完全不會', '一定會點');

  form.addSectionHeaderItem().setTitle('第二組');
  addBinary(form, '如果真的不小心被詐騙，你會不會因為「怕被罵」而不敢跟家人說？', '會', '不會');
  addBinary(form, '有沒有因為一時好奇或緊張，跟陌生訊息互動過（回覆、點擊、甚至留言）？', '有', '沒有');
  addScale(form, '如果朋友傳訊息說自己帳號被盜、要借錢，你會有多懷疑這則訊息是假的？', '完全不會懷疑', '一定會先查證再說');

  // ---- 資訊科技合理使用原則 ----
  form.addPageBreakItem().setTitle('資訊科技合理使用原則');

  form.addSectionHeaderItem().setTitle('第一組');
  addBinary(form, '你有沒有在自己的作業、簡報或社群貼文裡，直接用網路上找到的圖片或影片，卻沒有標明出處？', '有', '沒有');
  addBinary(form, '聽過「創用CC」這個授權標示嗎？', '聽過', '沒聽過');
  addScale(form, '你覺得「使用別人的圖片／影片卻沒有標明出處」這件事，嚴重程度有多高？', '完全不嚴重', '非常嚴重');

  form.addSectionHeaderItem().setTitle('第二組');
  addBinary(form, '你有沒有用AI工具（如ChatGPT、Midjourney等）生成過圖片或文字，直接當作自己的作業交出去？', '有', '沒有');
  addBinary(form, '如果作業裡用了AI生成的內容，你會不會主動跟老師或同學說明「這部分是AI做的」？', '會', '不會');
  addScale(form, '你覺得「直接把AI生成的作品當作自己的創作」，這件事有多不OK？', '完全OK', '非常不OK');

  Logger.log('編輯用網址（自己改題目用）：' + form.getEditUrl());
  // 一定要加 ?embedded=true，不然嵌入iframe會被Google擋掉（顯示「docs.google.com拒絕連線」）
  Logger.log('填答/嵌入用網址（可直接貼到 week6-7-intro.md 的 embeds.url）：' + form.getPublishedUrl() + '?embedded=true');
}

/** 「班級座號姓名」格式：班級(17開頭)+班級編號(01~10)_座號(01~27)_姓名(2~4個中文字)。 */
var NAME_ID_PATTERN = '^[1278](0[1-9]|10)_(0[1-9]|1[0-9]|2[0-7])_[一-龥]{2,4}$';

/**
 * 新增「班級座號姓名」文字題，用正規表示法擋格式。這題純粹是為了核對誰填了，
 * 不是測驗題，不設分數——跟create-week4-7-quiz-form.gs.js／
 * create-week5-7-quiz-form.gs.js裡同名的addNameIdItem不同，那兩份有points
 * 參數（配合自動評分），這份沒有。
 */
function addNameIdItem(form) {
  var item = form.addTextItem();
  item
    .setTitle('請輸入 班級座號姓名（格式：班級_座號_姓名，例如 710_16_王小明）')
    .setHelpText('格式：班級_座號_姓名，例如 710_16_王小明。這題只是用來核對誰填了，之後分析用的資料不會有這一欄。')
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .setHelpText('格式錯誤，請依照 班級_座號_姓名 輸入，例如 710_16_王小明。')
        .requireTextMatchesPattern(NAME_ID_PATTERN)
        .build()
    );
  return item;
}

/** 新增一題二選一的是非題，必填。positiveLabel/negativeLabel決定選項文字（例如「有／沒有」「會／不會」）。 */
function addBinary(form, title, positiveLabel, negativeLabel) {
  var item = form.addMultipleChoiceItem();
  item.setTitle(title).setRequired(true);
  item.setChoices([item.createChoice(positiveLabel), item.createChoice(negativeLabel)]);
}

/** 新增一題1~5分量表題，必填。 */
function addScale(form, title, lowLabel, highLabel) {
  var item = form.addScaleItem();
  item.setTitle(title).setBounds(1, 5).setLabels(lowLabel, highLabel).setRequired(true);
}
