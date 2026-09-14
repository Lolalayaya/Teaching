/**
 * 補丁：幫「現有的」科技生活時光機表單，補上/修正確認訊息裡的返回連結。
 * 不會建立新表單、不會動到已經收到的作答資料，只改確認畫面的文字。
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案
 * 2. 貼上這個檔案的內容，執行 fixConfirmation
 * 3. 第一次會要求授權，允許即可
 * 4. 執行紀錄會顯示「已更新確認訊息」，之後學生填完表單、按送出，
 *    確認畫面就會出現可以點回時光機頁面的連結
 */
function fixConfirmation() {
  var FORM_ID = '1F4Mhc_56WEZSSGs91DnenOI44sHGYxJN6OGTOT2jWac';
  var RETURN_URL = 'https://Lolalayaya.github.io/Teaching/tech-time-machine/?done=1';

  var form = FormApp.openById(FORM_ID);
  form.setConfirmationMessage(
    '感謝完成小測驗！請點下面這個連結，回到時光機頁面完成結案：\n' + RETURN_URL
  );
  form.setShowLinkToRespondAgain(false);

  Logger.log('已更新確認訊息。');
}
