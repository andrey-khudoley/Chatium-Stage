# Architecture: p/neso/design_2

## Purpose

`design_2` is a clean BPM-first UI module.
It provides reusable blocks for process control interfaces and a token-driven theme system.

## Main principles (from inner/docs)

- one route per file,
- small maintainable files,
- reusable components in `components/`,
- docs kept inside project (`docs/`).

## Route map

| Route | Purpose |
|---|---|
| `/` | Entry page |
| `/web/dark` | BPM workspace (dark) |
| `/web/light` | BPM workspace (light) |
| `/web/dark/components` | BPM component catalog (dark) |
| `/web/light/components` | BPM component catalog (light) |

## Directory structure

```
p/neso/design_2/
├── config/
│   ├── project.tsx
│   └── routes.tsx
├── components/
│   ├── DcDemoSidebar.vue
│   ├── DcGlowDots.vue
│   ├── DcGridLayer.vue
│   ├── DcPageBackground.vue
│   ├── DcPageHeader.vue
│   ├── DcThemeGlobalStyles.vue
│   ├── bpm/
│   │   ├── DcBpmPanel.vue
│   │   ├── DcBpmMetricGrid.vue
│   │   ├── DcBpmProcessInbox.vue
│   │   ├── DcBpmInstanceDetail.vue
│   │   ├── DcBpmKanbanBoard.vue
│   │   ├── DcBpmExecutionTimeline.vue
│   │   ├── DcBpmBuilderStudio.vue
│   │   ├── DcBpmAnalyticsPanel.vue
│   │   ├── DcBpmKnowledgeEditor.vue
│   │   └── DcBpmHeaderControls.vue
│   └── index.ts
├── design/
│   ├── README.md
│   ├── templates/
│   ├── showcase/
│   └── mock/
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── components.md
│   ├── data.md
│   ├── imports.md
│   ├── run.md
│   └── ADR/
├── layout/
│   ├── DcAppShell.vue
│   ├── DcContent.vue
│   ├── DcMain.vue
│   ├── DcSidebarOverlay.vue
│   └── index.ts
├── pages/
│   ├── DesignDemoPage.vue
│   ├── DesignComponentsPage.vue
│   ├── DesignComponentsDarkPage.vue
│   └── DesignComponentsLightPage.vue
├── shared/
│   ├── bpmDemoData.ts
│   ├── bpmI18n.ts
│   ├── bpmTypes.ts
│   ├── demoPageShell.tsx
│   ├── preloader.ts
│   ├── themeCatalog.ts
│   ├── themeStyles.ts
│   ├── logger.ts
│   └── logLevel.ts
├── web/
│   ├── dark/index.tsx
│   ├── light/index.tsx
│   ├── dark/components/index.tsx
│   └── light/components/index.tsx
├── index.tsx
└── README.md
```

## Composition model

`pages/DesignDemoPage.vue` is an orchestrator only:

1. holds route-level state (theme preset, locale, section modes),
2. passes data to reusable section components,
3. does not contain section-specific rendering logic.

## Theming model

- Presets defined in `shared/themeCatalog.ts`.
- Global CSS generated in `shared/themeStyles.ts`.
- Runtime injection through `DcThemeGlobalStyles.vue`.
- Components consume CSS vars only, no hardcoded palette branches.

## Reuse strategy

Every major BPM section is isolated in `components/bpm/*`.
A production project can copy one component with:

- its `.vue` file,
- required type(s) from `shared/bpmTypes.ts`,
- relevant tokens from `shared/themeCatalog.ts` (or local equivalents).
