# Gen4Zero release checklist

Use this checklist for every public release. Domain, DNS, repository access, workflow permissions, and new external services are R3 changes.

## Before merge

- [ ] Outcome, non-goals, risk level, acceptance evidence, stop condition, and rollback are recorded.
- [ ] R2/R3 work has a current Change Record and required human approval.
- [ ] `npm run verify:release` passes without bypasses.
- [ ] The diff contains no unrelated changes, debug code, credentials, machine paths, or tracked `dist/`.
- [ ] Recipe/version compatibility is unchanged or explicitly migrated.
- [ ] Affected layouts, keyboard states, reduced motion, renderers, exports, and local Gallery have the required human checks.
- [ ] Social metadata uses the canonical HTTPS origin and the 1200 × 630 card contains the exact current brand copy.

## Publish

- [ ] Merge or push the reviewed commit to `main`.
- [ ] Confirm the Pages workflow verified and deployed that commit.
- [ ] Keep `CNAME` equal to `gen4zero.zzao.im`.
- [ ] Keep DNS limited to `gen4zero CNAME hominthesky.github.io`; do not alter unrelated `zzao.im` records.
- [ ] Enable HTTPS only after GitHub provisions the certificate; never disable HTTPS to conceal a certificate or DNS failure.

## Live verification

- [ ] `https://gen4zero.zzao.im/` returns successfully over HTTPS.
- [ ] Canonical metadata and `https://gen4zero.zzao.im/og.png` resolve.
- [ ] Create view renders a moving canvas and six systems.
- [ ] Seed change, reset, palette, Layer B, canvas preset, pause/play, and safe zone respond.
- [ ] PNG dimensions match the selected preset; recipe JSON and recipe URL reload safely.
- [ ] Gallery opens, a curated recipe loads, and a local save remains on the device after refresh.
- [ ] Unsupported WebM recording fails visibly rather than breaking the page.
- [ ] Feedback and source links resolve to `hominthesky/gen4zero`.
- [ ] Commit, deployment result, observations, limitations, and rollback candidate are recorded in [`OPERATIONS.md`](./OPERATIONS.md).

## Rollback

If a required check fails and users are affected, redeploy the last-known-good commit. Do not edit the Pages artifact or DNS as an ad hoc code rollback. If DNS or certificate setup itself fails, keep the default GitHub Pages URL available, revert only the new `gen4zero` record when necessary, and preserve unrelated `zzao.im` records.
