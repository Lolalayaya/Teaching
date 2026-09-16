/**
 * 第四週・排行榜行動 排行榜行動任務繳交（八年級） —— Google Apps Script，自動建立Google表單
 * 單純收「姓名＋Scratch分享連結」，不是選擇題測驗——積木邏輯對不對由老師打開學生的專案
 * 連結自己看，不是表單自動評分，所以不用設測驗模式。
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案
 * 2. 把這個檔案的內容整個貼到編輯器裡（取代預設的 myFunction）
 * 3. 上方選單選 createForm 這個函式，按執行（第一次會要求授權，允許即可）
 * 4. 執行完成後，左下角「執行紀錄」會印出：
 *    - 編輯用網址（自己修改題目用）
 *    - 填答/嵌入用網址（要貼回 week4-8-intro.md frontmatter 的 embeds.url，取代
 *      PLACEHOLDER_FORM_ID）
 * 5. 建議把表單的「回覆」分頁連結到一張Google試算表（表單編輯畫面右上角「回覆」分頁
 *    → 綠色試算表圖示），方便照著名單一個一個點連結打開來看、手動評分。
 * 6. Scratch連結欄位有設基本格式驗證（網址裡要包含 scratch.mit.edu），避免學生
 *    貼錯網址或忘記貼；但沒辦法驗證專案是不是真的「已分享」，這件事表單做不到，
 *    要靠說明文字提醒學生自己檢查。
 * 7. 「班級座號姓名」也用正規表示法擋格式（例如 801_05_王小明），格式不對無法送出。
 *    這份表單不是測驗模式，這格不計分、也不會自動評分，Scratch積木邏輯還是要
 *    老師自己點連結手動看。
 *
 * 表單分成兩個區段：區段一只有「班級座號姓名」，區段二是「Scratch專案分享連結」。
 * 這份表單維持非測驗模式（不套用「提交後立即公布成績、可看到答錯題目」這類測驗
 * 專屬設定），但下面這幾項一般表單設定 createForm() 已經自動設定：收集電子郵件、
 * 限制每人只能回覆1次、問題順序隨機。
 * 以下2項 Google Forms 目前沒有開放 Apps Script 用程式設定，執行完 createForm()
 * 之後，麻煩自己到表單右上角⚙️（設定）→「回覆」分頁手動確認/勾選一次：
 * 1.「收集電子郵件地址」確認是選「已驗證」，不是「回覆者輸入」。
 * 2.「傳送回覆者回覆副本」選「一律」。
 * （這份表單沒有單選題，不需要處理選項洗牌。）
 */
function createForm() {
  var form = FormApp.create('W4-8-排行榜行動・任務繳交');
  form.setDescription(
    '完成排行榜清單起始專案裡的「替換」「插入」積木之後，先點Scratch右上角的' +
      '「分享」，確認專案狀態是「已分享」，再把分享頁的網址貼到下面。'
  );
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);
  form.setShuffleQuestions(true);

  addNameIdItem(form);

  form.addPageBreakItem().setTitle('Scratch專案繳交');

  var linkItem = form.addTextItem();
  linkItem
    .setTitle('請貼上你的Scratch專案分享連結')
    .setHelpText('點Scratch右上角「分享」之後，複製網址列的完整網址貼上來，例如 https://scratch.mit.edu/projects/123456789/')
    .setRequired(true);
  linkItem.setValidation(
    FormApp.createTextValidation()
      .setHelpText('網址裡要包含 scratch.mit.edu，請確認貼的是分享頁網址。')
      .requireTextContainsPattern('scratch\\.mit\\.edu')
      .build()
  );

  Logger.log('編輯用網址（自己改題目用）：' + form.getEditUrl());
  Logger.log('填答/嵌入用網址（貼回 week4-8-intro.md）：' + form.getPublishedUrl());
}

/** 「班級座號姓名」格式：班級(17開頭)+班級編號(01~10)_座號(01~27)_姓名(2~4個中文字)。 */
var NAME_ID_PATTERN = '^[1278](0[1-9]|10)_(0[1-9]|1[0-9]|2[0-7])_[一-龥]{2,4}$';

/** 新增「班級座號姓名」文字題，用正規表示法擋格式（這份表單非測驗模式，不計分）。 */
function addNameIdItem(form) {
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
  return item;
}
