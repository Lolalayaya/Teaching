# Lola 的資訊柑仔店

用 Astro 建置的國中資訊科技課程教材網站,包含課程講義、課程公告/作業、學生作品展示與評分標準,部署在 GitHub Pages 上。

## 開始使用

```sh
npm install
npm run dev       # 本機開發, http://localhost:4321
npm run build     # 產生 production 版本到 ./dist
npm run preview   # 用 production base path 預覽 build 結果
```

## 部署到 GitHub Pages(第一次設定)

1. 到 GitHub 建立一個新的 repository(例如 `teaching-site`)。
2. 打開 [astro.config.mjs](astro.config.mjs),把 `site` 換成 `https://<你的帳號>.github.io`,把 `base` 換成 `/<repo 名稱>`(例如 `/teaching-site`)。
3. 把這個資料夾 push 到剛建立的 GitHub repo 的 `main` 分支。
4. 到 repo 的 **Settings → Pages**,把 **Source** 設定成 **GitHub Actions**。
5. push 之後,`.github/workflows/deploy.yml` 會自動 build 並部署,完成後網址會是 `https://<你的帳號>.github.io/<repo 名稱>/`。

## 新增內容的方式

不確定要改哪個檔案時,先看 `templates/` 資料夾——裡面三個範本檔案就是照著下面規則做的,複製貼上、填空即可,不用自己記路徑:

- **新增一篇講義**:複製 [`templates/新增課程講義.md`](templates/新增課程講義.md) 的內容,貼到 `src/content/lectures/` 底下的新檔案。也可以直接請 Claude Code 幫忙依照現有講義的格式新增。
- **新增一篇公告/作業**:複製 [`templates/新增公告.md`](templates/新增公告.md) 的內容,貼到 `src/content/announcements/` 底下的新檔案。
- **新增一筆學生作品**:複製 [`templates/新增學生作品.md`](templates/新增學生作品.md) 的內容,貼到 `src/content/showcase/` 底下的新檔案。
- **調整評分標準**:直接編輯 `src/pages/grades.md`——這是唯一一個不在 `src/content/` 底下的頁面,因為它只是一頁固定文字,不是像講義/公告/作品那樣「一筆一個檔案」的列表內容。

新增檔案的 frontmatter 格式都有 schema 驗證(見 `src/content.config.ts`),`npm run build` 時如果格式錯誤會直接報錯,方便及早發現問題。

### Frontmatter 共用欄位(講義/公告/學生作品都可以用)

```yaml
semester: 上學期        # 或「下學期」,選填
grades: ['7']           # 適用年級,可寫多個,如 ['7', '8'];不填 = 全年級皆適用
classes: ['701', '703'] # 適用班級,格式是「年級+兩位數班號」,如 701 代表 7年1班;不填 = 該年級全部班皆適用
embeds:                 # 附掛的外部連結,可以放多筆
  - type: scratch        # scratch | google-doc | google-sheet | google-form | canva
    title: 標題文字
    url: 嵌入用的網址
```

**`grades`/`classes` 只是首頁「選班級」功能的篩選依據,不是存取控制**——這是純靜態網站,沒有登入機制,所有內容本來就對任何訪客公開,篩選只是方便學生一進站就看到跟自己相關的內容,不會、也無法阻止任何人看到其他班級的內容。

### 如何取得各平台的「嵌入用網址」

- **Scratch**:打開專案的分享頁,網址是 `scratch.mit.edu/projects/數字ID`,把它改成 `scratch.mit.edu/projects/數字ID/embed` 就是嵌入網址。
- **Google 文件/試算表**:「檔案 → 分享 → 發布到網路」,或直接用一般分享連結把 `/edit` 換成 `/preview`。
- **Google 表單**:「傳送 → `<>`(嵌入 HTML)」,把裡面 `<iframe src="...">` 的網址整段複製起來。
- **Canva**:「分享 → 更多 → 嵌入」,一樣是複製 `<iframe>` 裡的網址。

## 選班級功能

首頁 / Nav 上的「選你的班級」(`/select-class/`)只是把選擇存在瀏覽器的 `localStorage`,用來篩選列表頁要優先顯示哪些內容,**不是登入**,換瀏覽器或清除瀏覽器資料就會恢復顯示全部內容。這個機制之後如果真的需要更嚴謹的存取控制(例如真的要做學生登入),需要另外導入後端服務,已超出目前純 GitHub Pages 靜態架構的範圍。

## 關於成績公告

目前 `src/pages/grades.md` 只公告評分等級與標準說明,**不會公開任何個別學生的具體成績**。因為這是純靜態網站(GitHub Pages 沒有後端),任何「輸入學號查成績」的功能實際上都會把全班成績整包送到瀏覽器,無法真正做到只讓學生看到自己的成績。如果未來真的需要線上查詢個別成績,需要額外導入一個小型後端服務(例如 Cloudflare Workers)才能做到安全的存取控制。

需要回傳到老師手上的測驗/作業(自動計分、收集回覆),請改用 Google 表單並以 `embeds` 的 `google-form` 類型嵌入,而不要自己刻一個會存資料的功能。

## 目前刻意不做的功能(已與老師確認過)

- **Scratch 作業自動批改**(檢查用了哪些積木、有沒有交檔等):需要解析 `.sb3` 專案結構,是一個獨立的後續專案,不在這個教材網站範圍內。
- **網站內建 Python 執行環境**:先跳過,等確認學生程度後再決定要不要做。
- **真正的登入/後端存取控制**:先不做,開學後視實際需求再評估。
- **搜尋功能、多語言**:目前規模不需要。
