/**
 * 第三週・索引行動 索引行動小測驗（八年級） —— Google Apps Script，自動建立Google表單
 * 測試陣列、索引、元素、變數與陣列（清單）差異這幾個概念，全部改用「手遊排行榜」情境出題，
 * 跟 week3-8-intro.md 講義裡的例子一致。
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案
 * 2. 把這個檔案的內容整個貼到編輯器裡（取代預設的 myFunction）
 * 3. 上方選單選 createForm 這個函式，按執行（第一次會要求授權，允許即可）
 * 4. 執行完成後，左下角「執行紀錄」會印出：
 *    - 編輯用網址（自己修改題目用）
 *    - 填答/嵌入用網址（要貼回 week3-8-intro.md frontmatter 的 embeds.url，取代原本的
 *      forms.gle 連結）
 * 5. 建議另外把表單的「回覆」分頁連結到一張Google試算表（表單編輯畫面右上角「回覆」
 *    分頁 → 綠色試算表圖示），方便核對誰還沒填。
 * 6. 舊的手動建立的表單（forms.gle/6ePPoDGcUDkrWM4RA）確認換過來之後可以自己決定要不要刪掉。
 *
 * 表單設成「測驗模式」（有標準答案、自動評分）。第一題是「班級座號姓名」文字題，不計分，
 * 純粹用來對應到姓名；其餘5題各20分，滿分100分。
 */
function createForm() {
  var form = FormApp.create('W3-8-索引行動・索引行動小測驗');
  form.setIsQuiz(true);
  form.setDescription(
    '完成今天的「排行榜真人陣列」活動之後，填這份測驗，測驗會考今天學到的陣列、索引、' +
      '元素、變數與清單的差異。'
  );

  form
    .addTextItem()
    .setTitle('請輸入 班級座號姓名（格式：班級_座號_姓名，例如 801_05_王小明）')
    .setHelpText('格式：班級_座號_姓名，例如 801_05_王小明。')
    .setRequired(true);

  addScoredChoice(
    form,
    '如果想記錄手遊排行榜前50名玩家的分數，比較好的做法是？',
    ['宣告50個不同名字的變數', '用一個陣列（清單）集中管理', '只記錄第1名就好', '用50台電腦分別存'],
    '用一個陣列（清單）集中管理'
  );

  addScoredChoice(
    form,
    '在陣列（清單）裡，用來表示某筆資料「排在第幾個位置」的數字，叫做？',
    ['元素', '索引', '變數', '迴圈'],
    '索引'
  );

  addScoredChoice(
    form,
    'Scratch的清單，「第一個」位置的索引是從幾開始算？',
    ['0', '1', '-1', '沒有規定，隨便都可以'],
    '1'
  );

  addScoredChoice(
    form,
    '排行榜上「第3名的分數被打破了，換成新分數」，這是哪一種操作？',
    ['存取', '替換', '插入', '刪除'],
    '替換'
  );

  addScoredChoice(
    form,
    '一位新玩家打進榜單，擠進第2名，原本第2名以後的人全部往後移一位，這是哪一種操作？',
    ['存取', '替換', '插入', '刪除'],
    '插入'
  );

  addScoredChoice(
    form,
    '如果只想記錄「你自己」一個人的最高分，比較適合用？',
    ['變數', '陣列（清單）', '兩個都可以，沒差', '兩個都不適合'],
    '變數'
  );

  Logger.log('編輯用網址（自己改題目用）：' + form.getEditUrl());
  Logger.log('填答/嵌入用網址（貼回 week3-8-intro.md）：' + form.getPublishedUrl());
}

/** 新增一題單選題，設成20分、有標準答案（測驗模式下才會自動評分）。 */
function addScoredChoice(form, title, options, correctOption) {
  var item = form.addMultipleChoiceItem();
  item.setTitle(title).setPoints(20).setRequired(true);
  item.setChoices(
    options.map(function (opt) {
      return item.createChoice(opt, opt === correctOption);
    })
  );
}
