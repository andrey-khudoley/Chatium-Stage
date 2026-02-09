# BPM-first Design Spec v3

## 1. Product direction

The interface is a unified BPM control workspace, not a CRM shell.
Primary UX objects:

- process definitions
- flow instances
- stages and transitions
- SLA and risk indicators
- rules and automation
- bottleneck analytics

## 2. Visual language

Atmosphere is preserved from previous design:

- dark mode: night forest depth
- light mode: morning clarity
- glass and transparent layers
- subtle glow and soft shadows

Data readability has priority over decorative effects.

## 3. Density standard

Workspace density is optimized for operations:

- compact header controls
- compact sidebar navigation
- table row modes (`compact`, `standard`, `audit`)
- reduced section paddings with strict visual hierarchy

## 4. Mandatory BPM blocks in workspace

1. App shell with process navigation.
2. Process inbox (instances table with status/stage/SLA/owner).
3. Instance detail panel.
4. Kanban stage board.
5. Execution timeline.
6. Flow/rules/automation builder.
7. Process analytics with chart modes.
8. Knowledge editor with Markdown + WYSIWYG layout.

## 5. Theme architecture

Theme = token preset. Components use CSS variables only.

Token source:

- `shared/themeCatalog.ts`
- `shared/themeStyles.ts`
- `components/DcThemeGlobalStyles.vue`

Shipped presets:

- `forest-night` (dark base)
- `midnight-pine` (dark variation)
- `sunrise-leaf` (light base)
- `misty-daybreak` (light variation)

Future custom theme editor can save new presets without component changes.

## 6. Localization

Workspace supports RU/EN copy switching in shell controls.

## 7. Extensibility

`design/` folder is reserved for template compositions, showcase states and mock data:

- `design/templates`
- `design/showcase`
- `design/mock`

Production components remain independent from `design/`.
