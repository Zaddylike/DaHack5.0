# BloomBreak · De Anza Hacks 5.0

> Take a break. Find a little wonder. Grow something.

BloomBreak 把忙碌生活中的短暫休息，變成一場重新發現自然的小冒險。使用者暫時離開螢幕，走出去留意身邊的顏色、聲音與細節；每次完成休息，都會讓自己的 California Poppy 再成長一點。這是我們對 **Nature Life × Modern Life** 的回應：用數位工具提醒人回到真實世界，而不是讓人花更多時間盯著螢幕。

## 目前可體驗的流程

1. 使用預先建立的 Demo 帳號登入，按 **GO** 開始休息。
2. 離開螢幕、接觸身邊的自然；回來後按 **STOP**。完成的時間會安全地存入 Supabase，重新整理後仍在。
3. 累積的正式休息時間推動 California Poppy 經過 **Seed → Sprout → Seedling → Bud → Bloom**。Garden 的 Demo Mode 可快速預覽圖像階段，不會更動正式紀錄。
4. Profile 顯示休息統計、成就、花朵收藏與最近活動。

目前線上展示版的五個累積門檻是 **0、2、5、7、10 分鐘**，方便黑客松期間分段展示；最初的長期遊戲設計目標是 210 分鐘。這些時間都是遊戲參數，並非植物實際生長速度。

## 下一步：Nature Quest

Nature Quest 是規劃中的小冒險功能，**尚未在線上版本推出**。構想是在按 GO 時給一個簡短的觀察任務，例如「找一種今天沒注意過的顏色」；按 STOP 後，使用者可以選擇留下一句發現，並在活動紀錄中回看。即使不填觀察，也能正常完成並儲存休息，避免影響核心計時流程。

## 開發與部署

線上展示：[bloombreak-dahack.vercel.app](https://bloombreak-dahack.vercel.app)。前端使用 React、Vite、TypeScript、Tailwind CSS 與 React Router；登入及資料儲存使用 Supabase Auth、PostgreSQL 和 RLS。只允許五個預建 Demo 帳號登入，不開放自行註冊。

```sh
npm install
cp .env.example .env.local
# 在 .env.local 設定 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
npm test
npm run build
```

不要提交密碼、真實 `.env.local` 或 service-role key。設定方式、SQL Migration 與團隊分工見 [TEAM_HANDOFF](docs/TEAM_HANDOFF.md)；共用資料介面見 [INTEGRATION_CONTRACT](docs/INTEGRATION_CONTRACT.md)；部署方式見 [DEPLOY](docs/DEPLOY.md)。

開發時可用 `http://localhost:5173/preview` 查看不需 Supabase 憑證的範例畫面。這個路由只在 Vite 開發模式存在，GO／STOP 的範例互動不會寫入正式資料。
