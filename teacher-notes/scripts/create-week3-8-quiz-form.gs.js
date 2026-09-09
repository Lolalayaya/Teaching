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
 * 表單設成「測驗模式」（有標準答案、自動評分）。第一題「班級座號姓名」文字題用正規表示法
 * 擋格式（例如 801_05_王小明），格式不對無法送出；執行 createForm() 時會順便建立一個
 * 「表單提交時」的觸發條件，格式一通過驗證，送出後就自動打85分，不用手動批改
 * （第一次執行會多跳出一次授權要求，允許即可）。其餘6題各2.5分，85 + 6×2.5 = 100分。
 */
function createForm() {
  var form = FormApp.create('W3-8-索引行動・索引行動小測驗');
  form.setIsQuiz(true);
  form.setDescription(
    '完成今天的「排行榜真人陣列」活動之後，填這份測驗，測驗會考今天學到的陣列、索引、' +
      '元素、變數與清單的差異。'
  );

  addNameIdItem(form, 85);

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

  installAutoGradeTrigger(form);

  Logger.log('編輯用網址（自己改題目用）：' + form.getEditUrl());
  Logger.log('填答/嵌入用網址（貼回 week3-8-intro.md）：' + form.getPublishedUrl());
}

/** 新增一題單選題，設成2.5分、有標準答案（測驗模式下才會自動評分）。 */
function addScoredChoice(form, title, options, correctOption) {
  var item = form.addMultipleChoiceItem();
  item.setTitle(title).setPoints(2.5).setRequired(true);
  item.setChoices(
    options.map(function (opt) {
      return item.createChoice(opt, opt === correctOption);
    })
  );
}

/** 「班級座號姓名」格式：班級(17開頭)+座號(01~10)_月或日(01~26)_姓名(2~4個中文字)。 */
var NAME_ID_PATTERN = '^[1278](0[1-9]|10)_(0[1-9]|1[0-9]|2[0-6])_[一-龥]{2,4}$';

/**
 * 新增「班級座號姓名」文字題，用正規表示法擋格式；格式一通過驗證，
 * onFormSubmit 觸發條件送出時就會自動打滿分（見下方 installAutoGradeTrigger）。
 */
function addNameIdItem(form, points) {
  var item = form.addTextItem();
  item
    .setTitle('請輸入 班級座號姓名（格式：班級_座號_姓名，例如 801_05_王小明）')
    .setHelpText('格式：班級_座號_姓名，例如 801_05_王小明。')
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .setHelpText('格式錯誤，請依照 班級_座號_姓名 輸入，例如 801_05_王小明。')
        .requireTextMatchesPattern(NAME_ID_PATTERN)
        .build()
    );
  if (points) {
    item.setPoints(points);
  }
  return item;
}

/** 綁定「表單提交時」觸發條件：讓「班級座號姓名」只要格式驗證通過就自動給滿分。 */
function installAutoGradeTrigger(form) {
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return trigger.getHandlerFunction() === 'onFormSubmit' && trigger.getTriggerSourceId() === form.getId();
    })
    .forEach(function (trigger) {
      ScriptApp.deleteTrigger(trigger);
    });
  ScriptApp.newTrigger('onFormSubmit').forForm(form).onFormSubmit().create();
}

/** 表單提交時觸發：「班級座號姓名」通過格式驗證才送得出去，這裡直接給滿分即可。 */
function onFormSubmit(e) {
  var formResponse = e.response;
  var itemResponses = formResponse.getItemResponses();

  itemResponses.forEach(function (itemResponse) {
    var item = itemResponse.getItem();
    if (item.getType() === FormApp.ItemType.TEXT && item.getTitle().indexOf('班級座號姓名') !== -1) {
      itemResponse.setScore(item.asTextItem().getPoints());
    }
  });

  formResponse.withItemGrades(itemResponses).submit();
}
