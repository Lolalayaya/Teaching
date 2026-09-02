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
 */
function createForm() {
  var RETURN_URL = 'https://Lolalayaya.github.io/Teaching/tech-time-machine/?done=1';

  var form = FormApp.create('科技生活時光機・驗收小測驗');
  form.setIsQuiz(true);
  form.setDescription('闖完科技生活時光機之後，填這份小測驗結案。');
  form.setConfirmationMessage(
    '感謝完成小測驗！請點下面這個連結，回到時光機頁面完成結案：\n' + RETURN_URL
  );
  form.setShowLinkToRespondAgain(false);

  addScoredChoice(
    form,
    '「擴增實境（AR）」最常被用來做什麼？',
    ['試穿衣服、模擬穿搭', '自動炒菜', '修理汽車引擎', '掃描課本內容'],
    '試穿衣服、模擬穿搭'
  );

  addScoredChoice(
    form,
    '「物聯網（IoT）」的智慧住宅，主要解決了什麼問題？',
    ['遠端管理、控制家裡的電器', '提高房租', '增加房子的坪數', '更換油漆顏色'],
    '遠端管理、控制家裡的電器'
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

  Logger.log('編輯用網址（自己改題目用）：' + form.getEditUrl());
  Logger.log('填答/嵌入用網址（貼回網站 formUrl）：' + form.getPublishedUrl());
}

/** 新增一題單選題，設成1分、有標準答案（測驗模式下才會自動評分）。 */
function addScoredChoice(form, title, options, correctOption) {
  var item = form.addMultipleChoiceItem();
  item.setTitle(title).setPoints(1).setRequired(true);
  item.setChoices(
    options.map(function (opt) {
      return item.createChoice(opt, opt === correctOption);
    })
  );
}
