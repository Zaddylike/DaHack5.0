# Outdoor memory branch preview

This feature is developed on `codex/outdoor-memory`. Do not merge it into `main` until the owner accepts the preview.

## What it does

- During a signed-in GO session, **Capture this moment** offers an optional 120-character note, one camera or library photo, and one approximate location. Location is requested only on tap, rounded to two decimal places, and never used to validate break duration.
- The selected image is redrawn as a JPEG before upload, removing original EXIF metadata (including embedded GPS). A 15 MB source limit and 3 MB processed limit apply.
- The draft is kept in the browser's IndexedDB for the current user and session, so a normal reload can restore it. Clearing browser storage removes the draft. Drafts are not synced between devices before STOP.
- STOP first commits the official break through `finish_break`. A nonempty draft is then uploaded to the private Storage bucket and attached to that completed session through `save_break_memory`. A failure leaves the break saved and the local draft available for retry.
- Only completed sessions can receive a memory. The same session ID is used on retry, preventing duplicate memories. Profile → Recent Activity displays successfully saved notes, approximate coordinates, and private photo previews.
- The unauthenticated `/preview` route keeps its local-only garden and has no photo/location upload.

## Supabase setup

Apply `supabase/migrations/202610170002_outdoor_memories.sql` in the project's SQL Editor after the previous migrations. The migration creates `break_memories`, a private `break-memories` Storage bucket, RLS policies, and the `save_break_memory` RPC. Keep the bucket **private**. The browser needs only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; never add a service-role key.

The table uses `session_id` as its primary key and a composite foreign key to the session owner. The RPC gets the owner from `auth.uid()` and requires that the caller's session is completed. Storage policies allow each Demo account to access files only in its own UID folder. Photo files use `<user-id>/<session-id>.jpg` and are downloaded with the signed-in user's authorization, not a public URL.

## Preview and verification

1. Run the SQL migration before using a branch deployment. This additive schema change does not change the current `main` UI.
2. Deploy the feature branch to a Vercel Preview URL; leave Production connected to `main`.
3. On a phone, sign in with one of the existing Demo accounts. GO → Capture this moment → note/photo/location → STOP. Check that Profile shows the same session and memory.
4. Refresh during GO and confirm the local draft is still present. Repeat with location denied and with no optional content; STOP must still work.
5. Disable the network before STOP, then reconnect and retry. Confirm only one completed session and one memory appear.
6. Sign in with another Demo account and confirm it cannot view the first account's memory or photo.

Known MVP limits: there is one memory and one photo per break; saved memories have no edit or delete UI. A location snapshot is not proof that a whole break happened outdoors. Camera and permission prompts vary by browser. Real mobile permissions and cross-account RLS require manual verification with logged-in Demo accounts; do not share passwords in Git or chat.
