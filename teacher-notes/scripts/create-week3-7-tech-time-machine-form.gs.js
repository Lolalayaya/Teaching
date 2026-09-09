/**
 * 科技生活時光機・驗收小測驗 —— Google Apps Script，自動建立Google表單
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案
 * 2. 把這個檔案的內容整個貼到編輯器裡（取代預設的 myFunction）
 * 3. 上方選單選 createForm 這個函式，按執行（第一次會要求授權，允許即可）
 * 4. 執行完成後，左下角「執行紀錄」會印出兩個網址：
 *    - 編輯用網址（自己修改題目用）
 *    - 填答/嵌入用網址（要貼回 tech-time-machine.config.json 的 formUrl）
 * 5. 把印出來的「嵌入用網址」貼給 Claude，或直接改 config：
 *    "formUrl": "<貼上的網址>&embedded=true"
 *
 * 這份表單會自動設定成「測驗模式」（有標準答案、自動評分），並且在填完送出後
 * 的確認畫面裡放一個連結，讓學生點回去 tech-time-machine 頁面時網址帶著
 * ?done=1，網頁會自動偵測到這個參數、跳過「填表單」畫面直接顯示「任務完成」。
 *
 * 「班級座號姓名」這題用正規表示法擋格式（例如 701_05_王小明），格式不對無法送出；
 * 執行 createForm() 時會順便建立一個「表單提交時」的觸發條件，只要格式一通過驗證，
 * 送出後就自動把這題打滿分，不用手動批改（第一次執行會多跳出一次授權要求，允許即可）。
 *
 * 配分：第一題「班級座號姓名」85分（只要格式正確就自動給分，不是真的評分內容）；
 * 後面5題單選題各3分，85 + 3×5 = 100分。
 */
function createForm() {
  var RETURN_URL = 'https://Lolalayaya.github.io/Teaching/tech-time-machine/?done=1';

  var form = FormApp.create('W3-7-科技生活時光機・驗收小測驗');
  form.setIsQuiz(true);
  form.setDescription('闖完科技生活時光機之後，填這份小測驗結案。');
  form.setConfirmationMessage(
    '感謝完成小測驗！請點下面這個連結，回到時光機頁面完成結案：\n' + RETURN_URL
  );
  form.setShowLinkToRespondAgain(false);

  addNameIdItem(form, 85);

  addScoredChoice(
    form,
    '「擴增實境（AR）」最常被用來做什麼？',
    ['試穿衣服、模擬穿搭', '自動炒菜', '修理汽車引擎', '掃描課本內容'],
    '試穿衣服、模擬穿搭'
  );

  addScoredChoice(
    form,
    '奈莉把同學明楓打瞌睡流口水的糗事告訴別人，讓明楓很生氣。奈莉的行為主要違反了什麼？',
    ['尊重隱私的網路禮儀', '著作權法', '資訊安全', '資訊產業規範'],
    '尊重隱私的網路禮儀'
  );

  addScoredChoice(
    form,
    '晴茹把喜歡的動漫畫面做成鑰匙圈，還拿去賣給同學賺零用錢，這樣做最可能觸犯了什麼？',
    ['著作權法', '資訊安全法', '個人資料保護法', '沒有問題，可以直接賣'],
    '著作權法'
  );

  addScoredChoice(
    form,
    '下面哪一組，全部都是「串流媒體」的例子？',
    ['YouTube、Netflix', '報紙、雜誌', '廣播、電視', 'FB、IG'],
    'YouTube、Netflix'
  );

  addScoredChoice(
    form,
    '寫程式、開發App，主要屬於資訊產業裡的哪一種類別？',
    ['軟體設計', '硬體製造', '網路通訊', '電子商務'],
    '軟體設計'
  );

  installAutoGradeTrigger(form);

  Logger.log('編輯用網址（自己改題目用）：' + form.getEditUrl());
  Logger.log('填答/嵌入用網址（貼回網站 formUrl）：' + form.getPublishedUrl());
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

/** 「班級座號姓名」格式：班級(17開頭)+座號(01~10)_月或日(01~26)_姓名(2~4個中文字)。 */
var NAME_ID_PATTERN = '^[1278](0[1-9]|10)_(0[1-9]|1[0-9]|2[0-6])_[一-龥]{2,4}$';

/**
 * 新增「班級座號姓名」文字題，用正規表示法擋格式；格式一通過驗證，
 * onFormSubmit 觸發條件送出時就會自動打滿分（見下方 installAutoGradeTrigger）。
 */
function addNameIdItem(form, points) {
  var item = form.addTextItem();
  item
    .setTitle('請輸入 班級座號姓名（格式：班級_座號_姓名，例如 701_05_王小明）')
    .setHelpText('格式：班級_座號_姓名，例如 701_05_王小明。')
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .setHelpText('格式錯誤，請依照 班級_座號_姓名 輸入，例如 701_05_王小明。')
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
