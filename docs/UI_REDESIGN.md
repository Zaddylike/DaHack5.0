# Mori UI prototype — outdoor time

All work stays on `jc-ui-prototype`; no database or authentication contract changes.

Run `pnpm dev`, open `/login`, then choose “先体验” / “Try it out”. The `/preview` experience stores data locally; it does not authenticate or write to Supabase. The save panel labels local versus cloud storage.

## Experience

- Minimal botanical login and a six-part, first-visit story about spending time outdoors.
- Metal timer: start when leaving, finish on return. MM:SS becomes HH:MM at one hour. No GPS validation. Existing 12-hour session cap retained.
- Persistent Chinese/English switch, including onboarding, timer, garden, guide, save controls and errors. Hints appear once and dismiss automatically.
- Real Three.js garden: modeled house, natural terrain, instanced grass, thin 3D petals, varied flower placement, four-band botanical lighting and directional shadows.
- Grass and flowers sway in a shared wind field. Rendering is capped at 30 fps and pauses for hidden/offscreen views. Reduced-motion preference disables continuous wind animation.
- Drag the scene to rotate. Click a flower or the current-flower shortcut to inspect it. Pinch/wheel zoom enters/leaves detail. Detail has previous/next controls and swipe on its information area.
- The first local flower reaches bloom after 600 cumulative completed seconds; later flowers require a new seed. The prototype cycles five species and displays up to 100 flowers in the overview. Existing flower positions remain stable as new flowers appear. All records remain navigable in detail.
- Local name, four device finishes, field guide, JSON import/export, confirmed reset and an optional 30-flower demo preset.

## Data boundaries

Local progress remains under `bloombreak-local-v1`; the language preference uses `bloombreak-language`. Per-account UI preferences are separate. Official accounts retain existing Supabase auth/start/finish RPCs and support one California poppy. Multi-flower server persistence and username authentication are not implemented.

`src/redesign/` contains the active UI. `Garden3D.tsx` owns the scene, `Meadow.ts` owns terrain and instanced wind-blown grass, and `Language.tsx` handles localization. Three.js is lazy-loaded so the login and timer do not fetch the 3D bundle. Old page components remain available for teammates.

## Verification

TypeScript, production build and 46 tests pass. Tests cover the original core, time formatting, import validation, duration limits, onboarding persistence, timer refresh/navigation, device finish, language persistence, stable flower placement, clear entry path, grass resource cleanup, five growth thresholds and old local-save migration.

Browser checks verified the initial 3D scene and English detail before the subsequent meadow/wind revision. The latest meadow shader and wind appearance have NOT been visually verified: browser approval review hit an account usage limit. Native pinch and live Supabase also remain unverified.


## Five-stage flowers
Growth uses cumulative completed outdoor-break seconds. The five game milestones are 0, 120, 300, 420, and 600 seconds (0/2/5/7/10 minutes), matching `src/lib/growth.ts`. The ten-minute bloom is a game parameter, not a botanical claim. Botanical sowing-to-flowering references remain linked in the field guide for education only and do not set the game timer.

Visual phases: seed 0–20%, sprout 20–50%, seedling 50–70%, closed bud 70–100%, bloom at completion. These proportions are artistic pacing. Leaves vary by species; petals are curved thin surfaces, with asymmetric rims and modeled centers. Guide phase buttons preview geometry without editing saved time or unlocking plants.

Local gardens carry surplus seconds into the next species in the existing five-species rotation. Preview progress is credited on STOP; the running timer only displays elapsed time. Existing local saves with growth beyond ten minutes are migrated into completed flowers plus remaining seconds. The 30-flower demo uses the sum of species durations. Cloud UI still supports one California poppy and derives its progress from total recorded seconds; backend projection rules are unchanged. Existing 12-hour session cap remains.

## Seed loop (local prototype)
The local preview now stores explicit species for mature plants, a single growing plant, five seed counts, and a per-session credited-seconds checkpoint. Each full 3600 seconds in the same outing grants one uniformly mixed pseudo-random species; partial hours do not carry between outings. Session/hour-based selection is stable across reloads and React updater retries. Rewards and growth settle on STOP, capped by the existing 12-hour session limit. A bloom returns one matching seed once and leaves the planting slot empty; choose the next seed from the garden seed bag. Time without an active plant still counts outdoors but is not banked for later growth. A starter plant is retained for new saves. Legacy flowers and partial growth migrate, granting one matching seed for each existing mature flower; historical hourly drops are not reconstructed because previous session boundaries were not stored. Imports validate inventory and reset the session checkpoint when stopping imported timers. Demo flowers do not fabricate outdoor time or reward drops. Cloud accounts retain their existing one-plant flow; seed inventory is currently local preview only.
