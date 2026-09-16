/**
 * 第五週・擂台行動 小測驗（八年級） —— Google Apps Script，自動建立Google表單
 * 這份是測驗模式(quiz mode)，5題單選題都已經標好正解，送出後會立刻顯示分數。
 * 考的是打擂台法的步驟、比較次數(n-1)，以及跟之後排序的關係。
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案
 * 2. 把這個檔案的內容整個貼到編輯器裡（取代預設的 myFunction）
 * 3. 上方選單選 createForm 這個函式，按執行（第一次會要求授權，允許即可）
 * 4. 執行完成後，左下角「執行紀錄」會印出：
 *    - 編輯用網址（自己修改題目用）
 *    - 填答/嵌入用網址（要貼回 week5-8-intro.md frontmatter 的 embeds.url，取代
 *      PLACEHOLDER_FORM_ID）
 * 5. 建議把表單的「回覆」分頁連結到一張Google試算表，方便看整班作答狀況。
 * 6. 這份表單已經用 setIsQuiz(true) 設成測驗模式，並且用 setPoints/createChoice
 *    標好每題的正解，學生送出後會立刻看到自己的分數與答錯的題目。
 * 7. 「班級座號姓名」用正規表示法擋格式（例如 801_05_王小明），格式不對無法送出；
 *    這一題本身不計分，純粹是身分確認用。
 * 8. 下面2項 Google Forms 目前沒有開放 Apps Script 用程式設定，執行完 createForm()
 *    之後，麻煩自己到表單右上角⚙️（設定）→「回覆」分頁手動確認/勾選一次：
 *    - 「收集電子郵件地址」確認是選「已驗證」，不是「回覆者輸入」。
 *    - 「傳送回覆者回覆副本」選「一律」。
 */
function createForm() {
  var form = FormApp.create('W5-8-擂台行動・小測驗');
  form.setDescription(
    '完成小組打擂台活動之後，做這份測驗，考的是今天學到的打擂台法步驟與比較次數。'
  );
  form.setIsQuiz(true);
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);
  form.setShuffleQuestions(true);

  addNameIdItem(form);

  form.addPageBreakItem().setTitle('擂台行動小測驗');

  addMultipleChoiceQuestion(
    form,
    '打擂台法時，兩張卡比較後，分數比較高的那張卡接下來會怎麼樣？',
    [
      ['留在擂台上，繼續跟下一張卡比', true],
      ['被淘汰放到一旁', false],
      ['直接排到最後一名', false],
      ['兩張卡都保留，並列第一', false],
    ]
  );

  addMultipleChoiceQuestion(
    form,
    '如果有6張分數卡，用打擂台法找出最大值，總共需要比較幾次？',
    [
      ['4次', false],
      ['5次', true],
      ['6次', false],
      ['7次', false],
    ]
  );

  addMultipleChoiceQuestion(
    form,
    '打擂台法最後留在擂台上的那張卡，代表什麼？',
    [
      ['這批資料裡的最大值', true],
      ['這批資料裡的最小值', false],
      ['隨機一張卡', false],
      ['所有資料的平均值', false],
    ]
  );

  addMultipleChoiceQuestion(
    form,
    '如果排行榜有100位玩家，用打擂台法從頭比到尾，需要比較幾次？',
    [
      ['99次', true],
      ['100次', false],
      ['50次', false],
      ['10000次', false],
    ]
  );

  addMultipleChoiceQuestion(
    form,
    '這學期後面會學到的「排序」，跟今天的打擂台法有什麼關係？',
    [
      ['排序時每一輪都要用打擂台法，從剩下的資料裡找出最大值', true],
      ['完全沒關係，是兩件不同的事', false],
      ['排序不需要比較大小', false],
      ['打擂台法只能用來找最大值，不能用在排序上', false],
    ]
  );

  Logger.log('編輯用網址（自己改題目用）：' + form.getEditUrl());
  Logger.log('填答/嵌入用網址（貼回 week5-8-intro.md）：' + form.getPublishedUrl());
}

/** 新增一題單選題，points固定1分，options是[[選項文字, 是否為正解], ...]的陣列。 */
function addMultipleChoiceQuestion(form, title, options) {
  var item = form.addMultipleChoiceItem();
  item.setTitle(title).setRequired(true).setPoints(1);
  var choices = options.map(function (option) {
    return item.createChoice(option[0], option[1]);
  });
  item.setChoices(choices);
  return item;
}

/** 「班級座號姓名」格式：班級(17開頭)+班級編號(01~10)_座號(01~27)_姓名(2~4個中文字)。
 *  這個函式跟 create-week4-8-submission-form.gs.js 裡的重複——每個 Apps Script
 *  專案是各自獨立的檔案，沒辦法跨檔案共用函式，所以兩份腳本各自複製一份。 */
var NAME_ID_PATTERN = '^[1278](0[1-9]|10)_(0[1-9]|1[0-9]|2[0-7])_[一-龥]{2,4}$';

/** 新增「班級座號姓名」文字題，用正規表示法擋格式（這一題不計分，純粹身分確認）。 */
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
