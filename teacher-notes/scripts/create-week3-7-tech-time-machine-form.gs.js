/**
 * 科技生活時光機・驗收小測驗 —— Google Apps Script，自動建立Google表單
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

/** 「班級座號姓名」格式：3位班級_2位座號_姓名（例如 701_05_王小明） */
var NAME_ID_PATTERN = '^[1278](0[1-9]|10)_(0[1-9]|1[0-9]|2[0-7])_[一-龥]{2,4}$';

/**
 * 新增「班級座號姓名」文字題，用正規表示法擋格式
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

/** 綁定「表單提交時」觸發條件 */
function installAutoGradeTrigger(form) {
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return trigger.getHandlerFunction() === 'autoGradeIdField' && trigger.getTriggerSourceId() === form.getId();
    })
    .forEach(function (trigger) {
      ScriptApp.deleteTrigger(trigger);
    });
  ScriptApp.newTrigger('autoGradeIdField').forForm(form).onFormSubmit().create();
}

/** 表單提交時自動給予第一題簡答題 85 分 */
function autoGradeIdField(e) {
  try {
    var form = e.source;
    var response = e.response;
    var items = form.getItems(FormApp.ItemType.TEXT);
    if (items.length === 0) {
      Logger.log('沒有找到任何簡答題項目');
      return;
    }
    var idItem = items[0];
    var itemResponse = response.getGradableResponseForItem(idItem);
    itemResponse.setScore(85);
    var gradedResponse = response.withItemGrade(itemResponse);
    form.submitGrades([gradedResponse]);
    Logger.log('已成功給分：85分，回覆時間 ' + response.getTimestamp());
  } catch (err) {
    Logger.log('自動評分失敗：' + err.message);
  }
}
