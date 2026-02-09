# p/neso/design_2 - BPM-first design system

BPM-first redesign of the NeSo workspace focused on process instances, stage flow, SLA control, rules, automation and analytics.

## Routes (relative to `/p/neso/design_2`)

- `/` - entry page with theme selection and links
- `/web/dark` - BPM workspace in dark mode (night forest atmosphere)
- `/web/light` - BPM workspace in light mode (sunrise atmosphere)
- `/web/dark/components` - component catalog (dark)
- `/web/light/components` - component catalog (light)

## What changed

- Full UI rebuild toward dense, process-oriented operations layout.
- App shell and dashboard now center on BPM entities: process inbox, instances, stages, timeline, rule builder, automation queue, analytics.
- Theme system moved to token presets: components consume CSS variables only.
- Preset architecture supports extending themes without changing component code.
- Added additional preset variants to validate extensibility (`midnight-pine`, `misty-daybreak`).
- Added RU/EN localization switches in the workspace shell.

## Theme architecture

Source of truth:

- `shared/themeCatalog.ts` - preset definitions and token maps
- `shared/themeStyles.ts` - global style generation from tokens
- `components/DcThemeGlobalStyles.vue` - runtime style injection for selected preset

Theme presets shipped now:

- Dark base: `forest-night`
- Dark variant: `midnight-pine`
- Light base: `sunrise-leaf`
- Light variant: `misty-daybreak`

## Key files

- `pages/DesignDemoPage.vue` - BPM workspace composition
- `components/DcDemoSidebar.vue` - compact process navigation
- `components/DcPageHeader.vue` - dense control header
- `layout/DcAppShell.vue` - app shell and layers
- `docs/architecture.md` - architecture notes
- `docs/ADR/0001-bpm-theme-token-architecture.md` - architecture decision record

## Stack

Chatium, Vue 3, TypeScript, CSS variables, FontAwesome, Google Fonts (Mulish, Old Standard TT).
