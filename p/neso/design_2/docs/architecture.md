# Architecture: p/neso/design_2

## Goal

`design_2` is a BPM-first UI module. It is not CRM-first. Core entities are process flows, flow instances, stages, SLA, rules and automation.

## Route map

| Route | Purpose |
|---|---|
| `/` | Entry page and theme chooser |
| `/web/dark` | BPM workspace, dark mode |
| `/web/light` | BPM workspace, light mode |
| `/web/dark/components` | Component catalog, dark mode |
| `/web/light/components` | Component catalog, light mode |

## Structure

```
p/neso/design_2/
├── config/
│   ├── project.tsx
│   └── routes.tsx
├── docs/
│   ├── architecture.md
│   ├── CHECKLIST-STAT-CARD-BACKGROUND.md
│   └── ADR/
│       └── 0001-bpm-theme-token-architecture.md
├── design/
│   ├── README.md
│   ├── templates/
│   │   └── BpmWorkspaceTemplate.md
│   ├── showcase/
│   │   └── workspace-states.md
│   └── mock/
│       └── bpmStates.ts
├── layout/
│   ├── DcAppShell.vue
│   ├── DcMain.vue
│   ├── DcContent.vue
│   ├── DcMainGrid.vue
│   ├── DcPageSection.vue
│   ├── DcSidebarOverlay.vue
│   └── index.ts
├── components/
│   ├── DcThemeGlobalStyles.vue
│   ├── DcPageBackground.vue
│   ├── DcGridLayer.vue
│   ├── DcGlowDots.vue
│   ├── DcDemoSidebar.vue
│   ├── DcPageHeader.vue
│   └── ...
├── pages/
│   ├── DesignDemoPage.vue
│   ├── DesignComponentsDarkPage.vue
│   └── DesignComponentsLightPage.vue
├── shared/
│   ├── demoPageShell.tsx
│   ├── preloader.ts
│   ├── themeCatalog.ts
│   ├── themeStyles.ts
│   ├── logLevel.ts
│   └── logger.ts
├── web/
│   ├── dark/
│   │   ├── index.tsx
│   │   └── components/index.tsx
│   └── light/
│       ├── index.tsx
│       └── components/index.tsx
├── index.tsx
└── README.md
```

## BPM workspace composition

`pages/DesignDemoPage.vue` composes the app using:

1. `DcAppShell` for the layered shell.
2. `DcDemoSidebar` for process navigation.
3. `DcPageHeader` for dense top controls (locale + theme preset switch).
4. Main workspace sections:
- process inbox table + detail panel
- stage kanban
- execution timeline
- flow/rules/automation builder
- analytics dashboard with chart modes
- markdown + wysiwyg editor area

## Theme system

Theme mode (`dark`/`light`) and preset are independent concepts.

- Mode decides base family (`dark` or `light`).
- Preset picks concrete token values.
- Components do not branch on colors; they consume CSS vars only.

Token source:

- `shared/themeCatalog.ts` defines presets and tokens.
- `shared/themeStyles.ts` converts tokens to global CSS.
- `DcThemeGlobalStyles.vue` injects styles and updates on preset change.

Current presets:

- `forest-night` (dark base)
- `midnight-pine` (dark variant)
- `sunrise-leaf` (light base)
- `misty-daybreak` (light variant)

This enables future user-generated themes without component edits.

## i18n

Workspace-level RU/EN localization is implemented in the page composition layer (`DesignDemoPage.vue`) via a local dictionary. The architecture can be replaced by project-wide i18n later without changing component styling.

## Layering

Visual layers are stable and token-driven:

1. `DcPageBackground` (base gradients)
2. `DcGridLayer` (subtle process grid)
3. `DcGlowDots` (ambient depth)
4. Shell content and panels

Effects (glass, blur, glow) remain secondary to data readability.
