# 三人協作交接

## 架構與啟動
React + Vite + TypeScript + Tailwind CSS v4 + React Router + Supabase JS。
`npm install` → 複製 `.env.example` 為 `.env.local` → `npm run dev`。
`npm test` 執行 Mock / domain 測試；`npm run build` 檢查 TypeScript 與 production bundle。
Node 建議 22.12+。Vercel 選 Vite，設定兩個同名環境變數；`vercel.json` 支援 SPA 深連結。

- `src/main.tsx`: router、ProtectedRoute、共用導覽與 Login。
- `src/context/AuthContext.tsx`: 共用登入狀態恢復與 authService。
- `src/context/BreakContext.tsx`: 正式休息資料、讀取、GO/STOP、衍生統計。
- `src/context/DemoContext.tsx`: 僅記憶體的 Demo state。
- `src/lib/{growth,statistics,achievements}.ts`: 共用純函式。
- `src/pages/Break.tsx`: 核心計時；Garden/Profile 為佔位。
- `src/api.ts`: 唯一共用資料存取層。
- `supabase/migrations/202610160001_core.sql`: schema、RLS、受控 RPC。

## Supabase 設定
1. 建立 Supabase project，從 Dashboard 複製 Project URL 與 publishable key 至 `.env.local` 的 `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`。前端不得使用 secret/service-role key。
2. 在 SQL Editor 執行 migration 全文一次。不要重複執行；後續 schema 變更新增 migration。
3. Auth 設定啟用 Email/Password，關閉「Allow new users to sign up」。前端也沒有 signup 功能。
4. 在 Authentication → Users → Add user 安全建立五個帳號（3 個開發、2 個展示），自行設定強密碼，必要時 auto-confirm。不要把密碼寫進 SQL、Git、README 或聊天記錄；透過密碼管理器分享。
5. 將五個 auth.users UUID 分別以 slot 1–5 加入 `public.demo_accounts`（Dashboard Table Editor 或 SQL Editor）。slot 範圍與唯一約束最多允許五個帳號存取正式資料。此表沒有瀏覽器存取權限。若須換人，由管理員修改該 slot 的 user_id。
6. Dashboard 建立的五個帳號才可登入；allowlist 同時保護資料，即使誤開 signup 也不能讀寫正式資料。部署前確認 signup 確實關閉。

所有資料表的 user_id 都關聯 auth.users.id。profiles 可依 RLS 更新自己的名稱；break_sessions / flower_progress / flower_collections 僅開放自己的 SELECT，修改只能經驗證 auth.uid() 與 allowlist 的 RPC。前端無法指定 RPC 使用者。正式真實來源是 completed break_sessions，投影表由 STOP transaction 同步；B/C 不需讀取投影表。

## 分工與介面
B: `src/pages/Garden.tsx`，原創 2D 植物、五階段、點擊抖動、階段轉場。C: `src/pages/Profile.tsx`，統計、收藏、成就、Recent Activity。共用 TypeScript 型別、Props、hooks、回呼與精確欄位見 [INTEGRATION_CONTRACT.md](./INTEGRATION_CONTRACT.md)。B/C 不變更 migration、api、context 或成長公式。

## Git 與 PR
A 使用 `feature/core-backend`。A 確認後 push 分支並建立 PR；不直接合併 main。
B/C 在核心 PR 合併後 `git switch main`、`git pull --ff-only`，再分別 `git switch -c feature/garden` / `git switch -c feature/profile`。若需要提前開工，從 A 已推送的核心分支建立各自分支，PR base 暫指核心分支；核心合併後改 base main 並同步。
每個人只提交自己負責檔案，push 自己分支，PR 附畫面、build/test 結果。A review 共用介面再整合。不 force push main；遇衝突先與檔案負責人協調。

## 重新整理、重送、網路
詳見 Integration Contract。GO/STOP 使用 server time；刷新從 DB 還原。STOP 失敗不清除現有 active session，可再次 STOP；若其實已提交，重送仍不會重複累積。離線未送達 STOP 時持續計時，直到線上 STOP 成功；單次最多計入 12 小時。每 15 秒與視窗 focus 同步跨裝置狀態。

## 已知限制與驗收
尚未提供 Supabase project，因此 migration、真實 Auth、RLS/跨帳號隔離、RPC 並行與 Vercel 部署需實際驗收。無 GPS、通知或離線佇列。只有一株花，不循環收集。Demo 不持久化，刷新回 Seed。Garden/Profile 刻意保留佔位。請先由 A 確認本機測試與架構，再進行 GitHub PR/整合。

實機驗收：五帳號成功登入、非名單帳號無資料權限；A/B 看不到彼此紀錄；GO 後刷新恢復；兩個裝置 GO 只一筆；兩次 STOP 只計一次；斷網 STOP 失敗後復網重試；檢查 projection 與 completed sessions 總和相同。

## 本次本機驗證結果
2026-10-16：TypeScript `tsc -b` 與 Vite production build 通過。Vitest Mock/domain tests 通過（包含 route 還原等待/保護、GO/STOP、重複點擊、失敗重試、active session 還原、成長門檻、Demo 隔離與當地日期 streak）。環境沒有 npm executable，因此直接用內建 Node 執行 `node_modules/typescript/bin/tsc -b`、`node_modules/vite/bin/vite.js build`、`node_modules/vitest/vitest.mjs run`，沒有執行 npm 指令本身。

依賴以 pnpm 安裝並附 `pnpm-lock.yaml`；團隊可使用 `pnpm install --frozen-lockfile` / `pnpm dev` / `pnpm test` / `pnpm build` 取得一致版本。npm 也支援 package.json scripts，但目前未產生 package-lock.json。pnpm install 曾因 esbuild lifecycle 未核准而回傳非零，實際安裝的 binary 已經通過 Vite build；`pnpm-workspace.yaml` 明確停用該 lifecycle。沒有執行真實後端測試，也沒有推送、建立 PR 或合併 main，等待 A 確認架構與結果。

## 本機畫面預覽
啟動 `pnpm dev` 後開啟 `/preview`。此頁只在開發模式提供，使用範例資料與本機計時，方便 A/B/C 邊開發邊確認畫面；正式資料仍需由登入後 `/break` 測試。`src/Preview.tsx` 由 A 維護。
