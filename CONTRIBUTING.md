# Contributing

Generative Studio is designed to be remixed. Small, legible systems are preferred over opaque effects or large dependencies.

## Add a system

1. Add its identity to `patterns`.
2. Implement a deterministic renderer with the same signature as the existing drawers.
3. Register it in `drawers` and expose it as both a primary and secondary system.
4. Add a compact thumbnail treatment and one curated recipe.
5. Confirm the same recipe renders the same starting frame after a reload.

## Design constraints

- Keep the core usable without a login, network request, or build step.
- Treat seeds and recipes as public interfaces; avoid breaking existing links.
- Controls must be keyboard accessible and usable on narrow screens.
- Do not add a visual effect unless it responds meaningfully to the shared parameters.
- Keep public curation separate from device-local saves.

## Before opening a pull request

Run `npm test`, describe the visual behavior you added, and include at least one recipe JSON object that demonstrates it.
