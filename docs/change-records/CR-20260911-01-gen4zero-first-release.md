# CR-20260911-01｜Gen4Zero brand and first public release

- **Status:** Preview ready; deployment pending
- **Owner:** Z4Zero
- **Risk:** R3
- **Human approval:** The product owner explicitly requested publication according to the agreed Gen4Zero brand plan on 2026-09-11. This approval covers creating and publishing the public `hominthesky/gen4zero` repository and configuring `gen4zero.zzao.im`; it does not authorize changes to unrelated repositories, DNS records, accounts, or services.

## Outcome and non-goals

Publish the existing browser-native instrument as **Gen4Zero**, with the canonical tagline “Begin at zero. Shape what emerges.”, a matching social card, an independent open-source repository, and a reliable human/agent release loop.

This change does not add accounts, uploads, analytics, community hosting, remote generation, dependencies, new renderer mathematics, or destructive migration of existing local Gallery data.

## Current evidence

The working instrument already contains six deterministic systems, layered composition, reproducible recipes, practical output presets, PNG/WebM export, and curated/local Galleries. Its previous placeholder identity and `studio.zzao.im` direction no longer match the approved product architecture recorded in the parent Z4Zero strategy.

## Public contracts and risks

- Existing recipe version 1 and rendering behavior remain unchanged.
- Existing local works under `z4zero-generative-works` are read and copied to `gen4zero-works-v1`; the legacy value is not deleted.
- Download names change to the public product name; recipe contents remain JSON.
- Pages publishes only an explicit static allowlist.
- The new public origin requires a single scoped DNS CNAME and GitHub Pages certificate.
- Code remains MIT; curated works and brand marks are not relicensed by implication.

## Implementation

- Rename public UI, metadata, documentation, download names, and repository guidance.
- Use `GEN4ZERO` as the readable wordmark and `Z40` as the compact mother-brand mark.
- Replace the social card with exact approved copy.
- Add visible source/feedback links and structured GitHub issue forms.
- Add shared verification/build scripts, risk policy, operation log, release checklist, and PR evidence template.
- Make pull requests verify without deploying; only `main` publishes an allowlisted artifact.

## Acceptance and verification

Evidence:

- `npm run verify:release` passes locally: five tests, JavaScript syntax, metadata/origin, documentation links, secret scan, change policy, and a seven-file allowlisted build.
- Social card is a visually inspected 1200 × 630 PNG with exact title, tagline, and descriptor.
- The local browser preview loads without console warnings or errors. System selection, seed input, Layer B, TikTok preset, safe zone, and pause/play were exercised successfully in the responsive interface.
- PNG/WebM and complete Gallery persistence remain release/live checks; their underlying rendering behavior was not changed beyond public filenames and the non-destructive storage-key migration.
- The public repository, Pages deployment, custom HTTPS origin, metadata, assets, and feedback links resolve.

Results will be updated only after execution.

## Stop conditions and rollback

Stop after two failures of the same method, any need to alter unrelated DNS, ambiguous repository permissions, conflicting live content, or evidence of data exposure. Before a public known-good exists, local commit `734f28c` is the source rollback. After deployment, roll back by redeploying the last live-verified commit; do not edit generated artifacts or unrelated DNS records.

## Release evidence

Pending verified commit, deployment URL, workflow result, custom-domain check, and operation-log completion.
