# p/neso/design_2 - BPM-first UI kit

Clean BPM-first design module for Chatium.
The project contains only reusable UI blocks and route pages related to the redesigned process workspace.

## Scope

- BPM workspace (not CRM-first): process inbox, flow instances, stages, SLA, rules, automation, analytics.
- Theme system with token presets.
- Component catalog built from the same reusable BPM blocks.

## Routes

- `/` - entry and navigation to workspace/catalog.
- `/web/dark` - BPM workspace in dark mode.
- `/web/light` - BPM workspace in light mode.
- `/web/dark/components` - BPM component catalog (dark preset).
- `/web/light/components` - BPM component catalog (light preset).

## Reusable components (copy-ready)

Core shell:

- `layout/DcAppShell.vue`
- `layout/DcMain.vue`
- `layout/DcContent.vue`
- `components/DcDemoSidebar.vue`
- `components/DcPageHeader.vue`

Visual layer:

- `components/DcThemeGlobalStyles.vue`
- `components/DcPageBackground.vue`
- `components/DcGridLayer.vue`
- `components/DcGlowDots.vue`

BPM sections:

- `components/bpm/DcBpmPanel.vue`
- `components/bpm/DcBpmMetricGrid.vue`
- `components/bpm/DcBpmProcessInbox.vue`
- `components/bpm/DcBpmInstanceDetail.vue`
- `components/bpm/DcBpmKanbanBoard.vue`
- `components/bpm/DcBpmExecutionTimeline.vue`
- `components/bpm/DcBpmBuilderStudio.vue`
- `components/bpm/DcBpmAnalyticsPanel.vue`
- `components/bpm/DcBpmKnowledgeEditor.vue`
- `components/bpm/DcBpmHeaderControls.vue`

## Theme architecture

Single source of truth:

- `shared/themeCatalog.ts` - theme presets + token maps.
- `shared/themeStyles.ts` - global CSS generation from tokens.
- `components/DcThemeGlobalStyles.vue` - runtime injection/update.

Shipped presets:

- `forest-night` (dark base)
- `midnight-pine` (dark variant)
- `sunrise-leaf` (light base)
- `misty-daybreak` (light variant)

## Supporting files

- `shared/bpmI18n.ts` - RU/EN copy dictionary.
- `shared/bpmTypes.ts` - reusable types for section props.
- `shared/bpmDemoData.ts` - demo datasets for workspace/catalog.

## Docs

- `docs/architecture.md`
- `docs/api.md`
- `docs/data.md`
- `docs/imports.md`
- `docs/run.md`
- `docs/components.md`
- `docs/ADR/0001-bpm-theme-token-architecture.md`

## Current status

- Legacy CRM-like component set removed from this module.
- Workspace page is now composition-only: all major visual sections extracted to reusable components.
- Catalog page demonstrates only the new BPM component set.
