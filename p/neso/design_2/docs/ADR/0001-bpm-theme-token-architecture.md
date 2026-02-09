# ADR 0001: BPM-first UI with tokenized theme presets

## Status

Accepted

## Date

2026-02-09

## Context

The previous UI module mixed BPM goals with oversized generic dashboard patterns.
We needed a clean, production-transferable BPM-first component set with preserved visual atmosphere.

## Decision

1. Rebuild workspace around BPM entities: flow instances, stages, SLA, rules, automation.
2. Keep page files thin and move section rendering into reusable `components/bpm/*` files.
3. Standardize theming as token presets (`shared/themeCatalog.ts`) consumed via CSS vars only.
4. Ship dark/light base presets plus two variants to validate extensibility.
5. Keep catalog routes and show only the new BPM component set.

## Consequences

### Positive

- Higher data density and better scan speed for operations.
- Components are copy-ready and independent.
- Theme extension no longer requires component code changes.

### Tradeoffs

- Workspace remains demo-data driven (no backend integration in this module).
- RU/EN dictionary is local to this module and can be moved to global i18n later.

## Follow-up

1. Add persistent user theme settings.
2. Move RU/EN dictionary to shared platform i18n layer.
3. Add automated visual regression checks for presets.
