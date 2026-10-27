/**
 * 第九週・解碼行動 試算表練習檔 —— Google Apps Script，從第六週班級問卷的回覆試算表，
 * 自動做出「每班一份」去識別化的練習檔，外加一份老師用的答案總表。
 *
 * 第九週學生用自己組在第六週設計的3題（2是非＋1量表）學COUNTA/COUNTIF/百分比/AVERAGE/圖表。
 * 原本規劃用第八週網站使用調查（表單A）的資料，2026-10-22改用W6：W6十個班都會有資料
 * （表單A當時只有703），題目又是各組自己出的，算出來的數字可以直接接到第十週
 * 「我們班 vs 全國」和之後的宣傳單、漫畫。
 *
 * 腳本做的事：
 * 1. 讀第六週回覆試算表，依「班級座號姓名」去掉重複填答——同一班同一個名字只留
 *    最後一次送出的答案（2026-10-22檢查時，161筆裡有15筆是同一人重複送出，
 *    最多的一人送了4次；也有人換帳號重填，所以用班級＋姓名判斷，不用Email）。
 * 2. 刪掉時間戳記、Email、班級座號姓名，只留18題答案，並打亂列的順序
 *    （一班只有十幾二十人，照送出順序排可能被坐隔壁的同學猜出是誰）。
 * 3. 每班建一份試算表：第1列是題目（前面加組別，依主題上色），中間是全班答案，
 *    下方留好「分析區」的列標題，學生只要在自己組的3欄填公式。分析區放在同一個
 *    分頁的資料下面，學生不用學跨分頁參照，公式往右拖也不會跑掉。
 * 4. 每份練習檔設成「知道連結的任何人可檢視」，執行紀錄印出每班的 /copy 連結，
 *    貼到 week9-7-intro.md 第二節的表格。
 * 5. 把這次建立的班級寫進「答案總表（老師用）」：每班一列，列出每題的人數、比例、平均，
 *    最後一列是全年級合計。第九週繳交表單（create-week9-7-submission-form.gs.js）
 *    直接讀這份總表批改，第十週「我們班 vs 全年級」也用得到。這份不要分享給學生。
 *    每班的答案跟它的練習檔是同一次執行算出來的，之後W6問卷再多人填，也不會對不上。
 *
 * 使用方式：
 * 1. 開啟 https://script.google.com/ → 新增專案，把這個檔案的內容整個貼進去
 * 2. 把下面 SOURCE_SPREADSHEET_ID 換成第六週回覆試算表的ID（網址 /d/ 和 /edit 中間那一段）
 * 3. 選 createPracticeSheets 執行（第一次會要求授權，允許即可）
 * 4. 執行紀錄會印出每班的「建立副本」連結和答案總表的網址；把答案總表的ID貼到下面
 *    ANSWER_KEY_SPREADSHEET_ID，也貼到繳交表單腳本的同名變數
 *
 * 707、708 因10/23颱風假，延到下一次上課（預計10/30）才上第六週。他們填完以後，把 CLASSES 改成 ['707', '708'] 再執行一次：
 * 只會多建這兩班的練習檔，答案總表會補上這兩列（其他班的列不會動），全年級那列重算。
 * 707、708 填完後，記得把第六週問卷關閉「接受回應」。
 *
 * 上課示範用：選 createDemoSheet 執行，會用目前全部回覆（去重複、去識別化、全年級合在一起）
 * 建一份「上課示範」試算表，有兩個分頁——「示範（空白）」跟學生的練習檔長得一樣，老師可以
 * 現場示範；「完成版」18欄的公式都填好了，還有一張圓餅圖，給學生看做完長什麼樣子。
 * 全年級的數字跟各班不一樣，學生看了也不能直接抄答案。
 */

// 第六週回覆試算表：ID是網址 /d/ 和 /edit 中間那一段，GID是網址最後 gid= 後面的數字（回覆所在的分頁）
var SOURCE_SPREADSHEET_ID = '1h2by2pBgbgekHphw7mXkEAH_69LBPFl2TvJtpO4vyKQ';
var SOURCE_SHEET_GID = 339197082;
var ANSWER_KEY_SPREADSHEET_ID = '1xMt9GGxerXecZHDTw-uMPyH63kqU7nZEsepGlw_aQsA'; // 第一次執行留空會自動建立，之後填入印出的ID
var CLASSES = ['701', '702', '703', '704', '705', '706', '709', '710'];
var FOLDER_NAME = 'W9-7 試算表練習檔';

// 回覆試算表的欄位順序（從0起算）：0時間戳記、1電子郵件、2班級座號姓名、3~20是18題
var ID_COL = 2;
var FIRST_Q_COL = 3;

// 18題依第六週表單的順序：每組3題（是非、是非、量表），共6組。
// options 是是非題的兩個選項，要跟 create-week6-7-survey-form.gs.js 的 addBinary 一字不差。
var GROUPS = [
  { name: '個資保護・第一組', color: '#dbeafe', options: [['有', '沒有'], ['會', '不會']] },
  { name: '個資保護・第二組', color: '#bfdbfe', options: [['會', '不會'], ['有', '沒有']] },
  { name: '資訊安全・第一組', color: '#dcfce7', options: [['有', '沒有'], ['會', '不會']] },
  { name: '資訊安全・第二組', color: '#bbf7d0', options: [['會', '不會'], ['有', '沒有']] },
  { name: '合理使用・第一組', color: '#fef3c7', options: [['有', '沒有'], ['聽過', '沒聽過']] },
  { name: '合理使用・第二組', color: '#fde68a', options: [['有', '沒有'], ['會', '不會']] },
];

// 分析區的列標題，順序就是學生由上往下要做的順序
// 是非題的兩個選項各題不同（有／會／聽過），分析區統一叫Yes、No，括號列出實際的字。
// 2026-10-27 從「第一個選項／第二個選項」改過來，已建好的檔案用 relabelExistingSheets() 更新。
var ANALYSIS_ROWS = ['選項', '我猜的結果', '總人數', 'Yes的人數（有／會／聽過）', 'No的人數（沒有／不會／沒聽過）', 'Yes的比例', '平均分數'];
var OLD_ANALYSIS_LABELS = { '第一個選項的人數': ANALYSIS_ROWS[3], '第二個選項的人數': ANALYSIS_ROWS[4], '第一個選項的比例': ANALYSIS_ROWS[5] };
var NOT_USED_COLOR = '#e5e7eb';

function createPracticeSheets() {
  var values = readSourceValues();
  var titles = values[0].slice(FIRST_Q_COL, FIRST_Q_COL + 18);
  var byClass = dedupeByClass(values.slice(1));
  var folder = getOrCreateFolder(FOLDER_NAME);
  var built = [];

  CLASSES.forEach(function (cls) {
    var rows = byClass[cls] || [];
    if (rows.length === 0) {
      Logger.log(cls + '：沒有資料，跳過');
      return;
    }
    var file = buildClassSheet(cls, titles, shuffle(rows));
    DriveApp.getFileById(file.getId()).moveTo(folder);
    DriveApp.getFileById(file.getId()).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    built.push(cls);
    Logger.log(cls + '（' + rows.length + '人）建立副本連結：https://docs.google.com/spreadsheets/d/' + file.getId() + '/copy');
  });

  var key = updateAnswerKey(titles, byClass, built, folder);
  Logger.log('答案總表（老師用，不要分享）：' + key.getUrl());
  Logger.log('答案總表ID（貼到 ANSWER_KEY_SPREADSHEET_ID）：' + key.getId());
}

// 完成版的圓餅圖示範哪一題（0起算）：4＝個資保護・第二組Q2「謊報年齡註冊」，全年級約一半回答「有」
var DEMO_CHART_QUESTION = 4;

/** 全年級上課示範檔：「示範（空白）」＋「完成版」兩個分頁 */
function createDemoSheet() {
  var values = readSourceValues();
  var titles = values[0].slice(FIRST_Q_COL, FIRST_Q_COL + 18);
  var byClass = dedupeByClass(values.slice(1));
  var all = [];
  Object.keys(byClass).forEach(function (cls) {
    all = all.concat(byClass[cls]);
  });

  var ss = buildClassSheet('全年級', titles, shuffle(all));
  ss.rename('W9-7 上課示範（全年級' + all.length + '人）');
  var blank = ss.getSheets()[0].setName('示範（空白）');
  var done = blank.copyTo(ss).setName('完成版');
  fillDemoFormulas(done, all.length);

  var file = DriveApp.getFileById(ss.getId());
  file.moveTo(getOrCreateFolder(FOLDER_NAME));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  Logger.log('上課示範（' + all.length + '人）：' + ss.getUrl());
}

/** 完成版：分析區填上公式（跟講義教的寫法一樣），再加一張圓餅圖 */
function fillDemoFormulas(sheet, n) {
  var top = n + 3; // 分析區第一列「選項」，跟 buildClassSheet 一致
  var guessRow = top + 1;
  var totalRow = top + 2;
  var firstRow = top + 3;
  var secondRow = top + 4;
  var ratioRow = top + 5;
  var avgRow = top + 6;

  sheet.getRange(guessRow, 2, 1, 18).setValue('（自己猜）').setFontColor('#9ca3af');
  for (var i = 0; i < 18; i++) {
    var col = 2 + i;
    var letter = columnLetter(col);
    var range = letter + '2:' + letter + (n + 1);
    sheet.getRange(totalRow, col).setFormula('=COUNTA(' + range + ')');
    if (i % 3 === 2) {
      sheet.getRange(avgRow, col).setFormula('=AVERAGE(' + range + ')').setNumberFormat('0.00');
    } else {
      var options = GROUPS[Math.floor(i / 3)].options[i % 3];
      sheet.getRange(firstRow, col).setFormula('=COUNTIF(' + range + ', "' + options[0] + '")');
      sheet.getRange(secondRow, col).setFormula('=COUNTIF(' + range + ', "' + options[1] + '")');
      sheet.getRange(ratioRow, col).setFormula('=' + letter + firstRow + '/' + letter + totalRow).setNumberFormat('0.0%');
    }
  }

  // 講義第六節的小表格：左邊選項文字、右邊 = 人數那格，再拿這4格畫圓餅圖
  var q = DEMO_CHART_QUESTION;
  var qLetter = columnLetter(2 + q);
  var qOptions = GROUPS[Math.floor(q / 3)].options[q % 3];
  var tableRow = avgRow + 3;
  sheet.getRange(tableRow, 1, 2, 2).setValues([
    [qOptions[0], '=' + qLetter + firstRow],
    [qOptions[1], '=' + qLetter + secondRow],
  ]);
  var chart = sheet
    .newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(sheet.getRange(tableRow, 1, 2, 2))
    .setOption('title', String(sheet.getRange(1, 2 + q).getValue()).split('｜')[1])
    .setOption('pieSliceText', 'percentage')
    .setPosition(tableRow, 3, 0, 0)
    .build();
  sheet.insertChart(chart);
}

/** 欄號轉英文字母，例如 2→B、19→S */
function columnLetter(col) {
  var s = '';
  while (col > 0) {
    var m = (col - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    col = Math.floor((col - 1) / 26);
  }
  return s;
}

/**
 * 把資料夾裡已經建好的練習檔、上課示範檔，分析區的「第一個選項／第二個選項」改成Yes／No。
 * 只改老師雲端硬碟裡的原始檔；學生已經建立的副本不會跟著變。可以重複執行。
 */
function relabelExistingSheets() {
  var files = getOrCreateFolder(FOLDER_NAME).getFilesByType(MimeType.GOOGLE_SHEETS);
  while (files.hasNext()) {
    var file = files.next();
    if (file.getName().indexOf('答案總表') !== -1) continue;
    var ss = SpreadsheetApp.openById(file.getId());
    var changed = 0;
    Object.keys(OLD_ANALYSIS_LABELS).forEach(function (oldLabel) {
      changed += ss.createTextFinder(oldLabel).matchEntireCell(true).replaceAllWith(OLD_ANALYSIS_LABELS[oldLabel]);
    });
    ss.getSheets().forEach(function (sheet) {
      sheet.setColumnWidth(1, 230);
    });
    Logger.log(file.getName() + '：改了 ' + changed + ' 格');
  }
}

/** 讀第六週回覆分頁的全部內容（第1列是題目） */
function readSourceValues() {
  var sheet = SpreadsheetApp.openById(SOURCE_SPREADSHEET_ID).getSheets().filter(function (s) {
    return s.getSheetId() === SOURCE_SHEET_GID;
  })[0];
  if (!sheet) throw new Error('找不到 gid=' + SOURCE_SHEET_GID + ' 的分頁，請確認 SOURCE_SHEET_GID');
  return sheet.getDataRange().getValues();
}

/** 依班級分組，同班同名只留時間最晚的那一筆；回傳 { '701': [[18題答案], ...], ... } */
function dedupeByClass(responses) {
  var latest = {};
  responses.forEach(function (r) {
    var parts = String(r[ID_COL]).trim().split('_');
    if (parts.length < 3) return;
    var key = parts[0] + '_' + parts[2];
    if (!latest[key] || r[0] > latest[key][0]) latest[key] = r;
  });

  var byClass = {};
  Object.keys(latest).forEach(function (key) {
    var cls = key.split('_')[0];
    (byClass[cls] = byClass[cls] || []).push(latest[key].slice(FIRST_Q_COL, FIRST_Q_COL + 18));
  });
  return byClass;
}

function buildClassSheet(cls, titles, rows) {
  var ss = SpreadsheetApp.create('W9-7 我們班的問卷資料（' + cls + '）');
  var sheet = ss.getSheets()[0].setName('問卷資料');
  var n = rows.length;

  // 第1列：A欄「編號」，B~S欄「組別・Q幾｜題目」
  var header = ['編號'].concat(
    titles.map(function (t, i) {
      return GROUPS[Math.floor(i / 3)].name + '・Q' + ((i % 3) + 1) + '｜' + t;
    })
  );
  sheet.getRange(1, 1, 1, 19).setValues([header]).setFontWeight('bold').setWrap(true).setVerticalAlignment('top');
  GROUPS.forEach(function (g, gi) {
    sheet.getRange(1, 2 + gi * 3, 1, 3).setBackground(g.color);
  });

  // 資料列
  var body = rows.map(function (r, i) {
    return [i + 1].concat(r);
  });
  sheet.getRange(2, 1, n, 19).setValues(body);

  // 分析區：資料下面空一列
  var top = n + 3;
  sheet.getRange(top, 1, ANALYSIS_ROWS.length, 1)
    .setValues(ANALYSIS_ROWS.map(function (label) { return [label]; }))
    .setFontWeight('bold');
  sheet.getRange(top - 1, 1).setValue('▼ 分析區：在自己組的3欄填公式').setFontColor('#b91c1c');

  for (var i = 0; i < 18; i++) {
    var col = 2 + i;
    var g = GROUPS[Math.floor(i / 3)];
    var isScale = i % 3 === 2;
    sheet.getRange(top, col).setValue(isScale ? '1～5分' : g.options[i % 3].join('／'));
    if (isScale) {
      sheet.getRange(top + 3, col, 3, 1).setBackground(NOT_USED_COLOR); // 人數、比例：量表題不用
    } else {
      sheet.getRange(top + 6, col).setBackground(NOT_USED_COLOR); // 平均：是非題不用
    }
  }

  sheet.setColumnWidth(1, 230);
  sheet.setColumnWidths(2, 18, 170);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);
  return ss;
}

/**
 * 老師用答案總表：每班一列、每題一組數字，最後一列是全年級合計。
 * 欄位順序固定（繳交表單腳本靠位置讀）：班級、人數，接著6組各5欄——
 * Q1人數、Q1比例、Q2人數、Q2比例、Q3平均。比例、平均存原始數字，只用格式顯示成%和小數。
 * 這次有建練習檔的班級才會寫入或覆蓋，其他班的列保持原樣。
 */
function updateAnswerKey(titles, byClass, builtClasses, folder) {
  var ss;
  if (ANSWER_KEY_SPREADSHEET_ID) {
    ss = SpreadsheetApp.openById(ANSWER_KEY_SPREADSHEET_ID);
  } else {
    ss = SpreadsheetApp.create('W9-7 答案總表（老師用）');
    DriveApp.getFileById(ss.getId()).moveTo(folder);
  }
  var sheet = ss.getSheets()[0].setName('答案總表');

  var header = ['班級', '人數'];
  titles.forEach(function (t, i) {
    var label = GROUPS[Math.floor(i / 3)].name + '・Q' + ((i % 3) + 1);
    if (i % 3 === 2) {
      header.push(label + ' 平均');
    } else {
      var first = GROUPS[Math.floor(i / 3)].options[i % 3][0];
      header.push(label + '「' + first + '」人數', label + '「' + first + '」比例');
    }
  });

  // 讀出舊的班級列（全年級那列每次重算，不保留）
  var existing = {};
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, header.length).getValues().forEach(function (row) {
      if (row[0] && row[0] !== '全年級') existing[String(row[0])] = row;
    });
  }
  builtClasses.forEach(function (cls) {
    existing[cls] = summarize(cls, byClass[cls]);
  });

  var all = [];
  Object.keys(byClass).forEach(function (cls) {
    all = all.concat(byClass[cls]);
  });
  var out = Object.keys(existing).sort().map(function (cls) { return existing[cls]; });
  out.push(summarize('全年級', all));

  sheet.clear();
  sheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold').setWrap(true);
  sheet.getRange(2, 1, out.length, header.length).setValues(out);
  for (var g = 0; g < 6; g++) {
    var base = 3 + g * 5;
    sheet.getRange(2, base + 1, out.length, 1).setNumberFormat('0.0%');
    sheet.getRange(2, base + 3, out.length, 1).setNumberFormat('0.0%');
    sheet.getRange(2, base + 4, out.length, 1).setNumberFormat('0.00');
  }
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);
  return ss;
}

/** 一列答案總表：班級、人數，接著每題——是非題「Yes人數、比例」，量表題「平均」 */
function summarize(label, rows) {
  var n = rows.length;
  var line = [label, n];
  for (var i = 0; i < 18; i++) {
    if (i % 3 === 2) {
      var sum = rows.reduce(function (s, r) { return s + Number(r[i]); }, 0);
      line.push(sum / n);
    } else {
      var first = GROUPS[Math.floor(i / 3)].options[i % 3][0];
      var count = rows.filter(function (r) { return r[i] === first; }).length;
      line.push(count, count / n);
    }
  }
  return line;
}

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function getOrCreateFolder(name) {
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}
