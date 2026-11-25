/**
 * 第十三週・校閱行動 互評與修改表單（七年級） —— Google Apps Script，自動建立Google表單並自動批改
 *
 * 學生兩人一組交換看第十二週的Canva宣傳單，互相給建議，再修改自己的（見 week13-7-intro.md）。
 * 宣傳單本身照第十二週講義第六節的檢查表評分（看修改後的版本），算段考3；
 * 這份表單另外算一次成績，也算進段考3。給分如下：
 *   1. 班級座號姓名（60分）
 *   第一部分：我幫同學看
 *   2. 被評者座號（不計分，backfillGrades() 用來把建議對到被評的人）
 *   3. 3秒測試：看3秒後覺得它在提醒什麼（5分）：有寫就給分
 *   4. 一個優點（不計分，必填）
 *   5. 一個建議（10分）：去掉標點後6個字以上、不是「很好／沒有」之類的給10分；其他給5分，老師點開看
 *   第二部分：我的宣傳單
 *   6. 修改紀錄（10分）：去掉標點後6個字以上給10分；其他給5分
 *   第三部分：情境題
 *   7~9. 三題選擇題，各5分（測驗模式自動批改）
 *   60 + 5 + 10 + 10 + 15 = 100分
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案，把這個檔案的內容整個貼進去
 * 2. 選 createForm 執行（第一次會要求授權，允許即可）
 * 3. 執行紀錄會印出編輯用網址（貼到下面 FORM_EDIT_URL）和填答/嵌入用網址
 *    （貼到 week13-7-intro.md frontmatter 的 embeds.url，已經加好 ?embedded=true）
 *
 * createForm() 已經自動設定：收集電子郵件、限制每人只能回覆1次、測驗模式。
 * 以下幾項要自己到表單右上角⚙️（設定）手動確認一次：
 * 1.「回覆」分頁：「收集電子郵件地址」選「已驗證」；「傳送回覆者回覆副本」選「一律」。
 * 2.「測驗」分頁：「成績發布」選「提交後立即公布」；「回覆者可以看到」三個都勾選。
 *
 * 上課結束後，手動重跑一次 backfillGrades()（可重複執行，不會出錯）。它只批改上次執行之後
 * 才送出的回覆（要全部重新批改時執行 regradeAll()）。執行紀錄會印出：
 *   - 這批新回覆裡，建議或修改紀錄只拿5分的人（老師點開看）
 *   - 每個人收到的建議（依被評者排序），批改宣傳單時可以對照有沒有照建議改
 *   - 沒有被任何人評到的人（表單只記得到有交表單的評分者，請假或沒交的不會出現）
 */
function createForm() {
  var form = FormApp.create('W13-7-校閱行動・互評與修改表單');
  form.setIsQuiz(true);
  form.setDescription('先幫同學看宣傳單、給建議（第一部分），修改完自己的宣傳單再填第二、三部分。');
  form.setCollectEmail(true);
  form.setLimitOneResponsePerUser(true);

  addNameIdItem(form, 60);

  form.addPageBreakItem().setTitle('第一部分：我幫同學看');

  form
    .addTextItem()
    .setTitle(TARGET_SEAT_TITLE)
    .setHelpText('只填座號兩位數，例如 05。三人一組的，填你坐在右邊那位同學。')
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .setHelpText('請填兩位數的座號，01～27，例如 05。')
        .requireTextMatchesPattern(SEAT_PATTERN)
        .build()
    );

  form
    .addTextItem()
    .setTitle(THREE_SEC_TITLE)
    .setHelpText('看3秒就轉開，寫下你的第一印象，不用寫得很完整。')
    .setPoints(5)
    .setRequired(true);

  form
    .addTextItem()
    .setTitle(GOOD_TITLE)
    .setHelpText('例如：大數字很大，一眼就看到')
    .setRequired(true);

  form
    .addParagraphTextItem()
    .setTitle(SUGGEST_TITLE)
    .setHelpText('要說清楚改哪裡、怎麼改。例如：提醒放大，加一個色塊，移到最下面')
    .setPoints(10)
    .setRequired(true);

  form.addPageBreakItem().setTitle('第二部分：我的宣傳單');

  form
    .addParagraphTextItem()
    .setTitle(REVISE_TITLE)
    .setHelpText('寫一句就可以，例如：我把提醒放大、加了色塊。沒有照建議改的話，寫為什麼。')
    .setPoints(10)
    .setRequired(true);

  form.addPageBreakItem().setTitle('第三部分：情境題');

  SCENARIOS.forEach(function (spec) {
    var item = form.addMultipleChoiceItem();
    item
      .setTitle(spec.title)
      .setPoints(5)
      .setRequired(true)
      .setChoices(
        spec.choices.map(function (text, i) {
          return item.createChoice(text, i === spec.answer);
        })
      );
  });

  installAutoGradeTrigger(form);

  Logger.log('編輯用網址（自己改題目用，也貼到 FORM_EDIT_URL）：' + form.getEditUrl());
  // 一定要加 ?embedded=true，不然嵌入iframe會被Google擋掉（顯示「docs.google.com拒絕連線」）
  Logger.log('填答/嵌入用網址（貼到 week13-7-intro.md 的 embeds.url）：' + form.getPublishedUrl() + '?embedded=true');
}

/** 執行過一次 createForm() 之後，把印出的「編輯用網址」貼在這裡，backfillGrades() 才能重新打開這份表單 */
var FORM_EDIT_URL = 'https://docs.google.com/forms/d/1-l7hosCgLKcZaYJ7BjgwyWhgkNc4Ge2ZCePUYnN9yLk/edit';

var TARGET_SEAT_TITLE = '你幫哪一位同學看宣傳單？請填他的座號';
var THREE_SEC_TITLE = '3秒測試：看3秒後，你覺得這張宣傳單在提醒什麼？';
var GOOD_TITLE = '一個優點';
var SUGGEST_TITLE = '一個建議';
var REVISE_TITLE = '你的宣傳單改了什麼？是根據哪一條建議？';
var SEAT_PATTERN = '^\\s*(0[1-9]|1[0-9]|2[0-7])\\s*$';

var SCENARIOS = [
  {
    title: '小美在Google圖片搜尋到一個很可愛的「鎖頭」圖示，想下載放在宣傳單上。她應該怎麼做？',
    choices: [
      '改用Canva素材庫裡的鎖頭圖示',
      '直接下載使用，網路上找得到的圖片都可以自由使用',
      '可以用，只要把圖片縮小就好',
      '可以用，只要改個顏色就算是她自己的圖',
    ],
    answer: 0,
  },
  {
    title: '阿哲把Canva素材庫裡的盾牌圖示改成粉紅色，再放大放在宣傳單上。這樣可以嗎？',
    choices: [
      '可以，Canva素材庫的素材本來就可以改顏色、改大小來用',
      '不行，素材庫的素材只能照原樣使用',
      '可以，但要在旁邊標示「AI生成」',
      '可以，而且改過顏色之後就變成他的原創作品，可以拿去賣',
    ],
    answer: 0,
  },
  {
    title: '小安的宣傳單用了兒福聯盟調查的數字「41.8%的國中生曾謊報年齡註冊帳號」。她應該怎麼做？',
    choices: [
      '在資料來源寫出調查單位、年份和調查對象',
      '不用寫，因為這個數字已經公開在網路上了',
      '在資料來源寫「網路上查到的」就好',
      '把數字改成50%，比較好記',
    ],
    answer: 0,
  },
];

var VAGUE_PATTERN = /^(很好|很棒|不錯|沒有|無|沒|都很好|很漂亮|再漂亮一點|加油|讚)+$/;

function stripPunct(text) {
  return String(text).replace(/[\s，。、！？,.!?：:；;「」『』（）()~～…]/g, '');
}

/** 建議：6個字以上、不是空泛的話給10分，其他給5分；沒寫給0分 */
function scoreSuggestion(text) {
  var s = stripPunct(text);
  if (s.length === 0) return 0;
  if (s.length >= 6 && !VAGUE_PATTERN.test(s)) return 10;
  return 5;
}

/** 修改紀錄：6個字以上給10分，其他給5分；沒寫給0分 */
function scoreRevision(text) {
  var s = stripPunct(text);
  if (s.length === 0) return 0;
  return s.length >= 6 && !VAGUE_PATTERN.test(s) ? 10 : 5;
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
    var r = response.getResponseForItem(findItem(title));
    return r ? String(r.getResponse()) : '';
  }
  function setScore(item, score) {
    var itemResponse = response.getGradableResponseForItem(item);
    itemResponse.setScore(score);
    response.withItemGrade(itemResponse);
  }

  var idItem = form.getItems(FormApp.ItemType.TEXT)[0];
  var id = String(response.getResponseForItem(idItem).getResponse());
  setScore(idItem, 60);
  setScore(findItem(THREE_SEC_TITLE), stripPunct(answerOf(THREE_SEC_TITLE)).length > 0 ? 5 : 0);
  var suggestScore = scoreSuggestion(answerOf(SUGGEST_TITLE));
  setScore(findItem(SUGGEST_TITLE), suggestScore);
  var reviseScore = scoreRevision(answerOf(REVISE_TITLE));
  setScore(findItem(REVISE_TITLE), reviseScore);

  return {
    graded: response,
    result: {
      id: id,
      cls: id.split('_')[0],
      target: answerOf(TARGET_SEAT_TITLE).trim(),
      threeSec: answerOf(THREE_SEC_TITLE),
      suggest: answerOf(SUGGEST_TITLE),
      suggestScore: suggestScore,
      revise: answerOf(REVISE_TITLE),
      reviseScore: reviseScore,
    },
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

/* ===== 只批改新回覆 =====
 * backfillGrades() 會記住批改到哪一份，下次只批改之後才送出的回覆，回覆越多也不會越跑越久。
 * 進度存在這個 Apps Script 專案的「專案設定 → 指令碼屬性」（lastGradedAt）。
 * 改了批改規則，或想全部重新批改一次時，改執行 regradeAll()。 */
var LAST_GRADED_KEY = 'lastGradedAt';

/** 上次批改之後才送出的回覆；還沒有進度紀錄（第一次執行）就是全部回覆 */
function getNewResponses(form) {
  var saved = PropertiesService.getScriptProperties().getProperty(LAST_GRADED_KEY);
  if (!saved) return form.getResponses();
  var since = Number(saved);
  return form.getResponses(new Date(since)).filter(function (response) {
    return response.getTimestamp().getTime() > since;
  });
}

/** 成績送出後記下進度。retry 是這次沒批好、下次要再批的回覆，
 *  進度會停在最早一份 retry 之前，下次執行時從那份開始重批。 */
function saveProgress(responses, retry) {
  if (responses.length === 0) return;
  var times = function (list) {
    return list.map(function (response) {
      return response.getTimestamp().getTime();
    });
  };
  var mark = retry.length > 0 ? Math.min.apply(null, times(retry)) - 1 : Math.max.apply(null, times(responses));
  PropertiesService.getScriptProperties().setProperty(LAST_GRADED_KEY, String(mark));
}

/** 清掉進度，從第一份開始全部重新批改 */
function regradeAll() {
  PropertiesService.getScriptProperties().deleteProperty(LAST_GRADED_KEY);
  backfillGrades();
}

/** 批改上次之後的新回覆：建議每次上完課手動重跑一次（重複執行也不會出錯）。
 *  只有新回覆會送出成績；「每個人收到的建議」要對照全班，所以還是會讀全部回覆（只讀不送出）。 */
function backfillGrades() {
  var form = FormApp.openByUrl(FORM_EDIT_URL);
  var responses = getNewResponses(form);
  var graded = [];
  var newResults = [];

  responses.forEach(function (response) {
    var out = gradeResponse(form, response);
    graded.push(out.graded);
    newResults.push(out.result);
  });

  if (graded.length > 0) form.submitGrades(graded);
  saveProgress(responses, []);
  Logger.log('這次批改 ' + graded.length + ' 份新回覆');

  newResults.sort(function (a, b) {
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  Logger.log('===== 需要點開看的回覆（這批新回覆） =====');
  newResults.forEach(function (r) {
    if (r.suggestScore < 10) Logger.log(r.id + '　⚠️建議只拿' + r.suggestScore + '分：' + r.suggest);
    if (r.reviseScore < 10) Logger.log(r.id + '　⚠️修改紀錄只拿' + r.reviseScore + '分：' + r.revise);
  });

  // 下面的對照表要看全班，所以讀全部回覆的答案
  // （gradeResponse 只在記憶體裡算分，沒有呼叫 submitGrades 就不會送出成績）
  var results = form.getResponses().map(function (response) {
    return gradeResponse(form, response).result;
  });

  // 被評者 = 評分者的班級 + 填的座號；同班有交表單的人才找得到姓名
  var nameBySeat = {};
  results.forEach(function (r) {
    var parts = r.id.split('_');
    nameBySeat[parts[0] + '_' + parts[1]] = r.id;
  });
  var received = {};
  results.forEach(function (r) {
    var key = r.cls + '_' + r.target;
    (received[key] = received[key] || []).push(r);
  });

  Logger.log('===== 每個人收到的建議（批改宣傳單時對照） =====');
  Object.keys(received)
    .sort()
    .forEach(function (key) {
      received[key].forEach(function (r) {
        Logger.log(
          (nameBySeat[key] || key + '（沒有交表單）') +
            '　←' + r.id + '　3秒：' + r.threeSec + '　建議：' + r.suggest
        );
      });
    });

  var missing = Object.keys(nameBySeat)
    .filter(function (key) {
      return !received[key];
    })
    .map(function (key) {
      return nameBySeat[key];
    })
    .sort();
  Logger.log('===== 沒有被任何人評到的人 =====');
  Logger.log(missing.length ? missing.join('、') : '（沒有）');
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
