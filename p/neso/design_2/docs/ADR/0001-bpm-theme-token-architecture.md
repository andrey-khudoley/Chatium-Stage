# ADR 0001: BPM-first UI with tokenized theme presets

## Status

Accepted

## Date

2026-02-09

## Context

The previous interface used atmospheric visual language but was too airy and oversized for operational BPM work. The redesign had to:

- preserve dark/light atmosphere and glass effects,
- become dense and process-centric,
- support future theme expansion without changing components,
- keep route and shell architecture stable.

## Decision

1. Rebuild the main workspace as BPM-first layout focused on process instances and flow control.
2. Move theme system to preset tokens in `shared/themeCatalog.ts`.
3. Generate runtime global CSS from tokens (`shared/themeStyles.ts`).
4. Keep components style-only through CSS variables (no hardcoded theme branches).
5. Provide four presets (2 base + 2 variants) to validate extensibility.
6. Keep dark/light routes, allow preset switching inside workspace controls.

## Consequences

### Positive

- Data density and scan speed are significantly improved.
- Future themes can be added by extending token presets only.
- Visual identity (night forest / sunrise morning + glass depth) is preserved.
- BPM patterns are explicit: inbox/detail, kanban, timeline, builder, analytics.

### Tradeoffs

- Local RU/EN dictionary currently lives in page-level composition layer.
- Component catalogs still include legacy samples and can be modernized later.

## Follow-up

1. Extract workspace copy into project-wide i18n module.
2. Add persisted user theme settings (preset + density + typography).
3. Split large page composition into dedicated BPM modules (`design/` templates + mock states).
