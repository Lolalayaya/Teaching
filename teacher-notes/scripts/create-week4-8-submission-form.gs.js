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
 */
function createForm() {
  var form = FormApp.create('W4-8-排行榜行動・任務繳交');
  form.setDescription(
    '完成排行榜清單起始專案裡的「替換」「插入」積木之後，先點Scratch右上角的' +
      '「分享」，確認專案狀態是「已分享」，再把分享頁的網址貼到下面。'
  );

  form
    .addTextItem()
    .setTitle('請輸入 班級座號姓名（格式：班級_座號_姓名，例如 801_05_王小明）')
    .setHelpText('格式：班級_座號_姓名，例如 801_05_王小明。')
    .setRequired(true);

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
