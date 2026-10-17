# Daily Mail

The Garden mailbox adds one quiet anonymous exchange per UTC calendar day. It is available to the existing invited demo accounts; local /preview displays the mailbox with a sign-in explanation and never fabricates another user's photo.

## Flow
- Private photo capture and memory saving remain unchanged. After a photo is saved, a separate Share / Keep Private choice appears. Closing the dialog is not consent.
- Sharing downloads the user's saved private photo and uploads an independent JPEG under a random share ID in the private daily-mail bucket. Publication happens only after upload succeeds. Neither account ID, source session ID, note nor location is returned to the recipient.
- The garden claims at most one letter per recipient/day, excluding self and unpublished/withdrawn photos. Each photo goes to at most one recipient. The pool includes photos shared today (UTC); an empty pool can be retried later. Refreshing does not reroll an assigned letter, even if it was subsequently withdrawn.
- Open the letter to see photo, completed walk minutes and share date. Thanks is idempotent. The sender receives only a boolean notification, never a count or recipient identity.
- Mailbox > Send a little nature lists saved photos and lets the owner share later or withdraw a published share. Withdrawal prevents new downloads and allocations; it cannot erase a photo someone has already viewed or saved. A withdrawn photo cannot be republished from the same session.

## Apply to Supabase
Apply supabase/migrations/202610170003_daily_mail.sql after 202610170002_outdoor_memories.sql. Deploy the corresponding frontend afterward. Do not make the daily-mail bucket public. The application needs only its existing publishable key; no service-role key is added to the browser.

The SQL migration must be applied to the live Supabase project before signed-in mailboxes can work. Until then, signed-in mailbox requests display an unavailable state; the core timer, growth and private memories continue independently. Verify using two invited test accounts: A saves a photo and selects Share; B opens Garden and receives it; B sends thanks; A returns to Garden and opens the mailbox to see the acknowledgement. A can then withdraw it; B must no longer be able to download it. Also test Keep Private, empty pool, same-account exclusion, reload, and a UTC day rollover.

## Verification
- UI tests cover explicit opt-in, Keep Private, upload/publish error feedback, open/thanks states, empty pool and local-preview isolation.
- scripts/test-daily-mail.mjs runs the actual migration against a disposable PGlite PostgreSQL instance with mocked Supabase auth/storage schemas. Install @electric-sql/pglite into a temporary directory, then run `node scripts/test-daily-mail.mjs <absolute path to that package's dist/index.js>`. This verifies SQL execution, ownership, photo RLS, anonymous payloads, deterministic daily assignment, one recipient per photo, idempotent thanks and withdrawal. It does not replace live Supabase Storage integration testing or a concurrent-request load test.
- The live recipient view and photo transfer require the migration and two accounts. Local browser inspection verifies the Garden mailbox layout and sign-in explanation only.

## Current scope
No usernames, followers, comments, counters or public feed. The pool is restricted to the existing invited demo audience; open public registration and moderation are outside this change. An unshared uploaded copy is never eligible for delivery. Failed uploads/publications can be retried. Routine cleanup of old undelivered copies is not yet automated.
