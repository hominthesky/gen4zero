# Gen4Zero engineering rules

Gen4Zero is a public, browser-native generative instrument. Human maintainers and coding agents must read [`docs/PRODUCT.md`](./docs/PRODUCT.md) and [`docs/ENGINEERING.md`](./docs/ENGINEERING.md) before changing behavior. Publishing work must also use [`docs/RELEASE_CHECKLIST.md`](./docs/RELEASE_CHECKLIST.md).

## Non-negotiable boundaries

- Keep the core instrument local-first: no account, upload, analytics, fingerprinting, hidden network request, or remote execution without an approved product decision.
- Seeds and recipes are public compatibility contracts. The same supported recipe version, seed, parameters, canvas, and time must return to the same starting composition.
- Unknown or malformed recipe values must be rejected or normalized within documented bounds; never pass untrusted recipe values into HTML or executable code.
- Browser storage may contain recipes and local gallery state only. Do not collect personal data or silently migrate it to a server.
- `dist/` is generated from an explicit allowlist and is never the source of truth. Do not edit or commit it.
- Never commit credentials, tokens, private keys, unpublished user works, browser profiles, logs, or machine-specific paths.
- Code, curated artworks, and the Gen4Zero/Z4Zero brand have different rights. Do not imply that the MIT software license grants rights to gallery works or marks.
- Preserve unrelated human changes. Do not weaken or skip a failing gate to obtain a green release.

## Risk levels

- `R0`: copy, documentation, comments, and metadata that do not change behavior. Run the relevant fast checks.
- `R1`: UI behavior, accessible states, non-semantic styling, gallery presentation, and additive presets. Run the release gate and review the affected flow.
- `R2`: renderer algorithms, recipe schema or normalization, determinism, storage migration, export formats, animation timing, or performance limits. Create a Change Record, add regression evidence, work on a branch, and obtain human review before merge.
- `R3`: domain/DNS, Pages permissions, deployment topology, third-party services, uploads, authentication, telemetry, license boundaries, destructive migrations, or public production changes. R2 rules apply, plus explicit human approval and a tested rollback.

When uncertain, use the higher level. A small diff can still be R2 or R3.

## Required loop

1. Define the intended user outcome, scope, non-goals, acceptance evidence, risk level, stop conditions, and rollback.
2. Inspect current behavior and the authoritative document before designing a second solution.
3. Make the smallest coherent change. If scope or permissions expand, stop and reclassify.
4. Run `npm run verify` while iterating and `npm run verify:release` before review or release.
5. Review the diff for unrelated files, debug remnants, credentials, generated artifacts, compatibility changes, and undocumented limitations.
6. Update the authoritative document and [`docs/OPERATIONS.md`](./docs/OPERATIONS.md). R2/R3 changes also update a file in `docs/change-records/`.
7. Present a stable preview and concrete evidence for human feedback. Do not ask for approval based only on an implementation summary.
8. Merge or publish only with the authority required by the risk level. Verify the live origin, assets, interaction path, and deployed commit; otherwise roll back to last-known-good.

The same failed method may be retried once. After two failures, conflicting evidence, a new permission requirement, or a higher-risk discovery, stop and ask for a human decision.

## Agent authority

Agents may autonomously inspect, design, implement, document, and locally validate in-scope R0/R1 work. They may prepare R2/R3 changes and review evidence, but must not silently merge, change DNS or repository access, enable external data flows, or publish publicly. A user instruction that explicitly requests a named production action supplies authority only for that action and does not remove the verification or rollback gates.
