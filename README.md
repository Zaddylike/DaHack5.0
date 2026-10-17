# Mori · De Anza Hacks 5.0

> Take a break. Find a little wonder. Grow something.

Mori 把忙碌生活中的短暫休息，變成一場重新發現自然的小冒險。使用者暫時離開螢幕，走出去留意身邊的顏色、聲音與細節；每次完成休息，都會讓自己的 California Poppy 再成長一點。這是我們對 **Nature Life × Modern Life** 的回應：用數位工具提醒人回到真實世界，而不是讓人花更多時間盯著螢幕。

## 目前可體驗的流程

1. 使用預先建立的 Demo 帳號登入，按 **GO** 開始休息。
2. 外出時間每累積 5 分鐘，就由伺服器發放一顆隨機種子；例如兩次分別 3 與 2 分鐘也能得到一顆，不必等 STOP 才領取。
3. 在 Garden 的種子清單選擇一顆種下。已種下的花會隨已完成的休息時間經過 **Seed → Sprout → Seedling → Bud → Bloom**，累積 10 分鐘開花。開花會返還一顆同種類種子。
4. 按 **STOP** 結束休息，正式紀錄與花園資料儲存於 Supabase；Profile 顯示統計、成就、收藏與最近活動。免登入預覽版資料僅存於該瀏覽器。
5. 在正式登入版的 GO 計時期間，可選擇「記錄此刻」：寫最多 120 字、拍一張照片或從相簿選取，並主動加入約略位置。STOP 先儲存休息，再附加這份私人紀錄；略過或上傳失敗都不影響休息、種子與植物生長。Profile 的 Recent Activity 顯示已成功儲存的內容。

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

不要提交密碼、真實 `.env.local` 或 service-role key。正式種子功能須先執行 `supabase/migrations/202610170001_cloud_seed_garden.sql`；戶外紀錄功能再執行 `supabase/migrations/202610170002_outdoor_memories.sql`；種植時間修正接著執行 `supabase/migrations/202610170004_planting_time.sql`，讓植物只計入種植後完成的休息秒數。再部署新版前端。照片存放於私人 Supabase Storage bucket `break-memories`，上傳前會轉成不含原始 EXIF 的 JPEG；文字、約略位置及照片路徑在 `break_memories`，均受登入權限及 RLS 保護。設定方式、SQL Migration 與團隊分工見 [TEAM_HANDOFF](docs/TEAM_HANDOFF.md)；共用資料介面見 [INTEGRATION_CONTRACT](docs/INTEGRATION_CONTRACT.md)；部署方式見 [DEPLOY](docs/DEPLOY.md)。

開發時可用 `http://localhost:5173/preview` 查看不需 Supabase 憑證的範例畫面。這個路由只在 Vite 開發模式存在，GO／STOP 的範例互動不會寫入正式資料。
