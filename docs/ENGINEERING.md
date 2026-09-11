# Gen4Zero engineering loop

Updated: 2026-09-11

This document turns product work into a bounded, inspectable loop that an agent can execute independently while preserving meaningful human control. It adapts the strongest ideas from Market Monitor—risk grading, single sources of truth, shared local/CI gates, release evidence, bounded retry, and last-known-good rollback—to a public generative-art instrument.

## 1. Single sources of truth

| Question | Authoritative location |
| --- | --- |
| Product model, users, features, and roadmap | [`PRODUCT.md`](./PRODUCT.md) |
| Engineering risks, gates, and human/agent boundary | This document |
| Repository-level non-negotiable rules | [`../AGENTS.md`](../AGENTS.md) |
| Release and rollback procedure | [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) |
| Historical release evidence | [`OPERATIONS.md`](./OPERATIONS.md) |
| A material decision and its rejected alternatives | `change-records/` and, when architectural, an ADR |
| Running behavior | Reviewed source, tests, and the deployed commit |

One fact should have one long-term owner. Other documents link to it instead of copying divergent versions.

## 2. The closed loop

```text
Observe → Frame → Classify → Implement → Verify → Preview → Human signal
   ↑                                                        ↓
Learn ← Record ← Live verify ← Publish/rollback ← Decide ←──┘
```

The agent can move autonomously from Observe through Preview within granted scope. Human input is requested at a decision point, not at every implementation step:

- when product intent remains materially ambiguous;
- before merging R2 behavior or any R3 change;
- when visual judgment has more than one defensible answer;
- when evidence conflicts, the scope expands, or the retry budget is exhausted.

Human feedback returns to a concrete artifact: a live preview, recipe URL, exported sample, screenshot, diff, or failed acceptance case. “Looks good?” without a stable object is not an adequate feedback interface.

## 3. Risk classification

Risk is the worst credible consequence, not the number of changed lines.

| Level | Typical change | Required evidence | Human gate |
| --- | --- | --- | --- |
| R0 | Copy, docs, non-behavioral metadata | Targeted check; links; brand terms | Review optional before PR |
| R1 | Controls, accessible states, gallery layout, additive presets | Release gate; affected-flow preview; narrow-screen check when relevant | Inspectable PR before merge |
| R2 | Renderer, seed/recipe semantics, normalization, storage, export, animation clock, performance budget | Change Record; tests for success/failure/bounds; canonical recipes; visual comparison; compatibility note | Approval before merge |
| R3 | DNS/domain, Pages permissions, deployments, external service, upload/auth/telemetry, license boundary, destructive migration | R2 evidence; independent diff review; explicit rollback; least privilege; live smoke test | Explicit approval for the production action |

Cross-level changes use the highest level. A visual restyle becomes R2 if it changes exported artwork or recipe output.

## 4. Definition of Ready

Before implementation, record:

- the user-visible outcome and a short non-goal list;
- affected files and public contracts;
- the risk level and why;
- acceptance checks, including what still needs human visual judgment;
- the last-known-good and rollback path;
- external writes or permissions required;
- a stop condition and a two-attempt retry budget.

R0/R1 can record this in the task or operation entry. R2/R3 use [`templates/CHANGE_RECORD.md`](./templates/CHANGE_RECORD.md).

## 5. Implementation contract

### Determinism and recipes

- Recipe `version` is explicit. Existing fields cannot silently change meaning within a version.
- Seed, normalized parameter values, selected systems, palette, layer relationship, preset, and captured time are part of reproducibility.
- Inputs are bounded before rendering. Unknown enum values fall back to documented defaults; numeric values are clamped; arbitrary HTML or code is never evaluated.
- A breaking semantic change increments the recipe version and includes a migration or a clear incompatibility message.
- Canonical recipes should cover all systems, major aspect-ratio families, layered composition, minimum/maximum parameters, and malformed input.

### Rendering and export

- A renderer must respond meaningfully to shared parameters and must not rely on network state or the wall clock for its initial frame.
- Preview resolution may be reduced for performance; exported dimensions must match the selected preset exactly.
- PNG and recipe exports fail visibly. Video capability is feature-detected and must not block still-image creation.
- New effects need a performance ceiling on a representative laptop and a safe reduction strategy for constrained viewports.

### Privacy and security

- The released allowlist contains only `index.html`, `styles.css`, `app.js`, `og.png`, `CNAME`, `.nojekyll`, and `LICENSE`.
- User work stays in the browser unless a future R3 decision explicitly introduces storage and its privacy model.
- Links opened in a new tab use `rel="noreferrer"`; untrusted recipe data is rendered with text-safe APIs.
- Dependencies are added only when their value outweighs supply-chain and maintenance cost. The current zero-runtime-dependency architecture is intentional.

## 6. Verification ladder

`npm run verify` is the fast local loop. It checks JavaScript syntax, tests, brand/origin contracts, documentation links, credentials, and change policy.

`npm run verify:release` adds a clean allowlisted build and byte-for-byte source/artifact comparison. GitHub Actions runs this same command; CI does not have a weaker alternate definition of success.

Automated checks cannot decide composition quality. When a change affects visible behavior, the review evidence must also include:

1. the exact recipe or interaction path;
2. desktop and narrow-screen observations when layout is affected;
3. still export dimensions and visual inspection when rendering changes;
4. a five-second recording check when motion/export changes;
5. reduced-motion and keyboard behavior when interaction changes.

These remain human review gates until a trustworthy browser visual-regression harness is added. Unimplemented automation must not be described as enforced.

## 7. Human feedback flow

The product links directly to GitHub Issues. Feedback enters through three structured forms:

- **Bug:** expected/actual behavior, browser, recipe, reproduction, and privacy-safe evidence.
- **Visual feedback:** what feels strong or weak, the recipe/view, intended use, and whether the comment is taste or a usability failure.
- **System proposal:** generative logic, parameter behavior, deterministic plan, performance risks, and a sample recipe.

Triage labels each item as defect, accessibility, compatibility, visual judgment, feature request, or out of scope. Repeated evidence changes priority; a single preference does not silently rewrite the visual system. Accepted work receives a risk level and acceptance contract before implementation. Closing the loop means linking the shipped release or clearly recording why the idea was declined.

## 8. Release state machine

| State | Meaning | Minimum evidence |
| --- | --- | --- |
| `FRAMED` | Outcome, risk, and acceptance are explicit | Task or Change Record |
| `IMPLEMENTED` | Source and docs changed | Reviewable diff |
| `VERIFIED` | Shared release gate passes | `npm run verify:release` |
| `PREVIEW_READY` | A human can inspect the actual interaction | Stable local or PR preview plus recipe/path |
| `APPROVED` | Required human gate passed | Review or explicit production instruction |
| `DEPLOYED` | The approved commit was published | Pages deployment tied to commit |
| `LIVE_VERIFIED` | Public origin and core flow work | HTTPS, canonical assets, create/gallery/export smoke test |

States advance only with evidence. A successful command does not prove visual quality; an attractive preview does not prove deterministic compatibility; a deployed artifact is not live-verified until the custom origin works.

## 9. Release and rollback

Only `main` deploys. Pull requests run the same release gate without deployment. The Pages workflow builds `dist/` from the allowlist, preventing repository-only files from leaking into the public artifact.

The rollback unit is a known-good Git commit and its Pages deployment. On a failed release:

1. do not modify generated `dist/` by hand;
2. identify whether failure is source, workflow, GitHub Pages, certificate, or DNS;
3. redeploy the last-known-good commit when users are affected;
4. preserve failing evidence in the operation log;
5. fix forward on a branch and rerun the full gate.

DNS changes are kept separate from visual releases so an application rollback never requires improvising name-service changes.

## 10. Definition of Done

A change is done only when acceptance evidence exists, required automated and human checks pass, docs and operation history are current, no secret or generated artifact is committed, known limitations are explicit, and the live release is verified when publishing was in scope.
