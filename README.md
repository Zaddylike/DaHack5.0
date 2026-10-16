# BloomBreak · De Anza Hacks 5.0

Nature Life × Modern Life：短暫休息，讓 California Poppy 隨你的休息時間成長。

React / Vite / TypeScript / Tailwind / React Router / Supabase。

```sh
npm install
cp .env.example .env.local
# 設定 Supabase URL 和 publishable key
npm run dev
npm test
npm run build
```

五個預建 Demo 帳號、無自行註冊。GO/STOP 由 PostgreSQL 伺服器計時並保存，210 分鐘開花是遊戲設計參數。Garden/Profile 目前為組員開發用佔位頁。

設定、SQL、帳號建立與分工見 [TEAM_HANDOFF](docs/TEAM_HANDOFF.md)。Props / hooks / 網路失敗行為見 [INTEGRATION_CONTRACT](docs/INTEGRATION_CONTRACT.md)。

目前不含實際 Supabase 憑證；真實後端與部署須另行驗收。不要提交密碼或 service-role key。

開發時可開啟 `http://localhost:5173/preview`，不需 Supabase 憑證即可查看三個頁面的範例畫面。這個路由只存在於 Vite 開發模式，GO/STOP 僅是本機畫面互動，不會寫入資料庫。

短期公開部署步驟見 [DEPLOY](docs/DEPLOY.md)。Vercel 可提供免費 `*.vercel.app` 網址；正式可用前仍須完成 Supabase 設定與五帳號實機驗收。
