# Design System

## Goals
- Provide a reusable enterprise UI layer for CRM pages.
- Keep backend behavior unchanged.
- Support long-term module growth.

## Token Model
Runtime tokens are defined in `shared/design/system.ts` and applied as CSS variables.

Core token groups:
- surfaces: `bg`, `bgAlt`, `surface`, `surfaceRaised`
- typography colors: `text`, `textMuted`, `textDim`
- semantic accents: `accent`, `accentStrong`, `accentSoft`
- semantic states: `success`, `warning`, `danger`, `info`
- structure: `border`, `borderStrong`, `shadow`

## Themes
Six presets are shipped:
- `midnight-ops`
- `forest-grid`
- `graphite-amber`
- `violet-pulse`
- `linen-pro`
- `sand-contrast`

Dark mode is default.

## Runtime Customization
`useDesignSystem()` provides UI-level controls for:
- theme preset
- density and table density
- chart visual mode
- radius/shadow/element scale
- manual color overrides
- typography roles (heading/body/tables/forms/navigation)
- preloader enabled/disabled state

Preferences are persisted via cookies.

## Typography
- One default font + 20 additional options.
- Role-based selection:
  - heading
  - body
  - tables
  - forms
  - navigation

## i18n
- Baseline locales: RU/EN.
- Key-based dictionary in `shared/design/i18n.ts`.
- Locale switcher in header.
- Locale persisted in cookie (`crm_ui_lang_v1`).

## Component Modularity
Component structure:
- `components/base`
- `components/layout`
- `components/navigation`
- `components/data-display`
- `components/editors`
- `components/feedback`
- `components/feature`

Rules:
- base components stay domain-agnostic
- feature components compose base/layout components
- page-level composition remains in `pages/`

## Extension Rules
1. Add new visual tokens only in `shared/design/system.ts`.
2. Keep global styles in `shared/design/globalStyles.ts`.
3. Reuse existing base components before creating page-specific ones.
4. Avoid runtime dependencies on `/design` templates.
5. Do not move business logic into UI components.
