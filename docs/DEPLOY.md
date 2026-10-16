# 一週公開展示：Vercel + Supabase

Vercel 免費 Hobby 專案會提供 `*.vercel.app` 公開網址，不需要購買網域。BloomBreak 仍以 Supabase Auth + RLS 保護五個 Demo 帳號的資料。正式部署不包含本機 `/preview` 範例頁。

## 需要的帳號

- Vercel 帳號（可用 GitHub 登入）。
- Supabase 帳號與一個 Free project。

## 順序

1. 在 Supabase Dashboard 建立 project。把 Project URL 與 **publishable key** 保存到本機 `.env.local`，分別對應 `VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`。前端不得使用 secret/service-role key。
2. 在 SQL Editor 執行 `supabase/migrations/202610160001_core.sql`。
3. 在 Auth 設定開啟 Email + Password，關閉公開註冊。在 Dashboard 安全建立五個帳號，並把各帳號 UUID 指派到 `public.demo_accounts` slot 1–5。密碼不要放進 Git 或聊天訊息。
4. 在本機以五個帳號之一測試登入、GO、刷新、STOP、Garden、Profile；再用另一帳號確認資料隔離。
5. 在 Vercel 建立專案，匯入 GitHub 上已審核的功能分支，或以 Vercel CLI 從本機目錄部署；不要合併 main 才能部署。Framework 選 Vite，Build Command `npm run build`，Output Directory `dist`。在 Vercel Project Settings → Environment Variables 設定兩個 `VITE_` 變數，然後重新部署。這兩個是瀏覽器公開設定，不是秘密；絕不放 service-role key。
6. Vercel 會顯示實際 `*.vercel.app` 網址。打開該網址，驗證五帳號登入、資料隔離、GO/STOP、刷新後資料還在，以及 `/garden`、`/profile` 深連結可用。

## 一週後

在 Vercel Dashboard 移除或停用該專案後，公開網址即不再服務。若 Demo 帳號不再使用，請在 Supabase Dashboard 停用或刪除帳號與專案；先匯出你需要保留的資料。刪除專案或資料通常不可復原，請由專案擁有者確認後操作。Supabase Free project 可能因活動量低而自動暫停，不能把它當成精確的一週自動到期機制。

## 目前狀態

本機程式可 build、Mock 測試通過；尚無 Supabase 專案 URL / publishable key、沒有執行 migration 與實際五帳號驗收，也尚未登入 Vercel 或取得公開 URL。請不要把本機 `127.0.0.1` 網址當成公開網站。
