/**
 * 第十二週・宣導行動 繳交表單（七年級） —— Google Apps Script，自動建立Google表單並自動批改
 *
 * 學生把第十週的「我們發現」做成個人Canva宣傳單（見 week12-7-intro.md）。
 * 宣傳單本身是段考2的成績，由老師照講義第五節的檢查表看Canva連結評分；
 * 這份表單只收連結和兩個文字欄位，給分如下：
 *   1. 班級座號姓名（60分）
 *   2. Canva檢視連結（15分）：用正規表示法擋格式，填得進去就給分
 *   3. 大數字（10分）：有數字就給分
 *   4. 提醒句（10分）：15個字以內、沒有數字（不是把數字再說一次）給10分；其他給5分，老師點開看
 *   5. AI生成圖片情境題（5分）
 *   6. 自我檢查（複選，不計分）：老師批改宣傳單時對照用
 *   60 + 15 + 10 + 10 + 5 = 100分
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案，把這個檔案的內容整個貼進去
 * 2. 選 createForm 執行（第一次會要求授權，允許即可）
 * 3. 執行紀錄會印出編輯用網址（貼到下面 FORM_EDIT_URL）和填答/嵌入用網址
 *    （貼到 week12-7-intro.md frontmatter 的 embeds.url，已經加好 ?embedded=true）
 *
 * createForm() 已經自動設定：收集電子郵件、限制每人只能回覆1次、測驗模式。
 * 以下幾項要自己到表單右上角⚙️（設定）手動確認一次：
 * 1.「回覆」分頁：「收集電子郵件地址」選「已驗證」；「傳送回覆者回覆副本」選「一律」。
 * 2.「測驗」分頁：「成績發布」選「提交後立即公布」；「回覆者可以看到」三個都勾選。
 *
 * 上課結束後，手動重跑一次 backfillGrades()（可重複執行，不會出錯）。執行紀錄會印出
 * 提醒句只拿5分的人，以及每個人的Canva連結，方便一份一份點開評分。
 */
function createForm() {
  var form = FormApp.create('W12-7-宣導行動・繳交表單');
  form.setIsQuiz(true);
  form.setDescription('貼上你的Canva宣傳單連結，再填宣傳單上的大數字和提醒。');
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);

  addNameIdItem(form, 60);

  form
    .addTextItem()
    .setTitle(LINK_TITLE)
    .setHelpText('Canva右上角「分享」→ 協作連結改成「知道連結的任何人」、「可檢視」→「複製連結」')
    .setPoints(15)
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .setHelpText('請貼上Canva的分享連結，開頭像 https://www.canva.com/design/...')
        .requireTextMatchesPattern(LINK_PATTERN)
        .build()
    );

  form
    .addTextItem()
    .setTitle(NUMBER_TITLE)
    .setHelpText('例如：每3人就有1人；選Q3的寫分數，例如：4.2分')
    .setPoints(10)
    .setRequired(true);

  form
    .addTextItem()
    .setTitle(REMINDER_TITLE)
    .setHelpText('例如：帳號密碼，只給自己。要告訴大家做什麼，不是把數字再說一次')
    .setPoints(10)
    .setRequired(true);

  var item = form.addMultipleChoiceItem();
  item
    .setTitle(AI_SPEC.title)
    .setPoints(5)
    .setRequired(true)
    .setChoices(
      AI_SPEC.choices.map(function (text, i) {
        return item.createChoice(text, i === AI_SPEC.answer);
      })
    );

  form
    .addCheckboxItem()
    .setTitle(SELF_CHECK_TITLE)
    .setHelpText('照你的宣傳單實際情況勾選，沒做到的不要勾。')
    .setChoiceValues(SELF_CHECK_CHOICES);

  installAutoGradeTrigger(form);

  Logger.log('編輯用網址（自己改題目用，也貼到 FORM_EDIT_URL）：' + form.getEditUrl());
  // 一定要加 ?embedded=true，不然嵌入iframe會被Google擋掉（顯示「docs.google.com拒絕連線」）
  Logger.log('填答/嵌入用網址（貼到 week12-7-intro.md 的 embeds.url）：' + form.getPublishedUrl() + '?embedded=true');
}

/** 執行過一次 createForm() 之後，把印出的「編輯用網址」貼在這裡，backfillGrades() 才能重新打開這份表單 */
var FORM_EDIT_URL = 'PLACEHOLDER_W12_FORM_EDIT_URL';

var LINK_TITLE = 'Canva宣傳單的檢視連結';
var NUMBER_TITLE = '宣傳單上的大數字';
var REMINDER_TITLE = '宣傳單上的提醒';
var SELF_CHECK_TITLE = '你的宣傳單做到了哪些？（可複選）';
// canva.com/design/... 或 canva.link/... 短網址
var LINK_PATTERN = '^\\s*https?://(www\\.)?(canva\\.com/design/|canva\\.link/)\\S+\\s*$';

var AI_SPEC = {
  title: '小明用Canva的AI功能生成了一張「駭客偷密碼」的圖，放在自己的宣傳單上。他應該怎麼做？',
  choices: [
    '在圖片旁邊用小字標示「AI生成」，讓看的人知道這不是他畫的',
    '不用標示，因為是他自己輸入文字讓AI生成的，就算他的作品',
    '不能用，宣傳單上只能放自己手畫的圖',
    '把圖片放到最大，讓宣傳單比較好看',
  ],
  answer: 0,
};

var SELF_CHECK_CHOICES = [
  '大數字是全張最大的字，而且跟比較表上的一樣',
  '提醒是告訴大家要做什麼，不是把數字再說一次',
  '有圖表，看得出我們班和比較對象誰比較高',
  '最下面有資料來源',
  '圖片來自Canva素材庫；用AI生成的有標示',
  '字體不超過2種、顏色不超過3種',
  '隔壁同學看3秒，說得出這張在提醒什麼',
];

/** 提醒句：去掉空白和標點後15個字以內、沒有數字給10分，其他給5分 */
function scoreReminder(text) {
  var s = String(text).replace(/[\s，。、！？,.!?：:；;「」『』（）()]/g, '');
  if (s.length === 0) return 0;
  if (s.length <= 15 && !/[0-9０-９%％]/.test(s)) return 10;
  return 5;
}

/** 批改一份回覆，回傳 { graded, result } 給 backfillGrades() 統計用 */
function gradeResponse(form, response) {
  var items = form.getItems();
  function findItem(title) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].getTitle() === title) return items[i];
    }
    throw new Error('找不到題目：' + title + '（題目標題是否被改過？）');
  }
  function answerOf(title) {
    return String(response.getResponseForItem(findItem(title)).getResponse());
  }
  function setScore(item, score) {
    var itemResponse = response.getGradableResponseForItem(item);
    itemResponse.setScore(score);
    response.withItemGrade(itemResponse);
  }

  var idItem = form.getItems(FormApp.ItemType.TEXT)[0];
  var id = String(response.getResponseForItem(idItem).getResponse());
  setScore(idItem, 60);
  setScore(findItem(LINK_TITLE), 15);
  setScore(findItem(NUMBER_TITLE), /[0-9０-９一二三四五六七八九十]/.test(answerOf(NUMBER_TITLE)) ? 10 : 0);
  var reminderScore = scoreReminder(answerOf(REMINDER_TITLE));
  setScore(findItem(REMINDER_TITLE), reminderScore);

  return {
    graded: response,
    result: { id: id, link: answerOf(LINK_TITLE).trim(), reminder: answerOf(REMINDER_TITLE), reminderScore: reminderScore },
  };
}

/** 綁定「表單提交時」觸發條件，讓 autoGrade 在每次送出時批改。
 *  多人同時送出時常常收到 Google 端暫時性的伺服器錯誤而沒批到，
 *  所以每次上完課都要手動重跑一次 backfillGrades()，不要只依賴這個即時觸發。 */
function installAutoGradeTrigger(form) {
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return trigger.getHandlerFunction() === 'autoGrade' && trigger.getTriggerSourceId() === form.getId();
    })
    .forEach(function (trigger) {
      ScriptApp.deleteTrigger(trigger);
    });
  ScriptApp.newTrigger('autoGrade').forForm(form).onFormSubmit().create();
}

/** 表單提交時觸發：批改這一份回覆 */
function autoGrade(e) {
  try {
    var out = gradeResponse(e.source, e.response);
    e.source.submitGrades([out.graded]);
    Logger.log('已批改：' + out.result.id);
  } catch (err) {
    Logger.log('自動評分失敗：' + err.message);
  }
}

/** 重新批改所有回覆：建議每次上完課手動重跑一次（重複執行也不會出錯）。
 *  執行紀錄會依班級座號排序，印出每個人的Canva連結，方便老師一份一份點開評分。 */
function backfillGrades() {
  var form = FormApp.openByUrl(FORM_EDIT_URL);
  var graded = [];
  var results = [];

  form.getResponses().forEach(function (response) {
    var out = gradeResponse(form, response);
    graded.push(out.graded);
    results.push(out.result);
  });

  form.submitGrades(graded);
  Logger.log('共批改 ' + graded.length + ' 份');

  results.sort(function (a, b) {
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  results.forEach(function (r) {
    var note = r.reminderScore < 10 ? '　⚠️提醒句只拿' + r.reminderScore + '分：' + r.reminder : '';
    Logger.log(r.id + '　' + r.link + note);
  });
}

/** 「班級座號姓名」格式：班級(17開頭)+班級編號(01~10)_座號(01~27)_姓名(2~4個中文字)。
 *  這個函式跟其他 create-week*.gs.js 裡的重複——每個 Apps Script 專案是各自獨立
 *  的檔案，沒辦法跨檔案共用函式，所以每份腳本各自複製一份。 */
var NAME_ID_PATTERN = '^[1278](0[1-9]|10)_(0[1-9]|1[0-9]|2[0-7])_[一-龥]{2,4}$';

/** 新增「班級座號姓名」文字題，用正規表示法擋格式，送出後由 autoGrade 打60分 */
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
