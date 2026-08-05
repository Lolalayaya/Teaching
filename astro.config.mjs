// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages project-site 部署設定。
// 部署到 GitHub 之後,把下面兩行換成你實際的 GitHub 帳號與 repo 名稱,
// 例如 repo 是 https://github.com/your-account/teaching-site,就設成:
//   site: 'https://your-account.github.io',
//   base: '/teaching-site',
// https://astro.build/config
export default defineConfig({
  site: 'https://Lolalayaya.github.io',
  base: '/Teaching/',
});
