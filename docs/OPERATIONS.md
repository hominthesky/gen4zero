# Gen4Zero operation log

This is the chronological evidence trail. It records what actually happened; product and engineering rules remain in their authoritative documents.

## 2026-09-11｜Gen4Zero brand and first public release

- **Reason:** Establish the first Z4Zero product as a reusable browser-native generative instrument and publish it at a durable product origin.
- **Risk:** R3 because the change includes a public repository, GitHub Pages workflow, custom domain, DNS, and release permissions. Renderer behavior remains unchanged; local Gallery storage receives a non-destructive key migration.
- **Scope:** Rename the public product to Gen4Zero; apply the approved tagline and descriptors; refresh social preview; align downloads and storage; add a feedback path; add risk-graded agent/human engineering governance; build Pages from an explicit allowlist.
- **Approval:** The product owner explicitly requested publication under the agreed brand plan on 2026-09-11.
- **Current state:** `PREVIEW_READY`; the shared release gate passed and the local product preview loaded without console warnings or errors. System selection, seed entry, Layer B, TikTok preset, safe zone, and pause/play were exercised successfully. Remote publication, DNS, HTTPS, and live export checks remain pending.
- **Rollback candidate:** Commit `734f28c` is the pre-rebrand local baseline. A public last-known-good will be recorded after the first successful deployment.
- **Evidence:** See [`change-records/CR-20260911-01-gen4zero-first-release.md`](./change-records/CR-20260911-01-gen4zero-first-release.md).
- **Pre-publication corrections:** Full-history change checks, PR/production concurrency isolation, least-privilege deployment, and promotion of the verified artifact. Added executable renderer/recipe/storage regression tests; repaired prototype-name and value-coercion handling and quota-safe migration. Browser export verification remains incomplete; prior automation timed out and must not be counted as a passing export test.
- **Final acceptance preparation:** Added a repeatable isolated-browser smoke script. Corrected compact Z40 mark alignment, disclosed preview-resolution WebM separately from full-resolution PNG, and added visible recording failure handling. Native browser automation failed twice at screen capture; isolated Playwright is the fallback and its result is recorded separately. Corrected README deployment guidance to distinguish the allowlisted artifact from source and the Pages custom-domain setting from `CNAME`.
- **Browser acceptance:** Isolated Chrome passed all six renderer nonblank checks, a 1080 × 1920 PNG, a downloaded/decoded 1080 × 1920 WebM, local Gallery save/refresh/load, JSON and URL recipe round-trips, no page errors, and no horizontal overflow at 390 px. Desktop (1440 × 960) and narrow-screen screenshots were visually inspected. These are real browser smoke checks, not cross-browser parity or pixel-regression guarantees.
