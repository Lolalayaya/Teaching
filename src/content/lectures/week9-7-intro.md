---
title: 第九週 任務檔案 009・解碼行動｜Google試算表入門
unit: 第九單元
order: 19
date: 2026-10-26
semester: 115-1
grades: ['7']
classes: ['703', '705']
published: true
current: true
tags: ["資料處理應用專題", "Google試算表", "COUNTIF", "AVERAGE", "圖表"]
summary: 用Google試算表分析第六週班級問卷中自己組負責的3題，學會COUNTA、COUNTIF、百分比、AVERAGE與圖表，算出「我們班的答案」並寫進資料筆記。
embeds:
  - type: google-form
    title: 第九週繳交表單
    url: https://docs.google.com/forms/d/e/1FAIpQLSdbDj8_x9Wezccb_SV8qbncModOWpyLow18L_XhPIfZ88NFSg/viewform?embedded=true
---

## 學習目標

- 認識試算表的欄、列、儲存格，以及問卷回覆在試算表裡的排列方式
- 使用 `COUNTA`、`COUNTIF` 計算人數，並算出比例
- 使用 `AVERAGE` 計算量表題的平均分數，並說出平均分數代表的意思
- 把計算結果做成圖表，寫進資料筆記

## 一、先猜一猜

打開你們這組的資料筆記，看「三、我們班的問卷題目」裡的3題。第六週全班都填過這份問卷，在算之前，先猜猜看：

- 兩題是非題：全班有幾成的人選了**第一個選項**（例如「有」、「會」、「聽過」）？
- 量表題：全班的平均分數大概是幾分？

先把答案記在心裡，等一下打開試算表後，要寫進「我猜的結果」那一列。

## 二、打開我們班的資料

點下面的「**建立副本**」，會出現「要建立副本嗎？」，再按一次「**建立副本**」。這份副本存在你自己的雲端硬碟，只有你能編輯，改壞了也不會影響別人。

表格只會顯示你登入的班級。如果看到的不是自己班，請先按頁面上方的「登出／換班級」，用自己班的密碼重新登入。

<table>
  <thead><tr><th>班級</th><th>練習檔</th></tr></thead>
  <tbody>
    <tr data-only-class="701" hidden><td>701</td><td><a href="https://docs.google.com/spreadsheets/d/1AjreZOdC5xAOxN-8st6lyAGrp_LSWzrew9n_mukTeWk/copy" target="_blank" rel="noopener">建立副本</a></td></tr>
    <tr data-only-class="702" hidden><td>702</td><td><a href="https://docs.google.com/spreadsheets/d/1yk43dXy5iampNNsrc5RlEDLdtNji4RCzzLENSkjy2Tc/copy" target="_blank" rel="noopener">建立副本</a></td></tr>
    <tr data-only-class="703" hidden><td>703</td><td><a href="https://docs.google.com/spreadsheets/d/1TTiW7Wo60_eHdyhzCLA7Kc1mU5hbHRQYbJbflkyJQjA/copy" target="_blank" rel="noopener">建立副本</a></td></tr>
    <tr data-only-class="704" hidden><td>704</td><td><a href="https://docs.google.com/spreadsheets/d/1CmhEG-B2gGOi57FbKARI52CHqsfbrZhkMsacH2J9EzE/copy" target="_blank" rel="noopener">建立副本</a></td></tr>
    <tr data-only-class="705" hidden><td>705</td><td><a href="https://docs.google.com/spreadsheets/d/1xaTM8kDE1iA8xjzDj3FoQnaRuWB8zrn3kDZtjlb9-3Q/copy" target="_blank" rel="noopener">建立副本</a></td></tr>
    <tr data-only-class="706" hidden><td>706</td><td><a href="https://docs.google.com/spreadsheets/d/1YsBe14sssTbZ3Q-wuruh6Be_Vt0gFJxjecdMYp_feVI/copy" target="_blank" rel="noopener">建立副本</a></td></tr>
    <tr data-only-class="707" hidden><td>707</td><td>第六週問卷填完後提供</td></tr>
    <tr data-only-class="708" hidden><td>708</td><td>第六週問卷填完後提供</td></tr>
    <tr data-only-class="709" hidden><td>709</td><td><a href="https://docs.google.com/spreadsheets/d/1M9PtYyzvbDbfDqgm8524IG-9uvhTcp0nsG6dM_4kDSE/copy" target="_blank" rel="noopener">建立副本</a></td></tr>
    <tr data-only-class="710" hidden><td>710</td><td><a href="https://docs.google.com/spreadsheets/d/1FTJnYs8V97PmhYSdmGbLqS7duUOep789VR5dgF84bUg/copy" target="_blank" rel="noopener">建立副本</a></td></tr>
  </tbody>
</table>

### 認識試算表

- **欄**：直的一行，用英文字母編號（A、B、C⋯）
- **列**：橫的一行，用數字編號（1、2、3⋯）
- **儲存格**：欄和列交叉的一格，用「欄＋列」稱呼，例如B2就是B欄第2列

Google表單的回覆，送到試算表時會這樣排：**一列是一位同學的答案，一欄是一道題目**。第1列是題目，第2列開始是全班的答案。

這份資料已經拿掉姓名、座號、Email和填寫時間，順序也打亂過，看不出哪一列是誰填的。這就是第四週學過的個資保護：資料可以拿來分析，但不能指認出個人。請不要猜測某一列是哪位同學。

### 找到你們這組的3欄

第1列的題目前面標有組別，同一個主題用同一種顏色，例如「資訊安全・第一組・Q1｜⋯」。找到你們這組的Q1、Q2、Q3，它們會連在一起。

往下捲到資料的最下面，會看到「**▼ 分析區**」。接下來的公式，都寫在**自己組那3欄**的分析區裡。灰色的格子代表這一題用不到，不用填。

## 三、公式的寫法

試算表的公式一定是**等號 `=` 開頭**，例如在格子裡輸入 `=1+2`，按Enter會顯示3。

函式是試算表內建的計算工具，寫法是「函式名稱(要算的範圍)」。範圍用「第一格:最後一格」表示，例如 `B2:B21` 就是B2到B21這一整段。打範圍時不用自己打字，**直接用滑鼠從第一個答案拖到最後一個答案**，試算表會自動填好。

## 四、是非題：算人數和比例

先做**Q1**，在Q1那一欄的分析區由上往下填：

| 分析區的列 | 要填什麼 | 公式寫法 |
| --- | --- | --- |
| 我猜的結果 | 第一節猜的比例，例如打 `30%` | 不用公式 |
| 總人數 | 這一題有幾個人回答 | `=COUNTA(範圍)` |
| 第一個選項的人數 | 選第一個選項的人數 | `=COUNTIF(範圍, "選項文字")` |
| 第二個選項的人數 | 選第二個選項的人數 | `=COUNTIF(範圍, "選項文字")` |
| 第一個選項的比例 | 第一個選項的人數 ÷ 總人數 | `=人數那格/總人數那格` |

- **COUNTA**：數一數範圍裡有幾格有填東西
- **COUNTIF**：數一數範圍裡有幾格**符合條件**。選項文字要加上英文的雙引號，而且要跟資料裡的字**一模一樣**，多一個字、少一個字都會算錯。這一欄的選項文字，寫在分析區第一列「選項」那一格
- **比例**：公式裡的「人數那格」、「總人數那格」，用滑鼠直接點那一格就好。算出來是小數，選取那一格，按工具列上的「**%**」按鈕，就會變成百分比

**自己檢查：** 第一個選項的人數＋第二個選項的人數，應該剛好等於總人數。

### 拖曳複製到Q2

Q2的算法跟Q1一樣，不用重打一次：

1. 選取Q1分析區裡「總人數」到「第一個選項的比例」這4格
2. 把滑鼠移到選取框**右下角的小藍點**，游標會變成十字
3. 按住往右拖一格，拖到Q2那一欄就放開

試算表會自動把範圍換成Q2那一欄。拖完之後，用上面的方法檢查Q2：兩個選項的人數加起來，等於總人數嗎？如果不相等，回頭看看Q2的「選項」那一格，再看看你的公式，想想是哪裡沒有跟著改到。

## 五、量表題：算平均

Q3是1～5分的量表題，在Q3那一欄的分析區填：

| 分析區的列 | 要填什麼 | 公式寫法 |
| --- | --- | --- |
| 我猜的結果 | 第一節猜的平均，例如打 `3.5` | 不用公式 |
| 總人數 | 這一題有幾個人回答 | `=COUNTA(範圍)` |
| 平均分數 | 全班分數的平均 | `=AVERAGE(範圍)` |

算出平均後，回頭看第1列的題目，想一想這個分數代表什麼。每一題的1分和5分意思不一樣，例如「你會有多猶豫」這一題，5分是「絕對不會給」，平均越接近5分，代表全班越謹慎；「你會有多想點進去看」這一題剛好相反，平均越接近1分越好。

## 六、做成圖表

從Q1、Q2裡選一題做圓餅圖：

1. 在分析區下方找兩列空白，左邊一格打第一個選項的文字，右邊一格打 `=` 再點「第一個選項的人數」那一格；下一列照樣做第二個選項。做好會是一個兩列、兩欄的小表格
2. 選取這4格，點上方選單「**插入**」→「**圖表**」
3. 右邊的「圖表編輯器」裡，「圖表類型」選「**圓餅圖**」
4. 在「自訂」→「圖表和軸標題」，把標題改成這一題的題目

做得快的同學可以挑戰：用 `COUNTIF` 分別算出Q3選1分、2分、3分、4分、5分的人數，做一張長條圖，看看全班的分數集中在哪裡。

## 七、寫進資料筆記

同一組的同學算的是同樣3題，先互相對答案：如果數字不一樣，一起找找看是誰的範圍或選項文字打錯了。

確認答案以後，由**文件管理員**在資料筆記「三、我們班的問卷題目」每一題的下方，各補一行結果：

- 是非題：我們班 ○ 人中，有 ○ 人選「第一個選項」，占 ○%
- 量表題：我們班的平均是 ○ 分（1分＝⋯，5分＝⋯）

再請一位組員把圖表貼到筆記裡：在試算表點圖表右上角的「⋮」→「複製圖表」，回到資料筆記按 `Ctrl+V` 貼上。

最後想一想：算出來的結果跟你猜的差多少？班上只有十幾、二十個人，一個人就占了大約5%，所以兩三個人的差別，比例看起來就會差很多。下週拿全國的調查數字來比較時，記得這一點。

## 八、繳交

試算表做完之後，先把它設成老師看得到：

1. 點右上角「**共用**」
2. 「一般存取權」選「**知道連結的任何人**」，權限選「**檢視者**」
3. 點「**複製連結**」

打開下方的「**第九週繳交表單**」，填入班級座號姓名、組別、你算出來的數字，並貼上試算表連結。

**今天的課堂作業：** 繳交表單送出，資料筆記第三段補上3題的結果和1張圖表，兩件都做到才算完成。

## 九、下週預告

今天算出的是「我們班」的數字。下週要拿出資料筆記「二、重要數字」裡的調查報告，把我們班和全國的數字放在同一張圖表裡比較，寫出這組的「我們發現⋯」。
